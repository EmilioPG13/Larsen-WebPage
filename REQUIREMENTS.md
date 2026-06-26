# Larsen Italiana — Sitio Web · Requisitos y Pendientes

> Contexto para desarrollo. Empresa: máquinas de coser industriales (overlock, bordadoras, cortadoras, rectas). Stack: React + Vite. Deploy: Vercel. Dominio final: larsenitaliana.com

---

## 1. Objetivo del sitio
Sitio corporativo y catálogo que comunique la oferta de máquinas de coser industriales, genere confianza (20+ años de experiencia) y capte leads vía formulario de contacto/cotización.

**Audiencia:** talleres textiles, confeccionistas, maquiladoras, emprendedores del sector textil.

---

## 2. Secciones requeridas

### Home / Landing
- [ ] Hero con propuesta de valor clara y CTA principal (ver catálogo / cotizar)
- [ ] Sección de categorías de producto destacadas
- [ ] Bloque de "por qué Larsen" (experiencia, garantía, servicio, refacciones)
- [ ] CTA de contacto/cotización
- [ ] Reemplazar TODO texto placeholder por copy real

### Catálogo de productos
- [ ] Vista de categorías: Overlock · Bordadoras · Cortadoras · Rectas (confirmar lista real con la empresa)
- [ ] Tarjeta de producto: imagen, nombre/modelo, specs clave, CTA "cotizar"
- [ ] Vista de detalle de producto (si aplica) con ficha técnica completa
- [ ] Estado vacío / fallback si una categoría no tiene productos aún

### Nosotros / Quiénes somos
- [ ] Historia de la empresa, años de experiencia, ubicación
- [ ] Diferenciadores (servicio técnico, refacciones, asesoría)

### Contacto
- [ ] Formulario funcional (nombre, email, teléfono, mensaje / interés)
- [ ] Conectar envío al correo corporativo de Google Workspace
- [ ] Datos de contacto reales: dirección, teléfono, WhatsApp, horario
- [ ] Link a Instagram (@larsen.italiana)
- [ ] Mapa de ubicación (opcional)

---

## 3. Contenido pendiente de la empresa (BLOQUEANTE)
> Esto es cuello de botella — solicitar cuanto antes.
- [ ] Fotos reales de cada máquina/modelo (alta resolución)
- [ ] Fichas técnicas / especificaciones por producto
- [ ] Lista definitiva de categorías y modelos
- [ ] Logo en vectorial (SVG/PNG transparente) y variantes
- [ ] Política de precios o cotización (¿se muestran precios o solo "cotizar"?)
- [ ] Datos de contacto oficiales y dirección
- [ ] Texto de historia/about aprobado por dirección

---

## 4. Diseño y UX
- [ ] Identidad visual consistente: paleta, tipografía, espaciado
- [ ] Diseño responsivo verificado en móvil, tablet y desktop
- [ ] Navegación clara (header + footer con links principales)
- [ ] Estados de carga y de error en componentes que lo necesiten
- [ ] Accesibilidad básica: alt en imágenes, contraste, navegación por teclado
- [ ] Favicon y assets de marca

---

## 5. Técnico
- [ ] Optimización de imágenes (formato webp, lazy loading, peso reducido)
- [ ] Meta tags ya configurados — confirmar que apunten al dominio final
- [ ] og-image.jpg real (actualmente referenciada en /images/og-image.jpg)
- [ ] Conectar dominio propio (larsenitaliana.com) en Vercel
- [ ] Revisión de performance (Lighthouse)
- [ ] Formulario: validación de campos + protección anti-spam básica
- [ ] 404 / página de error

---

## 6. Pre-lanzamiento
- [ ] Revisión de ortografía y consistencia de copy
- [ ] Prueba de todos los links y del formulario end-to-end
- [ ] Verificar SEO on-page (titles, descriptions, headings jerárquicos)
- [ ] Publicar y validar en producción con dominio final

---

## Notas
- Prioridad: cerrar contenido (sección 3) desbloquea casi todo lo demás.
- El formulario de contacto es la pieza que conecta el sitio con el objetivo de generación de leads — no dejarlo al final.
