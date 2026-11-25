package com.ev1.cloudnative.controllers;

import com.ev1.cloudnative.dtos.PreferenciaPagoDto;
import com.ev1.cloudnative.services.PagoService;
import com.ev1.cloudnative.services.PedidoService;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.resources.payment.Payment;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/pagos")
@RequiredArgsConstructor
@Tag(name = "Pagos", description = "Integración con Mercado Pago Checkout Pro")
public class PagoController {

    private final PagoService pagoService;
    private final PedidoService pedidoService;

    @PostMapping("/preferencia/{idPedido}")
    @Operation(summary = "Genera preferencia de Checkout Pro a partir de un pedido existente")
    public ResponseEntity<PreferenciaPagoDto> crearPreferencia(@PathVariable Long idPedido) throws Exception {
        return ResponseEntity.ok(pagoService.crearPreferenciaParaPedido(idPedido));
    }

    @PostMapping("/webhook")
    @Operation(summary = "Webhook público para notificaciones de Mercado Pago")
    public ResponseEntity<Void> recibirWebhook(
            @RequestParam(required = false) String type,
            @RequestParam(name = "data.id", required = false) String dataId,
            @RequestBody(required = false) Map<String, Object> body) {

        try {
            String paymentId = dataId;
            String eventType = type;

            if ((paymentId == null || eventType == null) && body != null) {
                if (eventType == null && body.get("type") != null) {
                    eventType = body.get("type").toString();
                }
                if (paymentId == null && body.get("data") instanceof Map<?, ?> dataMap && dataMap.get("id") != null) {
                    paymentId = dataMap.get("id").toString();
                }
            }

            if ("payment".equalsIgnoreCase(eventType) && paymentId != null) {
                PaymentClient paymentClient = new PaymentClient();
                Payment payment = paymentClient.get(Long.parseLong(paymentId));

                if ("approved".equalsIgnoreCase(payment.getStatus()) && payment.getExternalReference() != null) {
                    Long idPedido = Long.parseLong(payment.getExternalReference());
                    pedidoService.marcarComoPagado(idPedido, String.valueOf(payment.getId()));
                    log.info("Pedido {} marcado como PAGADO por pago MP {}", idPedido, payment.getId());
                }
            }
        } catch (Exception e) {
            log.error("Error procesando webhook de Mercado Pago: {}", e.getMessage(), e);
        }

        return ResponseEntity.ok().build();
    }
}