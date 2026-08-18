# AutoNave MX

App **gratuita y de código abierto** para gestionar un autolavado: tickets, caja, asistencia de trabajadores y estadísticas. Es una **PWA** (Progressive Web App): funciona en el navegador, se puede **instalar** en el celular o la computadora como si fuera una app nativa, y **sigue funcionando sin internet** una vez cargada.

No usa frameworks ni npm/Node — es HTML, CSS y JavaScript "vanilla" (módulos ES). Esto significa que **no hay que compilar nada**: se sube tal cual a GitHub Pages y ya funciona. Cada dueño de carwash **crea su cuenta** (correo/contraseña o Google) y sus datos se guardan en su propia cuenta en la nube (Firebase, plan gratuito), así que puede entrar desde el celular, una tablet y la computadora del mostrador y ver siempre la misma información.

El diseño es una identidad propia: panel oscuro y elegante, tarjetas redondeadas, sombras suaves y un acento azul — pensado para verse profesional y para que cualquier persona lo use cómodamente, sin importar su edad o qué tan acostumbrada esté a la tecnología.

## Qué incluye

- **Login por cuenta**: correo/contraseña o Google. Tus datos quedan ligados a tu cuenta, no al dispositivo.
- **Tickets**: abre un ticket al recibir un vehículo, agrega servicios adicionales y consumo extra al cerrarlo, cobra en efectivo/digital/mixto/crédito, comparte el comprobante por WhatsApp o imprímelo/guárdalo como PDF.
- **Día**: desglose de caja (reserva + cobros − gastos − propinas), resumen del día, cierre de día.
- **Asistencia**: marca entrada/salida de cada trabajador por día.
- **Estadísticas**: totales por hoy/7 días/mes/rango personalizado, gráfico de los últimos 7 días, exportación a CSV (Excel).
- **Historial**, **Trabajadores**, **Productos** y **Configuración** (tipos de vehículo y precios, servicios adicionales, reserva de caja). Todos los montos se muestran en **pesos mexicanos (MXN)**.
- **Copia de seguridad**: exporta/importa todos los datos en un archivo `.json`.
- **Modo claro/oscuro**, instalable como app (Android/iOS/escritorio), funciona offline gracias al caché local de Firestore, e incluye espacios discretos para anuncios (ver más abajo).

## Estructura del proyecto

```
index.html              punto de entrada
privacidad.html          aviso de privacidad (edítalo con tus datos, ver sección 7)
terminos.html            términos de uso (edítalo con tus datos, ver sección 7)
manifest.webmanifest     metadata de la PWA (nombre, ícono, colores)
sw.js                    service worker (caché offline del "cascarón" de la app)
ads.txt                  para cuando actives Google AdSense
css/styles.css           todo el sistema de diseño (panel oscuro, tarjetas y navegación)
js/
  app.js                 arranque + router + control de sesión (login/onboarding/app)
  firebaseConfig.js      tus claves de Firebase (las pegas tú, ver sección 2)
  firebase.js            inicializa Firebase (Auth + Firestore con caché offline)
  auth.js                login/registro/Google/logout/recuperar contraseña
  db.js                  capa de datos (Firestore, organizado por usuario)
  store.js               estado compartido en memoria
  ui.js                  helpers de interfaz (topbar, sheets/modales, tarjeta de ticket)
  ads.js                 módulo de anuncios (AdSense)
  donate.js              enlace opcional de donación (Stripe/Ko-fi/etc.) + bono "sin anuncios"
  install.js             lógica de "instalar app"
  theme.js               preferencia de tema claro/oscuro
  utils.js               formateo, toasts, exportar CSV, etc.
  views/                 una vista por pantalla (login, tickets, day, attendance, stats...)
icons/                   íconos de la PWA (192, 512, maskable, apple-touch)
scripts/generate_icons.py regenera los íconos (opcional, requiere Python)
.github/workflows/deploy.yml  despliegue automático a GitHub Pages
```

## 1. Probarlo en tu computadora antes de subirlo

Como no hay proceso de build, solo necesitas servir la carpeta con cualquier servidor estático (abrir `index.html` con doble clic **no funciona bien** porque los módulos ES y el service worker requieren `http://`, no `file://`).

Opción con Python (ya viene en la mayoría de sistemas):

```bash
python -m http.server 8080
```

Y abre `http://localhost:8080` en el navegador. También puedes usar la extensión "Live Server" de VS Code, o `npx serve` si tienes Node instalado.

Mientras no hayas conectado Firebase (siguiente sección), verás una pantalla explicándote qué falta — es normal, no es un error.

## 2. Login y datos en la nube (Firebase)

La app usa **Firebase** (de Google) para el login y para guardar los datos: es gratis para un proyecto de este tamaño (plan **Spark**, sin tarjeta de crédito), no requiere que mantengas un servidor, y funciona perfecto sirviendo el resto de la app como archivos estáticos en GitHub Pages.

### 2.1 Crear el proyecto

1. Entra a [console.firebase.google.com](https://console.firebase.google.com) con tu cuenta de Google → **Agregar proyecto** → dale un nombre (ej. "autonave-mx") → puedes desactivar Google Analytics, no lo necesitas.
2. Dentro del proyecto, click en el ícono **`</>`** ("Web") para agregar una app web → dale un apodo → **no** hace falta marcar "Firebase Hosting" (usarás GitHub Pages) → Registrar app.
3. Firebase te muestra un bloque de código con un objeto `firebaseConfig = {...}`. Copia esos valores y pégalos en [js/firebaseConfig.js](js/firebaseConfig.js), reemplazando el objeto de ejemplo.

### 2.2 Activar el login

1. Menú lateral → **Authentication** → **Comenzar** (Get started).
2. Pestaña **Sign-in method** → activa **Correo electrónico/contraseña**.
3. En la misma pestaña, activa **Google** → elige un correo de soporte → Guardar.
4. Cuando despliegues en GitHub Pages, ve a **Authentication → Settings → Authorized domains** y agrega tu dominio (`tuusuario.github.io`, y también tu dominio propio si conectaste uno, ej. `autonavemx.com`) — si no, el botón de Google fallará con "unauthorized-domain".
5. La app ya envía automáticamente un correo de verificación cuando alguien crea cuenta con correo/contraseña (no bloquea el uso, solo muestra un aviso en Más hasta que confirmen). No necesitas configurar nada para esto.

### 2.2.1 Bloquear bots en el registro (gratis, opcional)

Para evitar registros automatizados sin pedirle a la gente real que resuelva ningún captcha, la app usa **Firebase App Check + reCAPTCHA v3** (invisible casi siempre):

1. Ve a [google.com/recaptcha/admin/create](https://www.google.com/recaptcha/admin/create) → registra un sitio con **reCAPTCHA v3**, dominio `autonavemx.com` (agrega también `localhost` si quieres probar en tu compu). Te da una **clave del sitio** (pública) y una **clave secreta** (privada, no la compartas).
2. En Firebase Console → ⚙️ **Configuración del proyecto → App Check** → registra tu app web con el proveedor reCAPTCHA v3, pegando ahí la clave **secreta**.
3. Pega la clave del **sitio** (la pública) en [js/firebaseConfig.js](js/firebaseConfig.js), reemplazando `RECAPTCHA_SITE_KEY`.
4. En **App Check → pestaña "APIs"**, activa "Enforce" para Authentication.

Mientras no configures `RECAPTCHA_SITE_KEY`, la app funciona igual, solo sin esta capa extra.

### 2.3 Activar la base de datos (Firestore)

1. Menú lateral → **Firestore Database** → **Crear base de datos** → modo **producción** → elige la región más cercana a tus usuarios.
2. Ve a la pestaña **Reglas** y reemplaza todo por esto (cada quien solo puede leer/escribir sus propios datos):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      match /{collection}/{docId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
}
```

3. **Publicar**.

Con esto ya puedes recargar la app local (`python -m http.server 8080`), crear una cuenta y usarla. Los límites gratuitos de Firestore (Spark) son generosos para un carwash: ~50,000 lecturas y ~20,000 escrituras al día, 1 GB de almacenamiento — normalmente no se acercan a eso.

> Si quieres que varios empleados usen la misma cuenta (una sola caja compartida), simplemente inicien sesión todos con el mismo correo y contraseña. El "login por usuario" de esta app está pensado para un dueño/negocio por cuenta, no para roles distintos por empleado (eso quedaría como mejora futura).

## 3. Subirlo a GitHub

1. Crea una cuenta en [github.com](https://github.com) si no tienes una.
2. Crea un repositorio nuevo (botón **New repository**). Puede ser público (necesario para GitHub Pages gratis, salvo que tengas plan de pago) — por ejemplo `autonave-mx`. No marques "Add a README" (ya tienes uno).
3. En tu computadora, dentro de esta carpeta:

```bash
git init
git add .
git commit -m "Primera versión de AutoNave MX"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/autonave-mx.git
git push -u origin main
```

(Reemplaza `TU-USUARIO/autonave-mx` por la URL real de tu repositorio.)

## 4. Desplegarlo con GitHub Pages

Este proyecto ya incluye `.github/workflows/deploy.yml`, que despliega automáticamente cada vez que subes cambios a la rama `main`. Solo falta activarlo:

1. En GitHub, entra a tu repositorio → **Settings** → **Pages**.
2. En "Build and deployment" → **Source**, elige **GitHub Actions** (no "Deploy from a branch").
3. Haz cualquier pequeño cambio y `git push`, o entra a la pestaña **Actions** de tu repo y ejecuta el workflow manualmente ("Run workflow").
4. En unos segundos/minutos tu app quedará publicada en:
   `https://TU-USUARIO.github.io/autonave-mx/`

Cada vez que hagas `git push` a `main`, el sitio se actualiza solo.

### Alternativa sin Actions (más simple, menos flexible)

Si prefieres no usar el workflow: Settings → Pages → Source → **Deploy from a branch** → rama `main`, carpeta `/ (root)`. Funciona igual de bien para este proyecto porque no hay build.

### Dominio propio (ej. autonavemx.com)

El repositorio ya incluye un archivo `CNAME` apuntando a `autonavemx.com`, pero eso por sí solo no activa el dominio — faltan dos pasos más:

1. En tu proveedor de dominio (donde compraste `autonavemx.com`), agrega estos registros DNS:
   - Cuatro registros **A** apuntando a: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
   - Si además quieres que funcione `www.autonavemx.com`, agrega un registro **CNAME** de `www` apuntando a `TU-USUARIO.github.io`.
2. En GitHub → tu repo → **Settings → Pages**, en el campo "Custom domain" escribe `autonavemx.com` y guarda. Espera a que aparezca la palomita verde (puede tardar de minutos a un día en propagar) y luego marca **"Enforce HTTPS"**.

Mientras el dominio no esté verificado, tu app sigue funcionando normal en `https://TU-USUARIO.github.io/autonave-mx/`.

## 5. Instalar la app en el celular (PWA)

Una vez publicada:

- **Android (Chrome)**: entra al sitio, aparecerá un banner "Instalar" dentro de la app (o el menú ⋮ → "Instalar app" / "Agregar a pantalla de inicio").
- **iPhone (Safari)**: entra al sitio → botón compartir (cuadrito con flecha) → **"Agregar a pantalla de inicio"**. iOS no permite instalar PWAs desde otros navegadores, tiene que ser Safari.
- **Escritorio (Chrome/Edge)**: ícono de instalar en la barra de direcciones, o menú → "Instalar AutoNave MX".

Después de instalada, abre igual que cualquier app y funciona sin conexión — el service worker cachea el "cascarón" (HTML/CSS/JS) y Firestore cachea tus datos localmente; todo se sincroniza solo al recuperar internet (excepto el primer login, que sí necesita conexión, y los anuncios).

> **Importante:** actualiza el número `CACHE_VERSION` al inicio de `sw.js` cada vez que subas cambios importantes. Así el service worker sabe que debe descargar la versión nueva en vez de seguir usando la copia guardada en el celular de tus usuarios.

## 6. Monetización con anuncios (Google AdSense)

La app ya trae listo el "enchufe" para anuncios discretos (`js/ads.js`), colocados **solo** en pantallas secundarias: Estadísticas, Historial y Configuración — nunca en el flujo de abrir/cerrar tickets, y nunca como pantallas completas ni pop-ups.

Pasos para activarlos:

1. Ve a [adsense.google.com](https://adsense.google.com) y agrega tu sitio (la URL de GitHub Pages, o tu dominio propio si conectaste uno).
2. Google revisa el sitio (puede tardar días o semanas; necesita contenido real y algo de tráfico/uso).
3. Cuando te aprueben, copia tu ID de cliente (`ca-pub-XXXXXXXXXXXXXXXX`) y pégalo en `js/ads.js`, reemplazando `ADSENSE_CLIENT`.
4. Crea 2 o 3 bloques de anuncio tipo "Display" en tu panel de AdSense y copia sus IDs de bloque (`data-ad-slot`) en el objeto `AD_SLOTS` del mismo archivo (`stats`, `history`, `config`).
5. Actualiza `ads.txt` en la raíz del proyecto con la línea que te indique AdSense.
6. Sube los cambios (`git add . && git commit -m "activar anuncios" && git push`).

**Nota sobre `ads.txt` y GitHub Pages:** el archivo `ads.txt` normalmente se valida en la raíz del dominio (`tudominio.com/ads.txt`). Con el dominio propio ya conectado (ver sección 4 → "Dominio propio"), `ads.txt` queda automáticamente en `autonavemx.com/ads.txt` — justo donde AdSense lo espera.

Mientras `ADSENSE_CLIENT` conserve el valor de ejemplo, la app **no carga ningún anuncio real** (evita errores y espacios vacíos para tus usuarios).

### Alternativas si AdSense no aprueba tu sitio todavía

- [Carbon Ads](https://www.carbonads.net/) o [BuySellAds](https://www.buysellads.com/): redes más pequeñas, suelen aprobar más rápido.
- Un simple banner de "apóyanos" con enlace a Ko-fi / Buy Me a Coffee mientras consigues aprobación (puedes reemplazar temporalmente el contenido de `mountAd()` en `js/ads.js`).

### Honestidad sobre cuánto puedes ganar con los anuncios

Los anuncios solo aparecen en pantallas secundarias (Estadísticas, Historial, Config), así que hay pocas impresiones por negocio al día. Con RPM típico de tráfico mexicano (~$1-3 USD por cada 1,000 impresiones), esto se siente más como para cubrir gastos simbólicos que como un ingreso real, salvo que la app la usen cientos de negocios de forma activa. No la conviertas en tu plan de negocio principal.

### Donaciones (probablemente más realista que los anuncios)

Además de los anuncios, la app tiene un botón opcional de "Donar" en **Más**, pensado para que quien la use y le sirva pueda apoyarte directamente — suele rendir más rápido que AdSense para una herramienta de nicho como esta. Quien dona, además, deja de ver anuncios en su cuenta automáticamente.

**Recomendado: Stripe Payment Link** — es la única opción de las tres que cobra en pesos mexicanos de forma nativa (no dólares) y que puede activar el "sin anuncios" automáticamente al volver del pago.

1. Crea tu cuenta en [dashboard.stripe.com/register](https://dashboard.stripe.com/register) (correo, nombre, cómo te van a depositar — cuenta bancaria mexicana). Esto lo tienes que hacer tú; nadie más puede crear tu cuenta de pagos.
2. Ya adentro, ve a **Payment links** (Enlaces de pago) en el menú lateral → **+ Crear enlace de pago**.
3. En "Producto": nombre "Donación AutoNave MX", y en precio elige **"El cliente elige cuánto pagar"** (así cualquiera dona lo que quiera, no un monto fijo).
4. Revisa que la moneda diga **MXN** (pesos mexicanos) — Stripe la detecta según tu cuenta, pero confírmalo antes de crear el link.
5. Antes de crear el link, abre **"Opciones avanzadas" → "Después del pago"** → elige **"Redirigir a tu sitio web"** y pega exactamente esta URL (ajusta tu usuario/repo si son distintos):
   ```
   https://autonavemx.com/?gracias=1#/more
   ```
   Ese `?gracias=1` es lo que la app detecta para quitar los anuncios al volver — si cambias esa palabra aquí, también cámbiala en `DONATION_RETURN_PARAM` dentro de [js/donate.js](js/donate.js).
6. **Crear enlace**. Te da una URL tipo `https://buy.stripe.com/xxxxxxxx`. Cópiala.
7. Pégala en [js/donate.js](js/donate.js), reemplazando el valor vacío de `DONATION_URL`.

Stripe cobra una comisión por cada donación (normal en cualquier procesador): aproximadamente 3.6% + $3 MXN por transacción con tarjetas mexicanas, más IVA sobre esa comisión — de una donación de $100 MXN te llegarían netos alrededor de $92 MXN.

**Nota sobre el "sin anuncios":** como la app no tiene servidor propio, no hay forma 100% blindada de confirmar el pago real — la app confía en que Stripe te regresó porque el pago fue exitoso. Es más que suficiente dado que hablamos de anuncios que valen centavos; no es algo por lo que valga la pena complicar la app con funciones en la nube.

**Alternativas más simples (pero sin el bono de "sin anuncios" automático):** [Ko-fi](https://ko-fi.com) o PayPal.me — más rápidas de configurar, aunque Ko-fi muestra los montos en USD salvo que cambies la configuración regional de tu cuenta.

## 7. Aviso de privacidad y términos de uso

Como la app guarda datos personales (correo, nombre del negocio, y placas de vehículos que registras en los tickets) y usa AdSense, la ley mexicana y las políticas de Google exigen un aviso de privacidad — ya viene incluido:

- [privacidad.html](privacidad.html) — aviso de privacidad (identidad del responsable, qué datos se recaban, para qué, con quién se comparten, cómo ejercer tus derechos ARCO).
- [terminos.html](terminos.html) — términos de uso (servicio "tal cual", responsabilidad, donaciones, propiedad intelectual).

**Antes de publicar, edítalos con tus datos reales:**

1. Abre [privacidad.html](privacidad.html) y reemplaza `[TU NOMBRE O RAZÓN SOCIAL]` por tu nombre. Revisa que el correo de contacto sea el que quieres usar públicamente.
2. Ambos archivos tienen un comentario al inicio recordándote qué editar.
3. Ya están enlazados desde la pantalla de inicio de sesión y desde **Más**.

Esto no sustituye una revisión legal formal — son plantillas razonables basadas en los requisitos vigentes, pero si en algún momento monetizas en serio o creces mucho, vale la pena que un abogado las revise.

## 8. Personalizarlo

- **Nombre e ícono**: edita `manifest.webmanifest` (`name`, `short_name`, `theme_color`) y vuelve a generar los íconos con `python scripts/generate_icons.py` después de ajustar los colores en ese script, o reemplaza directamente los archivos en `icons/` por tu propio logo (mismos nombres y tamaños: 192×192, 512×512, 512×512 maskable, 180×180 para iOS).
- **Colores y estilo**: variables CSS al inicio de `css/styles.css` (`--bg`, `--accent`, `--ink`, etc. — hay un bloque para modo claro y otro para oscuro).
- **Datos de ejemplo al primer uso**: `js/views/onboarding.js` (tipos de vehículo, servicios y trabajadores por defecto).

## 9. Limitaciones actuales (honestidad ante todo)

- **Un dueño = una caja compartida.** Todos los que inicien sesión con la misma cuenta ven los mismos datos; no hay roles distintos por empleado (todos tienen los mismos permisos). Para varias sucursales necesitarías una cuenta por sucursal.
- El plan gratuito de Firebase (Spark) tiene límites diarios generosos pero reales (lecturas/escrituras/almacenamiento). Un carwash normal no se acerca a ellos, pero si creces mucho revisa el panel de uso en Firebase Console.
- Si alguna vez quieres borrar tu cuenta de Firebase también deberás borrar los datos del usuario en Firestore (o usar **Más → Copia de seguridad → Borrar todos los datos** antes) — Firebase Authentication y Firestore son productos separados.
- El inventario de "Productos" no descuenta stock automáticamente al vender — es solo una lista de precios para agilizar la carga de consumo adicional.

## Licencia

MIT — úsala, modifícala y compártela libremente. Ver [LICENSE](LICENSE).
