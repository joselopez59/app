# Gestión de Mesas - Sala

Aplicación web simple para gestionar y organizar mesas en una sala mediante drag & drop.

## Características

- ✨ Interfaz moderna y atractiva
- 🖱️ Drag & drop para mover mesas
- ➕ Añadir mesas con diferentes capacidades (2, 4, 6, 8 personas)
- 🗑️ Eliminar mesas
- 📐 Plano de la sala con áreas especiales (Bar, DJ)
- 💾 Guardado automático en localStorage

## Uso

Simplemente abre el archivo `index.html` en tu navegador. No se requiere instalación ni servidor.

### Opciones:

1. **Abrir directamente**: Haz doble clic en `index.html`
2. **Servidor local** (recomendado para desarrollo):
   ```bash
   # Con Python 3
   python -m http.server 8000
   
   # Con Node.js (http-server)
   npx http-server
   
   # Con PHP
   php -S localhost:8000
   ```
   Luego abre `http://localhost:8000` en tu navegador

## Estructura de archivos

```
app/
├── index.html      # Estructura HTML de la aplicación
├── styles.css      # Estilos CSS
├── app.js          # Lógica JavaScript
└── README.md       # Este archivo
```

## Funcionalidades

- **Añadir mesas**: Usa los botones en el panel lateral para añadir mesas de diferentes tamaños
- **Mover mesas**: Haz clic y arrastra las mesas en el plano
- **Eliminar mesas**: Usa el botón "×" en la lista de mesas
- **Persistencia**: Las mesas se guardan automáticamente en el navegador (localStorage)

## Tecnologías

- HTML5
- CSS3
- JavaScript (Vanilla, sin frameworks)
