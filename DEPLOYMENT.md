# 🚀 Guía de Despliegue - Larsen Italiana

## Preparación antes del despliegue

### 1. Configurar EmailJS

**IMPORTANTE**: Antes de desplegar, debes configurar EmailJS para que el formulario de contacto funcione.

1. Ve a [EmailJS](https://www.emailjs.com/) y crea una cuenta
2. Configura un servicio de email (Gmail, Outlook, etc.)
3. Crea una plantilla de email con estas variables:
   - `{{from_name}}`
   - `{{from_email}}`
   - `{{phone}}`
   - `{{company}}`
   - `{{message}}`
   - `{{product_name}}`

4. Actualiza `src/components/ContactModal.tsx` líneas 42-48:
   ```typescript
   const result = await emailjs.send(
     'TU_SERVICE_ID',    // Reemplazar
     'TU_TEMPLATE_ID',   // Reemplazar
     {
       // ... datos del formulario
       to_email: 'TU_EMAIL@ejemplo.com', // Tu email real
     },
     'TU_PUBLIC_KEY'     // Reemplazar
   );
   ```

### 2. Agregar imágenes reales

Coloca las imágenes de productos en `public/images/`:
- `hero-machine.jpg` (800x600px recomendado)
- `machine-1.jpg` a `machine-6.jpg` (400x300px recomendado)
- `refurbished-machine.jpg` (600x400px recomendado)
- `og-image.jpg` (1200x630px para redes sociales)

### 3. Actualizar información de contacto

En `src/components/Footer.tsx`, actualiza:
- Teléfono real
- Email real
- Dirección real

## Despliegue en Vercel (Recomendado)

### Opción 1: Desde GitHub

1. Sube tu código a GitHub
2. Ve a [vercel.com](https://vercel.com)
3. Conecta tu repositorio de GitHub
4. Vercel detectará automáticamente que es un proyecto Vite
5. Haz clic en "Deploy"

### Opción 2: Desde CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Hacer login
vercel login

# Desplegar
vercel

# Para producción
vercel --prod
```

## Despliegue en Netlify

### Opción 1: Desde GitHub

1. Ve a [netlify.com](https://netlify.com)
2. Conecta tu repositorio
3. Configuración:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Deploy

### Opción 2: Drag & Drop

```bash
# Construir el proyecto
npm run build

# Subir la carpeta 'dist' a Netlify
```

## Variables de entorno (si es necesario)

Si decides usar variables de entorno para EmailJS:

1. Crea `.env.local`:
   ```
   VITE_EMAILJS_SERVICE_ID=tu_service_id
   VITE_EMAILJS_TEMPLATE_ID=tu_template_id
   VITE_EMAILJS_PUBLIC_KEY=tu_public_key
   ```

2. Actualiza `ContactModal.tsx`:
   ```typescript
   const result = await emailjs.send(
     import.meta.env.VITE_EMAILJS_SERVICE_ID,
     import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
     // ...
     import.meta.env.VITE_EMAILJS_PUBLIC_KEY
   );
   ```

3. Configura las variables en tu plataforma de despliegue

## Dominio personalizado

### En Vercel:
1. Ve a tu proyecto > Settings > Domains
2. Agrega tu dominio personalizado
3. Configura los DNS según las instrucciones

### En Netlify:
1. Ve a Site settings > Domain management
2. Agrega tu dominio personalizado
3. Configura los DNS según las instrucciones

## Optimizaciones post-despliegue

### 1. Google Analytics (opcional)
Agrega el código de tracking en `index.html`

### 2. Google Search Console
1. Verifica tu dominio
2. Envía el sitemap (se genera automáticamente)

### 3. Monitoreo
- Configura alertas de uptime
- Monitorea el formulario de contacto

## Checklist pre-despliegue

- [ ] EmailJS configurado y funcionando
- [ ] Imágenes reales agregadas
- [ ] Información de contacto actualizada
- [ ] Proyecto compila sin errores (`npm run build`)
- [ ] Formulario de contacto probado
- [ ] Responsive design verificado
- [ ] SEO meta tags actualizados
- [ ] Dominio configurado (si aplica)

## Soporte post-despliegue

Para actualizaciones futuras:
1. Haz cambios en tu código
2. Haz commit y push a GitHub
3. El despliegue se actualiza automáticamente

Para cambios urgentes:
- Vercel: `vercel --prod`
- Netlify: Redeploy desde el dashboard

---

¡Tu sitio web de Larsen Italiana estará listo para generar leads! 🎯
