HU2: Ingresar pedido manualmente
Como administrador, quiero ingresar un pedido manualmente en el sistema, para registrar
una nueva solicitud de un cliente.

- Se ingresan datos obligatorios (nombre producto, cantidad, nombre cliente, fecha de
  entrega).
- El sistema no permite guardar un pedido si hay campos requeridos incompletos.
- El formulario incluye una opción para agregar etiquetas personalizadas.
- El campo correo electrónico debe ser opcional
- Al guardar, el pedido queda visible en la vista general
  Diagrama de Secuencia
  HU4: Vista general de pedidos
  Como trabajador, quiero ver una página con el listado de todos los pedidos, para tener una
  visión completa del estado de la producción.
- Se debe mostrar un listado con los pedidos existentes
- Cada pedido debe incluir mínimo nombre de del cliente y fecha de entrega
- El estado del pedido se debe representar con un color: Verde para "Listo", Rojo para
  "Cancelado" y Amarillo para “Pendiente”
- Los pedidos pendientes aparecen al inicio de la lista por defecto.
  Diagrama de Secuencia

HU5: Ver detalles del pedido
Como trabajador, quiero ver el detalle de un pedido específico, para conocer su estado
actual (pendiente, en proceso, entregado).

- El detalle muestra claramente su estado: “Pendiente”, “Listo” o “Cancelado”.
- Incluye datos básicos: cliente, producto, cantidad, fecha de entrega, comentarios y
  etiquetas.
  Diagrama de Secuencia
  HU7: Marcar pedido como entregado
  Como trabajador, quiero marcar un pedido cómo "Listo", para confirmar que ese pedido ha
  finalizado.
- Al marcar como “Listo” un pedido, su estado cambia a “Listo”, sin importar el estado
  previo.
- El cambio se refleja inmediatamente en la vista general y el historial

Diagrama de Secuencia
HU13: Editar Pedido
Como administrador, quiero editar la información de un pedido ya creado, para poder
corregir errores o actualizar su estado

- Al presionar editar, los campos se vuelven editables
- Al presionar guardar los cambios quedan establecidos.
- Al guardar un cambio, se genera una notificación para los demás usuarios
  Diagrama de Secuencia
  HU3: Gestionar listado de pedidos (FUSIÓN HU3 HU4)
  Como trabajador, quiero buscar y ordenar pedidos en la lista, para organizar y encontrar
  fácilmente los pedidos que necesito.

- Existe una barra de búsqueda que permite búsqueda por nombre de cliente o código
  de producto.
- El listado se puede ordenar por estado (Listo, cancelado o pendiente), fecha de
  entrega, nombre de cliente, ciudad de entrega.
  Diagrama de secuencia:
  HU6: Agregar comentarios
  Como administrador, quiero agregar comentarios a un pedido, para dejar registro de notas o
  actualizaciones importantes sobre él.
- Los comentarios quedan asociado al pedido con usuario y fecha
- Los comentarios son visibles desde el detalle del pedido.
  Diagrama de secuencia:

HU8: Eliminar Pedido
Como trabajador, quiero eliminar un pedido, para borrar registros que fueron creados por
error o están duplicados.

- El sistema pide confirmación antes de eliminar.
- Una vez confirmado, el pedido desaparece de la vista general y queda en el historial.
  Diagrama de secuencia:
  HU9: Ver Historial de Pedidos
  Como trabajador, quiero consultar un historial de todos los pedidos, para poder revisar el
  trabajo realizado en períodos anteriores.
- Se muestran pedidos completados, eliminados y cancelados.
- El historial es accesible desde el menú principal.
  Diagrama de secuencia:

HU11: Filtrar Historial
Como trabajador, quiero aplicar filtros al historial, para analizar pedidos específicos por
fecha, nombre de cliente o estado.

- El sistema ofrece filtros de nombre de cliente, rango de fechas y estado
- Los filtros pueden combinarse entre sí.
  Diagrama de secuencia:
  HU17: Reactivar pedido desde el historial:
  Como administrador, quiero tomar un pedido del historial y moverlo a la lista de pedidos en
  curso para reactivar una solicitud de un cliente que se había retractado
- Los pedidos cancelados tienen botón “Reactivar”.
- Al reactivar el pedido, aparece en la vista general con estado “Pendiente”.
  Diagrama de secuencia:

HU20: Vista de pedidos formato Calendario
Como trabajador quiero poder ver los pedidos pendientes en un formato calendario para así
tener una vista más amplia de lo que se viene en el mes.
● En la vista general debe existir un botón que permita cambiar a la vista en formato
calendario.
● En el calendario, cada día que tenga pedidos asociados mostrará un botón con el
nombre o las iniciales del cliente correspondiente.
● Si un día tiene más de tres pedidos, se mostrará un cuarto botón con el texto “+X”,
donde _X_ representa la cantidad de pedidos adicionales de ese día.
● Al presionar el botón “+X”, se abrirá una ventana emergente que permite ver y
desplazarse (scroll) por todos los pedidos asociados a ese día.
● Dentro de la ventana emergente, al seleccionar un pedido, se debe mostrar el detalle
completo de ese pedido.
Diagrama de secuencia:

# Sprint 3

HU1: Iniciar Sesión
Como trabajador, quiero iniciar sesión utilizando mi cuenta de Google, para acceder
rápidamente y de forma segura a las herramientas de gestión de pedidos.
● El sistema debe permitir iniciar sesión únicamente mediante Google OAuth2.
● No debe existir formulario de usuario/contraseña nativo.
● Si el trabajador intenta acceder con una cuenta de Google que no está registrada en
el sistema, debe mostrarse un mensaje claro indicando que no posee acceso
autorizado.
● Si el trabajador está desactivado en el sistema interno, debe impedirse su inicio de
sesión aun cuando el login con Google haya sido exitoso.
● Debe existir un mecanismo equivalente a “Recordarme”, utilizando la persistencia
del token de sesión (cookies/refresh token) para evitar iniciar sesión repetidamente.
● El sistema debe manejar errores provenientes de Google OAuth2 (cancelación del
usuario, tokens inválidos, scopes insuficientes) y mostrar mensajes claros y
amistosos.
● El sistema solo debe permitir el acceso una vez verificada la identidad proveniente
de Google y validado el email contra la base de datos interna.

HU10: Exportar pedidos
Como administrador quiero exportar pedidos desde el historial para generar reportes en
excel

- El archivo contiene toda la información visible en el historial
- El archivo se descarga en formato Excel (.xlsx).
  Diagrama de secuencia:
  HU12: Agregar Usuario
  Como administrador, quiero agregar nuevos usuarios al sistema, para controlar y gestionar
  quiénes tienen acceso.
- El administrador puede crear nuevos usuarios
- El sistema valida el ingreso de un usuario SOLO si no existe tal el usuario
  previamente

HU14: Editar Usuario
Como administrador, quiero editar los datos de un usuario existente, para gestionar sus
permisos o actualizar su información de contacto.

- Al presionar “Editar”, se abre un formulario con datos actuales.
- Se pueden modificar datos y permisos.

HU15: Desactivar Usuario/Activar Usuario
Como administrador, quiero desactivar la cuenta de un usuario, para revocar su acceso al
sistema de forma segura sin borrar su historial.

- Al desactivar, el usuario no puede iniciar sesión.
- El administrador puede reactivar el usuario en cualquier momento.

HU16: Recibir notificaciones de cambios:
Como trabajador, quiero recibir una notificación dentro de la aplicación cuando un pedido es
creado o actualizado para estar siempre informado de los últimos movimientos

- Cualquier cambio en los pedidos, será notificado por notificación.
- Cada notificación aparece como pop-up emergente.
- Al hacer clic, se abre una ventana modal con detalle del cambio.
  HU18: Eliminar usuario permanentemente:
  Como administrador quiero eliminar de forma permanente la cuenta de un usuario para
  borrar completamente sus datos del sistema cuando sea necesario

- El botón “Eliminar permanentemente” aparece junto a “Desactivar”.
- Al presionar el botón “Eliminar permanentemente” aparece una ventana de
  confirmación muy clara sobre la acción
- Tras confirmar, los datos del usuario se eliminan de la base de datos.
  HU21: Manejar Catálogo de Productos
  Como administrador, quiero poder administrar el catálogo de productos (crear, editar,
  eliminar y visualizar), para tener un control total sobre el inventario y la información de
  productos disponibles en el sistema.

● El administrador puede crear, editar y eliminar productos del catálogo
● El sistema valida que no existan productos duplicados por nombre antes de crear
● Todos los campos obligatorios (nombre, precio, stock) deben estar completos para
guardar
● No se permite eliminar productos asociados a pedidos activos
● Se muestran mensajes de confirmación al crear, editar o eliminar productos
