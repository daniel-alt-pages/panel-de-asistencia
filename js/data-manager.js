/**
 * ============================================================
 *  DATA-MANAGER.JS — Procesamiento de Datos y Estado Global
 * ============================================================
 * 
 * Gestiona TODO el procesamiento de datos del panel:
 *  1. Carga y parseo de archivos CSV
 *  2. Procesamiento de métricas por estudiante
 *  3. Filtrado dual por Institución (SG/IETAC) y Área Académica
 *  4. Estado global de la aplicación
 * 
 * FLUJO DE DATOS:
 *   CSV Upload → SESSIONS[] → processData() → studentMap{} → UI
 *   
 *   Filtros activos:
 *     activeSede + activeArea → processData() → renderAll()
 * 
 * DETECCIÓN DE SEDE:
 *   Prioridad 1: Prefijo en nombre del estudiante (ej: "SG - VALERIA")
 *   Prioridad 2: Nombre/programa de la sesión (ej: "PREICFES INTENSIVO SG")
 *   Fallback: "OTRO"
 * 
 * DEPENDENCIAS: icons.js (INSTITUTIONS, AREAS), utils.js (funciones puras)
 * CARGADO POR: index.html (después de utils.js)
 * ============================================================
 */


// ─────────────────────────────────────────────
//  CUENTAS EXCLUIDAS DEL ANÁLISIS
// ─────────────────────────────────────────────

/**
 * Cuentas administrativas o de prueba que deben ser ignoradas
 * durante el procesamiento de datos. Se comparan contra el
 * resultado de getKey(studentRow).
 * 
 * @type {Set<string>}
 */
const EXCLUDED_ACCOUNTS = new Set([
    'DANIEL SOLARTE',
    'PREICFES SEAMOS GENIOS',
    'DANIEL CAMILO CUSPOCA QUITIAN',
    'PREINTENSIVO SEAMOSGENIOS'
]);


// ─────────────────────────────────────────────
//  ESTADO GLOBAL DE LA APLICACIÓN
// ─────────────────────────────────────────────

/**
 * Mapa de estudiantes procesados. Clave: nombre (getKey). Valor: objeto con métricas.
 * Se recalcula cada vez que cambia un filtro o se cargan nuevos datos.
 * @type {Object<string, Object>}
 */
let studentMap = {};

/**
 * Sede activa para filtrar. Valores posibles: 'todas', 'SG', 'IETAC', 'OTRO'.
 * @type {string}
 */
let activeSede = 'todas';

/**
 * Área académica activa para filtrar. Valores posibles: 'todas', o cualquier clave de AREAS.
 * @type {string}
 */
let activeArea = 'todas';

/**
 * Notas del administrador por estudiante (persiste en localStorage).
 * Clave: nombre del estudiante. Valor: texto de la nota.
 * @type {Object<string, string>}
 */
let notes = JSON.parse(localStorage.getItem('attendanceNotes') || '{}');

/**
 * Estado de contacto por estudiante (persiste en localStorage).
 * Clave: nombre del estudiante. Valor: boolean.
 * @type {Object<string, boolean>}
 */
let contacted = JSON.parse(localStorage.getItem('attendanceContacted') || '{}');


// ─────────────────────────────────────────────
//  FILTRADO DE SESIONES (por Área solamente)
// ─────────────────────────────────────────────

/**
 * Retorna las sesiones filtradas según el área activa.
 * 
 * NOTA: El filtro de SEDE se aplica a nivel de ESTUDIANTE (en processData),
 * no a nivel de sesión, porque una misma sesión puede tener estudiantes
 * de SG y IETAC mezclados.
 * 
 * @returns {Object[]} Array de sesiones que cumplen el filtro de área.
 */
function getFilteredSessions() {
    return SESSIONS.filter(session => {
        // Filtro por área académica (a nivel de sesión)
        if (activeArea !== 'todas') {
            const sessionArea = getSessionArea(session);
            if (sessionArea !== activeArea) return false;
        }
        return true;
    });
}


/**
 * Cambia la sede activa, reprocesa los datos y refresca la UI.
 * 
 * @param {string} sede - Identificador de la sede ('todas', 'SG', 'IETAC').
 */
function selectSede(sede) {
    activeSede = sede;
    processData();
    renderAll();
}


/**
 * Cambia el área activa, reprocesa los datos y refresca la UI.
 * 
 * @param {string} area - Nombre del área ('todas', 'Ciencias Naturales', etc.).
 */
function selectArea(area) {
    activeArea = area;
    processData();
    renderAll();
}


// ─────────────────────────────────────────────
//  RESOLUCIÓN DE SEDE POR ESTUDIANTE
// ─────────────────────────────────────────────

/**
 * Determina la sede de un estudiante usando la prioridad:
 *   1. Prefijo en nombre del estudiante (ej: "SG - VALERIA")
 *   2. Nombre/programa de la sesión como fallback
 *   3. "OTRO" si no se puede determinar
 * 
 * @param {string[]} studentRow - Fila del estudiante del CSV.
 * @param {Object} session - Sesión a la que pertenece esta entrada.
 * @returns {string} 'SG', 'IETAC' o 'OTRO'.
 */
function resolveStudentSede(studentRow, session) {
    // Prioridad 1: prefijo en nombre del estudiante
    const studentSede = getStudentSede(studentRow);
    if (studentSede) return studentSede;

    // Prioridad 2: nombre/programa de la sesión
    return getSessionSede(session);
}


// ─────────────────────────────────────────────
//  CARGA DE ARCHIVOS CSV
// ─────────────────────────────────────────────

/**
 * Procesa múltiples archivos CSV subidos por el usuario.
 * 
 * Formato esperado del nombre de archivo:
 *   "Asistencia de [Nombre Sesión] (YYYY_MM_DD ...) - Asistentes.csv"
 * 
 * Formato del CSV (columnas):
 *   [0] Nombre, [1] Apellido, [2] Correo, [3] Duración, [4] Ingreso, [5] Salida
 *
 * Nota: El nombre (col 0) puede tener prefijo "SG - " o "IETAC - " indicando sede.
 * 
 * @param {Event} event - Evento del input[type=file].
 */
function handleCSVUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    let loaded = 0;

    Array.from(files).forEach(file => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const lines = e.target.result.split(/\r?\n/).filter(l => l.trim());
            if (lines.length < 2) return;

            // Extraer nombre de la sesión y fecha del nombre del archivo
            const nameMatch = file.name.match(/Asistencia de (.+?)\s*\(/);
            const dateMatch = file.name.match(/\((\d{4}_\d{2}_\d{2})/);

            const newSession = {
                id: SESSIONS.length + 1,
                name: nameMatch ? nameMatch[1].trim() : file.name,
                program: '',
                date: dateMatch ? dateMatch[1].replace(/_/g, '-') : new Date().toISOString().slice(0, 10),
                time: '',
                students: []
            };

            // Parsear filas de estudiantes (empezar desde línea 1, la 0 es header)
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',');
                if (cols.length >= 6) {
                    newSession.students.push([
                        cols[0].trim(), cols[1].trim(), cols[2].trim(),
                        cols[3].trim(), cols[4].trim(), cols[5].trim()
                    ]);

                    // Extraer horario de la primera fila con datos de hora
                    if (!newSession.time && cols[4]) {
                        newSession.time = cols[4].trim() + ' - ' + cols[5].trim();
                    }
                }
            }

            SESSIONS.push(newSession);
            loaded++;

            if (loaded === files.length) {
                processData();
                renderAll();
                showToast(`${icon('check')} ${loaded} archivo(s) cargado(s)`);
            }
        };

        reader.readAsText(file);
    });

    // Limpiar el input para permitir cargar los mismos archivos de nuevo
    event.target.value = '';
}


// ─────────────────────────────────────────────
//  PROCESAMIENTO DE DATOS
// ─────────────────────────────────────────────

/**
 * Procesa todas las sesiones filtradas y construye el studentMap.
 * 
 * Para cada estudiante calcula:
 *   - attended: número de sesiones asistidas
 *   - attRate: tasa de asistencia (0 a 1)
 *   - avgDuration: duración promedio en minutos
 *   - engagement: score de compromiso (0-100)
 *   - sessions: array con detalle de cada sesión asistida
 *   - sede: sede del estudiante (detectada del prefijo de su nombre)
 *   - area: área más frecuente del estudiante
 * 
 * FILTRO DE SEDE:
 *   Se aplica AQUÍ (no en getFilteredSessions) porque la sede es
 *   por ESTUDIANTE, no por sesión. Una misma sesión puede mezclar
 *   estudiantes SG e IETAC.
 * 
 * Engagement = (0.4 × asistencia) + (0.35 × duración) + (0.25 × constancia)
 */
function processData() {
    studentMap = {};
    const sessions = getFilteredSessions();
    const totalSessions = sessions.length;

    // Fase 1: Recorrer cada sesión y acumular datos por estudiante
    sessions.forEach(session => {
        const sessionArea = getSessionArea(session);

        session.students.forEach(studentRow => {
            const key = getKey(studentRow);

            // Ignorar cuentas excluidas
            if (EXCLUDED_ACCOUNTS.has(key)) return;

            // Determinar sede del estudiante
            const studentSede = resolveStudentSede(studentRow, session);

            // Filtro de sede: saltar este estudiante si no coincide con la sede activa
            if (activeSede !== 'todas' && studentSede !== activeSede) return;

            // Inicializar entrada del estudiante si no existe
            if (!studentMap[key]) {
                studentMap[key] = {
                    name: key,
                    email: studentRow[2] || '',
                    sede: studentSede,
                    area: sessionArea,
                    attended: 0,
                    sessions: [],
                    avgDuration: 0,
                    attRate: 0,
                    engagement: 0,
                    _areaCount: {}
                };
            }

            const student = studentMap[key];

            // Contabilizar área para el estudiante
            student._areaCount[sessionArea] = (student._areaCount[sessionArea] || 0) + 1;

            // Datos de esta asistencia
            const duration = parseDuration(studentRow[3]);
            const joinTime = studentRow[4] || '';
            const leaveTime = studentRow[5] || '';
            const durationStr = studentRow[3] || '';

            student.attended++;
            student.sessions.push({
                sessionId: session.id,
                sessionName: session.name,
                date: session.date,
                duration: duration,
                durationStr: durationStr,
                joinTime: joinTime,
                leaveTime: leaveTime
            });
        });
    });

    // Fase 2: Calcular métricas derivadas para cada estudiante
    Object.values(studentMap).forEach(student => {
        const totalAttended = student.sessions.length;
        const totalDuration = student.sessions.reduce((sum, s) => sum + s.duration, 0);

        // Tasa de asistencia
        student.attRate = totalSessions > 0 ? totalAttended / totalSessions : 0;
        student.avgDuration = totalAttended > 0 ? totalDuration / totalAttended : 0;

        // Área más frecuente del estudiante
        student.area = Object.entries(student._areaCount)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'General';

        // Limpiar contadores internos
        delete student._areaCount;

        // Score de engagement (0-100)
        // Fórmula: 40% asistencia + 35% duración (normalizada a 2h) + 25% constancia
        const attendanceScore = student.attRate * 100;
        const durationScore = Math.min(student.avgDuration / 120, 1) * 100;
        const consistencyScore = totalSessions > 0
            ? (totalAttended >= totalSessions * 0.8 ? 100 :
                totalAttended >= totalSessions * 0.5 ? 70 : 30)
            : 0;

        student.engagement = Math.round(
            (attendanceScore * 0.40) +
            (durationScore * 0.35) +
            (consistencyScore * 0.25)
        );
    });
}
