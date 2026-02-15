/**
 * ============================================================
 *  ICONS.JS — Sistema de Íconos SVG Inline y Configuración
 * ============================================================
 * 
 * Este módulo define todos los íconos SVG utilizados en el panel
 * de asistencia como strings inline, eliminando la necesidad de
 * librerías externas como Lucide o Font Awesome.
 * 
 * VENTAJAS:
 *  - Sin dependencias externas (no CDN, no peticiones HTTP)
 *  - Cada ícono es un SVG puro, escalable y estilizable con CSS
 *  - Tamaño controlado por parámetro
 * 
 * USO:
 *   icon('users')       → SVG de 18px (tamaño por defecto)
 *   icon('clock', 24)   → SVG de 24px
 *   icon('alert', 14)   → SVG de 14px
 * 
 * AGREGAR UN ÍCONO NUEVO:
 *   1. Buscar el SVG deseado (recomendado: https://lucide.dev)
 *   2. Copiar el contenido del <path> / <polyline> / <circle>
 *   3. Agregar una entrada en el objeto ICONS con una clave descriptiva
 *   4. Usar en cualquier módulo: icon('mi-nuevo-icono')
 * 
 * DEPENDENCIAS: Ninguna (este es el primer módulo en cargarse)
 * CARGADO POR: index.html (después de data.js)
 * ============================================================
 */

// ------------------------------------
// Catálogo completo de íconos SVG
// ------------------------------------
// Cada clave es el nombre del ícono y el valor es la cadena de
// elementos internos del SVG (paths, circles, polylines, etc.)
// Se envuelven automáticamente en un <svg> por la función icon().
const ICONS = {
    // --- Navegación y UI ---
    'dashboard': '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    'trending-up': '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    'calendar': '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
    'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    'trophy': '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    'alert': '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    'help': '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',

    // --- Métricas y gráficas ---
    'bar-chart': '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
    'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    'check': '<polyline points="20 6 9 17 4 12"/>',
    'x-circle': '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    'target': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    'star': '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    'medal': '<path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"/><path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12"/>',

    // --- Acciones ---
    'search': '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    'download': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    'upload': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    'save': '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
    'printer': '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    'phone': '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',

    // --- Información y documentos ---
    'info': '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    'spreadsheet': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="10" y1="9" x2="10" y2="9"/>',
    'heatmap': '<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="3" height="3"/><rect x="14" y="7" width="3" height="3"/><rect x="7" y="14" width="3" height="3"/><rect x="14" y="14" width="3" height="3"/>',

    // --- Edificios / Instituciones ---
    'building': '<path d="M6 22V2a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v20"/><path d="M6 12H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2"/><path d="M18 9h2a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-2"/><path d="M10 6h4M10 10h4M10 14h4M10 18h4"/>',
    'door-open': '<path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/><path d="M10 12v.01"/><path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z"/>',

    // --- Lectura / Educación ---
    'book-open': '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',

    // --- Filtros ---
    'filter': '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>'
};


/**
 * Genera un ícono SVG inline como string HTML.
 * 
 * @param {string} name  - Nombre del ícono (clave del objeto ICONS).
 *                         Si no existe, retorna un string vacío.
 * @param {number} [size=18] - Tamaño en píxeles (ancho y alto del SVG).
 * @returns {string} Cadena HTML del SVG, lista para usar con innerHTML.
 * 
 * @example
 *   document.getElementById('btn').innerHTML = icon('users', 20);
 *   // Resultado: <svg class="icon" width="20" height="20" ...>...</svg>
 */
function icon(name, size) {
    const s = size || 18;
    const path = ICONS[name];
    if (!path) return '';
    return `<svg class="icon" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}


// ------------------------------------
// Configuración de Instituciones (Sedes)
// ------------------------------------
// Cada institución tiene un color principal, un fondo semitransparente
// y un ícono asociado. Se usa en el selector de institución y en las
// etiquetas de las sesiones.
//
// CÓMO AGREGAR UNA NUEVA INSTITUCIÓN:
//   1. Agregar la entrada aquí con color, bg e icon
//   2. En utils.js → getSessionSede(), agregar la detección del nombre
//   3. La UI se actualizará automáticamente
const INSTITUTIONS = {
    'SG': {
        fullName: 'Seamos Genios',       // Nombre completo de la institución
        color: '#8b5cf6',              // Color principal (violeta)
        bg: 'rgba(139,92,246,.12)', // Fondo semitransparente
        icon: 'building'              // Ícono del catálogo ICONS
    },
    'IETAC': {
        fullName: 'IETAC',                // Nombre completo
        color: '#06b6d4',              // Color principal (cian)
        bg: 'rgba(6,182,212,.12)',   // Fondo semitransparente
        icon: 'building'              // Ícono del catálogo ICONS
    }
};


// ------------------------------------
// Configuración de Áreas Académicas
// ------------------------------------
// Cada área tiene un color, fondo e ícono para los filtros y etiquetas.
// Los nombres deben coincidir con los retornados por getSessionArea() en utils.js.
//
// CÓMO AGREGAR UNA NUEVA ÁREA:
//   1. Agregar la entrada aquí con color, bg e icon
//   2. En utils.js → getSessionArea(), agregar la detección por keywords
//   3. La UI se actualizará automáticamente
const AREAS = {
    'Ciencias Naturales': {
        color: '#22c55e',                // Verde
        bg: 'rgba(34,197,94,.12)',
        icon: 'target'
    },
    'Inglés': {
        color: '#3b82f6',                // Azul
        bg: 'rgba(59,130,246,.12)',
        icon: 'book-open'
    },
    'Lectura Crítica': {
        color: '#f59e0b',                // Ámbar
        bg: 'rgba(245,158,11,.12)',
        icon: 'book-open'
    },
    'Matemáticas': {
        color: '#ef4444',                // Rojo
        bg: 'rgba(239,68,68,.12)',
        icon: 'bar-chart'
    },
    'Sociales': {
        color: '#a855f7',                // Morado
        bg: 'rgba(168,85,247,.12)',
        icon: 'users'
    },
    'General': {
        color: '#6b7280',                // Gris
        bg: 'rgba(107,114,128,.12)',
        icon: 'info'
    }
};
