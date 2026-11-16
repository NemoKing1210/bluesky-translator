# Bluesky Translator

[English](README.md) · [Русский](README.ru.md) · [中文](README.zh.md) · **Español** · [Português](README.pt.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [日本語](README.ja.md)

[![CI](https://github.com/NemoKing1210/bluesky-translator/actions/workflows/ci.yml/badge.svg)](https://github.com/NemoKing1210/bluesky-translator/actions/workflows/ci.yml)
[![Install userscript](https://img.shields.io/badge/⬇_Install-userscript-1083fe?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/bluesky-translator.user.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.2-green?style=for-the-badge)](CHANGELOG.md)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen?style=for-the-badge)](package.json)

Userscript que añade **traducción en el lugar** para las publicaciones de [Bluesky](https://bsky.app), sin salir del feed.

Compatible con [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/), [Greasemonkey](https://www.greasespot.net/), [ScriptCat](https://scriptcat.org/) y otros gestores que admiten el bloque de metadatos `// ==UserScript==`.

> **Estado:** estable (`1.0.2`): traduce publicaciones en el lugar, varios proveedores, caché, filtros e interfaz clara/oscura.
> **Nota:** no está afiliado a Bluesky Social PBC.

---

## Índice

- [Capturas de pantalla](#capturas-de-pantalla)
- [Instalación rápida](#instalación-rápida)
- [Características](#características)
- [Ajustes](#ajustes)
- [Cómo funciona](#cómo-funciona)
- [Actualizaciones](#actualizaciones)
- [Preguntas frecuentes](#preguntas-frecuentes)
- [Seguridad](#seguridad)
- [Autor](#autor)
- [Más userscripts](#más-userscripts)
- [Licencia](#licencia)

---

## Capturas de pantalla

El userscript real en una publicación en vivo de Bluesky y en el diálogo de ajustes.

![Publicación de Bluesky con el botón Translate y el panel de traducción al ruso bajo el texto original](https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/docs/screenshots/feed-translation-panel.png)

![Diálogo de ajustes de Bluesky Translator — pestaña General](https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/docs/screenshots/settings-general.png)

| | |
|---|---|
| ![Pestaña Proveedores — selector de proveedor y credenciales](https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/docs/screenshots/settings-providers.png)<br>**Proveedores** — elige Google, DeepL, Microsoft, OpenAI, Yandex o LibreTranslate; los proveedores que necesitan clave muestran sus propios campos | ![Pestaña Caché — uso, TTL y borrado](https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/docs/screenshots/settings-cache.png)<br>**Caché** — uso, TTL y la acción de borrar caché |

---

## Instalación rápida

1. Instala un gestor de userscripts ([Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/) o [ScriptCat](https://scriptcat.org/) recomendados).
2. Instala desde la URL directa de GitHub de abajo (o compílalo localmente).

**URL de instalación (GitHub — la más reciente):**

```
https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/bluesky-translator.user.js
```

<p align="center">
  <a href="https://raw.githubusercontent.com/NemoKing1210/bluesky-translator/main/bluesky-translator.user.js"><img src="https://img.shields.io/badge/⬇_Install-GitHub_raw-1a1d24?style=for-the-badge&labelColor=1083fe" alt="Instalar desde GitHub" /></a>
</p>

### Instalar desde URL (panel del gestor)

| Gestor | Ruta |
|--------|------|
| Tampermonkey | Panel → **Utilidades** → **Instalar desde URL** |
| Violentmonkey | Panel → **+** → **Instalar desde URL** |
| Greasemonkey | Menú del complemento → **Nuevo script de usuario** → pega la URL directa |
| ScriptCat | Instala la [extensión](https://scriptcat.org/) y usa la URL directa de GitHub |

### Instalación manual / local

```bash
git clone https://github.com/NemoKing1210/bluesky-translator.git
cd bluesky-translator
npm install
npm run build
```

Luego abre el archivo compilado [`bluesky-translator.user.js`](bluesky-translator.user.js) en tu gestor (o copia su contenido en un script nuevo).

Para recarga en caliente durante el desarrollo, ejecuta `npm run dev` e instala el script servido por Vite (prefijo de nombre `dev:`).

---

## Características

### En Bluesky (`bsky.app`)

- Botón **Translate** en su propia fila bajo el texto de la publicación (indicador de carga mientras traduce; el clic no abre la publicación)
- El mismo botón en publicaciones **citadas / incrustadas** del feed
- La traducción se muestra en un panel de resultado (expansión suave) o en lugar del texto original (botón / vista al pasar el cursor / vista dividida); los enlaces y menciones siguen siendo clicables
- Modo **automático** opcional: traduce en cuanto la publicación aparece mínimamente en pantalla (todas las cuentas o una lista permitida; gestión en ajustes o en el menú de la publicación)
- **Lista de bloqueo** de cuentas y listas de permitidos/bloqueados por idioma de origen (filtros «no tocar»)
- Iconos en Translate / Hide / Show original / Retry
- Idioma de destino desde ajustes: **Auto** sigue el idioma de la interfaz / navegador, o elige entre ~40 idiomas con nombres completos y banderas
- Omisión opcional si la publicación ya está en el idioma de destino
- Funciona con la navegación SPA de Bluesky (scroll, cambios de ruta, feed infinito)

### Ajustes y detalles

- Panel de ajustes con pestañas: **General · Proveedores · Caché · Depuración · Acerca de**
- Proveedores: Google (predeterminado, sin clave), DeepL, Microsoft, OpenAI, Yandex, LibreTranslate; los campos dependen del proveedor elegido
- Puntos de entrada:
  - Elemento **Translator** en la barra lateral izquierda (junto a los ajustes de Bluesky)
  - Comando del menú del gestor de userscripts
- Idiomas de interfaz: English, Русский, 中文, Español, Português, Deutsch, Français, 日本語 (+ Auto)
- Avisos para guardar / borrar caché
- Caché de traducciones en el almacenamiento del userscript (TTL configurable)

### Técnico

- El proveedor Google predeterminado no requiere clave API; DeepL / Microsoft / OpenAI / Yandex / LibreTranslate necesitan credenciales en **Ajustes → Proveedores**
- Deduplicación de solicitudes + reexploración del DOM con debounce
- Creado con [Vite](https://vitejs.dev/) + [vite-plugin-monkey](https://github.com/lisonge/vite-plugin-monkey)
- Mismo flujo de artefactos / CI que [x-translator](https://github.com/NemoKing1210/x-translator) y [backloggd-plus](https://github.com/NemoKing1210/backloggd-plus)

---

## Ajustes

Abre **Translator** en la barra lateral izquierda, o el menú del gestor → **Bluesky Translator — Settings**.

| Pestaña | Qué puedes cambiar | Predeterminado |
|---------|--------------------|----------------|
| **General** | Idioma de interfaz; insignia del idioma de destino; modo; alcance automático + lista permitida; revelado al reemplazar; lista de bloqueo de cuentas; listas de idiomas de origen permitidos/bloqueados; modo de visualización; idioma de destino; omitir si ya está en el destino | Auto / botón / todas / botón / panel / activado |
| **Proveedores** | Insignia del motor de traducción en la pestaña; proveedor + credenciales API / campos de URL | Google |
| **Caché** | Insignia de ocupación % en la pestaña; medidor de uso; horas de caché (`0` = desactivado); borrar caché | 24 |
| **Depuración** | Metadatos de aciertos de caché; estadísticas de traducción / aciertos de caché | desactivado |
| **Acerca de** | Descripción, enlace al repositorio, tarjeta del autor | — |

Al guardar se cierra el panel y se aplica al instante (se actualizan las etiquetas de navegación y los botones de las publicaciones).

---

## Cómo funciona

1. Coincide con `https://bsky.app/*` en `document-idle`.
2. Encuentra el texto con `[data-testid="postText"]` y las publicaciones citadas incrustadas (`[aria-label^="Post by"] …`); ajustable en `src/constants.js` si el DOM de Bluesky cambia.
3. Inyecta una barra **Translate** como hermano después de cada nodo de texto elegible.
4. Al hacer clic, solicita el proveedor configurado (Google por defecto) mediante el sandbox del userscript (`@connect`).
5. Guarda los resultados correctos en el almacenamiento `GM` (`bst_cache_v1`) hasta que expire el TTL o borres la caché.

El cliente web de Bluesky se actualiza a menudo: si los botones dejan de aparecer, revisa primero los selectores de `POST_TEXT_SELECTORS`.

---

## Actualizaciones

El script compilado incluye `@updateURL` / `@downloadURL` apuntando a `main` en GitHub. Los gestores compatibles buscan actualizaciones automáticamente.

**Para publicar una nueva versión:**

1. Sube `version` en [`package.json`](package.json) (fuente única de `@version` y `SCRIPT_VERSION`).
2. Ejecuta `npm run build` (regenera `bluesky-translator.user.js` / `.meta.js` en la raíz).
3. Añade una entrada en [`CHANGELOG.md`](CHANGELOG.md).
4. Actualiza la insignia de versión de este README si hace falta.
5. Sube a `main`.

Para configuración local, contribución y estructura del repositorio, consulta [`DEVELOPMENT.md`](DEVELOPMENT.md), [`CONTRIBUTING.md`](CONTRIBUTING.md) y [`AGENTS.md`](AGENTS.md).

---

## Preguntas frecuentes

**¿Hace falta una clave API de Google?**  
No para el proveedor **Google** predeterminado. DeepL, Microsoft, OpenAI, Yandex y LibreTranslate necesitan credenciales en **Ajustes → Proveedores**.

**¿Se comparte mi contraseña de Bluesky?**  
No. El script solo lee el texto de las publicaciones del DOM y lo envía al proveedor de traducción elegido. No accede a los tokens de autenticación de Bluesky para traducir. Las claves API que introduzcas se guardan en el almacenamiento GM del userscript en tu dispositivo.

**¿Faltan botones en algunas publicaciones?**  
Las publicaciones vacías (solo medios) se omiten. Si tras una actualización de Bluesky tampoco aparecen en publicaciones con texto, informa del problema o ajusta `POST_TEXT_SELECTORS`.

**¿La caché crece demasiado?**  
Reduce las horas de **Caché**, bórrala en Ajustes o vigila el medidor de uso (límite blando de ~2 MB con desalojo LRU).

**¿La lista desplegable del tema oscuro se ve mal?**  
Usa la compilación más reciente (`0.1.2+`): las opciones nativas de `<select>` usan `color-scheme: dark`.

---

## Seguridad

¿Encontraste una vulnerabilidad? Repórtala en privado; consulta [`SECURITY.md`](SECURITY.md). No abras un issue público para problemas de seguridad.

Resumen del modelo: el texto solo va al proveedor de traducción elegido, las claves API y las traducciones en caché permanecen en el almacenamiento del userscript en tu dispositivo (sin cifrar), y el script nunca lee cookies ni tokens de autenticación de Bluesky. Los endpoints personalizados los proporciona el usuario, así que usa solo hosts de confianza.

## Autor

| | |
|---|---|
| **NemoKing** | [@NemoKing1210](https://github.com/NemoKing1210) |
| Email | [nemoking1210@gmail.com](mailto:nemoking1210@gmail.com) |
| Repositorio | [github.com/NemoKing1210/bluesky-translator](https://github.com/NemoKing1210/bluesky-translator) |

Errores e ideas: [GitHub Issues](https://github.com/NemoKing1210/bluesky-translator/issues).

---

## Más userscripts

Otros userscripts del mismo autor:

| Userscript | Qué hace |
|:-----------|:---------|
| [![X Translator](https://img.shields.io/badge/X_Translator-1d9bf0?style=flat-square&logo=x&logoColor=white)](https://github.com/NemoKing1210/x-translator) | **Traducción en el lugar** para publicaciones y respuestas de [X](https://x.com) (Twitter), con el mismo enfoque de proveedores, caché y filtros que este script |

---

## Licencia

[MIT](LICENSE) — Copyright (c) 2026 NemoKing
