Evaluación Parcial N° 4
PPrreesseennttaacciióónn
Instrucciones y pauta de evaluación | Estudiante
2025

Evaluación Parcial N° 2
Presentación
Instrucciones y pauta de evaluación
Estudiante
Semana inicio
Sigla Nombre Asignatura Tiempo Asignado % Ponderación
EFT
DSY1107 Desarrollo Cloud Native I 5 horas pedagógicas 18%
1. Instrucciones generales
Descripción
• En esta etapa deberás incorporar RabbitMQ al sistema desarrollado previamente, implementando colas, exchanges y DLQs para gestionar
tareas asíncronas como notificaciones, generación de tickets o documentos.
• Tu desafío es demostrar que la mensajería desacoplada funciona correctamente, sin afectar la lógica existente del sistema.
• La distribución de los porcentajes en esta evaluación es la siguiente:
Evaluación Tipo de situación Distribución de porcentajes Individual/Grupal
evaluativa
Evaluación Parcial N°4 Presentación 100% Individual
(18%)
Total 100%
• El encargo corresponde al código de los componentes frontend y backend del sistema, entregado vía GitHub.
• El tiempo asignado para desarrollar esta evaluación es de 2 semanas para la elaboración del encargo y de la presentación.
• Las/los estudiantes inician el trabajo del encargo en el Taller de Proyectos (Taite 7), pero deben finalizarlo junto a presentación en su
tiempo de trabajo personal.
Página 1 de 6
2025

Instrucciones específicas de la Evaluación:
• La presentación del proyecto se realiza de manera grupal, respondiendo dudas que el docente realice. Cada estudiante fundamenta la
propuesta desarrollada, justificando el diseño, tecnologías utilizadas en el sistema y mostrando su funcionamiento. La presentación
debe incluir los siguientes elementos:
• El estudiante debe mostrar en la plataforma cloud la creación de la instancia de API Manager en funcionamiento.
• El estudiante debe mostrar la configuración del API Manager que permite llamar a los endpoints del backend.
• El estudiante debe demostrar que el frontend consume los endpoints a través del API Manager correctamente configurado.
• El estudiante debe mostrar que el API Manager valida JWT, rechazando peticiones inválidas y aceptando las correctas.
• El estudiante debe mostrar la creación del tenant en IDaaS y la existencia de usuarios registrados.
• El estudiante debe demostrar que el frontend utiliza OAuth 2.0/OpenID Connect para iniciar sesión y obtener un JWT válido.
• El estudiante debe mostrar en la nube que el backend y el frontend están desplegados, activos e integrados.
• El estudiante debe mostrar la existencia de dos nodos RabbitMQ configurados y su integración en un clúster.
• El estudiante debe demostrar que existen tres colas de mensajes con sus respectivas DLQ funcionando.
• El estudiante debe mostrar la existencia de exchanges de tipo direct y topic correctamente configurados en RabbitMQ.
• El estudiante debe demostrar en la nube la ejecución de docker-compose levantando servicios de RabbitMQ.
Los aspectos formales son:
• La presentación debe tener entre 5 y 10 minutos de duración.
• La información presentada debe tener un orden e hilo conductor, haciendo uso de un lenguaje técnico.
Los materiales, herramientas o insumos que se requieren para realizar esta evaluación:
• Materiales y contenidos académicos proporcionados durante el curso, incluyendo especificaciones técnicas, análisis previos y guías de
referencia.
Computadores disponibles en taller de proyectos (TAITE 7).
Página 2 de 6
2025

2. Pauta de Evaluación
| Categoría  | % logro  |     |     | Descripción niveles de logro  |     |     |     |
| ---------- | -------- | --- | --- | ----------------------------- | --- | --- | --- |
Muy buen desempeño  100%  Demuestra un desempeño destacado, evidenciando el logro de todos los aspectos evaluados en el indicador.
Buen desempeño  80%  Demuestra un alto desempeño del indicador, presentando pequeñas omisiones, dificultades y/o errores.
Demuestra un desempeño competente, evidenciando el logro de los elementos básicos del indicador, pero con
| Desempeño aceptable   | 60%  |     |     |     |     |     |     |
| --------------------- | ---- | --- | --- | --- | --- | --- | --- |
omisiones, dificultades o errores.
Presenta importantes omisiones, dificultades o errores en el desempeño, que no permiten evidenciar los
| Desempeño incipiente   | 30%  |     |     |     |     |     |     |
| ---------------------- | ---- | --- | --- | --- | --- | --- | --- |
elementos básicos del logro del indicador, por lo que no puede ser considerado competente.
| Desempeño no logrado  | 0%  Presenta ausencia o incorrecto desempeño.  |     |     |     |     |     |     |
| --------------------- | ---------------------------------------------- | --- | --- | --- | --- | --- | --- |

Categorías de Respuesta
Ponderación
|     |     | Muy buen  | Buen  | Desempeño  | Desempeño  | Desempeño no  |     |
| --- | --- | --------- | ----- | ---------- | ---------- | ------------- | --- |
Indicador de Evaluación  Indicador de
|     |     | desempeño  | desempeño  | aceptable  | incipiente  | logrado  | Evaluación  |
| --- | --- | ---------- | ---------- | ---------- | ----------- | -------- | ----------- |
|     |     | 100%       | 80%        | 60%        | 30%         | 0%       |             |
Todos los
|     |     |     | La mayoría de  | Existe una  |     |     |     |
| --- | --- | --- | -------------- | ----------- | --- | --- | --- |
nombres de colas,
|     |     |     | los nombres  | mezcla  | La mayoría de  |     |     |
| --- | --- | --- | ------------ | ------- | -------------- | --- | --- |
exchanges y
|     |     |     | está centralizada  | evidente entre  | los nombres de  |     |     |
| --- | --- | --- | ------------------ | --------------- | --------------- | --- | --- |
bindings están
|     |     |               | en el archivo de  | nombres          | colas y         |                |     |
| --- | --- | ------------- | ----------------- | ---------------- | --------------- | -------------- | --- |
|     |     | definidos de  |                   |                  |                 | No se utiliza  |     |
|     |     |               | configuración o   | centralizados y  | exchanges está  |                |     |
|     |     | manera        |                   |                  |                 | configuración  |     |
|     |     |               | en la clase       | nombres          | escrita         |                |     |
Define en application.yml o clase @Configuration los  centralizada en  centralizada. Todos
|     |     |     | @Configuration.  | escritos  | directamente  |     |     |
| --- | --- | --- | ---------------- | --------- | ------------- | --- | --- |
nombres de colas, exchanges y bindings de forma  application.yml o  los nombres están  12%
|                |     |                  | Existen pocos     | directamente    | en las clases de  |                  |     |
| -------------- | --- | ---------------- | ----------------- | --------------- | ----------------- | ---------------- | --- |
| centralizada.  |     | en una clase de  |                   |                 |                   | dispersos en el  |     |
|                |     |                  | valores aislados  | en código. La   | negocio. El       |                  |     |
|                |     | configuración    |                   |                 |                   | código de forma  |     |
|                |     |                  | en el código que  | configuración   | archivo de        |                  |     |
|                |     | única. No hay    |                   |                 |                   | manual.          |     |
|                |     |                  | no afectan de     | es usable pero  | configuración     |                  |     |
valores sueltos en
|     |     |     | forma  | dificulta el  | se usa poco o  |     |     |
| --- | --- | --- | ------ | ------------- | -------------- | --- | --- |
el código. La
|     |     |     | importante el  | mantenimiento  | nada.  |     |     |
| --- | --- | --- | -------------- | -------------- | ------ | --- | --- |
organización es
|     |     |     | mantenimiento.  | y la lectura.  |     |     |     |
| --- | --- | --- | --------------- | -------------- | --- | --- | --- |
clara y consistente
Página 3 de 6
2025

para todos los
microservicios.
Existen clases de
Hay muy pocos
| configuración que  | La mayoría de  | Solo los casos  |     |     |     |
| ------------------ | -------------- | --------------- | --- | --- | --- |
beans de
| declaran beans de  | los casos de uso  | principales  |     |     |     |
| ------------------ | ----------------- | ------------ | --- | --- | --- |
configuración.
| Queue, Exchange  | tiene sus beans  | están  |     |     |     |
| ---------------- | ---------------- | ------ | --- | --- | --- |
La mayor parte
| y Binding para  | de Queue,  | configurados  |     | No hay clases de  |     |
| --------------- | ---------- | ------------- | --- | ----------------- | --- |
de la
| cada caso de uso  | Exchange y  | con beans  |     | configuración que  |     |
| ----------------- | ----------- | ---------- | --- | ------------------ | --- |
Declara beans de configuración de RabbitMQ con  interacción con
| definido en el  | Binding  | explícitos.  |     | declaren beans de  | 13%  |
| --------------- | -------- | ------------ | --- | ------------------ | ---- |
Queue, Exchange y Binding para cada caso de uso.  RabbitMQ se
| sistema. Cada ruta  | definidos. Faltan  | Otros usos  |     | Queue, Exchange o  |     |
| ------------------- | ------------------ | ----------- | --- | ------------------ | --- |
realiza desde el
| de mensajería  | algunos  | dependen de  |     | Binding.  |     |
| -------------- | -------- | ------------ | --- | --------- | --- |
código de
| está claramente  | escenarios poco  | configuraciones  |     |     |     |
| ---------------- | ---------------- | ---------------- | --- | --- | --- |
negocio sin una
| identificada y  | utilizados o  | implícitas o  |     |     |     |
| --------------- | ------------- | ------------- | --- | --- | --- |
configuración
| documentada en  | secundarios.  | incompletas.  |     |     |     |
| --------------- | ------------- | ------------- | --- | --- | --- |
clara.
código.
La configuración
de mensajería
| está  |     |     | Se observa una  |     |     |
| ----- | --- | --- | --------------- | --- | --- |
La separación
| completamente      |                 |                 | mezcla         |                      |     |
| ------------------ | --------------- | --------------- | -------------- | -------------------- | --- |
|                    | En general la   | es parcial.     |                |                      |     |
| aislada en clases  |                 |                 | importante de  |                      |     |
|                    | separación es   | Parte de la     |                |                      |     |
| específicas. Los   |                 |                 | lógica de      | No existe            |     |
|                    | clara. Existen  | configuración   |                |                      |     |
| servicios de       |                 |                 | negocio con    | separación. Toda la  |     |
|                    | pequeños        | está en clases  |                |                      |     |
El código del microservicio no mezcla la lógica de  negocio solo  instrucciones  configuración de
|     | fragmentos de  | dedicadas y  |     |     |     |
| --- | -------------- | ------------ | --- | --- | --- |
negocio con la configuración de mensajería. Hay  consumen  de  mensajería se  10%
|     | configuración en  | otra parte se  |     |     |     |
| --- | ----------------- | -------------- | --- | --- | --- |
clases de configuración separadas.  interfaces o  configuración  encuentra
|                    | clases de       | implementa    |                |                     |     |
| ------------------ | --------------- | ------------- | -------------- | ------------------- | --- |
| componentes ya     |                 |               | de colas y     | incrustada en la    |     |
|                    | negocio que no  | directamente  |                |                     |     |
| configurados. No   |                 |               | exchanges. La  | lógica de negocio.  |     |
|                    | afectan el      | dentro de     |                |                     |     |
| se observa lógica  |                 |               | estructura     |                     |     |
|                    | diseño global.  | servicios o   |                |                     |     |
| de configuración   |                 |               | dificulta el   |                     |     |
controladores.
| en controladores  |     |     | mantenimiento.  |     |     |
| ----------------- | --- | --- | --------------- | --- | --- |
o servicios de
dominio.
| Todos los      | La mayoría de  | Los             | Los            |                     |     |
| -------------- | -------------- | --------------- | -------------- | ------------------- | --- |
| consumidores   | los            | consumidores    | consumidores   | No se utilizan      |     |
| están          | consumidores   | funcionan pero  | están          | @RabbitListener ni  |     |
| correctamente  | está           | se encuentran   | implementados  | anotaciones         |     |
Los consumidores están implementados con  implementados  implementada  mezclados  de forma  equivalentes para
@RabbitListener u otra anotación equivalente y se  con  con  dentro de un  dispersa. No  implementar  15%
agrupan por dominio funcional.  @RabbitListener u  @RabbitListener  mismo paquete  existe un  consumidores o
| otra anotación    | y se observa una  | o clase sin una  | criterio claro de  | directamente no se  |     |
| ----------------- | ----------------- | ---------------- | ------------------ | ------------------- | --- |
| adecuada. Se      | organización por  | separación       | organización       | implementa ningún   |     |
| organizan de      | dominio           | clara por        | por dominio y      | consumidor.         |     |
| manera clara por  | funcional.        | dominios. La     | es difícil         |                     |     |
Página 4 de 6
2025

| dominio funcional   | Existen pocos   | estructura es  | identificar a   |     |
| ------------------- | --------------- | -------------- | --------------- | --- |
| o contexto de       | casos donde la  | comprensible   | qué parte del   |     |
| negocio. La         | agrupación      | pero no        | sistema         |     |
| estructura del      | podría ser más  | óptima.        | pertenece cada  |     |
| código facilita el  | consistente.    |                | consumidor.     |     |
mantenimiento y
refleja una
separación
coherente de
responsabilidades.
| El manejo de       |     | Los           |               |     |
| ------------------ | --- | ------------- | ------------- | --- |
| confirmación está  |     | consumidores  | El manejo de  |     |
Los
| completamente  |     | realizan ACK  | confirmación es  |     |
| -------------- | --- | ------------- | ---------------- | --- |
consumidores
| implementado.  |     | automáticos o  | muy básico. Los  |     |
| -------------- | --- | -------------- | ---------------- | --- |
manejan ACK y
| Cada consumidor  |     | parciales. El  | consumidores  |     |
| ---------------- | --- | -------------- | ------------- | --- |
controlan
| gestiona ACK de  |     | manejo de  | no distinguen  | No se implementa  |
| ---------------- | --- | ---------- | -------------- | ----------------- |
errores de
| forma explícita.  |     | errores existe  | entre errores  | ACK ni manejo  |
| ----------------- | --- | --------------- | -------------- | -------------- |
manera
| Los errores se  |     | pero es  | recuperables o  | explícito de errores.  |
| --------------- | --- | -------- | --------------- | ---------------------- |
adecuada en la
En los consumidores se maneja la confirmación de  manejan  limitado y no  no  Los consumidores
mayoría de los
mensajes. Se ve uso de ACK y manejo explícito de  correctamente  cubre todos los  recuperables.  procesan mensajes  20%
casos. Existe
errores.  con rutas  casos  Se observan  sin control de flujo
alguna omisión
| diferenciadas y  |     | esperados.  | respuestas  | y sin mecanismos  |
| ---------------- | --- | ----------- | ----------- | ----------------- |
menor en
| decisiones claras  |     | Puede haber  | imprecisas que  | para gestionar  |
| ------------------ | --- | ------------ | --------------- | --------------- |
escenarios poco
| entre reintentos,  |     | requeue  | pueden  | fallas.  |
| ------------------ | --- | -------- | ------- | -------- |
frecuentes que
| NACK y envío a  |     | innecesario o  | provocar  |     |
| --------------- | --- | -------------- | --------- | --- |
no afecta el
| DLQ. La lógica de  |     | falta de control  | reprocesos o  |     |
| ------------------ | --- | ----------------- | ------------- | --- |
funcionamiento
| error está  |     | cuando  | pérdida de  |     |
| ----------- | --- | ------- | ----------- | --- |
general.
| documentada y es  |     | aparece un      | mensajes.  |     |
| ----------------- | --- | --------------- | ---------- | --- |
| consistente.      |     | error.          |            |     |
| El microservicio  |     | La API es       |            |     |
| administrador     |     | funcional pero  |            |     |
Los endpoints
| expone una API  |     | presenta  | Los endpoints  |     |
| --------------- | --- | --------- | -------------- | --- |
están bien
| REST clara y  |     | inconsistencias  | son confusos o  | El microservicio  |
| ------------- | --- | ---------------- | --------------- | ----------------- |
definidos en su
| coherente. Los  |     | en nombres de  | no siguen una  | administrador no  |
| --------------- | --- | -------------- | -------------- | ----------------- |
mayoría. Hay
El microservicio administrador expone endpoints  endpoints tienen  rutas, verbos o  estructura  expone endpoints
detalles
REST bien definidos por ejemplo POST /queues o  rutas, verbos  estructura de  clara. Es difícil  REST para  13%
menores en
DELETE /queues/{name}.  HTTP y nombres  los recursos. La  deducir qué  administrar colas o
nombres o
| de recursos bien  |     | intención se  | hace cada ruta  | no implementa este  |
| ----------------- | --- | ------------- | --------------- | ------------------- |
verbos que no
| definidos. La  |     | entiende pero  | solo leyendo el  | microservicio.  |
| -------------- | --- | -------------- | ---------------- | --------------- |
afectan el uso
| estructura sigue  |     | no se alinea  | código.  |     |
| ----------------- | --- | ------------- | -------- | --- |
de la API.
| buenas prácticas  |     | completamente  |     |     |
| ----------------- | --- | -------------- | --- | --- |
| de diseño REST y  |     | con un diseño  |     |     |
Página 5 de 6
2025

|     | está          |     | REST        |     |     |     |
| --- | ------------- | --- | ----------- | --- | --- | --- |
|     | documentada.  |     | cuidadoso.  |     |     |     |
La mayoría de
|     | Toda la lógica de  |     | Parte de la  | Las operaciones  |     |     |
| --- | ------------------ | --- | ------------ | ---------------- | --- | --- |
las operaciones
|     | creación,  |     | lógica de  | de  |     |     |
| --- | ---------- | --- | ---------- | --- | --- | --- |
de
|     | actualización y  |     | administración  | administración  |     |     |
| --- | ---------------- | --- | --------------- | --------------- | --- | --- |
administración
|     | eliminación de  |     | está en un  | se implementan  |     |     |
| --- | --------------- | --- | ----------- | --------------- | --- | --- |
está
|     | colas y exchanges  |     | servicio y parte  | directamente  |     |     |
| --- | ------------------ | --- | ----------------- | ------------- | --- | --- |
concentrada en
|                                              | está encapsulada  |                  | se reparte       | en               | No existe un        |      |
| -------------------------------------------- | ----------------- | ---------------- | ---------------- | ---------------- | ------------------- | ---- |
| La lógica para crear colas y exchanges está  |                   | un servicio      |                  |                  |                     |      |
|                                              | en un servicio    |                  | entre            | controladores o  | servicio dedicado   |      |
| encapsulada en un servicio por ejemplo       |                   | específico.      |                  |                  |                     | 10%  |
|                                              | dedicado. Los     |                  | controladores o  | clases no        | para administrar    |      |
| RabbitAdminService.                          |                   | Existen algunas  |                  |                  |                     |      |
|                                              | controladores     |                  | utilidades. La   | especializadas.  | colas y exchanges.  |      |
llamadas
|     | llaman a métodos  |     | responsabilidad  | El servicio  |     |     |
| --- | ----------------- | --- | ---------------- | ------------ | --- | --- |
directas a la
|     | de alto nivel y no  |     | del servicio no  | dedicado es  |     |     |
| --- | ------------------- | --- | ---------------- | ------------ | --- | --- |
librería de
|     | conocen detalles  |     | es  | inexistente o  |     |     |
| --- | ----------------- | --- | --- | -------------- | --- | --- |
RabbitMQ desde
|     | internos de  |     | completamente  | casi no se  |     |     |
| --- | ------------ | --- | -------------- | ----------- | --- | --- |
otros puntos del
|     | RabbitMQ.  |     | clara.  | utiliza.  |     |     |
| --- | ---------- | --- | ------- | --------- | --- | --- |
código.
Los endpoints del
microservicio
administrador
La API realiza
validan todos los
|     |     | La validación  | validaciones  |     |     |     |
| --- | --- | -------------- | ------------- | --- | --- | --- |
parámetros de
|     |                   | cubre los casos  | básicas. Es     |                   |                  |     |
| --- | ----------------- | ---------------- | --------------- | ----------------- | ---------------- | --- |
|     | entrada. Se usan  |                  |                 | La validación es  |                  |     |
|     |                   | más              | posible que se  |                   |                  |     |
|     | DTO con           |                  |                 | mínima. Es fácil  | No se valida la  |     |
|     |                   | importantes.     | cuelen          |                   |                  |     |
La API valida los parámetros de entrada para evitar  anotaciones de  crear colas con  entrada. El backend
|     |     | Algunos  | configuraciones  |     |     |     |
| --- | --- | -------- | ---------------- | --- | --- | --- |
crear colas con nombres vacíos o configuraciones  validación o lógica  nombres  acepta cualquier  7%
|     |     | parámetros  | poco claras  |     |     |     |
| --- | --- | ----------- | ------------ | --- | --- | --- |
inválidas.  equivalente. No es  inconsistentes o  dato sin controles
|     |                      | secundarios no   | aunque la       |                |           |     |
| --- | -------------------- | ---------------- | --------------- | -------------- | --------- | --- |
|     | posible crear colas  |                  |                 | parámetros     | previos.  |     |
|     |                      | se validan pero  | mayoría de los  |                |           |     |
|     | con nombres          |                  |                 | poco seguros.  |           |     |
|     |                      | no generan       | errores         |                |           |     |
vacíos ni con
|     |     | fallas críticas.  | evidentes se  |     |     |     |
| --- | --- | ----------------- | ------------- | --- | --- | --- |
configuraciones
detecta.
inválidas. Los
mensajes de error
son claros.
Total  100%

Página 6 de 6
2025