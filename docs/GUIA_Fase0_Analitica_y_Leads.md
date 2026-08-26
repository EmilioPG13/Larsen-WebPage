# Fase 0: encender la medición y la captura de prospectos

**Duración:** una tarde. **Costo:** cero pesos. **Depende de:** nadie.

Al terminar esta guía el sitio pasa de no capturar nada y no medir nada, a entregar prospectos por correo y registrar el embudo completo. No hay que escribir una sola línea de código: **todo el código ya está escrito y probado en el repo**, y está apagado únicamente porque le faltan cuatro variables de entorno en Vercel.

---

## Lo que está roto hoy, para que sepas qué estás arreglando

Revisé el paquete JavaScript que está en producción ahora mismo. Contiene esto:

```
apiUrls: ["http://localhost:3001/api"]
service_id de EmailJS: ausente
template_id de EmailJS: ausente
measurement ID de GA4: ausente  (gtag: undefined, dataLayer: none)
```

Traducido:

- `VITE_API_URL` no está configurada, así que el sitio publicado le pide los datos a `localhost:3001`, o sea a la computadora del visitante. Nunca va a responder.
- `VITE_EMAILJS_*` tampoco está configurada.
- Tu función `sendQuoteLead` en `src/services/leads.ts` resuelve si **al menos uno** de los dos canales funciona. Fallan los dos, así que lanza error.

**Cada persona que ha llenado el formulario de cotización desde que el dominio está vivo recibió un error y ese contacto se perdió.**

Además, `VITE_GA_MEASUREMENT_ID` está vacía, así que `src/services/analytics.ts` opera como no-op. No hay un solo dato de tráfico registrado.

---

## Parte 1: Google Analytics 4

Empieza por aquí. Es la más rápida, y cada día que pase sin medición es un día de tráfico que no vas a poder reportarle ni a Stephano ni a la UMAD.

### 1.1 Crear la propiedad

1. Entra a `analytics.google.com` con la cuenta de Google que vaya a ser la dueña. **Usa la cuenta de Google Workspace de la empresa, no tu Gmail personal.** Si el buzón corporativo todavía no existe, ve primero a la Parte 3 y regresa.
2. `Administrar`, el engrane abajo a la izquierda.
3. `Crear`, luego `Propiedad`.
4. Nombre de la propiedad: `Larsen Italiana`. Zona horaria: México. Moneda: Peso mexicano.
5. En los datos del negocio elige industria manufactura o similar, y tamaño pequeño.
6. Objetivo: `Generar clientes potenciales`.

### 1.2 Crear el flujo de datos

1. Cuando pregunte por la plataforma, elige **Web**.
2. URL del sitio: `https://larsenitaliana.com`, **sin www**. Debe coincidir con lo que dejes como dominio principal en Vercel.
3. Nombre del flujo: `Sitio web`.
4. Deja activada la medición mejorada.
5. `Crear flujo`.

### 1.3 Copiar el ID

En la pantalla del flujo, arriba a la derecha, aparece el **ID de medición**. Tiene el formato `G-XXXXXXXXXX`.

**Cópialo. Es el valor de `VITE_GA_MEASUREMENT_ID`.**

> Google te va a ofrecer instalar la etiqueta manualmente o con un gestor de etiquetas. **Ignora las dos.** El código de integración ya está en tu repo, en `src/services/analytics.ts`, y se activa solo cuando la variable existe. No pegues ningún script en `index.html`, porque duplicarías la etiqueta y todos los números te saldrían al doble.

---

## Parte 2: EmailJS

Este es el canal que hace que el formulario vuelva a entregar prospectos.

### 2.1 Crear la cuenta

1. Entra a `emailjs.com` y regístrate. El plan gratuito da 200 correos al mes, de sobra para arrancar.
2. Verifica el correo de registro.

### 2.2 Conectar el servicio de correo

1. En el panel, `Email Services`, luego `Add New Service`.
2. Elige **Gmail**, que es el que corresponde a Google Workspace.
3. Autoriza con la cuenta `admin@larsenitaliana.com`. Si aún no existe, ve a la Parte 3 primero.
4. Guarda.

**Copia el `Service ID`.** Tiene formato `service_xxxxxxx`. Es el valor de `VITE_EMAILJS_SERVICE_ID`.

### 2.3 Crear la plantilla

`Email Templates`, luego `Create New Template`.

Los nombres de las variables **tienen que coincidir exactamente** con los que manda tu código en `src/services/leads.ts`. Si les cambias el nombre, llegan vacías.

**Asunto:**

```
Nueva cotización desde el sitio: {{machine}}
```

**Contenido:**

```
Nuevo prospecto desde larsenitaliana.com

Nombre:    {{from_name}}
Empresa:   {{company}}
Correo:    {{email}}
Teléfono:  {{phone}}
Máquina:   {{machine}}
Origen:    {{source}}

Mensaje:
{{message}}
```

**En los ajustes de la plantilla:**

- `To Email`: `admin@larsenitaliana.com`
- `From Name`: `Sitio Larsen Italiana`
- `Reply To`: `{{reply_to}}`

Ese último campo es el que importa en el día a día. Con él, cuando le des Responder al correo del prospecto, le contestas directo a esa persona en lugar de a ti mismo.

Guarda y **copia el `Template ID`**. Formato `template_xxxxxxx`. Es el valor de `VITE_EMAILJS_TEMPLATE_ID`.

### 2.4 Copiar la llave pública

`Account`, luego `General`. Ahí está la **Public Key**. Es el valor de `VITE_EMAILJS_PUBLIC_KEY`.

> Esta llave queda visible en el código del navegador. Es normal y así está diseñado EmailJS. Lo que sí conviene es entrar a los ajustes de seguridad de EmailJS y **restringir el dominio permitido a `larsenitaliana.com`**, para que nadie más pueda usar tu cuota desde otro sitio.

---

## Parte 3: el buzón de Google Workspace

Si `admin@larsenitaliana.com` todavía no existe como cuenta real, hay que crearlo. Hoy ese correo está publicado en el sitio y en el marcado estructurado sin existir, así que quien escriba ahí no le llega a nadie.

1. Entra a `admin.google.com`.
2. `Directorio`, `Usuarios`, `Añadir nuevo usuario`. O bien crea `info` como alias de una cuenta que ya exista, si prefieres no gastar una licencia.
3. Confirma que llega correo mandándole una prueba desde tu cuenta personal.

**Y mientras estás ahí, hazte un favor.** En `Aplicaciones`, `Google Workspace`, `Gmail`, `Autenticar correo electrónico`, configura **SPF, DKIM y DMARC** en el DNS del dominio. Sin eso, el correo que salga de la empresa tiene alta probabilidad de caer en la carpeta de no deseados de sus propios clientes. Es el punto que nadie revisa y el que más caro sale.

---

## Parte 4: cargar las variables en Vercel

Aquí es donde todo se enciende.

1. Entra a `vercel.com`, abre el proyecto `larsen-webpage`.
2. `Settings`, luego `Environment Variables`.
3. Agrega estas tres, marcando los tres entornos: Production, Preview y Development.

| Nombre | Valor |
| :---- | :---- |
| `VITE_EMAILJS_SERVICE_ID` | el `service_...` de la Parte 2.2 |
| `VITE_EMAILJS_TEMPLATE_ID` | el `template_...` de la Parte 2.3 |
| `VITE_EMAILJS_PUBLIC_KEY` | la llave pública de la Parte 2.4 |
| `VITE_GA_MEASUREMENT_ID` | el `G-...` de la Parte 1.3 |

**No agregues `VITE_API_URL` por ahora.** El backend todavía no está desplegado, y `getMachines` ya cae elegantemente a los datos estáticos cuando la API no responde. Ponerla apuntando a algo inexistente solo agregaría errores a la consola.

4. **Redespliega.** Las variables de entorno de Vite se incrustan en el momento de compilar, así que **no aplican solas**. Ve a `Deployments`, abre el último, menú de tres puntos, `Redeploy`. Desmarca la casilla de usar caché de compilación.

Este paso es el que más gente olvida. Si guardas las variables y no redespliegas, no cambia absolutamente nada y vas a pensar que no funcionó.

---

## Parte 5: verificar que sí quedó

No des esto por terminado sin comprobarlo.

### 5.1 La analítica responde

1. Abre `https://larsenitaliana.com` en una ventana de incógnito.
2. En Analytics, entra a `Informes`, `Tiempo real`.
3. Debes verte a ti mismo como usuario activo en menos de un minuto.
4. Navega a una máquina, por ejemplo `/maquinas/aries-3`, y confirma que en el reporte de tiempo real aparece el evento `view_machine_detail`.
5. Haz clic al botón de WhatsApp y confirma que aparece `click_whatsapp`.

Si no aparece nada, abre la consola del navegador y escribe `window.dataLayer`. Si sale `undefined`, la variable no se aplicó y falta redesplegar sin caché.

### 5.2 El formulario entrega

1. Ve a `https://larsenitaliana.com/cotizacion`.
2. Llena el formulario con tus propios datos y una máquina cualquiera.
3. Envía.
4. Revisa la bandeja de `admin@larsenitaliana.com`. El correo debe llegar en segundos.
5. Confirma que al darle Responder, el destinatario es el correo que pusiste en la prueba y no el buzón de la empresa.
6. En Analytics, tiempo real, confirma que se registró `submit_quote`.

### 5.3 Deja constancia

Toma captura de las dos cosas: el evento en tiempo real de GA4 y el correo del prospecto de prueba en la bandeja.

Esas dos capturas fechadas son la evidencia de que el sistema quedó operando, y sirven tanto para tu informe de estadía como para la conversación con Stephano. Guárdalas en la carpeta de la estadía.

---

## Los eventos que vas a empezar a recibir

Todos ya están instrumentados en el código. No hay que configurarlos en Analytics, llegan solos.

| Evento | Cuándo se dispara | Para qué te sirve |
| :---- | :---- | :---- |
| `page_view` | En cada cambio de ruta | Tráfico y páginas más vistas |
| `view_machine_detail` | Al abrir el detalle de una máquina | **Qué máquina mira realmente la gente.** El dato más valioso para decidir qué fotografiar |
| `click_whatsapp` | Al tocar el botón flotante o el de detalle | Intención de contacto por el canal principal |
| `click_phone` | Al tocar el teléfono | Intención de contacto |
| `submit_quote` | Al enviar el formulario | Conversión |
| `download_spec` | Al descargar la ficha técnica en PDF | Interés profundo, señal de comprador serio |

---

## Por qué esto vale más que cualquier otra cosa que hagas esta semana

Stephano todavía no aprueba los $75,000 de fotografía.

Si enciendes esto hoy y él tarda tres semanas en decidir, para cuando pregunte qué gana con la inversión, no vas a contestarle con una opinión. Vas a poder decirle cuánta gente entró a su sitio, qué máquina fue la más vista, cuántos intentaron contactarlo por WhatsApp y cuántas cotizaciones se pidieron. Con números de su propia empresa.

Y si dice que no, tú de todos modos te quedas con la medición que la universidad te va a pedir como evidencia de la estadía.

Es la única tarea de todo el proyecto que gana en los dos escenarios.
