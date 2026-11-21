# Sitio_web_ACSO

##  Descripción del proyecto

**ACSO (Aplicación Web de Control y Seguimiento Operativo)** es un sistema web desarrollado para la empresa de aseo y mantenimiento **Power Clean**.

El sistema busca centralizar y organizar diferentes procesos operativos y administrativos de la empresa, facilitando la gestión de información relacionada con usuarios, personal, clientes, servicios, contratos, productos, pagos y novedades.

La aplicación cuenta con diferentes roles de usuario y un sistema de autenticación que permite controlar el acceso a las funcionalidades según el tipo de usuario.



## Objetivo

Desarrollar una aplicación web que permita organizar, administrar y consultar la información relacionada con los procesos operativos de una empresa de aseo y mantenimiento.

El sistema permite gestionar información de:

* Usuarios y roles.
* Personas.
* Empleados y supervisores.
* Clientes.
* Zonas.
* Proveedores y productos.
* Contratos.
* Servicios.
* Horarios.
* Notificaciones.
* Novedades laborales.
* Productos asociados a servicios.



## Roles del sistema

El sistema maneja cuatro roles principales:

* **Administrador:** gestión general de la información del sistema.
* **Supervisor:** gestión y seguimiento de diferentes procesos operativos.
* **Empleado:** acceso a las funciones correspondientes a sus actividades.
* **Cliente:** consulta de la información relacionada con sus servicios y contratos.

El acceso a las funcionalidades está controlado mediante autenticación y permisos según el rol del usuario.


##  Arquitectura del proyecto

El proyecto está organizado en tres componentes principales:

### Frontend

Desarrollado utilizando:

* HTML
* CSS
* JavaScript

El frontend contiene las interfaces con las que interactúan los usuarios y se comunica con el backend mediante solicitudes HTTP.

### Backend

Desarrollado utilizando:

* Java
* Spring Boot
* Maven
* Spring Security
* Spring Data JPA
* Jakarta Validation

El backend contiene la lógica de la aplicación, los controladores, servicios, repositorios, modelos, validaciones, autenticación y seguridad.

### Base de datos

Se utiliza:

* PostgreSQL

La base de datos almacena y relaciona la información utilizada por el sistema.

##  Base de datos

La aplicación utiliza **PostgreSQL** como sistema gestor de base de datos.

La base de datos contiene **15 tablas relacionadas**, utilizando claves primarias y claves foráneas para organizar la información.

Entre las principales tablas se encuentran:

* ROL
* PERSONAS
* USUARIO
* EMPLEADOS
* SUPERVISORES
* CLIENTE
* ZONA
* PROVEEDOR
* PRODUCTOS
* CONTRATO
* SERVICIOS
* HORARIO
* NOTIFICACION
* NOVEDAD_LABORAL
* PRODUCTOS_SERVICIOS

## Autenticación y seguridad

El backend utiliza **Spring Security** para controlar el acceso a los recursos protegidos.

El sistema cuenta con:

* Inicio de sesión.
* Autenticación de usuarios.
* Control de acceso según roles.
* Contraseñas protegidas mediante **BCrypt**.

El inicio de sesión se realiza mediante el endpoint:
POST /api/login

## API REST

El backend proporciona una API REST para realizar las operaciones del sistema.

Los principales recursos disponibles son:
/api/roles
/api/personas
/api/zonas
/api/proveedores
/api/usuarios
/api/empleados
/api/clientes
/api/supervisores
/api/productos
/api/horarios
/api/notificaciones
/api/novedades
/api/contratos
/api/servicios
/api/productos-servicios

Los recursos cuentan con operaciones CRUD:
GET       Consultar registros
GET /id   Consultar un registro específico
POST      Crear registros
PUT /id   Actualizar registros
DELETE /id Eliminar registros

##  Pruebas de la API

Las pruebas de los endpoints se realizan utilizando **Postman**.

Se realizan solicitudes HTTP para comprobar el funcionamiento de las operaciones CRUD y verificar las respuestas del backend.

También se utiliza Postman para comprobar el funcionamiento de la autenticación y de los diferentes endpoints de la API.

##  Requisitos

Para ejecutar el proyecto se necesitan las herramientas utilizadas durante su desarrollo:

* Java 26.0.1
* Spring Boot
* Maven
* PostgreSQL
* pgAdmin
* Visual Studio Code
* IntelliJ IDEA
* Navegador web
* Postman

##  Ejecución del proyecto

### 1. Base de datos

Crear y configurar la base de datos PostgreSQL utilizada por el proyecto.

Los scripts de la base de datos se encuentran en:
database/scripts.sql
database/respaldo.sq

La configuración de conexión se encuentra en el archivo:
backend/powerclean-acso/src/main/resources/application.properties

La aplicación utiliza PostgreSQL mediante una conexión similar a:

jdbc:postgresql://localhost:5432/power_clean_acso

### 2. Backend

Abrir la carpeta:


backend/powerclean-acso

Ejecutar la aplicación Spring Boot desde IntelliJ IDEA o mediante Maven.

El backend está configurado para ejecutarse en:
http://localhost:8081

### 3. Frontend

Abrir la carpeta:
frontend

El frontend puede ejecutarse mediante **Live Server** desde Visual Studio Code.

Después de iniciar el servidor, acceder al sistema desde el navegador.

## Flujo general del sistema

El funcionamiento general del proyecto sigue el siguiente flujo:

Usuario
   ↓
Frontend
   ↓
Solicitud HTTP
   ↓
API REST
   ↓
Backend Spring Boot
   ↓
PostgreSQL
   ↓
Respuesta al Frontend

La autenticación permite identificar al usuario y determinar el rol correspondiente para controlar el acceso a las funcionalidades.

##  Herramientas utilizadas

Durante el desarrollo del proyecto se utilizaron:

| Herramienta        | Uso                                                |
| ------------------ | -------------------------------------------------- |
| Java               | Lenguaje de programación del backend               |
| Spring Boot        | Desarrollo del backend                             |
| Maven              | Gestión del proyecto y dependencias                |
| Spring Security    | Autenticación y seguridad                          |
| PostgreSQL         | Gestión de la base de datos                        |
| pgAdmin            | Administración de PostgreSQL                       |
| HTML               | Estructura del frontend                            |
| CSS                | Diseño y estilos                                   |
| JavaScript         | Interactividad y comunicación con la API           |
| Postman            | Pruebas de la API                                  |
| IntelliJ IDEA      | Desarrollo del backend                             |
| Visual Studio Code | Desarrollo del frontend                            |
| Git                | Control de versiones                               |
| GitHub             | Repositorio y trabajo colaborativo                 |
| Docker             | Herramientas de apoyo para el entorno del proyecto |


## Archivos de apoyo

El proyecto contiene archivos destinados a facilitar su desarrollo y pruebas:

* `database/scripts.sql` — scripts de la base de datos.
* `database/respaldo.sql` — respaldo de la base de datos.
* `postman/ACSO.postman_collection.json` — colección de solicitudes para probar la API.
* `docker/Dockerfile` — configuración de Docker.
* `docker/docker-compose.yml` — configuración de Docker Compose.


##  Autores

**Johan Eduardo Letrado Parra**

**Yeison Estid Acuña Guevara**

##  Proyecto académico

Proyecto desarrollado como parte del proceso de formación en **Análisis y Desarrollo de Software (ADSO)**.


## Novedades laborales e incapacidades (Firebase / Cloud Firestore)

Flujo: **Empleado → Cloud Firestore → Supervisor**, en tiempo real.

* El empleado envía la novedad desde `empleado/empleado.html` (si el tipo es *Incapacidad* se piden fechas, días calculados automáticamente y EPS/ARL).
* Se guarda en la colección `novedades_laborales` con estado `Pendiente`.
* El supervisor la ve al instante en `supervisor/supervisor.html` → *Novedad laboral* (con aviso emergente y contador en el menú) y puede marcarla como **Pendiente, Visto, En revisión, Aprobada o Rechazada**, con un comentario opcional.
* Cada cambio de estado crea una notificación en la colección `notificaciones` que el empleado ve en su panel.

### Puesta en marcha

1. En la consola de Firebase crea la base **Cloud Firestore** (proyecto `sitio-web-acso`).
2. Publica las reglas del archivo `firestore.rules` (pestaña *Reglas*).
3. Abre el sitio con **Live Server** (puerto 5501) o cualquier servidor HTTP. Los módulos de Firebase no funcionan abriendo el HTML con doble clic (`file://`).
4. Inicia sesión con un usuario de cargo `empleado` y otro con cargo `supervisor`.

### Archivos clave

* `FIREBASE/firebase.js` – configuración única de Firebase (login, empleado y supervisor la importan).
* `empleado/empleados.js` – envío de novedades, historial y notificaciones.
* `supervisor/script.js` – recepción, filtros, cambio de estado y notificaciones.

Los servicios, horarios, contratos, clientes y productos siguen leyéndose de la API Spring Boot (`localhost:8080`). Si el backend está apagado, esas secciones muestran un aviso y el resto sigue funcionando.


---

## Solicitudes de clientes (servicios y contratos)

Flujo: **Cliente → Cloud Firestore → Supervisor**, en tiempo real.

* En `cliente/Cliente.html` → *Solicitar*, el cliente elige **Pedir un servicio** (tipo, fecha, jornada, dirección) o **Pedir un contrato** (servicio, frecuencia, inicio, duración, ubicación, m²).
* Se guarda en la colección `solicitudes` con estado `Pendiente`.
* El supervisor la ve en *Solicitudes* (contador rojo y aviso emergente) y la marca como **Pendiente, Visto, En revisión, Aprobada o Rechazada**, con una respuesta para el cliente.
* Cada cambio crea un documento en `notificaciones` con `id_cliente`, que el cliente ve en su panel y en *Mis solicitudes*.

Colección nueva: **`solicitudes`**. Hay que volver a publicar `firestore.rules` para que Firestore la permita.


---

## Seguridad del acceso de supervisor

El ingreso como supervisor usa un segundo paso (clave de supervisor), código de autorización para registrarse, bloqueo por intentos y sesión con token. Guía de puesta en marcha y limitaciones en [`SEGURIDAD.md`](SEGURIDAD.md).


---

## Panel de administrador y recuperación de contraseña

* **Admin:** `admin/admin.html` (cargo `administrador`, con segundo paso de clave como el supervisor). Gestiona usuarios, recuperaciones y datos de Firebase y de la API.
* **Primer administrador:** `node herramientas/crear-admin.js` y pegar el JSON como nuevo hijo de `usuarios` en Realtime Database.
* **Recuperar contraseña:** `recuperar/recuperar.html`. La persona pide la recuperación, el admin verifica su identidad y genera un código de un solo uso (30 min); con ese código crea su nueva contraseña.
* Las contraseñas nuevas se guardan con hash (PBKDF2); las cuentas antiguas en texto plano siguen entrando.


---

## Inventario, pedidos de productos, servicios asignados y horarios

Todo se guarda en **Cloud Firestore** y se actualiza en tiempo real entre supervisor y empleado.

| Qué | Quién lo hace | Dónde se ve | Colección |
|---|---|---|---|
| Inventario de productos (crear, editar, sumar stock, eliminar, alerta de stock bajo) | Supervisor → *Inventario* | Supervisor, y el empleado lo ve al pedir productos | `inventario` |
| Pedido de productos para un servicio | Empleado → *Pedir productos* | Supervisor → *Pedidos de productos* (con contador en el menú). Al marcarlo **Entregado** se descuenta del inventario (una sola vez) | `pedidos_productos` |
| Asignar un servicio a un empleado (a mano o desde una solicitud de cliente con el botón **👷 Asignar a empleado**) | Supervisor → *Servicios* | Empleado → *Mis servicios* (puede marcarlo *En curso* / *Completado*) | `asignaciones_servicio` |
| Horario de cada empleado (un día, o un rango de fechas con días de la semana) | Supervisor → *Horarios* | Empleado → *Mi horario* y «Turno de hoy» en Inicio | `horarios_empleados` |
| Contratos pedidos por clientes | Cliente → *Solicitar* | Supervisor → *Contratos* → desplegable **Contratos solicitados por clientes** | `solicitudes` (ya existía) |

Cada asignación, cambio de horario o respuesta a un pedido crea una notificación para el empleado en `notificaciones`.

El empleado se identifica con `id_empleado` (o `id_usuario`, o la llave del usuario en Realtime Database), igual que en el resto del panel.

### Reglas de Firestore

Hay que **añadir estas colecciones** a las reglas publicadas (`firestore.rules`), si no Firestore las rechaza:

```
match /inventario/{id}             { allow read, write: if true; }
match /pedidos_productos/{id}      { allow read, write: if true; }
match /asignaciones_servicio/{id}  { allow read, write: if true; }
match /horarios_empleados/{id}     { allow read, write: if true; }
```

(Usa el mismo criterio que ya tienes en `novedades_laborales` y `solicitudes`.)

### Archivos nuevos / modificados

* `FIREBASE/firebase.js` – nuevas colecciones y `deleteDoc` / `writeBatch`.
* `FIREBASE/gestion.css` – estilos compartidos (supervisor y empleado).
* `supervisor/gestion.js` – inventario, pedidos, servicios y horarios del supervisor.
* `supervisor/supervisor.html`, `supervisor/script.js` – menú, secciones y desplegable de contratos.
* `empleado/empleado.html`, `empleado/empleados.js` – *Pedir productos*, *Mis servicios* y *Mi horario* en vivo.


---

## Diseño unificado y accesibilidad de los paneles

Los cuatro paneles (administrador, supervisor, empleado y cliente) usan **una sola hoja de estilos** y **un solo script común**:

| Archivo | Para qué sirve |
|---|---|
| `FIREBASE/acso-ui.css` | Sistema de diseño único: colores, barra superior, menú lateral, cabecera, tarjetas, tablas, botones, formularios, estados, avisos y diálogos. Si algo cambia aquí, cambia igual en los cuatro paneles. |
| `FIREBASE/panel.js` | Comportamiento común: barra «Accesibilidad» (texto A / A+ / A++ y alto contraste), foco y título al cambiar de sección, flechas en el menú, indicador de conexión, `ACSO.confirmar()` / `ACSO.preguntar()` / `ACSO.errorCampo()`. |
| `FIREBASE/menu.js` | Menú lateral (ahora también aplica las preferencias de accesibilidad y bloquea el fondo en móvil). |

Estructura idéntica en los cuatro HTML: `header.acso-topbar` → `aside.sidebar` (`.acso-nav-item`, botón *Cerrar sesión* abajo) → `main.acso-contenido` (`.acso-cab`, secciones con `.section-header`, `footer.acso-pie`).
La opción activa del menú se marca con `aria-current="page"`.

Se eliminaron `menu.css`, `paneles.css`, `perfil.css`, `gestion.css`, `admin.css`, `supervisor/style.css`, `empleado/estilos.css` y `cliente/estilos-cliente.css` (todo quedó en `acso-ui.css`).

Pendiente: `supervisor/Configuracion` y `Reportes` siguen con su diseño propio.
