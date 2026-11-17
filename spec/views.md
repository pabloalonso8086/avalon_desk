# Vistas y componentes

Fuente: `initial_prompt.md`. Modelo de datos: `spec/data-model.md`.

> Las marcas **[P-n]** señalan puntos pendientes de confirmar (ver `spec/data-model.md`).

## Reglas generales de la interfaz

- Stack: **Tauri** (ejecución), **TanStack Start** (vistas), **Tailwind** (estilos).
- Cada elemento tiene su propio componente.
- **i18n:** un único `src/i18n/i18n.json` organizado por componente.
  - Componente es cualquier elemento visible, por básico que sea: un botón, un label…
  - Cada componente tiene una sección `languages`, primero `en` y luego `es`, en variantes genéricas sin región.
  - Solo se traducen los textos de la interfaz. Lo que viene de la base de datos o de un fichero `.md` (nombres de ítems, estados, notas, tareas) se muestra tal cual.
  - El idioma por defecto es el inglés. Si falta un texto en el idioma activo, se muestra en inglés.
  - El idioma elegido se guarda en `settings.json`.
- **Estilos:** una única hoja global. Colores y fuentes siempre mediante variables de tema.
- **Temas:**
  - `_template.css` contiene todas las variables sin valores y nunca se carga en una vista.
  - Temas base: `Light` y `Dark`, con todas las variables de la plantilla y sus valores.
- Todos los separadores entre columnas o paneles son un borde fino que se arrastra con el ratón para cambiar el tamaño.

## Objetivo de la aplicación

Gestor de tareas que unifica proyectos, GitHub y un "ToDo" personal. También permite abrir sesiones de consola para lanzar asistentes de IA.

## Layout principal (`AppLayout`)

Un contenedor principal para los ajustes visuales globales, sin márgenes ni espacios, dividido en dos columnas redimensionables:

1. **Sidebar** (izquierda): los menús.
2. **Contenedor de la vista principal** (derecha).

## Sidebar

De arriba abajo:

1. **Logo** de la aplicación.
2. **Menú "Home"**: de momento sin funcionalidad.
3. **Listado de proyectos**: cada proyecto es una entrada del menú.
   - Va dentro de un div con scroll vertical si el contenido supera el alto.
   - El texto que no cabe en horizontal se corta con "…".
4. **Menú "Ajustes"**: fijo en la parte inferior. Cada ajuste indica dónde se guarda: en `settings.json` o en la base de datos (ver `spec/data-model.md`).

## `main_view`

Se muestra en el contenedor derecho al pulsar un proyecto del menú. Tiene dos columnas redimensionables:

- Izquierda: componente **ToDo**.
- Derecha: componente **minion**.

**Persistencia:** la vista de cada proyecto no se destruye al cambiar de proyecto. Se queda en memoria para no cerrar su terminal.

## ToDo

Listado de las épicas, macros y tareas del proyecto.

- Cada ítem lleva anidados los ítems inferiores que tiene asociados.
- Cada ítem tiene una sangría desde la izquierda, esté asociado a un ítem superior o no.
- Los ítems con hijos se pueden plegar y expandir.

### Popup de edición

Se abre al hacer **doble clic** en cualquier elemento de la vista. Permite editar:

- El título o nombre.
- El estado, con un desplegable de la tabla `statuses`.
- El repositorio, elegido entre los asociados al proyecto (`project_repos`).
- **Solo macros:** rama e issue del repositorio asociado. La rama no se escribe a mano: se elige de la lista. Los listados se piden a la API en el momento de abrir el desplegable. Las tareas no tienen rama ni issue propios: los heredan de su macro.

Crear una tarea a mano la añade también al `tasks.md` de la rama de su macro (ver `spec/data-model.md`).

Al cambiar el estado se aplica la propagación descrita en `spec/data-model.md`: hacia abajo a todos los ítems inferiores, y hacia arriba por estado común de los hermanos o por `priority`. Si el ítem tiene ítems inferiores, antes de guardar se muestra un mensaje de confirmación, que será su propio componente con los textos en i18n.

## minion

Dos paneles apilados en vertical, separados por una barra que se arrastra para cambiar la altura.

### Panel superior: pestañas

- La primera pestaña, **"Notes"**, existe siempre.
- Al entrar por primera vez, busca en la carpeta de notas configurada (por defecto, `notes/` junto al ejecutable) el fichero `<item_type>_<id>.md`. Si no existe, lo crea.
- Al pulsar un proyecto, se abre el fichero `project_<id>`.

### Panel inferior: terminal

- Emulador de consola.
- **Solo se abre desde épicas y macros.** Los proyectos y las tareas nunca abren terminal.
- Se abre en la ruta local del repositorio del ítem (`epics.repo_id` / `macros.repo_id` → `repos.path`).
- Si el ítem no tiene repositorio, no se abre la terminal. Si su repositorio no tiene `path`, la terminal aparece deshabilitada.
- Sigue viva mientras la vista del proyecto esté en memoria (ver *Persistencia*).
