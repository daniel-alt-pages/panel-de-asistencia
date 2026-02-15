/**
 * ============================================================
 *  UTILS.JS — Funciones Utilitarias del Panel de Asistencia
 * ============================================================
 * 
 * Contiene todas las funciones puras de utilidad que no dependen
 * del estado de la aplicación. Estas funciones transforman datos
 * sin efectos secundarios.
 * 
 * PRINCIPIOS:
 *  - Funciones puras: misma entrada → misma salida
 *  - Sin dependencias de otros módulos
 *  - Sin acceso al DOM ni al estado global
 * 
 * DEPENDENCIAS: Ninguna
 * CARGADO POR: index.html (después de icons.js)
 * USADO POR: data-manager.js, ui-render.js, modals.js, export.js
 * ============================================================
 */


// ─────────────────────────────────────────────
//  PARSEO Y FORMATEO DE DURACIONES
// ─────────────────────────────────────────────

/**
 * Convierte una cadena de duración de la plataforma a minutos numéricos.
 * 
 * La plataforma exporta duraciones en formatos como:
 *   "1 h 23 min"  →  83
 *   "45 min"       →  45
 *   "2 h"          →  120
 *   "5 s"          →  0
 * 
 * @param {string} str - Cadena de duración exportada desde la plataforma.
 * @returns {number} Duración total en minutos. Retorna 0 si el formato es inválido.
 */
function parseDuration(str) {
    if (!str || typeof str !== 'string') return 0;

    const hoursMatch = str.match(/(\d+)\s*h/);
    const minutesMatch = str.match(/(\d+)\s*min/);

    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;

    return (hours * 60) + minutes;
}


/**
 * Formatea un número de minutos a una cadena legible humana.
 * 
 * @param {number} totalMinutes - Cantidad de minutos (puede ser decimal).
 * @returns {string} Cadena formateada: "Xh YYm" si ≥60, "Xm" si <60.
 */
function fmtMins(totalMinutes) {
    const rounded = Math.round(totalMinutes);
    if (rounded < 60) return `${rounded}m`;
    const hours = Math.floor(rounded / 60);
    const minutes = String(rounded % 60).padStart(2, '0');
    return `${hours}h ${minutes}m`;
}


// ─────────────────────────────────────────────
//  DETECCIÓN DE SEDE DESDE NOMBRE DEL ESTUDIANTE
// ─────────────────────────────────────────────

/**
 * Regex que detecta el prefijo de sede en el nombre del estudiante.
 * 
 * Patrones reales encontrados en CSVs:
 *   "SG - VALERIA"          → SG  (espacio-guión-espacio)
 *   "SG-VALENTINA"          → SG  (guión directo)
 *   "SG MATHIAS JOSÉ"       → SG  (solo espacio)
 *   "IETAC - JORGE ANDRÉS"  → IETAC
 *   "IETAC-Janer"           → IETAC
 *   "IETAC—ALEXANDRA"       → IETAC  (em-dash)
 * 
 * La regex captura: (SG|IETAC) seguido de espacio, guión, o em-dash.
 * Group 1 = sede, el resto del nombre se extrae removiendo el match.
 * 
 * @type {RegExp}
 */
const SEDE_PREFIX_REGEX = /^(SG|IETAC)\s*[-–—]?\s*/i;


/**
 * Extrae la sede/institución desde el prefijo del nombre del estudiante.
 * 
 * @param {string[]} studentRow - Fila del estudiante [Nombre, Apellido, ...].
 * @returns {string} 'SG', 'IETAC', o '' si no tiene prefijo.
 * 
 * @example
 *   getStudentSede(["SG - VALERIA", "AUSECHA", ...])       // → 'SG'
 *   getStudentSede(["IETAC - JORGE ANDRÉS", "PÉREZ", ...]) // → 'IETAC'
 *   getStudentSede(["VALERIA", "AUSECHA", ...])             // → ''
 */
function getStudentSede(studentRow) {
    const firstName = (studentRow[0] || '').trim();
    const match = firstName.match(SEDE_PREFIX_REGEX);
    return match ? match[1].toUpperCase() : '';
}


// ─────────────────────────────────────────────
//  IDENTIFICACIÓN DE ESTUDIANTES
// ─────────────────────────────────────────────

/**
 * Extrae la clave única (nombre completo limpio) de un registro de estudiante.
 * 
 * Pasos:
 *   1. Toma firstName (col 0) y lastName (col 1)
 *   2. Remueve el prefijo de sede (SG/IETAC) del firstName si existe
 *   3. Combina en "NOMBRE APELLIDO" en mayúsculas
 * 
 * @param {string[]} studentRow - Fila del CSV como array de strings.
 * @returns {string} Nombre completo limpio en mayúsculas.
 * 
 * @example
 *   getKey(["SG - VALERIA", "AUSECHA CAMPO", ...])        // → "VALERIA AUSECHA CAMPO"
 *   getKey(["IETAC - JORGE ANDRÉS", "PÉREZ MESTRA", ...]) // → "JORGE ANDRÉS PÉREZ MESTRA"
 *   getKey(["VALERIA", "AUSECHA CAMPO", ...])              // → "VALERIA AUSECHA CAMPO"
 *   getKey(["DIANA CAROLINA RUIZ", "", ...])               // → "DIANA CAROLINA RUIZ"
 */
function getKey(studentRow) {
    let firstName = (studentRow[0] || '').trim();
    const lastName = (studentRow[1] || '').trim();

    // Remover prefijo de sede (SG - / IETAC - / SG- / IETAC— / etc.)
    firstName = firstName.replace(SEDE_PREFIX_REGEX, '').trim();

    // Si el apellido está vacío, el nombre completo ya está en firstName
    const fullName = lastName ? `${firstName} ${lastName}` : firstName;

    return fullName.toUpperCase();
}


// ─────────────────────────────────────────────
//  DETECCIÓN DE SEDE (SESIÓN — FALLBACK)
// ─────────────────────────────────────────────

/**
 * Determina la sede/institución de una SESIÓN por su nombre o programa.
 * 
 * USAR COMO FALLBACK: Si los nombres de los estudiantes ya no tienen
 * prefijo (ej: data.js pre-limpio), esta función detecta la sede
 * desde el nombre/programa de la sesión.
 * 
 * @param {Object} session - Objeto de sesión con propiedades name y program.
 * @returns {string} Identificador de la sede: "SG", "IETAC" o "OTRO".
 * 
 * @example
 *   getSessionSede({ name: 'DINÁMICA II - CIENCIAS', program: 'PREICFES INTENSIVO SG' }) // → 'SG'
 */
function getSessionSede(session) {
    const text = `${session.name || ''} ${session.program || ''}`.toUpperCase();

    if (text.includes('SG')) return 'SG';
    if (text.includes('IETAC')) return 'IETAC';

    return 'OTRO';
}


// ─────────────────────────────────────────────
//  DETECCIÓN DE ÁREA ACADÉMICA
// ─────────────────────────────────────────────

/**
 * Detecta el área académica de una sesión por su nombre.
 * 
 * Busca keywords en el nombre de la sesión:
 *   - "CIENCIA" → Ciencias Naturales
 *   - "INGLÉ" / "ENGLISH" → Inglés
 *   - "LECTURA" / "CRÍTICA" / "CRITICA" → Lectura Crítica
 *   - "MATEMÁ" / "MATE" → Matemáticas
 *   - "SOCIAL" / "SOCIO" → Sociales
 *   - Otro → "General"
 * 
 * @param {Object} session - Objeto de sesión con propiedad name.
 * @returns {string} Nombre del área académica.
 * 
 * @example
 *   getSessionArea({ name: 'DINÁMICA II - CIENCIAS' })      // → 'Ciencias Naturales'
 *   getSessionArea({ name: 'TEÓRICA 12 - MATEMÁTICAS' })    // → 'Matemáticas'
 *   getSessionArea({ name: 'TEXTOS DISCONTINUOS - LECTURA CRÍTICA' }) // → 'Lectura Crítica'
 */
function getSessionArea(session) {
    const name = (session.name || '').toUpperCase();

    if (name.includes('CIENCIA')) return 'Ciencias Naturales';
    if (name.includes('INGLÉ') || name.includes('ENGLISH')) return 'Inglés';
    if (name.includes('LECTURA') || name.includes('CRÍTICA') || name.includes('CRITICA')) return 'Lectura Crítica';
    if (name.includes('MATEMÁ') || name.includes('MATE')) return 'Matemáticas';
    if (name.includes('SOCIAL') || name.includes('SOCIO')) return 'Sociales';

    return 'General';
}


// ─────────────────────────────────────────────
//  PARSEO DE HORARIOS
// ─────────────────────────────────────────────

/**
 * Convierte una hora en formato 12h (AM/PM o a.m./p.m.) a minutos desde medianoche.
 * 
 * La plataforma exporta horarios como "2:30 p.m.", "10:15 a.m.", etc.
 * 
 * @param {string} timeStr - Hora en formato "H:MM a.m./p.m." o "H:MM AM/PM".
 * @returns {number} Minutos desde medianoche. Retorna 0 si el formato es inválido.
 */
function parseTime12(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return 0;

    const match = timeStr.match(/(\d+):(\d+)\s*(a|p)/i);
    if (!match) return 0;

    let hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const isPM = match[3].toLowerCase() === 'p';

    // Conversión 12h → 24h
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;

    return (hours * 60) + mins;
}


// ─────────────────────────────────────────────
//  FUNCIONES ESTADÍSTICAS
// ─────────────────────────────────────────────

/**
 * Calcula la mediana de un array de números.
 * 
 * @param {number[]} arr - Array de valores numéricos.
 * @returns {number} Valor de la mediana. Retorna 0 si el array está vacío.
 */
function median(arr) {
    if (!arr || arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 !== 0) return sorted[mid];
    return (sorted[mid - 1] + sorted[mid]) / 2;
}


/**
 * Calcula la desviación estándar (poblacional) de un array de números.
 * 
 * @param {number[]} arr - Array de valores numéricos.
 * @returns {number} Desviación estándar. Retorna 0 si el array está vacío.
 */
function stdDev(arr) {
    if (!arr || arr.length === 0) return 0;
    const mean = arr.reduce((sum, val) => sum + val, 0) / arr.length;
    const squaredDiffs = arr.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / arr.length;
    return Math.sqrt(avgSquaredDiff);
}
