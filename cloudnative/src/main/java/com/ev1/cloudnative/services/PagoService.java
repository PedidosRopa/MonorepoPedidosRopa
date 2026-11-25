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
import com.mercadopago.client.preference.PreferencePayerRequest;
import com.mercadopago.client.preference.PreferenceRequest;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.resources.preference.Preference;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PagoService {

    private final PedidoRepository pedidoRepository;

    @Value("${mercadopago.access-token}")
    private String accessToken;

    @Value("${app.frontend-url}")
    private String frontendUrl;

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

        List<PreferenceItemRequest> items = pedido.getDetalles().stream()
                .map((DetallePedido d) -> PreferenceItemRequest.builder()
                        .id(String.valueOf(d.getProducto().getIdProducto()))
                        .title(d.getProducto().getNombre())
                        .quantity(d.getCantidad())
                        .unitPrice(BigDecimal.valueOf(Math.round(d.getPrecioUnitario())))
                        .currencyId("CLP")
                        .build())
                .toList();

        PreferenceBackUrlsRequest backUrls = PreferenceBackUrlsRequest.builder()
                .success(frontendUrl + "/pago-exitoso")
                .failure(frontendUrl + "/pago-fallido")
                .pending(frontendUrl + "/pago-pendiente")
                .build();

        PreferencePayerRequest payer = PreferencePayerRequest.builder()
                .email(pedido.getUsuarioEmail())
                .build();

        PreferenceRequest request = PreferenceRequest.builder()
                .items(items)
                .payer(payer)
                .backUrls(backUrls)
                .autoReturn("approved")
                .externalReference(String.valueOf(pedido.getIdPedido()))
                .build();

        PreferenceClient client = new PreferenceClient();
        Preference preference = client.create(request);

        pedido.setMpPreferenceId(preference.getId());
        pedidoRepository.save(pedido);

        return new PreferenciaPagoDto(
                preference.getId(),
                preference.getInitPoint(),
                preference.getSandboxInitPoint()
        );
    }
}