package com.ev1.cloudnative.services;

import com.ev1.cloudnative.dtos.PreferenciaPagoDto;
import com.ev1.cloudnative.exceptions.ResourceNotFoundException;
import com.ev1.cloudnative.model.DetallePedido;
import com.ev1.cloudnative.model.EstadoPedido;
import com.ev1.cloudnative.model.Pedido;
import com.ev1.cloudnative.repositories.PedidoRepository;
import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.preference.PreferenceBackUrlsRequest;
import com.mercadopago.client.preference.PreferenceClient;
import com.mercadopago.client.preference.PreferenceItemRequest;
import com.mercadopago.client.preference.PreferenceRequest;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.resources.preference.Preference;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PagoService {

    private final PedidoRepository pedidoRepository;

    @Value("${mercadopago.access-token}")
    private String accessToken;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${mercadopago.webhook-url}")
    private String webhookUrl;

    @PostConstruct
    public void init() {
        MercadoPagoConfig.setAccessToken(accessToken);
    }

    @Transactional
    public PreferenciaPagoDto crearPreferenciaParaPedido(Long idPedido) throws MPException, MPApiException {
        Pedido pedido = pedidoRepository.findById(idPedido)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado con ID: " + idPedido));

        if (pedido.getEstado() == EstadoPedido.PAGADO) {
            throw new IllegalStateException("El pedido #" + idPedido + " ya se encuentra pagado.");
        }

        if (pedido.getEstado() == EstadoPedido.CANCELADO) {
            throw new IllegalStateException("No se puede generar pago para un pedido cancelado.");
        }

        List<DetallePedido> detalles = pedido.getDetalles() != null
                ? pedido.getDetalles()
                : Collections.emptyList();

        if (detalles.isEmpty()) {
            throw new IllegalStateException("El pedido #" + idPedido + " no tiene detalles/ítems para pagar.");
        }

        List<PreferenceItemRequest> items = detalles.stream()
                .map(d -> toPreferenceItem(d, idPedido))
                .toList();

        String baseUrl = frontendUrl.endsWith("/")
                ? frontendUrl.substring(0, frontendUrl.length() - 1)
                : frontendUrl;

        PreferenceBackUrlsRequest backUrls = PreferenceBackUrlsRequest.builder()
                .success(baseUrl + "/pago-exitoso")
                .failure(baseUrl + "/pago-fallido")
                .pending(baseUrl + "/pago-pendiente")
                .build();

        PreferenceRequest request = PreferenceRequest.builder()
                .items(items)
                .backUrls(backUrls)
                .autoReturn("approved")
                .externalReference(String.valueOf(pedido.getIdPedido()))
                .notificationUrl(webhookUrl)
                .build();

        try {
            PreferenceClient client = new PreferenceClient();
            Preference preference = client.create(request);

            pedido.setMpPreferenceId(preference.getId());
            pedidoRepository.save(pedido);

            return new PreferenciaPagoDto(
                    preference.getId(),
                    preference.getInitPoint(),
                    preference.getSandboxInitPoint()
            );
        } catch (MPApiException e) {
            String apiContent = e.getApiResponse() != null ? e.getApiResponse().getContent() : "sin contenido";
            log.error("Error de API Mercado Pago para pedido {}: status={}, content={}",
                    idPedido, e.getStatusCode(), apiContent, e);
            throw e;
        } catch (Exception e) {
            log.error("Error inesperado creando preferencia para pedido {}", idPedido, e);
            throw e;
        }
    }

    private PreferenceItemRequest toPreferenceItem(DetallePedido d, Long idPedido) {
        String itemId = d.getProducto() != null && d.getProducto().getIdProducto() != null
                ? String.valueOf(d.getProducto().getIdProducto())
                : String.valueOf(d.getIdDetalle());

        String title = d.getProducto() != null && d.getProducto().getNombre() != null
                ? d.getProducto().getNombre()
                : "Producto pedido #" + idPedido;

        int cantidad = d.getCantidad() != null ? d.getCantidad() : 1;
        long unitPrice = d.getPrecioUnitario() != null ? Math.round(d.getPrecioUnitario()) : 0L;

        return PreferenceItemRequest.builder()
                .id(itemId)
                .title(title)
                .quantity(cantidad)
                .unitPrice(BigDecimal.valueOf(unitPrice))
                .currencyId("CLP")
                .build();
    }
}