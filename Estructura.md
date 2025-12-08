# Estructura del Proyecto Tischanordnung

## Árbol de Directorios
```
app/
├── src/
│   ├── assets/             # Recursos estáticos (Logos, SalaBase)
│   ├── components/         # Componentes UI reutilizables
│   │   ├── FloorPlan.svelte    # Lienzo SVG (SalaBase vectorial)
│   │   ├── OptionsPanel.svelte # Panel inferior (DJ, Fotobox)
│   │   ├── Sidebar.svelte      # Barra superior (InputThumbwheel)
│   │   ├── Thumbwheel.svelte   # Componente de entrada numérico estilo rueda
│   │   └── Table.svelte        # Representación visual de una mesa
│   ├── lib/
│   │   ├── actions.ts          # Acciones Svelte (followMouse)
│   │   └── stores.ts           # Gestión de estado (Stores: tables, persons, dragging)
│   ├── types/
│   │   └── index.ts            # Definiciones de tipos TypeScript
│   ├── App.svelte          # Layout principal (3 Filas)
│   ├── app.css             # Estilos globales (Dark Theme, Premium)
│   ├── main.ts             # Punto de entrada
│   └── vite-env.d.ts
├── public/
├── index.html
├── package.json
└── vite.config.ts
```

## Descripción de Componentes

### Core
*   **App.svelte**:
    *   **Layout**: Contenedor centrado (`max-width: 1280px`).
    *   **Estructura Vertical**:
        1.  **Header**: 15% altura.
        2.  **InputContainer**: Barra superior (`Sidebar.svelte`).
        3.  **FloorPlan**: Área central (SVG Vectorial).
        4.  **OptionsBar**: Barra inferior (`OptionsPanel.svelte`) con etiqueta "Optionen".
    *   **Drag Logic**: Maneja eventos globales `window`.

### Components
*   **Sidebar.svelte**:
    *   **Thumbwheel (Izq)**: Selección de invitados.
    *   **Info (Centro)**: Contador de mesas y botón RESET.
    *   **Staging Area (Der)**: Slider horizontal con las mesas generadas (aún no colocadas).
*   **FloorPlan.svelte**:
    *   SVG incrustado recreando el plano "SalaBase".
    *   Solo renderiza mesas con `placed: true`.
    *   Muros, Barra, Pilar, Etiquetas y Flechas definidos vectorialmente.
*   **Table.svelte**:
    *   Soporta modo `relative` (para Staging) y absoluto (para FloorPlan).
    *   Context Menu: Click derecho para Rotar, Bloquear Tipo, Renombrar.
*   **OptionsPanel.svelte**:
    *   Barra horizontal inferior.
    *   Elementos arrastrables: DJ Pult, Fotobox.
*   **Thumbwheel.svelte**:
    *   Input personalizado.
    *   Visualización de rueda con rayas y arrastre vertical.

### State Management (stores.ts)
*   `tables`: Array de objetos `Table` (`id`, `x`, `y`, `type`, `rotation`, `label`, `placed`).
*   `persons`: Número de invitados (Default 40).
*   `draggingItem`: Elemento en arrastre.
*   `djPosition` / `fotoBoxPosition`: Coordenadas de items extra.
