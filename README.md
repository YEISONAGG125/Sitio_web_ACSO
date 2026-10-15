# Sitio_web_ACSO

##  Descripción del proyecto

**ACSO (Aplicación Web de Control y Seguimiento Operativo)** es un sistema web desarrollado para la empresa de aseo y mantenimiento **Power Clean**.

El sistema busca centralizar y organizar diferentes procesos operativos y administrativos de la empresa, facilitando la gestión de información relacionada con usuarios, personal, clientes, servicios, contratos, productos, pagos y novedades.

La aplicación cuenta con diferentes roles de usuario y un sistema de autenticación que permite controlar el acceso a las funcionalidades según el tipo de usuario.

---

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
* Pagos.
* Horarios.
* Notificaciones.
* Novedades laborales.
* Productos asociados a servicios.

---

## Roles del sistema

El sistema maneja cuatro roles principales:

* **Administrador:** gestión general de la información del sistema.
* **Supervisor:** gestión y seguimiento de diferentes procesos operativos.
* **Empleado:** acceso a las funciones correspondientes a sus actividades.
* **Cliente:** consulta de la información relacionada con sus servicios y contratos.

El acceso a las funcionalidades está controlado mediante autenticación y permisos según el rol del usuario.

---

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

---


##  Base de datos

La aplicación utiliza **PostgreSQL** como sistema gestor de base de datos.

La base de datos contiene **16 tablas relacionadas**, utilizando claves primarias y claves foráneas para organizar la información.

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
* PAGOS
* HORARIO
* NOTIFICACION
* NOVEDAD_LABORAL
* PRODUCTOS_SERVICIOS

---

## Autenticación y seguridad

El backend utiliza **Spring Security** para controlar el acceso a los recursos protegidos.

El sistema cuenta con:

* Inicio de sesión.
* Autenticación de usuarios.
* Control de acceso según roles.
* Contraseñas protegidas mediante **BCrypt**.
* Protección de los diferentes endpoints de la API.

El inicio de sesión se realiza mediante el endpoint:

```text
POST /api/login
```

---

## API REST

El backend proporciona una API REST para realizar las operaciones del sistema.

Los principales recursos disponibles son:

```text
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
/api/pagos
/api/servicios
/api/productos-servicios
```

Los recursos cuentan con operaciones CRUD:

```text
GET       Consultar registros
GET /id   Consultar un registro específico
POST      Crear registros
PUT /id   Actualizar registros
DELETE /id Eliminar registros
```

---

##  Pruebas de la API

Las pruebas de los endpoints se realizan utilizando **Postman**.

Se realizan solicitudes HTTP para comprobar el funcionamiento de las operaciones CRUD y verificar las respuestas del backend.

También se utiliza Postman para comprobar el funcionamiento de la autenticación y de los diferentes endpoints de la API.

---

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

---

##  Ejecución del proyecto

### 1. Base de datos

Crear y configurar la base de datos PostgreSQL utilizada por el proyecto.

Los scripts de la base de datos se encuentran en:

```text
database/scripts.sql
database/respaldo.sql
```

La configuración de conexión se encuentra en el archivo:

```text
backend/powerclean-acso/src/main/resources/application.properties
```

La aplicación utiliza PostgreSQL mediante una conexión similar a:

```text
jdbc:postgresql://localhost:5432/power_clean_acso
```

---

### 2. Backend

Abrir la carpeta:

```text
backend/powerclean-acso
```

Ejecutar la aplicación Spring Boot desde IntelliJ IDEA o mediante Maven.

El backend está configurado para ejecutarse en:

```text
http://localhost:8081
```

---

### 3. Frontend

Abrir la carpeta:

```text
frontend
```

El frontend puede ejecutarse mediante **Live Server** desde Visual Studio Code.

Después de iniciar el servidor, acceder al sistema desde el navegador.

---

## Flujo general del sistema

El funcionamiento general del proyecto sigue el siguiente flujo:

```text
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
```

La autenticación permite identificar al usuario y determinar el rol correspondiente para controlar el acceso a las funcionalidades.

---

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

---

## Archivos de apoyo

El proyecto contiene archivos destinados a facilitar su desarrollo y pruebas:

* `database/scripts.sql` — scripts de la base de datos.
* `database/respaldo.sql` — respaldo de la base de datos.
* `postman/ACSO.postman_collection.json` — colección de solicitudes para probar la API.
* `docker/Dockerfile` — configuración de Docker.
* `docker/docker-compose.yml` — configuración de Docker Compose.

---

##  Autores

**Johan Eduardo Letrado Parra**

**Yeison Estid Acuña Guevara**

---

##  Proyecto académico

Proyecto desarrollado como parte del proceso de formación en **Análisis y Desarrollo de Software (ADSO)**.


---

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
