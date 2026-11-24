package com.ev1.cloudnative.controllers;

import com.ev1.cloudnative.audit.AuditarAdmin;
import com.ev1.cloudnative.dtos.admin.kafka.ConsumerGroupInfoDto;
import com.ev1.cloudnative.dtos.admin.kafka.TopicConfigUpdateDto;
import com.ev1.cloudnative.dtos.admin.kafka.TopicInfoDto;
import com.ev1.cloudnative.dtos.admin.kafka.TopicRequestDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.AlterConfigOp;
import org.apache.kafka.clients.admin.Config;
import org.apache.kafka.clients.admin.ConfigEntry;
import org.apache.kafka.clients.admin.ConsumerGroupDescription;
import org.apache.kafka.clients.admin.GroupListing;
import org.apache.kafka.clients.admin.ListGroupsOptions;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.admin.TopicDescription;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.config.ConfigResource;
import org.apache.kafka.common.config.TopicConfig;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/admin/kafka")
@PreAuthorize("hasRole('Administrador')")
@RequiredArgsConstructor
@Tag(name = "Administración Kafka", description = "Gestión dinámica de tópicos, configuraciones y consumer groups")
public class KafkaAdminController {

    private final AdminClient adminClient;

    @GetMapping("/topics")
    @Operation(summary = "Listar tópicos de Kafka con particiones y configuraciones")
    public ResponseEntity<List<TopicInfoDto>> listarTopicos() throws Exception {
        Set<String> nombres = adminClient.listTopics().names().get          (10, TimeUnit.SECONDS);
        if (nombres.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        Map<String, TopicDescription> descripciones =
                adminClient.describeTopics(nombres).allTopicNames().get(10, TimeUnit.SECONDS);

        List<ConfigResource> recursos = nombres.stream()
                .map(n -> new ConfigResource(ConfigResource.Type.TOPIC, n))
                .toList();
        Map<ConfigResource, Config> configs =
                adminClient.describeConfigs(recursos).all().get(10, TimeUnit.SECONDS);

        List<TopicInfoDto> respuesta = new ArrayList<>();
        for (String nombre : nombres) {
            TopicDescription desc = descripciones.get(nombre);
            Config cfg = configs.get(new ConfigResource(ConfigResource.Type.TOPIC, nombre));

            Map<String, String> props = new LinkedHashMap<>();
            if (cfg != null) {
                ConfigEntry ret = cfg.get(TopicConfig.RETENTION_MS_CONFIG);
                ConfigEntry clean = cfg.get(TopicConfig.CLEANUP_POLICY_CONFIG);
                if (ret != null) props.put(TopicConfig.RETENTION_MS_CONFIG, ret.value());
                if (clean != null) props.put(TopicConfig.CLEANUP_POLICY_CONFIG, clean.value());
            }

            int replicas = desc.partitions().isEmpty() ? 1 : desc.partitions().get(0).replicas().size();
            respuesta.add(new TopicInfoDto(nombre, desc.partitions().size(), replicas, props));
        }
        return ResponseEntity.ok(respuesta);
    }

    @PostMapping("/topics")
    @AuditarAdmin(accion = "CREAR_TOPICO", recurso = "KAFKA_TOPICS")
    @Operation(summary = "Crear un nuevo tópico en Kafka")
    public ResponseEntity<Map<String, Object>> crearTopico(@Valid @RequestBody TopicRequestDto dto) throws Exception {
        TopicBuilder builder = TopicBuilder.name(dto.nombre())
                .partitions(dto.particiones())
                .replicas(dto.replicas());

        if (dto.retentionMs() != null) {
            builder.config(TopicConfig.RETENTION_MS_CONFIG, String.valueOf(dto.retentionMs()));
        }
        if (dto.cleanupPolicy() != null && !dto.cleanupPolicy().isBlank()) {
            builder.config(TopicConfig.CLEANUP_POLICY_CONFIG, dto.cleanupPolicy());
        }

        NewTopic nuevoTopico = builder.build();
        adminClient.createTopics(List.of(nuevoTopico)).all().get(10, TimeUnit.SECONDS);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "mensaje", "Tópico creado exitosamente",
                "topico", dto.nombre(),
                "particiones", dto.particiones(),
                "replicas", dto.replicas()
        ));
    }

    @PatchMapping("/topics/{nombre}/config")
    @AuditarAdmin(accion = "MODIFICAR_CONFIG_TOPICO", recurso = "KAFKA_TOPICS")
    @Operation(summary = "Modificar retención o política de limpieza de un tópico")
    public ResponseEntity<Map<String, String>> actualizarConfiguracion(
            @PathVariable String nombre,
            @RequestBody TopicConfigUpdateDto dto) throws Exception {

        ConfigResource recurso = new ConfigResource(ConfigResource.Type.TOPIC, nombre);
        List<AlterConfigOp> operaciones = new ArrayList<>();

        if (dto.retentionMs() != null) {
            operaciones.add(new AlterConfigOp(
                    new ConfigEntry(TopicConfig.RETENTION_MS_CONFIG, String.valueOf(dto.retentionMs())),
                    AlterConfigOp.OpType.SET
            ));
        }
        if (dto.cleanupPolicy() != null && !dto.cleanupPolicy().isBlank()) {
            operaciones.add(new AlterConfigOp(
                    new ConfigEntry(TopicConfig.CLEANUP_POLICY_CONFIG, dto.cleanupPolicy()),
                    AlterConfigOp.OpType.SET
            ));
        }

        if (operaciones.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Debe enviar retentionMs o cleanupPolicy"));
        }

        adminClient.incrementalAlterConfigs(Map.of(recurso, operaciones)).all().get(10, TimeUnit.SECONDS);
        return ResponseEntity.ok(Map.of("mensaje", "Configuración actualizada para el tópico " + nombre));
    }

    @DeleteMapping("/topics/{nombre}")
    @AuditarAdmin(accion = "ELIMINAR_TOPICO", recurso = "KAFKA_TOPICS")
    @Operation(summary = "Eliminar un tópico de Kafka")
    public ResponseEntity<Void> eliminarTopico(@PathVariable String nombre) throws Exception {
        adminClient.deleteTopics(List.of(nombre)).all().get(10, TimeUnit.SECONDS);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/consumer-groups")
    @Operation(summary = "Inspeccionar Consumer Groups activos y tópicos asignados")
    public ResponseEntity<List<ConsumerGroupInfoDto>> listarConsumerGroups() throws Exception {
        Collection<GroupListing> listings =
                adminClient.listGroups(ListGroupsOptions.forConsumerGroups()).all().get(10, TimeUnit.SECONDS);

        List<String> groupIds = listings.stream().map(GroupListing::groupId).toList();
        if (groupIds.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        Map<String, ConsumerGroupDescription> descripciones =
                adminClient.describeConsumerGroups(groupIds).all().get(10, TimeUnit.SECONDS);

        List<ConsumerGroupInfoDto> resultado = new ArrayList<>();
        for (String id : groupIds) {
            ConsumerGroupDescription desc = descripciones.get(id);
            List<String> topicos = desc.members().stream()
                    .flatMap(m -> m.assignment().topicPartitions().stream())
                    .map(TopicPartition::topic)
                    .distinct()
                    .toList();

            resultado.add(new ConsumerGroupInfoDto(
                    id,
                    desc.groupState().toString(),
                    desc.members().size(),
                    topicos
            ));
        }
        return ResponseEntity.ok(resultado);
    }
}