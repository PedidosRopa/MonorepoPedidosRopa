# Evaluación Parcial N° 1

## Encargo | Estudiante

### Evaluación Parcial N° 1

##### Encargo | Estudiante

|Sigla|Nombre Asignatura|Tiempo Asignado|% Ponderación|Semana inicio EFT|
|---|---|---|---|---|
|DSY1107|Desarrollo Cloud Native I|5 horas pedagógicas|16%||

**1. Instrucciones generales**

|Descripción||||||
|---|---|---|---|---|---|
|• Gateway. • •|La distribución de los porcentajes en esta evaluación es la siguiente:||En esta primera etapa deberás diseñar y desarrollar la arquitectura base del sistema Pedidos360, integrando el frontend en Angular con autenticación mediante Azure AD (MSAL), el backend en Spring Boot desplegado en instancias EC2 y protegido a través de AWS API Tu objetivo es lograr un sistema funcional y seguro, que demuestre la correcta comunicación entre componentes y servicios en la nube.|||
||Evaluación|Tipo de situación evaluativa|Distribución de porcentajes en el ET|Individual/Grupal||
||Evaluación Parcial N°1 (16%) Total|Encargo|40% 100%|Parejas||
|• • • tiempo de trabajo personal. Instrucciones específicas de la Evaluación:||El encargo corresponde al código de los componentes frontend y backend del sistema, entregado vía GitHub. El tiempo asignado para desarrollar esta evaluación es de 2 semanas para la elaboración del encargo y de la presentación.|Las/los estudiantes inician el trabajo del encargo en el Taller de Proyectos (Taite 7), pero deben finalizarlo junto a presentación en su|||

Página 1 de 4

- Los componentes desarrollados, frontend y backend se entregan mediante el envío a el/la docente del código fuente.
- El código de todos los componentes del backend debe compilar, seguir buenas prácticas y responder a pruebas básicas.
- El código del frontend debe estar completo, modular, sin errores de compilación y con vistas funcionales.
- La integración del backend con la base de datos cloud debe estar configurada correctamente mediante entidades, repositorios y propiedades de conexión.
- El backend debe incluir filtros que validen el JWT recibido desde el IDaaS para autorizar las peticiones.
- El frontend debe implementar el flujo de login con IDaaS y utilizar el JWT en las llamadas al backend.
- Para ambos contextos, front y back, solo debe subirse a los repositorios lo que corresponda a la tecnología utilizada, configurando los archivos .gitignore necesarios para lograr esto.
Los aspectos formales son:

- Formato: el backend debe corresponder a varios microservicios construidos en Java con Spring Boot, el frontend debe ser un componente Angular. Ambos tipos de componentes deben ser entregados como enlaces a GitHub.
- Medio de entrega: Copiar los enlaces de los repositorios de GitHub a AVA y enviar copia al correo del docente, en el plazo de entrega establecido.
Los materiales, herramientas o insumos que se requieren para realizar esta evaluación:

- Materiales y contenidos académicos proporcionados durante el curso, incluyendo especificaciones técnicas, análisis previos y guías de referencia.
- <u>Computadores disponibles en taller de proyectos (TAITE 7)</u>
Página 2 de 4

**2.Pauta de Evaluación**

|Indicador de Evaluación|Categorías de Respuesta|Ponderación Indicador de Evaluación|||||
|---|---|---|---|---|---|---|
|||Muy buen desempeño 100%|Buen desempeño 80%|Desempeño aceptable 60%|Desempeño incipiente 30%|Desempeño no logrado 0%|
|Configura y utiliza correctamente la librería MSAL en conjunto con Angular, de manera que el flujo de usuario funcione correctamente y permita obtener todos los tokens necesarios|MSAL integrado y operativo. El inicio y cierre de sesión funcionan correctamente. Los guards y el MsalInterceptor operan sin fallas. Se obtienen los tokens necesarios para consumir el API Gateway y se|El flujo de autenticación funciona y el sistema consume el API Gateway. Existen pequeños detalles de configuración como fallas leves en guards o lectura parcial de roles.|La aplicación autentica pero presenta fallas intermitentes. A veces no adjunta el token o no renueva correctamente los accesos.|El login se muestra pero el token no se adjunta correctamente en las llamadas o la aplicación usa configuraciones incorrectas del IDaaS.|No integra MSAL o no logra autenticar en absoluto.|60%|

|Categoría|% logro|Descripción niveles de logro|
|---|---|---|
|Muy buen desempeño|100%|Demuestra un desempeño destacado, evidenciando el logro de todos los aspectos evaluados en el indicador.|
|Buen desempeño|80%|Demuestra un alto desempeño del indicador, presentando pequeñas omisiones, dificultades y/o errores.|
|Desempeño aceptable|60%|Demuestra un desempeño competente, evidenciando el logro de los elementos básicos del indicador, pero con omisiones, dificultades o errores.|
|Desempeño incipiente|30%|Presenta importantes omisiones, dificultades o errores en el desempeño, que no permiten evidenciar los elementos básicos del logro del indicador, por lo que no puede ser considerado competente.|
|Desempeño no logrado|0%|Presenta ausencia o incorrecto desempeño.|

Página 3 de 4

|||||||leen roles y scopes desde los claims del token.|
|---|---|---|---|---|---|---|
|Configura correctamente el BFF para que, al igual que el API Manager, pueda validar el token recibido con el IDaaS definido y solo permita consumir el endpoint si el token es válido|El BFF valida issuer y audience de forma correcta. Verifica la firma del token y su vigencia. Aplica autorización por rol cuando corresponde y responde con códigos de error adecuados.|La validación es consistente y funcional. Existe algún error muy menor en la autorización o en la forma de entregar mensajes de error.|El BFF valida tokens en la mayoría de los endpoints. Algunas rutas no verifican claims críticos como expiración o audience.|El BFF solo revisa la presencia del token. No valida firma ni claims relevantes.|No valida JWT o permite el acceso sin autenticación.|40%|
|Total|100%||||||

Página 4 de 4