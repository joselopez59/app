# Tischordnung - Saal

Aplicación web para gestionar y organizar mesas en una sala usando drag & drop.

## Estructura del Proyecto

```
app/
├── src/
│   ├── types/
│   │   └── index.ts          # Tipos e interfaces TypeScript
│   ├── services/
│   │   ├── StorageService.ts # Gestión de localStorage
│   │   └── TableService.ts   # Lógica de negocio de mesas
│   └── app.ts                # Punto de entrada principal
├── index.html               # HTML principal
├── styles.css               # Estilos CSS
├── tsconfig.json            # Configuración TypeScript
├── vite.config.ts           # Configuración Vite
└── package.json             # Dependencias
```

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Características

- Drag & drop de mesas
- Rotación de mesas en incrementos de 45°
- Diferentes tipos de mesas (normales, Tisch Royal, Geschenke)
- Persistencia en localStorage
- Elementos arrastrables (DJ, FotoBox)
