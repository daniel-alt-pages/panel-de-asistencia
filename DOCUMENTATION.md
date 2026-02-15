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
- Calcula métricas por estudiante: asistencia, duración, engagement
- Almacena resultados en `studentMap{}`

### 3. Renderizado

- `renderAll()` (app.js) dispara todas las funciones render*()
- Cada función render*() toma datos de `studentMap{}` y genera HTML

### 4. Filtrado

- `selectSede()` cambia `activeSede` y reprocesa datos
- `filterStudents()` aplica filtros de búsqueda/estado a la tabla

---

## 📊 Estado Global

| Variable | Módulo | Tipo | Persistencia |
|----------|--------|------|--------------|
| `SESSIONS` | data.js | Array | No |
| `ICONS` | icons.js | Object | No |
| `INSTITUTIONS` | icons.js | Object | No |
| `studentMap` | data-manager.js | Object | No |
| `notes` | data-manager.js | Object | localStorage |
| `contacted` | data-manager.js | Object | localStorage |
| `activeSede` | data-manager.js | String | No |
| `activeSession` | ui-render.js | Number | No |
| `activeRankSession` | ui-render.js | Number | No |
| `sortCol` / `sortAsc` | ui-render.js | Number/Bool | No |

---

## 🏆 Sistema de Ranking Unificado

El ranking usa un **Puntaje Unificado** (0-100) para evitar confusiones:

### Global (Vista "Todas las Clases")

| Componente | Peso | Cálculo |
|------------|------|---------|
| Asistencia | 40% | `(sesiones_asistidas / total_sesiones) × 100` |
| Duración | 35% | `min(duración_promedio / 120, 1) × 100` |
| Puntualidad | 25% | `max(0, 100 - retraso_promedio × 2)` |

### Por Clase (Vista individual)

| Componente | Peso | Cálculo |
|------------|------|---------|
| Duración | 50% | `min(duración / 120, 1) × 100` |
| Puntualidad | 50% | `max(0, 100 - retraso × 2)` |

---

## 🏫 Instituciones (Sedes)

Configuradas en `icons.js` → `INSTITUTIONS{}`:

| ID | Nombre | Color |
|----|--------|-------|
| SG | Seamos Genios | #8b5cf6 (violeta) |
| IETAC | IETAC | #06b6d4 (cian) |

### Agregar una nueva institución

1. **icons.js**: Agregar entrada en `INSTITUTIONS`
2. **utils.js**: Agregar detección en `getSede()`
3. La UI se actualiza automáticamente

---

## 🔌 API Pública (Integración)

El namespace `window.PanelAsistencia` permite integrar con otros proyectos:

```javascript
// Obtener datos
PanelAsistencia.getStudentMap()        // → {nombre: datos, ...}
PanelAsistencia.getFilteredSessions()  // → [sesiones filtradas]
PanelAsistencia.getActiveSede()        // → 'todas' | 'SG' | 'IETAC'

// Acciones
PanelAsistencia.selectSede('SG')       // Filtrar por sede
PanelAsistencia.processData()          // Recalcular métricas
PanelAsistencia.renderAll()            // Refrescar UI
PanelAsistencia.exportCSV()            // Descargar CSV
PanelAsistencia.exportExcel()          // Descargar Excel

// Info
PanelAsistencia.version                // → '2.0.0'
```

---

## 🎨 Sistema de Íconos

Todos los íconos son SVGs inline gestionados por `icon()` en `icons.js`:

```javascript
icon('users')        // SVG 18px (tamaño por defecto)
icon('clock', 24)    // SVG 24px
icon('alert', 14)    // SVG 14px
```

### Agregar un nuevo ícono

1. Buscar SVG en <https://lucide.dev>
2. Copiar el `<path>` interno
3. Agregar al objeto `ICONS` en `icons.js`

---

## 🚀 Setup Rápido

```bash
# No requiere instalación. Abrir directamente:
start index.html

# O servir con un servidor local:
npx serve .
```

### Requisitos

- Navegador moderno (Chrome, Firefox, Edge)
- Conexión a internet (para Google Fonts y SheetJS CDN)

### Formato de CSV esperado

Nombre del archivo: `Asistencia de [Sesión] (YYYY_MM_DD ...).csv`

| Columna | Contenido |
|---------|-----------|
| 0 | Nombre Completo |
| 1 | Código |
| 2 | Correo |
| 3 | Duración (ej: "1 h 23 min") |
| 4 | Hora Ingreso (ej: "2:30 PM") |
| 5 | Hora Salida (ej: "4:00 PM") |
