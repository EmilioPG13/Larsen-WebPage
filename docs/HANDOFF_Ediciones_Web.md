# Handoff de ediciones, larsenitaliana.com

**Repo:** `C:\Users\Emili\Desktop\Code\Larsen-WebPage`
**Rama:** `main`
**Fecha:** 24 de agosto de 2026
**Alcance:** Fase 1 del plan digital. Nada aquí depende de Stephano, de Alejandra ni de Creartes.

Cada edición es independiente. Se pueden hacer en cualquier orden y commitear por separado.

---

## Correcciones a lo que te dije antes

Tres cosas que afiné al leer el código a fondo. Vale la pena que las sepas antes de tocar nada.

1. **El idioma por defecto ya es español.** `getInitialLang()` en `src/i18n/LanguageContext.tsx` regresa `'es'`. Cuando revisé el sitio y lo vi en inglés era porque mi navegador tenía `larsen-lang: 'en'` guardado en localStorage de una visita previa. No hay nada que invertir. Ignora esa recomendación del plan.

2. **`hreflang` no aplica en este sitio.** Esa etiqueta exige una URL distinta por idioma. Aquí los dos idiomas viven en la misma URL y se alternan con un toggle en el cliente. Ponerlo apuntando a la misma dirección no sirve de nada. Para hacerlo bien habría que mover el idioma a la ruta, tipo `/en/maquinas`, y eso es un cambio de arquitectura, no una edición. Lo saco de esta fase.

3. **Las imágenes de máquinas sí funcionan.** Lo que vi vacío fue lazy loading que no había alcanzado a cargar. Ese punto está bien.

---

## E1. Normalizar finales de línea

**Problema:** `git status` reporta 69 archivos modificados con 34,478 inserciones y 34,478 eliminaciones. Son exactamente iguales porque no hay cambios reales, solo CRLF contra LF. Ese ruido esconde tus cambios de verdad.

**Archivo nuevo:** `.gitattributes` en la raíz del repo

```gitattributes
* text=auto eol=lf

*.png binary
*.jpg binary
*.jpeg binary
*.ico binary
*.webp binary
*.woff binary
*.woff2 binary
*.pdf binary
```

**Después, en la terminal:**

```bash
git add .gitattributes
git commit -m "chore: normalizar finales de linea con .gitattributes"
git add --renormalize .
git status
```

El `git status` debe quedar limpio o casi. Si aparecen archivos, commitéalos como `chore: renormalizar CRLF a LF`.

---

## E2. Imagen social y metadatos Open Graph

**Problema:** `og:image` apunta a `/images/machines/ARIES3.png` con ruta relativa. Open Graph exige URL absoluta, así que hoy **las vistas previas al compartir el link están rotas**. Para un negocio que vende por WhatsApp, eso es el primer contacto arruinado. En el código todavía está el `<!-- TODO -->` marcándolo.

**Paso 1.** Guarda `og-image.jpg` (te la mando aparte, ya está hecha a 1200x630 con la tipografía y los colores del sitio) en:

```
public/images/og-image.jpg
```

**Paso 2.** En `index.html`, reemplaza el bloque que va desde `<!-- Open Graph / Facebook -->` hasta la línea de `twitter:image` por esto:

```html
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Larsen Italiana" />
    <meta property="og:locale" content="es_MX" />
    <meta property="og:locale:alternate" content="en_US" />
    <meta property="og:url" content="https://larsenitaliana.com/" />
    <meta property="og:title" content="Larsen Italiana | Máquinas industriales de coser y tejer reacondicionadas" />
    <meta property="og:description" content="Reacondicionamos máquinas industriales de coser y tejer de las mejores marcas europeas y japonesas con precisión de ingeniería y garantía total de 365 días." />
    <meta property="og:image" content="https://larsenitaliana.com/images/og-image.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:alt" content="Máquina de tejer rectilínea Steiger Aries.3 reacondicionada por Larsen Italiana" />

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="https://larsenitaliana.com/" />
    <meta property="twitter:title" content="Larsen Italiana | Máquinas industriales de coser y tejer reacondicionadas" />
    <meta property="twitter:description" content="Reacondicionamos máquinas industriales de coser y tejer de las mejores marcas europeas y japonesas con precisión de ingeniería y garantía total de 365 días." />
    <meta property="twitter:image" content="https://larsenitaliana.com/images/og-image.jpg" />
```

> Nota: cambié el guión largo del `og:title` por una barra vertical. En metadatos algunos rastreadores lo manejan mal, y de paso queda consistente con cómo prefieres escribir.

**Paso 3.** Cambia también el `<title>` de la línea 12, por la misma razón:

```html
    <title>Larsen Italiana | Máquinas industriales de coser y tejer reacondicionadas</title>
```

**Verificación después de desplegar:** pega `https://larsenitaliana.com` en un chat de WhatsApp contigo mismo. Debe aparecer la tarjeta con la imagen. Si no, entra a `developers.facebook.com/tools/debug` y pide volver a raspar la URL.

---

## E3. Etiqueta canonical por ruta

**Problema:** el sitio no tiene `canonical` en ninguna página.

**Cuidado con la solución obvia.** Poner un `<link rel="canonical">` fijo en `index.html` sería peor que no tener nada: como es una SPA, todas las rutas heredarían el mismo valor y le estarías diciendo a Google que `/maquinas` y `/cotizacion` son duplicados de la portada. Tiene que ser dinámico por ruta.

**Archivo:** `src/i18n/useDocumentMeta.ts`

Reemplaza el contenido completo por:

```ts
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from './LanguageContext';

/** Versión canónica del sitio, sin www. Debe coincidir con sitemap.xml y robots.txt. */
const CANONICAL_ORIGIN = 'https://larsenitaliana.com';

function setMetaTag(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Sets the document <title>, meta description and canonical URL for the current
 * route, re-applying whenever the language changes.
 */
export function useDocumentMeta(title: string, description?: string) {
  const { lang } = useLanguage();
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = title;
    if (description) setMetaTag('description', description);
  }, [title, description, lang]);

  useEffect(() => {
    const path = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
    setCanonical(`${CANONICAL_ORIGIN}${path}`);
  }, [pathname]);
}
```

**Límite honesto:** un canonical puesto por JavaScript funciona porque Google ejecuta JS, pero pesa menos que uno servido por el servidor. Es la solución correcta para este stack sin meterte a renderizado del lado del servidor. Anótalo como deuda técnica, no como pendiente urgente.

**Requisito:** el hook ahora usa `useLocation`, así que todo componente que lo llame debe estar dentro del `<Router>`. Ya lo están todos, no hay nada que mover.

---

## E4. Año del footer

**Archivo:** `src/components/Footer.tsx`, línea 98

Antes:

```tsx
          <p className="text-[13px] text-white/45 m-0">© 2025 Larsen Italiana. {t.foot.rights}</p>
```

Después:

```tsx
          <p className="text-[13px] text-white/45 m-0">© {new Date().getFullYear()} Larsen Italiana. {t.foot.rights}</p>
```

Un footer con el año pasado es de las señales que más rápido leen los visitantes como sitio abandonado.

---

## E5. Traducción real del catálogo al inglés

**Problema:** el diccionario `src/i18n/dictionary.ts` traduce la interfaz y las etiquetas de especificación, pero los **valores** salen de `machines.json`, que está solo en español. En modo inglés queda "Width: 52 pulgadas (132 cm)". Es el defecto más visible del sitio.

La solución agrega un bloque `en` opcional a cada máquina y una función que lo aplica cuando el idioma está en inglés. No toca el render, y sigue funcionando igual cuando el backend esté desplegado y las máquinas vengan de la API.

### E5.1 Tipo

**Archivo:** `src/types/index.ts`

Justo antes de `export interface Machine {`, agrega:

```ts
/** Campos traducibles de una máquina. Los que falten caen al valor en español. */
export interface MachineI18n {
  description?: string;
  type?: string;
  knittingSystems?: string;
  width?: string;
  speed?: string;
  gauge?: string;
  yarnGuides?: string;
  capabilities?: string[];
  software?: string;
  power?: string;
  category?: string;
}
```

Y dentro de `interface Machine`, después de `inStock?: boolean;`, agrega:

```ts
  en?: MachineI18n;
```

### E5.2 Función de localización

**Archivo nuevo:** `src/i18n/localizeMachine.ts`

```ts
import type { Lang } from './dictionary';
import type { Machine } from '../types';

/**
 * Devuelve la máquina con sus campos traducidos al idioma activo.
 * En español, o si la máquina no trae bloque `en`, regresa el objeto original.
 * Los campos ausentes en `en` conservan su valor en español.
 */
export function localizeMachine(machine: Machine, lang: Lang): Machine {
  if (lang !== 'en' || !machine.en) return machine;

  const overrides = Object.fromEntries(
    Object.entries(machine.en).filter(([, value]) => value !== undefined && value !== null),
  );

  return { ...machine, ...overrides } as Machine;
}
```

### E5.3 Datos

**Archivo:** `src/data/machines.json`

Reemplaza el contenido completo por el del archivo `machines.json` que te mando junto a este handoff. Es el mismo JSON con un bloque `en` agregado a cada una de las tres máquinas.

### E5.4 Conectarlo en la lista

**Archivo:** `src/pages/MachinesPage.tsx`

Agrega a los imports:

```tsx
import { useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { localizeMachine } from '../i18n/localizeMachine';
```

(`useMemo` va en el import que ya existe de `react`, junto a `useState` y `useEffect`.)

Cambia el estado. Antes:

```tsx
  const [machines, setMachines] = useState<Machine[]>([]);
```

Después:

```tsx
  const [rawMachines, setRawMachines] = useState<Machine[]>([]);
  const { lang } = useLanguage();
  const machines = useMemo(
    () => rawMachines.map((m) => localizeMachine(m, lang)),
    [rawMachines, lang],
  );
```

Y dentro del `useEffect`, cambia:

```tsx
        setMachines(await getMachines());
```

por:

```tsx
        setRawMachines(await getMachines());
```

El resto del componente no se toca. `machines.map(...)` sigue funcionando igual.

### E5.5 Conectarlo en el detalle

**Archivo:** `src/pages/MachineDetailPage.tsx`

Mismos imports que arriba, más `useMemo` en el import de react.

Cambia el estado. Antes:

```tsx
  const [machine, setMachine] = useState<Machine | null | undefined>(undefined); // undefined = loading
```

Después:

```tsx
  const [rawMachine, setRawMachine] = useState<Machine | null | undefined>(undefined); // undefined = loading
  const { lang } = useLanguage();
  const machine = useMemo(
    () => (rawMachine ? localizeMachine(rawMachine, lang) : rawMachine),
    [rawMachine, lang],
  );
```

Dentro del `useEffect`, cambia las dos llamadas a `setMachine(...)` por `setRawMachine(...)`:

```tsx
        setRawMachine(machines.find((m) => m.id === id) ?? null);
```

```tsx
        setRawMachine(null);
```

**Y ahora lo importante.** Hay un `useEffect` que dispara el evento de analítica:

```tsx
  useEffect(() => {
    if (machine) track('view_machine_detail', { machine_id: machine.id, machine_name: machine.name });
  }, [machine]);
```

Como `machine` ahora es un objeto derivado, cambia de identidad en cada render y **ese evento se dispararía en bucle, inflando tus métricas de GA4 con datos falsos**. Cambia la dependencia:

```tsx
  }, [rawMachine]);
```

Con `useMemo` ya queda estable, pero depender de `rawMachine` lo deja a prueba de balas. No te saltes este paso, porque justo estás a punto de encender la analítica y sería envenenar el primer dato que recibas.

El resto del componente no se toca.

### E5.6 Verificación

```bash
npm run build
npm run test
npm run dev
```

En el navegador, entra a `/maquinas`, cambia el idioma a EN y confirma que descripción, ancho, galga y guía-hilos aparecen en inglés. Regresa a ES y confirma que vuelven al español. Entra al detalle de una máquina y repite. Abre la consola y verifica que `view_machine_detail` no se dispare más de una vez por carga.

---

## E6. Unificar el dominio, con o sin www

**Problema:** cuatro fuentes dicen **sin** www y el sitio redirige **a** www.

| Fuente | Qué declara |
| :---- | :---- |
| `public/sitemap.xml` | `https://larsenitaliana.com/...` sin www |
| `public/robots.txt` | `https://larsenitaliana.com/sitemap.xml` sin www |
| `index.html`, `og:url` y schema.org | sin www |
| Search Console | verificado sobre el prefijo sin www |
| **Vercel** | **redirige a `www.larsenitaliana.com`** |

Le estás mandando señales contradictorias a Google y la propiedad de Search Console no corresponde a la URL que se sirve.

**Como todo el código ya dice sin www, lo correcto es cambiar Vercel, no cambiar cinco archivos.**

En el panel de Vercel:

1. Entra al proyecto, `Settings`, `Domains`.
2. Localiza `larsenitaliana.com` y `www.larsenitaliana.com`.
3. Marca **`larsenitaliana.com` como dominio principal**, sin www.
4. Deja `www.larsenitaliana.com` redirigiendo hacia el principal.

**Verificación:** abre `https://www.larsenitaliana.com` y confirma que la barra de direcciones termina en `https://larsenitaliana.com`, sin www.

Esta es la única edición de la lista que no está en el código. No la dejes al final, porque hasta que no se resuelva, cualquier trabajo de SEO se reparte entre dos dominios.

---

## E7. Fecha en el sitemap

Menor, pero ayuda a que Google note los cambios.

**Archivo:** `public/sitemap.xml`. Agrega una línea `<lastmod>` dentro de cada `<url>`, con la fecha en que despliegues:

```xml
  <url>
    <loc>https://larsenitaliana.com/</loc>
    <lastmod>2026-08-25</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
```

Repite en las cinco entradas.

---

## Orden sugerido de commits

| # | Commit | Archivos |
| :---- | :---- | :---- |
| 1 | `chore: normalizar finales de linea con .gitattributes` | `.gitattributes` |
| 2 | `fix(seo): imagen social absoluta y metadatos Open Graph completos` | `index.html`, `public/images/og-image.jpg` |
| 3 | `feat(seo): canonical dinamico por ruta` | `src/i18n/useDocumentMeta.ts` |
| 4 | `fix(ui): year dinamico en el footer` | `src/components/Footer.tsx` |
| 5 | `feat(i18n): traduccion del catalogo de maquinas al ingles` | `types`, `machines.json`, `localizeMachine.ts`, `MachinesPage`, `MachineDetailPage` |
| 6 | `docs: lastmod en sitemap` | `public/sitemap.xml` |

El cambio de dominio en Vercel no lleva commit.

---

## Lista de verificación final

- [ ] `npm run build` pasa sin errores de TypeScript
- [ ] `npm run test` pasa
- [ ] `git status` limpio después de renormalizar
- [ ] El link pegado en WhatsApp muestra la tarjeta con imagen
- [ ] `https://www.larsenitaliana.com` redirige a la versión sin www
- [ ] Ver el código fuente de `/maquinas` y confirmar que el canonical dice `/maquinas` y no `/`
- [ ] Cambiar a EN y confirmar que las specs están en inglés
- [ ] `view_machine_detail` se dispara una sola vez por carga de detalle

---

## Lo que sigue, y no está aquí

Estas tres cosas quedan pendientes a propósito porque no son edición de código:

1. **Fase 0**, las cuatro variables de entorno en Vercel. Guía aparte. Es lo más urgente de todo.
2. **Enviar el sitemap en Search Console**, una vez resuelto el punto E6. Antes no tiene caso.
3. **Perfil de Empresa de Google** para la dirección de Cuautepec de Hinojosa. Gratis, y para este giro suele traer más contactos que el posicionamiento orgánico.
