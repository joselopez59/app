# Estructura del Proyecto Tischanordnung

## Árbol de Directorios
```
app/
├── src/
│   ├── components/         # Componentes UI reutilizables
│   │   ├── FloorPlan.svelte    # Lienzo principal (mesas, DJ, etc.)
│   │   ├── OptionsPanel.svelte # Panel derecho con items arrastrables
│   │   ├── Sidebar.svelte      # Panel izquierdo (configuración)
│   │   └── Table.svelte        # Representación visual de una mesa
│   ├── lib/
│   │   ├── actions.ts          # Acciones Svelte (ej. followMouse)
│   │   └── stores.ts           # Gestión de estado (Stores)
│   ├── types/
│   │   └── index.ts            # Definiciones de tipos TypeScript
│   ├── App.svelte          # Layout principal (3 columnas)
│   ├── app.css             # Estilos globales (Dark Theme)
│   ├── main.ts             # Punto de entrada
│   └── vite-env.d.ts
├── public/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Descripción de Componentes

### Core
*   **App.svelte**: Orquestador principal. Maneja el layout de 3 columnas y los eventos globales de `window` para el Drag & Drop (movimiento de mesas y drop de nuevos items).
*   **main.ts**: Monta la aplicación.

### Components
*   **Sidebar.svelte**:
    *   Input para número de personas.
    *   Llama a `autoConfigureTables` para regenerar el layout.
*   **FloorPlan.svelte**:
    *   Visualiza la lista de mesas (`$tables`).
    *   Visualiza elementos extra (`$djPosition`, `$fotoBoxPosition`).
*   **Table.svelte**:
    *   Renderiza una mesa con sillas.
    *   Maneja evento `mousedown` para iniciar arrastre.
*   **OptionsPanel.svelte**:
    *   Muestra herramientas disponibles (DJ, FotoBox).
    *   Inicia el arrastre de nuevos elementos (`draggingItem`).

### State Management (stores.ts)
*   `tables`: Array de objetos mesa.
*   `persons`: Número de comensales.
*   `draggingItem`: Elemento siendo arrastrado actualmente (mesa o item nuevo).
*   `djPosition` / `fotoBoxPosition`: Coordenadas de elementos únicos.
