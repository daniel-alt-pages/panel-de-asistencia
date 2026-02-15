/**
 * ============================================================
 *  MODALS.JS — Sistema de Modales y Ayuda
 * ============================================================
 * 
 * Gestiona todas las ventanas modales de la aplicación:
 *  1. Modal de Detalle de Estudiante (ficha completa)
 *  2. Modal de Ayuda (guías por pestaña)
 *  3. Guía de Inicio rápido
 *  4. Sistema de Toast Notifications
 * 
 * DEPENDENCIAS: icons.js (icon()), utils.js (fmtMins), data-manager.js (studentMap, notes, contacted)
 * CARGADO POR: index.html (después de ui-render.js)
 * ============================================================
 */


// ─────────────────────────────────────────────
//  MODAL DE DETALLE DE ESTUDIANTE
// ─────────────────────────────────────────────

/**
 * Abre el modal con la ficha completa de un estudiante.
 * Muestra: datos personales, métricas, historial de sesiones,
 * puntaje unificado, notas del admin y controles de contacto.
 * 
 * @param {string} name - Nombre completo del estudiante (clave de studentMap).
 */
function openModal(name) {
    const student = studentMap[name];
    if (!student) return;

    const sessions = getFilteredSessions();
    const totalS = sessions.length;
    const rate = Math.round(student.attRate * 100);
    const initials = student.name.split(' ').slice(0, 2).map(w => w[0]).join('');
    const savedNote = notes[name] || '';
    const isContacted = contacted[name];

    // Color y estado según tasa de asistencia
    const statusColor = rate >= 80 ? 'green' : rate >= 50 ? 'yellow' : 'red';
    const statusLabel = rate >= 80 ? `${icon('check', 14)} Excelente`
        : rate >= 50 ? `${icon('alert', 14)} Requiere Atención`
            : `<span class="status-dot red"></span> Riesgo Alto`;

    // ── Historial de sesiones ──
    const sessionsHTML = sessions.map(session => {
        const attendance = student.sessions.find(ss => ss.sessionId === session.id);

        if (attendance) {
            const pct = Math.min(attendance.duration / 130 * 100, 100);
            const color = attendance.duration >= 90 ? 'var(--green)'
                : attendance.duration >= 45 ? 'var(--yellow)' : 'var(--red)';

            return `<div class="session-row">
        <div class="session-row-header">
          <span class="session-row-name">${icon('check', 14)} ${session.name}</span>
          <span class="session-row-date">${icon('calendar', 12)} ${session.date}</span>
        </div>
        <div class="session-row-details">
          <div class="session-row-detail">${icon('clock', 12)} ${attendance.durationStr}</div>
          <div class="session-row-detail">Ingreso: ${attendance.joinTime}</div>
          <div class="session-row-detail">Salida: ${attendance.leaveTime}</div>
        </div>
        <div class="duration-bar"><div class="fill" style="width:${pct}%;background:${color}"></div></div>
      </div>`;
        }

        return `<div class="session-row" style="opacity:.5;border-color:var(--red)">
      <div class="session-row-header">
        <span class="session-row-name">${icon('x-circle', 14)} ${session.name}</span>
        <span class="session-row-date">${session.date}</span>
      </div>
      <p style="font-size:10px;color:var(--red);margin-top:3px">No asistió</p>
    </div>`;
    }).join('');

    // ── Estadísticas de duración ──
    const maxDur = student.sessions.length ? Math.max(...student.sessions.map(ss => ss.duration)) : 0;
    const minDur = student.sessions.length ? Math.min(...student.sessions.map(ss => ss.duration)) : 0;

    // ── Renderizar modal ──
    const escapedName = name.replace(/'/g, "\\'");

    document.getElementById('modalContent').innerHTML = `
    <div class="modal-header">
      <div class="modal-avatar">${initials}</div>
      <div>
        <div class="modal-name">${student.name}</div>
        <div class="modal-sede">
          ${icon('building', 14)} ${student.sede} · <span class="badge ${statusColor}">${statusLabel}</span>
          ${isContacted ? `<span class="badge blue">${icon('phone', 12)} Contactado</span>` : ''}
        </div>
        <div class="modal-email">${icon('info', 12)} ${student.email}</div>
      </div>
    </div>

    <div class="modal-stats">
      <div class="modal-stat"><div class="val">${student.attended}/${totalS}</div><div class="lbl">Sesiones</div></div>
      <div class="modal-stat"><div class="val" style="color:${rate >= 80 ? 'var(--green)' : rate >= 50 ? 'var(--yellow)' : 'var(--red)'}">${rate}%</div><div class="lbl">Asistencia</div></div>
      <div class="modal-stat"><div class="val">${fmtMins(student.avgDuration)}</div><div class="lbl">Prom. Duración</div></div>
      <div class="modal-stat"><div class="val" style="color:${student.engagement >= 60 ? 'var(--green)' : student.engagement >= 30 ? 'var(--yellow)' : 'var(--red)'}">${student.engagement}</div><div class="lbl">Engagement</div></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
      <div class="modal-stat"><div class="val">${fmtMins(maxDur)}</div><div class="lbl">Máx. Duración</div></div>
      <div class="modal-stat"><div class="val">${fmtMins(minDur)}</div><div class="lbl">Mín. Duración</div></div>
    </div>

    <div class="modal-sections">
      <h4 class="modal-section-title">${icon('calendar')} Historial de Sesiones</h4>
      ${sessionsHTML}
    </div>

    <div class="modal-notes">
      <h4>${icon('save')} Notas del Administrador</h4>
      <textarea class="notes-area" id="noteArea" placeholder="Observaciones sobre este estudiante...">${savedNote}</textarea>
    </div>

    <div class="modal-actions">
      <button class="btn-save" onclick="saveNote('${escapedName}')">${icon('save')} Guardar Nota</button>
      <button class="btn-contact" onclick="toggleContactModal('${escapedName}')">${icon('phone')} ${isContacted ? 'Desmarcar' : 'Marcar'} Contactado</button>
      <button class="btn-print" onclick="printStudentFicha('${escapedName}')">${icon('printer')} Imprimir Ficha</button>
    </div>`;

    document.getElementById('studentModal').classList.add('active');
}

/** Cierra el modal de estudiante. */
function closeModal() {
    document.getElementById('studentModal').classList.remove('active');
}

/** Guarda la nota del administrador en localStorage. */
function saveNote(name) {
    notes[name] = document.getElementById('noteArea').value;
    localStorage.setItem('attendanceNotes', JSON.stringify(notes));
    showToast(`${icon('check')} Nota guardada`);
}

/** Alterna el contacto desde dentro del modal y refresca las vistas. */
function toggleContactModal(name) {
    contacted[name] = !contacted[name];
    localStorage.setItem('attendanceContacted', JSON.stringify(contacted));
    openModal(name);
    filterStudents();
    renderAlerts();
    showToast(contacted[name] ? `${icon('check')} Contactado` : `${icon('phone')} Desmarcado`);
}

/** Imprime la ficha del estudiante usando la ventana del navegador. */
function printStudentFicha(name) {
    window.print();
}


// ─────────────────────────────────────────────
//  SISTEMA DE AYUDA
// ─────────────────────────────────────────────

/**
 * Contenido de ayuda por pestaña.
 * Cada clave corresponde al ID de una pestaña.
 */
const HELP_TOPICS = {
    resumen: {
        title: 'Pestaña de Resumen',
        content: `
      <h3>${icon('dashboard')} Panel de Resumen</h3>
      <p>Esta pestaña muestra una vista general de todos los datos de asistencia:</p>
      <ul>
        <li><strong>Tarjetas KPI:</strong> Métricas principales (estudiantes, asistencia, duración, riesgo, engagement)</li>
        <li><strong>Distribución de Duración:</strong> Gráfica de cómo se distribuyen los tiempos de conexión</li>
        <li><strong>Asistencia por Sede:</strong> Distribución entre SG e IETAC</li>
        <li><strong>Comparativa:</strong> Si hay 2+ sesiones, compara asistentes, duración y evolución</li>
        <li><strong>Puntualidad:</strong> Clasificación de los horarios de ingreso</li>
      </ul>
      <h4>${icon('info')} Filtro por Sede</h4>
      <p>Usa el selector de instituciones en la barra superior para filtrar datos por sede (SG o IETAC).</p>`
    },
    estadisticas: {
        title: 'Estadísticas Avanzadas',
        content: `
      <h3>${icon('trending-up')} Estadísticas Avanzadas</h3>
      <ul>
        <li><strong>Mediana y Desviación:</strong> Métricas robustas de duración</li>
        <li><strong>Retención:</strong> Porcentaje que permanece &gt; 1 hora por sesión</li>
        <li><strong>Engagement:</strong> Distribución del score de compromiso</li>
        <li><strong>Horarios:</strong> En qué franjas horarias ingresan los estudiantes</li>
        <li><strong>Deserción:</strong> Cuántos se desconectan antes de 1 hora</li>
        <li><strong>Heatmap:</strong> Matriz visual estudiante × sesión con códigos de color</li>
      </ul>`
    },
    sesiones: {
        title: 'Detalle por Sesión',
        content: `
      <h3>${icon('calendar')} Detalle por Sesión</h3>
      <p>Selecciona una sesión para ver su detalle individual:</p>
      <ul>
        <li>Total de asistentes y métricas de duración</li>
        <li>Tabla completa con nombre, duración, ingreso y salida</li>
        <li>Click en cualquier estudiante para ver su ficha completa</li>
      </ul>`
    },
    estudiantes: {
        title: 'Tabla de Estudiantes',
        content: `
      <h3>${icon('users')} Estudiantes</h3>
      <ul>
        <li><strong>Búsqueda:</strong> Filtra por nombre o correo</li>
        <li><strong>Filtros:</strong> Por sede y por estado (excelente/atención/riesgo)</li>
        <li><strong>Ordenamiento:</strong> Click en encabezados de columna</li>
        <li><strong>Estado:</strong> <span class="status-dot green"></span> ≥80% · <span class="status-dot yellow"></span> 50-79% · <span class="status-dot red"></span> &lt;50%</li>
        <li><strong>Contacto:</strong> Marca estudiantes como contactados para seguimiento</li>
      </ul>`
    },
    ranking: {
        title: 'Ranking Unificado',
        content: `
      <h3>${icon('trophy')} Sistema de Ranking</h3>
      <p>El ranking usa un <strong>Puntaje Unificado</strong> (0-100) para evitar confusiones:</p>
      <ul>
        <li><strong>40% Asistencia:</strong> Proporción de sesiones atendidas</li>
        <li><strong>35% Duración:</strong> Tiempo promedio normalizado a 2 horas</li>
        <li><strong>25% Puntualidad:</strong> Qué tan temprano ingresa vs. el inicio</li>
      </ul>
      <p>Puedes ver el ranking global o filtrado por sesión individual.</p>
      <p>En el ranking por clase, el puntaje es: <strong>50% Duración + 50% Puntualidad.</strong></p>`
    },
    alertas: {
        title: 'Sistema de Alertas',
        content: `
      <h3>${icon('alert')} Alertas</h3>
      <p>Clasificación automática de estudiantes:</p>
      <ul>
        <li><strong><span class="status-dot red"></span> Riesgo Alto:</strong> Asistencia &lt; 50%</li>
        <li><strong><span class="status-dot yellow"></span> Atención:</strong> Duración promedio &lt; 45 min</li>
        <li><strong><span class="status-dot green"></span> Excelente:</strong> 100% asistencia y &gt; 90 min promedio</li>
      </ul>`
    }
};

/**
 * Abre el modal de ayuda para una pestaña específica.
 * @param {string} topic - Clave de HELP_TOPICS.
 */
function showHelp(topic) {
    const data = HELP_TOPICS[topic];
    if (!data) return;

    document.getElementById('helpContent').innerHTML = data.content;
    document.getElementById('helpModal').classList.add('active');
}

/** Cierra el modal de ayuda. */
function closeHelp() {
    document.getElementById('helpModal').classList.remove('active');
}

/**
 * Abre la guía de inicio rápido.
 * Muestra los pasos para usar el panel por primera vez.
 */
function openGuide() {
    document.getElementById('helpContent').innerHTML = `
    <h3>${icon('book-open')} Guía de Inicio Rápido</h3>
    <ol>
      <li><strong>Cargar datos:</strong> Haz clic en "Cargar CSV" y selecciona los archivos exportados de la plataforma</li>
      <li><strong>Explorar resumen:</strong> El panel se actualiza automáticamente con las métricas principales</li>
      <li><strong>Filtrar por sede:</strong> Usa los botones SG/IETAC en la barra superior</li>
      <li><strong>Ver estudiantes:</strong> La tabla permite buscar, filtrar y ordenar</li>
      <li><strong>Seguimiento:</strong> Marca estudiantes como contactados y agrega notas</li>
      <li><strong>Exportar:</strong> Genera reportes CSV o Excel para compartir</li>
    </ol>
    <h4>${icon('info')} Formato del CSV</h4>
    <p>Los archivos deben llamarse: <code>Asistencia de [Sesión] (YYYY_MM_DD ...).csv</code></p>
    <p>Columnas esperadas: Nombre, Código, Correo, Duración, Hora Ingreso, Hora Salida</p>`;
    document.getElementById('helpModal').classList.add('active');
}


// ─────────────────────────────────────────────
//  TOAST NOTIFICATIONS
// ─────────────────────────────────────────────

/**
 * Muestra una notificación temporal tipo toast.
 * Se auto-destruye después de 3 segundos.
 * 
 * @param {string} message - Mensaje HTML a mostrar (puede incluir íconos).
 * @param {number} [duration=3000] - Duración en milisegundos.
 */
function showToast(message, duration) {
    const ms = duration || 3000;

    // Remover toast anterior si existe
    const existing = document.getElementById('toast');
    if (existing) existing.remove();

    // Crear y mostrar
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.innerHTML = message;
    document.body.appendChild(toast);

    // Forzar reflow para la animación
    toast.offsetHeight;
    toast.classList.add('show');

    // Auto-destruir
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, ms);
}
