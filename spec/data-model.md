# Modelo de datos

Fuente: `initial_prompt.md`. Implementación actual: `src-tauri/migrations/`.

> Las marcas **[P-n]** señalan puntos pendientes de confirmar (ver el final del documento).

## Convenciones

- Tablas, campos y valores guardados en la base de datos: siempre **en inglés**, aunque el ítem se nombre en castellano.
- Base de datos: **SQLite** local.
- Todos los `id` son `INTEGER` autoincrementales.
- Las fechas son `INTEGER` (timestamp Unix en segundos).
- Rutas por defecto, relativas al ejecutable:
  - `bbdd/`: base de datos.
  - `notes/`: notas en Markdown.
  - `docs/`: **reservada** para futuros documentos adjuntos externos. No usar ese nombre para nada más.
- Todos los documentos que genera la app son **Markdown (`.md`)**, salvo que se especifique lo contrario.
- Los ítems **no se borran**, solo se cierran (*Done* o *Canceled*). Más adelante se valorará un purgador según la carga de la app.

## Configuración

Hay dos lugares de almacenamiento, y **cada ajuste debe especificar en cuál se guarda**:

- **`settings.json`**, junto al ejecutable. Sirve para los ajustes de la app, y se puede editar a mano sin entrar en la pantalla de Ajustes. Ejemplos: la carpeta de notas y el idioma de la interfaz.
- **Base de datos:** los datos que se gestionan desde Ajustes. Ejemplo: la creación de proyectos.

`settings.json` se crea con los valores por defecto si no existe. Al arrancar, se completan las claves que falten y se respetan las desconocidas. Si no es un JSON válido, se renombra a `settings.invalid.json` y se crea uno nuevo por defecto.

Claves actuales:

| Clave | Descripción | Por defecto |
|---|---|---|
| `theme` | Tema de la interfaz (`light`, `dark`). Si está vacío, se usa el de por defecto. | `light` |
| `layout.sidebar.width` | Ancho actual del sidebar (px). | 240 |
| `layout.sidebar.default_width` | Ancho al que vuelve con doble clic en el separador. | 240 |
| `layout.sidebar.min_width` / `max_width` | Límites del arrastre. | 180 / 480 |

## Jerarquía de ítems

```
projects ─┬─ epics ── macros ── tasks
          └─────────── macros ── tasks
```

Aunque los ítems son muy parecidos, cada tipo tiene **su propia tabla** para facilitar el mantenimiento y los evolutivos futuros.

### Campos comunes ("clon de projects")

| Campo | Tipo | Notas |
|---|---|---|
| `id` | INTEGER PK autoincremental | |
| `name` | TEXT | Nombre o título del ítem. Editable desde el popup. Base del `slug`. En las tareas, es el texto de la línea en `tasks.md` |
| `slug` | TEXT UNIQUE | Id público. Si se repite, se añade `_N`, donde N es el contador de repeticiones (`_2`, `_3`…) |
| `status_id` | INTEGER FK → `statuses.id` | |
| `created_at` | INTEGER | |
| `updated_at` | INTEGER | |
| `closed_at` | INTEGER | |
| `deadline` | INTEGER | |

Ninguna de estas tablas tiene rutas en disco: las rutas locales pertenecen a los repositorios (ver `repos`).

### `projects`

Solo los campos comunes. Un proyecto puede tener varios repositorios (ver `project_repos`), y cada repositorio tiene su propia ruta local.

### `epics`

Campos comunes más:

| Campo | Tipo | Notas |
|---|---|---|
| `project_id` | INTEGER FK → `projects.id` | Obligatorio: una épica siempre pertenece a un proyecto |
| `repo_id` | INTEGER FK → `repos.id` | Repo de la épica. Su `path` es la ruta de la terminal. Null si no tiene repo |

### `macros`

Campos comunes más:

| Campo | Tipo | Notas |
|---|---|---|
| `project_id` | INTEGER FK → `projects.id` | Null si la macro depende de una épica |
| `epic_id` | INTEGER FK → `epics.id` | Null si la macro depende directamente de un proyecto |
| `branch` | TEXT | Rama del repositorio |
| `issue` | TEXT | Issue del repositorio |
| `repo_id` | INTEGER FK → `repos.id` | Repo al que pertenecen la rama y el issue |

Debe rellenarse exactamente uno de los dos campos, `project_id` o `epic_id`.

### `tasks`

Campos comunes más:

| Campo | Tipo | Notas |
|---|---|---|
| `macro_id` | INTEGER FK → `macros.id` | Obligatorio: una tarea solo depende de una macro |

Es el desglose más pequeño del trabajo. Su proyecto se obtiene a través de la jerarquía (macro → épica → proyecto, o macro → proyecto).

Las tareas no tienen rama ni issue propios: los heredan de su macro.

**Fuente de verdad: `tasks.md`.** Las tareas salen del fichero `tasks.md` del repositorio, en la rama de la macro (ver *Fichero tasks.md*). La tabla `tasks` es un espejo sincronizado que guarda lo que el fichero no tiene: `id`, `slug`, `status_id`, fechas, etiquetas y notas `task_<id>`.

## Tablas auxiliares

### `repos`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | INTEGER PK autoincremental | |
| `url` | TEXT UNIQUE | URL del repositorio remoto |
| `path` | TEXT | Carpeta local donde está clonado el repositorio. Admite null si aún no se ha clonado |

Las rutas en disco local van **siempre** asociadas al repositorio, nunca a `projects`, `epics`, `macros` ni `tasks`.

### `project_repos` (tabla de cruce)

Indica qué repositorios pueden pertenecer a cada proyecto.

| Campo | Tipo |
|---|---|
| `id` | INTEGER PK autoincremental |
| `project_id` | INTEGER FK → `projects.id` |
| `repo_id` | INTEGER FK → `repos.id` |

### `statuses`

| Campo | Tipo |
|---|---|
| `id` | INTEGER PK autoincremental |
| `name` | TEXT |
| `description` | TEXT |
| `priority` | INTEGER |

Valores iniciales. El nombre y la descripción se guardan en inglés en la base de datos y **no se traducen**: no pasan por i18n y se muestran tal cual en cualquier idioma. La columna *Significado* de esta tabla es solo una referencia en castellano.

| name | priority | Significado |
|---|---|---|
| Canceled | 0 | El trabajo o la propuesta se ha cancelado y no se desarrollará, al menos con los requisitos actuales |
| Done | 10 | Desplegado, entregado y validado. Se cierra como terminado |
| Testing | 12 | Desplegado y entregado al peticionario, pendiente de que confirme que hace lo pedido |
| Deploy Requested | 15 | Trabajo hecho. PR solicitado y pendiente del aprobador |
| Triage | 70 | Es una petición. No se ha iniciado ni se ha validado que se vaya a iniciar |
| Backlog | 79 | Se hará, pero faltan requisitos, estimar horas o proponer fecha |
| Paused | 80 | Pausado por decisión |
| Blocked | 89 | Otro desarrollo o la respuesta de terceros impide avanzar |
| In Progress | 99 | En curso |

### `labels`

| Campo | Tipo |
|---|---|
| `id` | INTEGER PK autoincremental |
| `name` | TEXT |
| `color` | TEXT |

### `items_labels`

Relación entre etiquetas y cualquier tipo de ítem.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | INTEGER PK autoincremental | |
| `label_id` | INTEGER FK → `labels.id` | Etiqueta asignada |
| `item_id` | INTEGER | Id del ítem en su tabla |
| `item_type` | TEXT | `project`, `epic`, `macro` o `task` |

## Reglas de negocio

### Propagación de estados

Se aplica igual tanto si el cambio se hace en la app como si llega desde `tasks.md`.

#### Hacia abajo

Cuando un ítem cambia de estado, **todos sus ítems inferiores pasan al mismo estado**, sea cual sea su prioridad. Ejemplo: si una épica pasa a *Paused*, todas sus macros y las tareas de esas macros pasan a *Paused*.

- Antes de aplicar el cambio se muestra un mensaje que informa de que los ítems inferiores también cambiarán, y se pide confirmación. Si se cancela, no cambia nada.
- Si el ítem no tiene ítems inferiores, no se muestra el mensaje.

#### Hacia arriba

Después, el cambio sube por la jerarquía. En cada nivel, el ítem superior se recalcula así:

1. **Todos sus hijos directos tienen el mismo estado:** el superior adopta ese estado, aunque tenga menos prioridad que el suyo. Ejemplo: si todas las tareas de una macro pasan a *Done*, la macro pasa a *Done*.
2. **Si no:** el superior adopta el nuevo estado **solo si su estado actual tiene una `priority` menor**. Ejemplo: si una tarea pasa a *In Progress* (99), su macro, su épica y su proyecto pasan a *In Progress* siempre que su estado tenga una prioridad inferior a 99.
3. **Si no se cumple ninguna de las dos:** el superior no cambia y la propagación se detiene.

Los hijos directos de un proyecto son sus épicas y sus macros sin épica.

Un ítem nuevo también aplica estas reglas, así que puede reabrir el superior. Ejemplo: una tarea nueva en *Triage* (70) dentro de una macro en *Done* (10) reabre la macro y lo que tiene por encima.

#### Fechas de cierre

- `closed_at` se rellena al pasar a *Done* o *Canceled*.
- Se vacía al pasar a cualquier otro estado (reapertura).
- Se aplica a todos los ítems que cambian por la propagación.

#### Reflejo en `tasks.md`

- Las tareas que cambian, de forma directa o por propagación, se actualizan en su `tasks.md`: *Done* se escribe como `[x]` y cualquier otro estado como `[ ]`.
- Un mismo cambio de estado genera **un solo commit** por repositorio y rama, aunque afecte a varias tareas.

### Ficheros de notas

- Cada ítem tiene un fichero Markdown en la carpeta de notas, llamado `<item_type>_<id>.md`; por ejemplo, `project_12.md`. Si no existe, se crea la primera vez que se abre.
- La carpeta de notas se configura en `settings.json`. Por defecto es `notes/`, junto al ejecutable.
- Si se renombra un ítem, su fichero de notas se mantiene asociado a él: el nombre del fichero usa el `id`, que no cambia.
- Como los ítems no se borran, sus notas tampoco.

#### Cambio de carpeta de notas

Si se cambia la carpeta y la antigua tiene notas, un mensaje ofrece tres opciones:

1. Importar todas las notas de la carpeta antigua.
2. Importar solo las notas de los ítems no cerrados (`closed_at` null).
3. No importar nada.

Las notas importadas se **mueven** (no se copian). Si en la carpeta nueva ya existe un fichero con el mismo nombre, se pregunta qué hacer con él.

### Fichero `tasks.md`

- Va **en el repositorio**: un `tasks.md` por rama, es decir, por macro (`macros.repo_id` → `repos.path`, en la rama `macros.branch`). **[P-12]**
- Ruta dentro del repositorio: `openspec/changes/<nombre_de_la_rama>/tasks.md`. Si la carpeta no existe, se crea junto con el fichero. En el nombre de la rama, cada `/` se sustituye por `_` (`feature/login` → `openspec/changes/feature_login/tasks.md`).
- Macro sin rama: por ahora no se hace nada (ni checkout ni `tasks.md`).
- La rama no se escribe a mano: se elige entre las ramas del repositorio asociado. Por eso una macro con rama siempre tiene `repo_id`.
- Repositorio sin `path`: la terminal se deshabilita y, como no hay carpeta local, tampoco hay checkout ni sincronización de `tasks.md`. Sus tareas existen solo en la base de datos.
- **Cambio de rama:** al entrar en una macro (o en cualquier ítem asociado a una rama), la app ejecuta `git checkout <branch>` en `repos.path`. Así el fichero se lee y se escribe siempre en la rama activa.
- Lo genera Faro al crear la rama. Esta aplicación no usa Faro, pero se asegura de que exista: si en la rama no hay `tasks.md`, lo crea y hace commit para guardarlo.
- Formato: checklist Markdown.

  ```markdown
  # Tasks

  - [ ] Crear endpoint <!-- slug:crear-endpoint -->
  - [x] Revisar modelo <!-- slug:revisar-modelo -->
  ```

  Cada línea lleva el `slug` de la tarea en un comentario HTML, que no se ve al renderizar el Markdown.

- Sincronización:
  - Crear una tarea a mano en la app la añade al fichero y **cada tarea hace su propio commit**.
  - Un cambio de estado hace un solo commit para todas las tareas afectadas (ver *Propagación de estados*).
  - Cada tarea se identifica por el `slug` del comentario, no por su texto.
  - **Renombrar en el fichero:** si cambia el texto y el slug sigue igual, se actualiza `name` de la tarea, que conserva su `id` y su nota.
  - **Línea sin slug** (añadida a mano o por Faro): es una tarea nueva. La app le asigna un slug, lo escribe en la línea y hace commit.
  - **Tarea que desaparece del fichero** (borrada desde fuera de la app): se marca como *Canceled* y se aplica la propagación de estados.
  - `[x]` corresponde a *Done* en los dos sentidos: marcar `[x]` en el fichero pone la tarea en *Done* y propaga, y poner una tarea en *Done* desde la app escribe `[x]`. Si una tarea pasa a `[ ]` desde el fichero y estaba en *Done*, vuelve a *Triage*. Los demás estados solo existen en la base de datos y en el fichero se ven como `[ ]`.

---

## Puntos pendientes de confirmar

- **[P-12]** Detalles de `tasks.md` sin definir:
  - Qué hacer si el checkout falla, por ejemplo porque hay cambios sin commit en la rama actual.
  - Dos macros del mismo repositorio comparten la carpeta: al cambiar de rama por una, cambia también lo que ve la terminal abierta de la otra.
  - Los dos primeros puntos (checkout fallido y carpeta compartida) dependen de cuánto se pueda interactuar con la consola (pendiente de investigar).

## Puntos resueltos

- **[P-1]** Una macro que depende directamente de un proyecto tiene `epic_id` a null (antes ponía "el campo macro").
- **[P-2]** `items_labels` incluye `label_id`, FK de `labels`.
- **[P-3]** Las rutas locales van en `repos.path` (migración `002_repos_path_epics_repo.sql`, nullable), no en `projects`: un proyecto puede tener varios repositorios.
- **[P-4]** Las tareas no tienen rama ni issue: los heredan de su macro. Salen del `tasks.md` de la rama, y la tabla `tasks` es un espejo sincronizado.
- **[P-5]** El nombre o título de todos los ítems es el campo `name` (ya en la migración 001).
- **[P-6]** Propagación de estados en los dos sentidos, con confirmación, recálculo por hermanos, reapertura, `closed_at`, cambios llegados desde `tasks.md` y un commit por cambio (ver *Propagación de estados*).
- **[P-7]** Los nombres y descripciones de los estados se guardan en inglés y no se traducen (no pasan por i18n).
- **[P-8]** El estado se llama `Deploy Requested` (en el texto original el nombre estaba partido entre dos columnas).
- **[P-9]** Notas en `.md` con nombre `<item_type>_<id>.md`. Configuración en `settings.json` (o en la base de datos, según el ajuste). Al cambiar de carpeta, las notas se mueven y se pregunta en caso de conflicto. En `tasks.md`, las tareas se identifican por un slug en un comentario HTML.
- **[P-10]** Regla de i18n unificada en un solo párrafo (ver `spec/views.md`). Se elimina la sección `statuses` de `i18n.json`, porque los estados no se traducen. El idioma elegido se guarda en `settings.json`.
- **[P-11]** La terminal solo se abre desde épicas y macros, en la ruta de su repositorio (`epics.repo_id` / `macros.repo_id` → `repos.path`). `epics.repo_id` se añade en la migración 002. Sin repositorio con `path`, no se abre la terminal.
