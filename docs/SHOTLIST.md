# Guía de captura — fotos y video para larsenitaliana.com

El objetivo es **generar confianza y cerrar ventas**: el comprador de maquinaria de alto valor necesita *ver* el estado real, el taller y la máquina funcionando. Esta lista dice exactamente qué capturar, con qué specs, y dónde va en el sitio.

## Prioridad 1 — lo que más vende (captura esto primero)

### 1. Video: prueba de tejido (knit test) 🎥
La máquina **funcionando**, tejiendo. Es lo que más convierte.
- 15–40 segundos por máquina, horizontal (16:9).
- Muestra la aguja/carro en movimiento y el tejido saliendo.
- Sonido real ayuda (transmite que funciona).
- Dónde va: hero de video en la página de detalle de cada máquina.

### 2. Máquina — foto de producto
Reemplaza los PNG actuales con fotos reales de cada modelo en stock.
- Fondo neutro/claro y uniforme (los actuales son cuadrados 2160×2160 — mantener ese formato ayuda a que encajen sin ajustes).
- Máquina completa, centrada, bien iluminada, sin distracciones detrás.
- 2–4 ángulos por máquina (frente, detalle del carro, panel de control, guía-hilos).
- Dónde va: tarjeta de máquina, galería en `/maquinas/:id`.

### 3. Taller / instalaciones
Prueba de los "2.500 m²" y del proceso serio de reacondicionamiento.
- Vista amplia del taller con varias máquinas.
- Técnicos trabajando (manos en la máquina, herramientas).
- Dónde va: sección "El corazón de la empresa" en *Nosotros* (hoy tiene un placeholder).

## Prioridad 2 — refuerza la historia

### 4. Antes / después del reacondicionamiento
Par de fotos: máquina llegada (usada) vs. terminada. Demuestra el valor agregado.

### 5. Equipo / personas
Retrato del equipo o de un ingeniero. Humaniza y genera confianza.

### 6. Empaque y envío
Máquina embalada / en tarima lista para exportar. Ataca la objeción de "¿cómo llega a México?".

## Specs técnicas
- **Fotos:** JPG o PNG, mínimo 1600 px en el lado largo (2160×2160 para producto). Buena luz, enfoque nítido, horizontal salvo producto (cuadrado).
- **Video:** MP4 (H.264), 1080p, horizontal, < 30 MB por clip si es posible (se puede comprimir).
- **Consistencia:** mismo fondo y estilo entre máquinas del catálogo.
- Evita marcas de agua y texto quemado en la imagen.

## Cómo entregarlas
Súbelas a una carpeta (Drive/WeTransfer) nombrando por máquina, p. ej. `aries3-frente.jpg`, `aries3-knittest.mp4`. Con eso las integro al sitio (galería + video en el detalle) y optimizo el peso.

> Nota: al tener fotos reales, conviene también convertirlas a **WebP** (más ligeras) — eso lo hago en el build cuando el material esté listo.
