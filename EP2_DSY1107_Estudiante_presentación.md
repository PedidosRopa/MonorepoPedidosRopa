# Presentación N° 2

### Instrucciones y pauta de evaluación | Estudiante

## Evaluación Parcial N° 2

#### Presentación Instrucciones y pauta de evaluación

#### Estudiante

|Sigla|Nombre Asignatura|Tiempo Asignado|% Ponderación|Semana inicio EFT|
|---|---|---|---|---|
|DSY1107|Desarrollo Cloud Native I|5 horas pedagógicas|24%||

**1. Instrucciones generales**

|Descripción|(Redacción orientada a estudiantes)|||||
|---|---|---|---|---|---|
|• Gateway. • •|La distribución de los porcentajes en esta evaluación es la siguiente:||En esta primera etapa deberás diseñar y desarrollar la arquitectura base del sistema Pedidos360, integrando el frontend en Angular con autenticación mediante Azure AD (MSAL), el backend en Spring Boot desplegado en instancias EC2 y protegido a través de AWS API Tu objetivo es lograr un sistema funcional y seguro, que demuestre la correcta comunicación entre componentes y servicios en la nube.|||
||Evaluación|Tipo de situación evaluativa|Distribución de porcentajes|Individual/Grupal||
||Evaluación Parcial 2 (24%) Total|Presentación|100% 100%|Individual||
|• • • tiempo de trabajo personal.||El encargo corresponde al código de los componentes frontend y backend del sistema, entregado vía GitHub. El tiempo asignado para desarrollar esta evaluación es de 2 semanas para la elaboración del encargo y de la presentación.|Las/los estudiantes inician el trabajo del encargo en el Taller de Proyectos (Taite 7), pero deben finalizarlo junto a presentación en su|||

Página 1 de 5

##### <u>Instrucciones específicas de la Evaluación:</u>

- La presentación del proyecto se realiza de manera grupal, respondiendo dudas que el docente realice. Cada estudiante fundamenta la propuesta desarrollada, justificando el diseño, tecnologías utilizadas en el sistema y mostrando su funcionamiento. La presentación debe incluir los siguientes elementos:
- El estudiante debe mostrar en la plataforma cloud la creación de la instancia de API Manager en funcionamiento.
- El estudiante debe mostrar la configuración del API Manager que permite llamar a los endpoints del backend.
- El estudiante debe demostrar que el frontend consume los endpoints a través del API Manager correctamente configurado.
- El estudiante debe mostrar que el API Manager valida JWT, rechazando peticiones inválidas y aceptando las correctas.
- El estudiante debe mostrar la creación del tenant en IDaaS y la existencia de usuarios registrados.
- El estudiante debe demostrar que el frontend utiliza OAuth 2.0/OpenID Connect para iniciar sesión y obtener un JWT válido.
- El estudiante debe mostrar en la nube que el backend y el frontend están desplegados, activos e integrados.
Los aspectos formales son:

- La presentación debe tener entre 5 y 10 minutos de duración.
- La información presentada debe tener un orden e hilo conductor, haciendo uso de un lenguaje técnico.
Los materiales, herramientas o insumos que se requieren para realizar esta evaluación:

- Materiales y contenidos académicos proporcionados durante el curso, incluyendo especificaciones técnicas, análisis previos y guías de referencia.
<u>Computadores disponibles en taller de proyectos (TAITE 7).</u>

Página 2 de 5

**2.Pauta de Evaluación (Rúbrica, Escala de valoración, Pauta de Cotejo)**

|Indicador de Evaluación|Categorías de Respuesta|Ponderación Indicador de Evaluación|||||
|---|---|---|---|---|---|---|
|||Muy buen desempeño 100%|Buen desempeño 80%|Desempeño aceptable 60%|Desempeño incipiente 30%|Desempeño no logrado 0%|
|Crea todas las rutas necesarias para que el API Manager sirva como intermediario entre los endpoints del backend del sistema y el frontend|Todas las rutas están creadas y dirigidas correctamente a los microservicios correspondientes. La estructura de paths y métodos es coherente y está probada.|La mayoría de las rutas está correcta. Existen pequeños errores como un método mal configurado o un path incompleto.|Se crean la mayoría de las rutas pero se observan omisiones evidentes o algunas rutas duplicadas.|Las rutas tienen errores relevantes que impiden el uso fluido del sistema y bloquean varios flujos.|No se configuran rutas en el API Manager.|13%|
|Configura CORS en el API Manager para permitir una comunicación adecuada con el frontend|CORS configurado de forma segura y funcional. Los orígenes permitidos están|CORS funciona pero permite más elementos de los necesarios. No|CORS funciona parcialmente. Algunos endpoints presentan|La configuración es insegura o bloquea de forma frecuente la comunicación|No existe configuración de CORS.|7%|

|Categoría|% logro|Descripción niveles de logro|
|---|---|---|
|Muy buen desempeño|100%|Demuestra un desempeño destacado, evidenciando el logro de todos los aspectos evaluados en el indicador.|
|Buen desempeño|80%|Demuestra un alto desempeño del indicador, presentando pequeñas omisiones, dificultades y/o errores.|
|Desempeño aceptable|60%|Demuestra un desempeño competente, evidenciando el logro de los elementos básicos del indicador, pero con omisiones, dificultades o errores.|
|Desempeño incipiente|30%|Presenta importantes omisiones, dificultades o errores en el desempeño, que no permiten evidenciar los elementos básicos del logro del indicador, por lo que no puede ser considerado competente.|
|Desempeño no logrado|0%|Presenta ausencia o incorrecto desempeño.|

Página 3 de 5

||||definidos correctamente y los métodos y encabezados necesarios están habilitados sin sobrepermisos.|afecta la operación pero se recomienda mejorar la seguridad.|errores de preflight o bloqueos.|desde el frontend.|
|---|---|---|---|---|---|---|
|Crea un tenant que dé soporte a los diferentes servicios del IDaaS que serán utilizados en el sistema|Tenant creado y configurado correctamente. Incluye usuarios de prueba, roles, políticas y parámetros que el sistema requiere.|Tenant operativo con pequeños errores en la definición de roles o usuarios.|Tenant creado pero faltan roles esenciales o los usuarios no están configurados para pruebas.|Tenant creado con parámetros incompletos que no permiten un flujo de autenticación adecuado.|No crea un tenant.|10%|
|Crea y configura correctamente la aplicación correspondiente dentro del tenant|La aplicación está registrada con clientId correcto. Las URIs de redirección están bien definidas. Los roles y scopes están configurados y el IDaaS expone la API del proyecto de manera adecuada.|La aplicación funciona pero falta algún detalle menor como una URI secundaria o un scope adicional.|La aplicación está registrada pero no tiene correctamente configurados los scopes o los roles de acceso.|Se genera la aplicación pero queda con configuraciones que impiden el flujo de autenticación como URIs erróneas.|No registra la aplicación en el tenant.|10%|
|Crea y configura el flujo de usuario necesario para que, desde el frontend, los usuarios puedan crear sus cuentas en el tenant y luego iniciar sesión, generando los tokens esperados|El flujo de registro e inicio de sesión funciona completamente. Los usuarios pueden crear cuenta e iniciar sesión y el sistema obtiene tokens con los claims esperados.|El flujo funciona en general. Existen detalles menores como mensajes poco claros o validaciones incompletas.|El inicio de sesión funciona pero el registro presenta fallas o tokens obtenidos sin los claims esperados.|El flujo funciona de manera intermitente o no devuelve tokens válidos.|No implementa el flujo.|10%|

Página 4 de 5

|Configura la aplicación y el flujo de usuario de modo que funcionen correctamente utilizando el flujo OIDC “Authorization Code con PKCE”|Implementa el flujo Authorization Code con PKCE correctamente. El sistema genera code verifier y code challenge adecuados. Valida parámetros de seguridad como state y nonce.|El flujo está operativo aunque algunos parámetros opcionales no están verificados completamente.|El flujo funciona pero utiliza configuraciones mezcladas que no corresponden a la implementación ideal.|El flujo usa configuraciones incorrectas como variantes del flujo Implicit o PKCE mal aplicado.|No implementa Authorization Code con PKCE.|15%|
|---|---|---|---|---|---|---|
|Configura correctamente todas las rutas del API Manager para que, mediante un JWT, se valide el acceso a cada uno de los endpoints del sistema|Todas las rutas aplican la validación JWT. El API Manager verifica issuer y audience correctamente y las pruebas muestran respuestas 200 401 y 403 coherentes.|La mayoría de las rutas están protegidas aunque falta una o dos configuraciones menores.|Se configuran políticas de validación solo en parte de las rutas.|Validación mínima que no revisa claims clave como issuer o audience.|No configura validación JWT.|20%|
|Evidencia el funcionamiento de cada ruta y cómo estas llaman correctamente al backend correspondiente y devuelven el JSON esperado|Entrega evidencias completas del funcionamiento de todas las rutas. Muestra llamadas con y sin token y confirma que los microservicios responden con el JSON esperado.|Evidencias casi completas. Faltan algunas rutas o casos de prueba.|Evidencias parciales que solo cubren una parte de los endpoints.|La evidencia es insuficiente o confusa. No permite verificar el comportamiento real del backend.|No presenta evidencia del funcionamiento de las rutas.|15%|
|Total|100%||||||

Página 5 de 5