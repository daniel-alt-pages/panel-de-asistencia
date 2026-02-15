# 📋 Panel de Asistencia — Documentación Técnica

> Documentación completa para el equipo de programación.  
> Última actualización: 2026-02-14

---

## 📁 Arquitectura del Proyecto

El proyecto sigue una **arquitectura modular** (Screaming Architecture) donde cada archivo
tiene un propósito único y su nombre comunica claramente su función.

```
panel de asistencia/
├── index.html            ← Estructura HTML + carga de scripts
├── styles.css            ← Estilos globales y componentes CSS
├── data.js               ← Datos estáticos de sesiones (SESSIONS[])
│
├── icons.js              ← 🎨 Íconos SVG + Configuración de instituciones
├── utils.js              ← 🔧 Funciones utilitarias puras
├── data-manager.js       ← 📊 Procesamiento de datos + Estado global
├── ui-render.js          ← 🖥️  Renderizado de toda la interfaz
├── modals.js             ← 🪟 Modales (detalle estudiante + ayuda)
├── export.js             ← 📤 Exportación CSV y Excel
├── app.js                ← 🚀 Punto de entrada + API pública
│
└── DOCUMENTATION.md      ← Este archivo
```

### Orden de Carga (Crítico)

Los scripts se cargan en `index.html` en orden estricto de dependencias:

```
1. data.js          → Define SESSIONS[] (sin dependencias)
2. icons.js         → Define ICONS{}, icon(), INSTITUTIONS{} (sin dependencias)
3. utils.js         → Define funciones puras (sin dependencias)
4. data-manager.js  → Usa: icons.js, utils.js
5. ui-render.js     → Usa: icons.js, utils.js, data-manager.js
6. modals.js        → Usa: icons.js, utils.js, data-manager.js
7. export.js        → Usa: icons.js, utils.js, data-manager.js
8. app.js           → Inicializa todo, expone PanelAsistencia{}
```

> ⚠️ **No cambiar el orden de carga.** Cada módulo depende de que los anteriores estén disponibles.

---

## 🔄 Flujo de Datos

```
CSV Upload → SESSIONS[] → processData() → studentMap{} → renderAll() → DOM
                                ↑                              ↑
                          selectSede()                   filterStudents()
                                ↑                              ↑
                     Filtro por Institución           Búsqueda / Filtros UI
```

### 1. Carga de Datos

- El usuario sube archivos CSV con `handleCSVUpload()` (data-manager.js)
- Cada CSV se parsea y agrega como nueva sesión a `SESSIONS[]`
- El nombre y fecha se extraen del nombre del archivo

### 2. Procesamiento

- `processData()` (data-manager.js) recorre todas las sesiones
