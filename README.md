# Larsen Italiana - Sitio Web de Generación de Leads

Un sitio web profesional para máquinas de coser industriales Larsen Italiana, construido con React, TypeScript y Tailwind CSS.

## 🚀 Características

- **Diseño Responsivo**: Optimizado para todos los dispositivos
- **Catálogo de Productos**: 6 máquinas industriales con información detallada
- **Formulario de Contacto**: Modal integrado con EmailJS
- **Paleta de Colores Personalizada**: Branding de Larsen Italiana
- **Interfaz Moderna**: Inspirada en Singer pero con identidad propia

## 🛠️ Tecnologías

- **Frontend**: Vite + React 18 + TypeScript
- **Estilos**: Tailwind CSS
- **Formularios**: EmailJS
- **Despliegue**: Vercel (recomendado)

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
```

## ⚙️ Configuración de EmailJS

Para que el formulario de contacto funcione, necesitas configurar EmailJS:

1. **Crear cuenta en EmailJS**:
   - Ve a [https://www.emailjs.com/](https://www.emailjs.com/)
   - Crea una cuenta gratuita

2. **Configurar servicio de email**:
   - En el dashboard, ve a "Email Services"
   - Conecta tu proveedor de email (Gmail, Outlook, etc.)
   - Anota el **Service ID**

3. **Crear plantilla de email**:
   - Ve a "Email Templates"
   - Crea una nueva plantilla con estas variables:
     ```
     {{from_name}} - Nombre del cliente
     {{from_email}} - Email del cliente
     {{phone}} - Teléfono
     {{company}} - Empresa
     {{message}} - Mensaje
     {{product_name}} - Producto de interés
     ```
   - Anota el **Template ID**

4. **Obtener Public Key**:
   - Ve a "Account" > "General"
   - Copia tu **Public Key**

5. **Actualizar configuración**:
   - Abre `src/components/ContactModal.tsx`
   - Reemplaza estos valores en la línea 42-48:
     ```typescript
     const result = await emailjs.send(
       'TU_SERVICE_ID',    // Reemplazar
       'TU_TEMPLATE_ID',   // Reemplazar
       {
         // ... datos del formulario
         to_email: 'ventas@larsenitaliana.com', // Tu email
       },
       'TU_PUBLIC_KEY'     // Reemplazar
     );
     ```

## 🎨 Paleta de Colores

```css
/* Colores principales */
--larsen-blue: #28327B
--larsen-red: #D81E2A
--larsen-pink: #D3AFC4
--larsen-dark-red: #B7444C
--larsen-white: #FFFFFF
```

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── Header.tsx          # Navegación principal
│   ├── Hero.tsx           # Sección hero con ofertas
│   ├── ProductGrid.tsx    # Grid de productos
│   ├── ProductCard.tsx    # Tarjeta individual de producto
│   ├── ContactModal.tsx   # Modal de contacto
│   └── Footer.tsx         # Pie de página
├── data/
│   └── products.json      # Datos de productos
├── types/
│   └── index.ts          # Tipos TypeScript
└── App.tsx               # Componente principal
```

## 🖼️ Imágenes

Las imágenes de productos deben colocarse en `public/images/`:
- `hero-machine.jpg` - Máquina principal del hero
- `machine-1.jpg` a `machine-6.jpg` - Imágenes de productos
- `refurbished-machine.jpg` - Imagen para sección reacondicionadas

## 🚀 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Las configuraciones se detectan automáticamente
3. Despliega con un click

### Netlify

1. Conecta tu repositorio a Netlify
2. Comando de build: `npm run build`
3. Directorio de publicación: `dist`

## 📧 Configuración de Email

El formulario enviará emails con esta información:
- Datos del cliente (nombre, email, teléfono, empresa)
- Producto de interés
- Mensaje personalizado
- Timestamp automático

## 🎯 Flujo de Generación de Leads

1. Usuario navega el catálogo
2. Hace clic en "Me interesa" en un producto
3. Se abre modal con formulario
4. Completa sus datos y envía
5. Email automático al equipo de ventas
6. Confirmación al usuario

## 🔧 Personalización

Para personalizar el contenido:
- **Productos**: Edita `src/data/products.json`
- **Colores**: Modifica `tailwind.config.js`
- **Textos**: Actualiza los componentes directamente
- **Email destino**: Cambia en `ContactModal.tsx`

## 📱 Responsive Design

El sitio está optimizado para:
- 📱 Móviles (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large screens (1280px+)

## 🆘 Soporte

Para soporte técnico o personalizaciones adicionales, contacta al equipo de desarrollo.

---

**Larsen Italiana** - Especialistas en máquinas de coser industriales desde 2004.