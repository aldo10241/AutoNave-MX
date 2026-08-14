# 🚗💦 Control Carwash Libre

App **gratuita y de código abierto** para gestionar un autolavado: tickets, caja, asistencia de trabajadores y estadísticas. Es una **PWA** (Progressive Web App): funciona en el navegador, se puede **instalar** en el celular o la computadora como si fuera una app nativa, y **sigue funcionando sin internet** una vez cargada.

No usa frameworks ni npm/Node — es HTML, CSS y JavaScript "vanilla" (módulos ES). Esto significa que **no hay que compilar nada**: se sube tal cual a GitHub Pages y ya funciona. Cada dueño de carwash **crea su cuenta** (correo/contraseña o Google) y sus datos se guardan en su propia cuenta en la nube (Firebase, plan gratuito), así que puede entrar desde el celular, una tablet y la computadora del mostrador y ver siempre la misma información.

El diseño es una identidad propia — "boleto de taller": papel cálido, tinta oscura, un acento ámbar y los tickets dibujados como boletos perforados de verdad. No es una copia de ninguna otra app.

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
manifest.webmanifest     metadata de la PWA (nombre, ícono, colores)
sw.js                    service worker (caché offline del "cascarón" de la app)
ads.txt                  para cuando actives Google AdSense
css/styles.css           todo el sistema de diseño ("boleto de taller")
js/
  app.js                 arranque + router + control de sesión (login/onboarding/app)
  firebaseConfig.js      tus claves de Firebase (las pegas tú, ver sección 2)
  firebase.js            inicializa Firebase (Auth + Firestore con caché offline)
  auth.js                login/registro/Google/logout/recuperar contraseña
  db.js                  capa de datos (Firestore, organizado por usuario)
  store.js               estado compartido en memoria
  ui.js                  helpers de interfaz (topbar, sheets/modales, tarjeta de ticket)
  ads.js                 módulo de anuncios (AdSense)
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

1. Entra a [console.firebase.google.com](https://console.firebase.google.com) con tu cuenta de Google → **Agregar proyecto** → dale un nombre (ej. "carwash-libre") → puedes desactivar Google Analytics, no lo necesitas.
2. Dentro del proyecto, click en el ícono **`</>`** ("Web") para agregar una app web → dale un apodo → **no** hace falta marcar "Firebase Hosting" (usarás GitHub Pages) → Registrar app.
3. Firebase te muestra un bloque de código con un objeto `firebaseConfig = {...}`. Copia esos valores y pégalos en [js/firebaseConfig.js](js/firebaseConfig.js), reemplazando el objeto de ejemplo.

### 2.2 Activar el login

1. Menú lateral → **Authentication** → **Comenzar** (Get started).
2. Pestaña **Sign-in method** → activa **Correo electrónico/contraseña**.
3. En la misma pestaña, activa **Google** → elige un correo de soporte → Guardar.
4. Cuando despliegues en GitHub Pages, ve a **Authentication → Settings → Authorized domains** y agrega tu dominio (`tuusuario.github.io`) — si no, el botón de Google fallará con "unauthorized-domain".

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
2. Crea un repositorio nuevo (botón **New repository**). Puede ser público (necesario para GitHub Pages gratis, salvo que tengas plan de pago) — por ejemplo `carwash-libre`. No marques "Add a README" (ya tienes uno).
3. En tu computadora, dentro de esta carpeta:

```bash
git init
git add .
git commit -m "Primera versión de Control Carwash Libre"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/carwash-libre.git
git push -u origin main
```

(Reemplaza `TU-USUARIO/carwash-libre` por la URL real de tu repositorio.)

## 4. Desplegarlo con GitHub Pages

Este proyecto ya incluye `.github/workflows/deploy.yml`, que despliega automáticamente cada vez que subes cambios a la rama `main`. Solo falta activarlo:

1. En GitHub, entra a tu repositorio → **Settings** → **Pages**.
2. En "Build and deployment" → **Source**, elige **GitHub Actions** (no "Deploy from a branch").
3. Haz cualquier pequeño cambio y `git push`, o entra a la pestaña **Actions** de tu repo y ejecuta el workflow manualmente ("Run workflow").
4. En unos segundos/minutos tu app quedará publicada en:
   `https://TU-USUARIO.github.io/carwash-libre/`

Cada vez que hagas `git push` a `main`, el sitio se actualiza solo.

### Alternativa sin Actions (más simple, menos flexible)

Si prefieres no usar el workflow: Settings → Pages → Source → **Deploy from a branch** → rama `main`, carpeta `/ (root)`. Funciona igual de bien para este proyecto porque no hay build.

## 5. Instalar la app en el celular (PWA)

Una vez publicada:

- **Android (Chrome)**: entra al sitio, aparecerá un banner "Instalar" dentro de la app (o el menú ⋮ → "Instalar app" / "Agregar a pantalla de inicio").
- **iPhone (Safari)**: entra al sitio → botón compartir (cuadrito con flecha) → **"Agregar a pantalla de inicio"**. iOS no permite instalar PWAs desde otros navegadores, tiene que ser Safari.
- **Escritorio (Chrome/Edge)**: ícono de instalar en la barra de direcciones, o menú → "Instalar Control Carwash Libre".

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

**Nota sobre `ads.txt` y GitHub Pages:** el archivo `ads.txt` normalmente se valida en la raíz del dominio (`tudominio.com/ads.txt`). Si publicas en `usuario.github.io/carwash-libre/`, el archivo queda en una subcarpeta y AdSense puede no encontrarlo automáticamente. Para que valide sin problema, lo más simple es conectar un **dominio propio** a GitHub Pages (Settings → Pages → Custom domain) o publicar como página de usuario/organización (`usuario.github.io`, sin subcarpeta).

Mientras `ADSENSE_CLIENT` conserve el valor de ejemplo, la app **no carga ningún anuncio real** (evita errores y espacios vacíos para tus usuarios).

### Alternativas si AdSense no aprueba tu sitio todavía

- [Carbon Ads](https://www.carbonads.net/) o [BuySellAds](https://www.buysellads.com/): redes más pequeñas, suelen aprobar más rápido.
- Un simple banner de "apóyanos" con enlace a Ko-fi / Buy Me a Coffee mientras consigues aprobación (puedes reemplazar temporalmente el contenido de `mountAd()` en `js/ads.js`).

## 7. Personalizarlo

- **Nombre e ícono**: edita `manifest.webmanifest` (`name`, `short_name`, `theme_color`) y vuelve a generar los íconos con `python scripts/generate_icons.py` después de ajustar los colores en ese script, o reemplaza directamente los archivos en `icons/` por tu propio logo (mismos nombres y tamaños: 192×192, 512×512, 512×512 maskable, 180×180 para iOS).
- **Colores y estilo**: variables CSS al inicio de `css/styles.css` (`--bg`, `--accent`, `--ink`, etc. — hay un bloque para modo claro y otro para oscuro).
- **Datos de ejemplo al primer uso**: `js/views/onboarding.js` (tipos de vehículo, servicios y trabajadores por defecto).

## 8. Limitaciones actuales (honestidad ante todo)

- **Un dueño = una caja compartida.** Todos los que inicien sesión con la misma cuenta ven los mismos datos; no hay roles distintos por empleado (todos tienen los mismos permisos). Para varias sucursales necesitarías una cuenta por sucursal.
- El plan gratuito de Firebase (Spark) tiene límites diarios generosos pero reales (lecturas/escrituras/almacenamiento). Un carwash normal no se acerca a ellos, pero si creces mucho revisa el panel de uso en Firebase Console.
- Si alguna vez quieres borrar tu cuenta de Firebase también deberás borrar los datos del usuario en Firestore (o usar **Más → Copia de seguridad → Borrar todos los datos** antes) — Firebase Authentication y Firestore son productos separados.
- El inventario de "Productos" no descuenta stock automáticamente al vender — es solo una lista de precios para agilizar la carga de consumo adicional.

## Licencia

MIT — úsala, modifícala y compártela libremente. Ver [LICENSE](LICENSE).
