# Seguridad del acceso de Supervisor

## Cómo funciona ahora

Para entrar como supervisor ya no basta con usuario y contraseña.

Paso 1: usuario + contraseña
   ↓  (si el cargo es supervisor)
Paso 2: clave de supervisor  ← distinta a la contraseña
   ↓
Se crea una sesión con token aleatorio
   ↓
Panel del supervisor (verifica el token en cada carga)


| Capa | Qué evita |
|---|---|
| **Código de autorización** | Que cualquiera se registre como supervisor desde la pantalla de registro |
| **Clave de supervisor (2.º paso)** | Que con solo la contraseña se pueda entrar |
| **Bloqueo: 3 intentos → 15 min** | Adivinar la clave por fuerza bruta (el bloqueo vive en la base de datos, borrar el navegador no lo salta) |
| **Token de sesión** | Falsificar el acceso escribiendo `cargo = supervisor` en la consola. En la base de datos solo se guarda el *hash* del token |
| **Expiración** | La sesión vence a las 8 h o tras 15 min sin actividad |
| **Cierre de sesión real** | Al salir, el token se invalida en el servidor (un token copiado deja de servir) |

Las claves (de supervisor y código) se guardan con **PBKDF2-SHA256, 210 000 iteraciones y sal aleatoria**. Nunca en texto plano.

## Puesta en marcha (una sola vez)

### 1. Crear el código de autorización
Lo eliges tú y solo lo conocen las personas que autorizan supervisores.

```bash
node herramientas/generar-codigo.js
```

Te pide el código (mínimo 12 caracteres) y muestra un JSON así:

```json
{
  "codigo_hash": "…",
  "codigo_salt": "…",
  "codigo_iter": 210000
}
```

### 2. Pegarlo en Firebase
Firebase Console → **Realtime Database** → crea el nodo `config/seguridad` y pega esos tres valores.

> Mientras `config/seguridad` no exista, **nadie** puede registrarse ni activarse como supervisor (el sistema falla "cerrado").

### 3. Publicar las reglas
Realtime Database → pestaña **Reglas** → pega `database.rules.json`.
Esto impide que alguien cambie `config/seguridad` desde el navegador.

### 4. Supervisores que ya existen
En su próximo inicio de sesión verán **"Activa tu acceso de supervisor"** y deberán poner el código de autorización y crear su clave de supervisor.

---

## Archivos nuevos / modificados

| Archivo | Cambio |
|---|---|
| `FIREBASE/cripto.js` | **Nuevo.** Hashing PBKDF2, SHA-256, tokens |
| `FIREBASE/seguridad.js` | **Nuevo.** Código, bloqueo, sesión, guard e inactividad |
| `herramientas/generar-codigo.js` | **Nuevo.** Genera el hash del código de autorización |
| `database.rules.json` | **Nuevo.** Protege `config/` contra escritura |
| `inicio de sistema/login.html`, `script.js`, `style.css` | Segundo paso de supervisor |
| `registro/registro.html`, `javascript.js`, `style.css` | Supervisor exige código + clave |
| `supervisor/supervisor.html`, `script.js` | Guard real, logout seguro, inactividad |
| `supervisor/Configuración_supervisor/html.html` | Ahora también protegida |

---

## ⚠️ Limitación importante (leer)

El proyecto no tiene backend propio para el login: valida desde el navegador contra Firebase Realtime Database, con reglas abiertas (`usuarios` es legible y escribible por cualquiera que tenga la configuración de Firebase, que es pública en el código).

Estas medidas detienen: el registro libre como supervisor, el truco de la consola, la fuerza bruta desde la pantalla de login y el robo de tokens viejos. **No detienen a alguien con conocimientos técnicos que hable directamente con la base de datos** (por ejemplo, creando él mismo un usuario supervisor con su propia clave).

Para cerrar ese hueco por completo hay que migrar el login a **Firebase Authentication** y escribir reglas por rol (`request.auth.token.rol == 'supervisor'`). Es el siguiente paso recomendado.

### Pendientes recomendados (ordenados por importancia)
1. **Contraseñas en texto plano**: hoy `usuarios/*/password` se guarda y se compara sin cifrar, y el login descarga todos los usuarios. Hay que migrarlas a hash o, mejor, a Firebase Authentication.
2. Reglas de **Firestore** abiertas (`allow read, create, update: if true`): cualquiera puede leer/cambiar novedades y solicitudes.
3. Cambiar el código de autorización si alguna vez se filtra (genera uno nuevo y reemplaza el JSON).
