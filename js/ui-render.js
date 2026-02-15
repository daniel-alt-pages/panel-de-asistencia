/**
 * ============================================================
 *  UI-RENDER.JS — Renderizado de la Interfaz de Usuario
 * ============================================================
 * 
 * Módulo encargado de todo el renderizado visual del panel.
 * Cada función render*() genera el HTML de una sección completa.
 * 
 * SECCIONES:
 *  1. Skeleton Loading  — Placeholders animados durante la carga
 *  2. Tabs              — Navegación entre pestañas
 *  3. Resumen           — Tarjetas KPI + gráficas de distribución
 *  4. Estadísticas      — Métricas avanzadas + heatmap
 *  5. Sesiones          — Detalle individual por clase
 *  6. Estudiantes       — Tabla con filtros y ordenamiento
 *  7. Ranking           — Sistema de puntos unificado
 *  8. Alertas           — Clasificación por nivel de riesgo
 * 
 * SISTEMA DE RANKING UNIFICADO:
 *  El ranking usa un "Puntaje Unificado" (0-100) calculado así:
 *    - 40% Asistencia (sesiones asistidas / total)
 *    - 35% Duración (promedio normalizado a 2h)
 *    - 25% Puntualidad (inverso del retraso promedio)
 *  Esto evita malentendidos al tener una sola métrica clara.
 * 
 * DEPENDENCIAS: icons.js, utils.js, data-manager.js
 * CARGADO POR: index.html (después de data-manager.js)
 * ============================================================
 */


// ─────────────────────────────────────────────
//  SKELETON LOADING (Carga con Placeholders)
// ─────────────────────────────────────────────

/**
 * Muestra placeholders animados mientras se cargan los datos.
 * Mejora la percepción de velocidad del usuario.
 * 
 * @param {string} containerId - ID del elemento contenedor.
 * @param {'cards'|'chart'|'table'} type - Tipo de skeleton a mostrar.
 */
function showSkeleton(containerId, type) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const shimmer = (width, height) =>
    `<div class="skeleton" style="width:${width};height:${height}px;border-radius:8px"></div>`;

  const generators = {
    cards: () => `<div class="cards-grid">${Array(6).fill(0).map(() =>
      `<div class="skeleton-card">${shimmer('50%', 16)}${shimmer('60%', 28)}${shimmer('80%', 12)}</div>`
    ).join('')
      }</div>`,

    chart: () => Array(5).fill(0).map((_, i) =>
      `<div class="skeleton-bar-row">${shimmer('80px', 16)}${shimmer(`${40 + i * 10}%`, 22)}</div>`
    ).join(''),

    table: () => Array(8).fill(0).map(() =>
      `<div class="skeleton-row">${shimmer('25%', 14)}${shimmer('15%', 14)}${shimmer('10%', 14)}${shimmer('20%', 14)}</div>`
    ).join('')
  };

  container.innerHTML = generators[type] ? generators[type]() : '';
}


// ─────────────────────────────────────────────
//  NAVEGACIÓN POR PESTAÑAS
// ─────────────────────────────────────────────

/**
 * Cambia la pestaña activa del panel.
 * Desactiva todas las pestañas/contenidos y activa la seleccionada.
 * 
 * @param {string} tabId - Identificador de la pestaña ('resumen', 'estadisticas', etc.)
 */
function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  const tabButton = document.querySelector(`[data-tab="${tabId}"]`);
  const tabContent = document.getElementById(`tab-${tabId}`);

  if (tabButton) tabButton.classList.add('active');
  if (tabContent) tabContent.classList.add('active');
}


// ─────────────────────────────────────────────
//  RESUMEN GENERAL (Tab principal)
// ─────────────────────────────────────────────

/**
 * Renderiza la pestaña de Resumen: tarjetas KPI, distribución
 * de duración, sedes, comparativa y puntualidad.
 */
function renderSummary() {
  showSkeleton('summaryCards', 'cards');

  setTimeout(() => {
    const students = Object.values(studentMap);
    const total = students.length;
    const sessions = getFilteredSessions();
    const totalSessions = sessions.length;

    // ── Métricas globales ──
    const allDurations = [];
    students.forEach(s => s.sessions.forEach(sess => allDurations.push(sess.duration)));

    const avgDuration = total > 0
      ? students.reduce((sum, s) => sum + s.avgDuration, 0) / total : 0;
    const medDuration = median(allDurations);
    const fullAttendance = students.filter(s => s.attended === totalSessions).length;
    const atRisk = students.filter(s => s.attRate < 0.5).length;
    const avgRate = total > 0
      ? students.reduce((sum, s) => sum + s.attRate, 0) / total * 100 : 0;
    const avgEngagement = total > 0
      ? students.reduce((sum, s) => sum + s.engagement, 0) / total : 0;

    // Actualizar contadores del header
    document.getElementById('totalStudents').textContent = total;
    document.getElementById('totalSessions').textContent = totalSessions;
    document.getElementById('lastUpdate').textContent = new Date().toLocaleDateString('es-CO');

    // ── Tarjetas KPI ──
    document.getElementById('summaryCards').innerHTML = `
      <div class="metric-card purple"><div class="metric-icon">${icon('users')}</div>
        <div class="metric-value">${total}</div>
        <div class="metric-label">Estudiantes Únicos</div>
        <div class="metric-sub">En ${totalSessions} sesiones registradas</div></div>
      <div class="metric-card green"><div class="metric-icon">${icon('check')}</div>
        <div class="metric-value">${fullAttendance}</div>
        <div class="metric-label">Asistencia Completa</div>
        <div class="metric-sub">${total > 0 ? Math.round(fullAttendance / total * 100) : 0}% del total</div></div>
      <div class="metric-card yellow"><div class="metric-icon">${icon('clock')}</div>
        <div class="metric-value">${fmtMins(avgDuration)}</div>
        <div class="metric-label">Duración Promedio</div>
        <div class="metric-sub">Mediana: ${fmtMins(medDuration)}</div></div>
      <div class="metric-card red"><div class="metric-icon">${icon('alert')}</div>
        <div class="metric-value">${atRisk}</div>
        <div class="metric-label">En Riesgo</div>
        <div class="metric-sub">Asistencia &lt; 50%</div></div>
      <div class="metric-card blue"><div class="metric-icon">${icon('bar-chart')}</div>
        <div class="metric-value">${Math.round(avgRate)}%</div>
        <div class="metric-label">Tasa Promedio</div>
        <div class="metric-sub">De asistencia general</div></div>
      <div class="metric-card pink"><div class="metric-icon">${icon('target')}</div>
        <div class="metric-value">${avgEngagement.toFixed(1)}</div>
        <div class="metric-label">Engagement Prom.</div>
        <div class="metric-sub">Escala 0 - 100</div></div>`;

    // ── Gráfica: Distribución de Duración ──
    renderBarChart('durationChart', allDurations, [
      { label: '< 15 min', min: 0, max: 15, color: 'red' },
      { label: '15-30 min', min: 15, max: 30, color: 'yellow' },
      { label: '30-60 min', min: 30, max: 60, color: 'yellow' },
      { label: '1-1.5 h', min: 60, max: 90, color: 'blue' },
      { label: '1.5-2 h', min: 90, max: 120, color: 'green' },
      { label: '> 2 h', min: 120, max: 9999, color: 'purple' }
    ]);

    // ── Gráfica: Asistencia por Sede ──
    renderSedeChart(students, total);

    // ── Gráfica: Comparativa entre Sesiones ──
    renderComparisonChart(sessions);

    // ── Gráfica: Puntualidad ──
    renderPunctualityChart(sessions);
  }, 120);
}

/**
 * Renderiza una gráfica de barras horizontales por rangos.
 * Reutilizable para cualquier distribución por rangos numéricos.
 * 
 * @param {string} containerId - ID del contenedor HTML.
 * @param {number[]} values - Array de valores numéricos a distribuir.
 * @param {Array<{label:string, min:number, max:number, color:string}>} ranges - Rangos.
 */
function renderBarChart(containerId, values, ranges) {
  const maxCount = Math.max(...ranges.map(r =>
    values.filter(v => v >= r.min && v < r.max).length
  ), 1);

  document.getElementById(containerId).innerHTML = ranges.map(range => {
    const count = values.filter(v => v >= range.min && v < range.max).length;
    const width = Math.max(count / maxCount * 100, 3);
    return `<div class="bar-row">
      <div class="bar-label">${range.label}</div>
      <div class="bar-track"><div class="bar-fill ${range.color}" style="width:${width}%">${count}</div></div>
    </div>`;
  }).join('');
}

/** Renderiza la gráfica de distribución por sede. */
function renderSedeChart(students, total) {
  const sedeCounts = {};
  students.forEach(s => { sedeCounts[s.sede] = (sedeCounts[s.sede] || 0) + 1; });

  const maxCount = Math.max(...Object.values(sedeCounts), 1);
  const sedeColors = { SG: 'purple', IETAC: 'blue', OTRO: 'yellow' };

  document.getElementById('sedeChart').innerHTML = Object.entries(sedeCounts).map(([sede, count]) =>
    `<div class="bar-row">
      <div class="bar-label">${sede} (${count})</div>
      <div class="bar-track"><div class="bar-fill ${sedeColors[sede] || 'green'}" style="width:${count / maxCount * 100}%">${Math.round(count / total * 100)}%</div></div>
    </div>`
  ).join('');
}

/** Renderiza la comparativa entre sesiones. */
function renderComparisonChart(sessions) {
  const container = document.getElementById('compChart');

  if (sessions.length < 2) {
    container.innerHTML = '<div class="empty-state">Se necesitan 2+ sesiones para comparar</div>';
    return;
  }

  const sessionStats = sessions.map(s => {
    const durations = s.students.map(st => parseDuration(st[3])).filter(d => d >= 1);
    return {
      name: s.name.substring(0, 20),
      count: durations.length,
      avg: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      med: median(durations)
    };
  });

  const renderValues = (stats, valueFn) => stats.map(s =>
    `<div class="comp-val"><div class="num">${valueFn(s)}</div><div class="lbl">${s.name}</div></div>`
  ).join('');

  container.innerHTML = `
    <div class="comp-card"><h4>${icon('users')} Asistentes</h4>
      <div class="comp-values">${renderValues(sessionStats, s => s.count)}</div></div>
    <div class="comp-card"><h4>${icon('clock')} Duración Promedio</h4>
      <div class="comp-values">${renderValues(sessionStats, s => fmtMins(s.avg))}</div></div>
    <div class="comp-card"><h4>${icon('bar-chart')} Mediana</h4>
      <div class="comp-values">${renderValues(sessionStats, s => fmtMins(s.med))}</div></div>
    <div class="comp-card"><h4>${icon('trending-up')} Diferencia</h4>
      <div class="comp-values">
        <div class="comp-val"><div class="num">${(sessionStats[1].count - sessionStats[0].count > 0 ? '+' : '') + (sessionStats[1].count - sessionStats[0].count)}</div><div class="lbl">Asistentes</div></div>
        <div class="comp-val"><div class="num">${(sessionStats[1].avg - sessionStats[0].avg > 0 ? '+' : '') + fmtMins(sessionStats[1].avg - sessionStats[0].avg)}</div><div class="lbl">Duración</div></div>
      </div></div>`;
}

/** Renderiza la gráfica de puntualidad. */
function renderPunctualityChart(sessions) {
  const punctuality = { early: 0, ontime: 0, late: 0, veryLate: 0 };

  sessions.forEach(session => {
    const joinTimes = session.students.map(s => parseTime12(s[4])).filter(t => t > 0);
    if (!joinTimes.length) return;

    const earliest = Math.min(...joinTimes);
    session.students.forEach(s => {
      const joinMin = parseTime12(s[4]);
      if (joinMin <= 0) return;

      const delay = joinMin - earliest;
      if (delay <= 5) punctuality.early++;
      else if (delay <= 15) punctuality.ontime++;
      else if (delay <= 30) punctuality.late++;
      else punctuality.veryLate++;
    });
  });

  const categories = [
    { label: 'Temprano (≤5m)', value: punctuality.early, color: 'green' },
    { label: 'A tiempo (5-15m)', value: punctuality.ontime, color: 'blue' },
    { label: 'Tarde (15-30m)', value: punctuality.late, color: 'yellow' },
    { label: 'Muy tarde (>30m)', value: punctuality.veryLate, color: 'red' }
  ];
  const maxVal = Math.max(...categories.map(c => c.value), 1);

  document.getElementById('punctualityChart').innerHTML = categories.map(cat =>
    `<div class="bar-row"><div class="bar-label">${cat.label}</div>
      <div class="bar-track"><div class="bar-fill ${cat.color}" style="width:${Math.max(cat.value / maxVal * 100, 3)}%">${cat.value}</div></div></div>`
  ).join('');
}


// ─────────────────────────────────────────────
//  ESTADÍSTICAS AVANZADAS
// ─────────────────────────────────────────────

/** Renderiza la pestaña de Estadísticas: métricas avanzadas,
 *  retención, engagement, horarios, deserción y heatmap. */
function renderAdvanced() {
  showSkeleton('advancedCards', 'cards');

  setTimeout(() => {
    const students = Object.values(studentMap);
    const sessions = getFilteredSessions();
    const allDurations = [];
    students.forEach(s => s.sessions.forEach(sess => allDurations.push(sess.duration)));

    const over1h = allDurations.filter(d => d >= 60).length;
    const under30 = allDurations.filter(d => d < 30).length;
    const contactedCount = Object.keys(contacted).filter(k => contacted[k]).length;
    const withNotes = Object.keys(notes).filter(k => notes[k] && notes[k].trim()).length;

    // Contar estudiantes por sede
    const sedeStats = {};
    students.forEach(s => {
      if (!sedeStats[s.sede]) sedeStats[s.sede] = 0;
      sedeStats[s.sede]++;
    });

    // ── Tarjetas de métricas avanzadas ──
    document.getElementById('advancedCards').innerHTML = `
      <div class="metric-card blue"><div class="metric-icon">${icon('bar-chart')}</div>
        <div class="metric-value">${fmtMins(median(allDurations))}</div>
        <div class="metric-label">Mediana Duración</div>
        <div class="metric-sub">σ = ${fmtMins(stdDev(allDurations))}</div></div>
      <div class="metric-card green"><div class="metric-icon">${icon('clock')}</div>
        <div class="metric-value">${over1h}</div>
        <div class="metric-label">&gt; 1 Hora</div>
        <div class="metric-sub">${allDurations.length ? Math.round(over1h / allDurations.length * 100) : 0}% de registros</div></div>
      <div class="metric-card red"><div class="metric-icon">${icon('alert')}</div>
        <div class="metric-value">${under30}</div>
        <div class="metric-label">&lt; 30 min</div>
        <div class="metric-sub">${allDurations.length ? Math.round(under30 / allDurations.length * 100) : 0}% de registros</div></div>
      <div class="metric-card yellow"><div class="metric-icon">${icon('phone')}</div>
        <div class="metric-value">${contactedCount}</div>
        <div class="metric-label">Contactados</div>
        <div class="metric-sub">De ${students.length} estudiantes</div></div>
      <div class="metric-card purple"><div class="metric-icon">${icon('save')}</div>
        <div class="metric-value">${withNotes}</div>
        <div class="metric-label">Con Notas</div>
        <div class="metric-sub">Seguimiento registrado</div></div>
      <div class="metric-card pink"><div class="metric-icon">${icon('building')}</div>
        <div class="metric-value">${Object.keys(sedeStats).length}</div>
        <div class="metric-label">Sedes Activas</div>
        <div class="metric-sub">${Object.entries(sedeStats).map(([k, v]) => `${k}: ${v}`).join(' · ')}</div></div>`;

    // ── Retención por sesión ──
    const retentionData = sessions.map(session => {
      const durations = session.students.map(s => parseDuration(s[3]));
      const totalValid = durations.filter(d => d >= 1).length;
      const retained = durations.filter(d => d >= 60).length;
      return {
        name: session.name.substring(0, 20),
        pct: totalValid ? Math.round(retained / totalValid * 100) : 0,
        detail: `${retained}/${totalValid}`
      };
    });

    document.getElementById('retentionChart').innerHTML = retentionData.map(r =>
      `<div class="bar-row"><div class="bar-label">${r.name}</div>
        <div class="bar-track"><div class="bar-fill ${r.pct >= 70 ? 'green' : r.pct >= 50 ? 'yellow' : 'red'}" style="width:${Math.max(r.pct, 5)}%">${r.pct}% (${r.detail})</div></div></div>`
    ).join('');

    // ── Engagement por rangos ──
    renderBarChart('engagementChart',
      students.map(s => s.engagement),
      [
        { label: '0-20 (Crítico)', min: 0, max: 20, color: 'red' },
        { label: '20-40 (Bajo)', min: 20, max: 40, color: 'yellow' },
        { label: '40-60 (Medio)', min: 40, max: 60, color: 'blue' },
        { label: '60-80 (Alto)', min: 60, max: 80, color: 'green' },
        { label: '80-100 (Excelente)', min: 80, max: 101, color: 'purple' }
      ]
    );

    // ── Mapa de horarios de ingreso ──
    renderJoinTimeMap(sessions);

    // ── Deserción ──
    renderDesertionChart(sessions);

    // ── Heatmap ──
    renderHeatmap(students, sessions);
  }, 120);
}

/** Renderiza el mapa de horarios de ingreso. */
function renderJoinTimeMap(sessions) {
  const slots = {};
  sessions.forEach(session => {
    session.students.forEach(s => {
      const match = (s[4] || '').match(/(\d+):(\d+)\s*(a|p)/i);
      if (!match) return;
      let hour = parseInt(match[1], 10);
      if (match[3].toLowerCase() === 'p' && hour !== 12) hour += 12;
      if (match[3].toLowerCase() === 'a' && hour === 12) hour = 0;
      const slot = `${hour}:00-${hour}:59`;
      slots[slot] = (slots[slot] || 0) + 1;
    });
  });

  const maxVal = Math.max(...Object.values(slots), 1);
  document.getElementById('joinTimeMap').innerHTML = Object.entries(slots).sort().map(([slot, count]) =>
    `<div class="bar-row"><div class="bar-label">${slot}</div>
      <div class="bar-track"><div class="bar-fill blue" style="width:${count / maxVal * 100}%">${count}</div></div></div>`
  ).join('');
}

/** Renderiza la gráfica de deserción (salieron antes de 1 hora). */
function renderDesertionChart(sessions) {
  const data = sessions.map(session => {
    const valid = session.students.filter(s => parseDuration(s[3]) >= 1);
    const deserted = valid.filter(s => parseDuration(s[3]) < 60).length;
    return {
      name: session.name.substring(0, 20),
      pct: valid.length ? Math.round(deserted / valid.length * 100) : 0,
      count: deserted
    };
  });

  document.getElementById('desertionChart').innerHTML = data.map(r =>
    `<div class="bar-row"><div class="bar-label">${r.name}</div>
      <div class="bar-track"><div class="bar-fill ${r.pct > 30 ? 'red' : r.pct > 15 ? 'yellow' : 'green'}" style="width:${Math.max(r.pct, 5)}%">${r.pct}% (${r.count})</div></div></div>`
  ).join('');
}

/** Renderiza el heatmap de asistencia (matriz estudiante × sesión). */
function renderHeatmap(students, sessions) {
  const sorted = [...students].sort((a, b) => a.name.localeCompare(b.name));

  const headerCols = sessions.map(s =>
    `<th>${s.name.substring(0, 18)}<br><span style="font-weight:400">${s.date}</span></th>`
  ).join('');

  const rows = sorted.map(student => {
    const cells = sessions.map(session => {
      const att = student.sessions.find(ss => ss.sessionId === session.id);
      if (!att) return '<td class="h-red">✗</td>';
      if (att.duration >= 90) return `<td class="h-green">${fmtMins(att.duration)}</td>`;
      if (att.duration >= 45) return `<td class="h-yellow">${fmtMins(att.duration)}</td>`;
      return `<td class="h-red">${fmtMins(att.duration)}</td>`;
    }).join('');

    return `<tr><td class="stu-name" onclick="openModal('${student.name.replace(/'/g, "\\'")}')">${student.name}</td>${cells}</tr>`;
  }).join('');

  document.getElementById('heatmapContainer').innerHTML =
    `<table class="heatmap-table"><thead><tr>
      <th style="position:sticky;left:0;z-index:2;background:var(--surface2)">Estudiante</th>${headerCols}
    </tr></thead><tbody>${rows}</tbody></table>`;
}


// ─────────────────────────────────────────────
//  SESIONES (Detalle por clase)
// ─────────────────────────────────────────────

/** Sesión actualmente seleccionada en la pestaña de Sesiones. */
let activeSession = 0;

/** Renderiza el selector de sesiones y el detalle. */
function renderSessions() {
  const sessions = getFilteredSessions();

  document.getElementById('sessionSelector').innerHTML = sessions.map((session, idx) => {
    const durations = session.students.map(s => parseDuration(s[3])).filter(d => d >= 1);
    const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const isActive = idx === activeSession ? 'active' : '';

    return `<button class="session-btn ${isActive}" onclick="selectSession(${idx})">
      <h4>${session.name}</h4>
      <p>${icon('calendar', 14)} ${session.date} · ${icon('users', 14)} ${durations.length} · ${icon('clock', 14)} ${fmtMins(avg)} prom</p>
    </button>`;
  }).join('');

  renderSessionDetail();
}

/** Selecciona una sesión y actualiza la UI. */
function selectSession(idx) {
  activeSession = idx;
  document.querySelectorAll('.session-btn').forEach((btn, i) =>
    btn.classList.toggle('active', i === idx)
  );
  renderSessionDetail();
}

/** Renderiza el detalle de la sesión seleccionada. */
function renderSessionDetail() {
  const sessions = getFilteredSessions();
  const session = sessions[activeSession];
  if (!session) return;

  const validStudents = session.students.filter(st => !EXCLUDED_ACCOUNTS.has(getKey(st)));
  const durations = validStudents.map(st => parseDuration(st[3]));
  const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const med = median(durations);
  const over1h = durations.filter(d => d >= 60).length;

  // Tabla de estudiantes de la sesión
  const rows = validStudents.map(st => {
    const dur = parseDuration(st[3]);
    const pct = Math.min(dur / 130 * 100, 100);
    const barColor = dur >= 90 ? 'var(--green)' : dur >= 45 ? 'var(--yellow)' : 'var(--red)';
    const name = getKey(st);

    return `<tr onclick="openModal('${name.replace(/'/g, "\\'")}')" style="cursor:pointer">
      <td><strong>${name}</strong></td><td style="font-size:10px">${st[2]}</td>
      <td>${st[3]}</td><td>${st[4]}</td><td>${st[5]}</td>
      <td><div class="progress-mini"><div class="fill" style="width:${pct}%;background:${barColor}"></div></div> ${Math.round(pct)}%</td></tr>`;
  }).join('');

  document.getElementById('sessionDetail').innerHTML = `
    <div class="cards-grid" style="margin-bottom:14px">
      <div class="metric-card purple"><div class="metric-icon">${icon('users')}</div>
        <div class="metric-value">${validStudents.length}</div><div class="metric-label">Asistentes</div></div>
      <div class="metric-card green"><div class="metric-icon">${icon('clock')}</div>
        <div class="metric-value">${fmtMins(avg)}</div><div class="metric-label">Promedio</div></div>
      <div class="metric-card blue"><div class="metric-icon">${icon('bar-chart')}</div>
        <div class="metric-value">${fmtMins(med)}</div><div class="metric-label">Mediana</div></div>
      <div class="metric-card yellow"><div class="metric-icon">${icon('check')}</div>
        <div class="metric-value">${over1h}</div><div class="metric-label">&gt; 1 hora</div>
        <div class="metric-sub">${Math.round(over1h / Math.max(validStudents.length, 1) * 100)}%</div></div>
    </div>
    <div class="chart-card">
      <h3>${icon('spreadsheet')} Detalle de Asistencia</h3>
      <p class="chart-desc">${session.name} — ${session.date} · Horario: ${session.time || 'N/A'}</p>
      <div class="table-wrapper"><table><thead><tr>
        <th>Estudiante</th><th>Correo</th><th>Duración</th><th>Ingreso</th><th>Salida</th><th>Permanencia</th>
      </tr></thead><tbody>${rows}</tbody></table></div>
    </div>`;
}


// ─────────────────────────────────────────────
//  TABLA DE ESTUDIANTES
// ─────────────────────────────────────────────

/** Columna de ordenamiento actual (-1 = sin ordenar). */
let sortCol = -1;
/** Dirección de ordenamiento (true = ascendente). */
let sortAsc = true;

/** Renderiza los filtros de sede y la tabla de estudiantes. */
function renderStudents() {
  const sedes = [...new Set(Object.values(studentMap).map(s => s.sede))];
  document.getElementById('filterSede').innerHTML =
    '<option value="">Todas las sedes</option>' +
    sedes.map(s => `<option value="${s}">${s}</option>`).join('');
  filterStudents();
}

/**
 * Filtra y ordena la tabla de estudiantes según los controles.
 * Se ejecuta al escribir en la búsqueda, cambiar filtros o hacer clic en headers.
 */
function filterStudents() {
  const query = (document.getElementById('searchInput').value || '').toUpperCase();
  const sede = document.getElementById('filterSede').value;
  const status = document.getElementById('filterStatus').value;
  const totalS = getFilteredSessions().length;

  // ── Filtrado ──
  let list = Object.values(studentMap).filter(s => {
    if (query && !s.name.includes(query) && !s.email.toUpperCase().includes(query)) return false;
    if (sede && s.sede !== sede) return false;
    if (status === 'excellent' && s.attRate < 0.8) return false;
    if (status === 'warning' && (s.attRate < 0.5 || s.attRate >= 0.8)) return false;
    if (status === 'risk' && s.attRate >= 0.5) return false;
    return true;
  });

  // ── Ordenamiento ──
  if (sortCol >= 0) {
    const getVal = [
      s => s.name, s => s.sede, s => s.attended,
      s => s.avgDuration, s => s.attRate, s => s.engagement
    ];
    list.sort((a, b) => {
      const va = getVal[sortCol](a);
      const vb = getVal[sortCol](b);
      if (typeof va === 'string') return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortAsc ? va - vb : vb - va;
    });
  }

  // ── Renderizado ──
  document.getElementById('studentBody').innerHTML = list.map(s => {
    const pct = Math.round(s.attRate * 100);
    const badge = pct >= 80 ? 'green' : pct >= 50 ? 'yellow' : 'red';
    const label = pct >= 80 ? `<span class="status-dot green"></span> Excelente`
      : pct >= 50 ? `<span class="status-dot yellow"></span> Atención`
        : `<span class="status-dot red"></span> Riesgo`;
    const barColor = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : 'var(--red)';
    const isContacted = contacted[s.name];

    return `<tr>
      <td><strong>${s.name}</strong><br><span style="font-size:9px;color:var(--text2)">${s.email}</span></td>
      <td>${s.sede}</td><td>${s.attended}/${totalS}</td><td>${fmtMins(s.avgDuration)}</td>
      <td>${pct}%<div class="progress-mini"><div class="fill" style="width:${pct}%;background:${barColor}"></div></div></td>
      <td><span style="font-weight:700;color:${s.engagement >= 60 ? 'var(--green)' : s.engagement >= 30 ? 'var(--yellow)' : 'var(--red)'}">${s.engagement}</span></td>
      <td><span class="badge ${badge}">${label}</span></td>
      <td>
        <button class="detail-btn" onclick="openModal('${s.name.replace(/'/g, "\\'")}')">${icon('search')}</button>
        <button class="tag-btn ${isContacted ? 'contacted' : ''}" onclick="toggleContact('${s.name.replace(/'/g, "\\'")}')" title="Marcar contactado">${isContacted ? icon('check') : icon('phone')}</button>
      </td></tr>`;
  }).join('');
}

/** Cambia la columna de ordenamiento o invierte la dirección. */
function sortTable(col) {
  if (sortCol === col) sortAsc = !sortAsc;
  else { sortCol = col; sortAsc = true; }
  filterStudents();
}

/** Alterna el estado de contacto de un estudiante. */
function toggleContact(name) {
  contacted[name] = !contacted[name];
  localStorage.setItem('attendanceContacted', JSON.stringify(contacted));
  filterStudents();
  showToast(contacted[name] ? `${icon('check')} Contactado` : `${icon('phone')} Desmarcado`);
}


// ─────────────────────────────────────────────
//  RANKING — SISTEMA DE PUNTAJE UNIFICADO
// ─────────────────────────────────────────────
// 
//  PUNTAJE UNIFICADO (0-100):
//    40% · Asistencia  = (sesiones asistidas / total) × 100
//    35% · Duración    = min(duración promedio / 120, 1) × 100
//    25% · Puntualidad = max(0, 100 - retraso promedio × 2)
// 
//  Este score único evita confusiones al tener rankings separados.
//  Se muestra como "Puntaje" en todas las vistas.
// ─────────────────────────────────────────────

/** Sesión seleccionada en el ranking (-1 = global). */
let activeRankSession = -1;

/**
 * Calcula el puntaje unificado para un estudiante en una sesión específica.
 * 
 * @param {Object} studentData - Datos del estudiante del CSV procesado.
 * @param {number} sessionStart - Minutos desde medianoche del inicio de sesión.
 * @param {number} totalSessions - Total de sesiones (para tasa de asistencia).
 * @returns {number} Puntaje de 0 a 100.
 */
function calculateUnifiedScore(studentData, sessionStart, totalSessions) {
  // Componente de asistencia (40%)
  const attendanceScore = totalSessions > 0
    ? (studentData.attended / totalSessions) * 100 : 0;

  // Componente de duración (35%)
  const durationScore = Math.min(studentData.avgDuration / 120, 1) * 100;

  // Componente de puntualidad (25%)
  let punctualityScore = 100;
  if (studentData.sessions.length > 0 && sessionStart > 0) {
    const avgDelay = studentData.sessions.reduce((sum, sess) => {
      const delay = Math.max(0, sess.joinMin - sessionStart);
      return sum + delay;
    }, 0) / studentData.sessions.length;
    punctualityScore = Math.max(0, 100 - avgDelay * 2);
  }

  return Math.round(
    (attendanceScore * 0.40 + durationScore * 0.35 + punctualityScore * 0.25) * 10
  ) / 10;
}

/** Renderiza la pestaña de Ranking. */
function renderRanking() {
  const sessions = getFilteredSessions();

  // Selector de sesión para ranking
  const buttons = [
    `<button class="ranking-class-btn ${activeRankSession === -1 ? 'active' : ''}" onclick="selectRankSession(-1)">
      ${icon('bar-chart')} Todas las Clases
      <span class="btn-sub">Vista global · ${sessions.length} sesiones</span></button>`
  ];

  sessions.forEach((session, idx) => {
    const count = session.students.filter(s => parseDuration(s[3]) >= 1).length;
    buttons.push(`<button class="ranking-class-btn ${activeRankSession === idx ? 'active' : ''}" onclick="selectRankSession(${idx})">
      ${icon('calendar')} ${session.name}
      <span class="btn-sub">${session.date} · ${count} asistentes</span></button>`);
  });

  document.getElementById('rankingClassSelector').innerHTML = buttons.join('');
  renderRankingContent();
}

/** Selecciona la sesión del ranking. */
function selectRankSession(idx) {
  activeRankSession = idx;
  document.querySelectorAll('.ranking-class-btn').forEach((btn, i) =>
    btn.classList.toggle('active', i === (idx + 1))
  );
  renderRankingContent();
}

/** Renderiza el contenido del ranking (global o por clase). */
function renderRankingContent() {
  const sessions = getFilteredSessions();
  const totalSessions = sessions.length;

  // Calcular hora de inicio de referencia (promedio de los primeros ingresos)
  let globalSessionStart = 0;
  let startCount = 0;
  sessions.forEach(session => {
    const joins = session.students.map(s => parseTime12(s[4])).filter(t => t > 0);
    if (joins.length) { globalSessionStart += Math.min(...joins); startCount++; }
  });
  if (startCount > 0) globalSessionStart = Math.round(globalSessionStart / startCount);

  if (activeRankSession === -1) {
    renderGlobalRanking(sessions, totalSessions, globalSessionStart);
  } else {
    renderClassRanking(sessions[activeRankSession], totalSessions);
  }
}

/** Renderiza el ranking global con puntaje unificado. */
function renderGlobalRanking(sessions, totalSessions, sessionStart) {
  const students = Object.values(studentMap);

  // Calcular puntaje unificado para cada estudiante
  const scored = students.map(s => ({
    ...s,
    unifiedScore: calculateUnifiedScore(s, sessionStart, totalSessions)
  })).sort((a, b) => b.unifiedScore - a.unifiedScore);

  // Info bar
  const avgScore = scored.length
    ? Math.round(scored.reduce((sum, s) => sum + s.unifiedScore, 0) / scored.length) : 0;

  document.getElementById('rankingClassInfo').innerHTML = `
    <div class="ranking-info">
      <div class="ranking-info-item"><div class="ri-val">${icon('bar-chart', 22)}</div><div class="ri-lbl">Vista Global</div></div>
      <div class="ranking-info-item"><div class="ri-val">${totalSessions}</div><div class="ri-lbl">Sesiones</div></div>
      <div class="ranking-info-item"><div class="ri-val">${students.length}</div><div class="ri-lbl">Estudiantes</div></div>
      <div class="ranking-info-item"><div class="ri-val">${avgScore}</div><div class="ri-lbl">Puntaje Prom.</div></div>
    </div>
    <div class="score-legend">
      <p>${icon('info', 14)} <strong>Puntaje Unificado</strong> (0-100): Asistencia 40% + Duración 35% + Puntualidad 25%</p>
    </div>`;

  // Renderizar lista
  const topList = renderRankList(scored.slice(0, 20), s => ({
    val: s.unifiedScore, sub: '/100'
  }), totalSessions);

  const bottomList = renderRankList(
    [...scored].reverse().slice(0, 15), s => ({
      val: s.unifiedScore, sub: '/100'
    }), totalSessions
  );

  document.getElementById('rankingContent').innerHTML = `
    <div class="chart-card">
      <h3>${icon('trophy')} Top 20 — Mayor Puntaje Unificado</h3>
      <p class="chart-desc">Basado en: asistencia (40%) + duración (35%) + puntualidad (25%)</p>
      ${makePodium(scored.slice(0, 3), s => ({ val: s.unifiedScore + '/100', sub: '' }))}
      ${topList}
    </div>
    <div class="chart-card">
      <h3>${icon('alert')} Menor Puntaje — Requieren Seguimiento</h3>
      <p class="chart-desc">Estudiantes con menor compromiso acumulado</p>
      ${bottomList}
    </div>`;
}

/** Renderiza el ranking de una clase específica. */
function renderClassRanking(session, totalSessions) {
  if (!session) return;

  const validStudents = session.students
    .filter(st => !EXCLUDED_ACCOUNTS.has(getKey(st)))
    .map(st => {
      const dur = parseDuration(st[3]);
      const joinMin = parseTime12(st[4]);
      return {
        name: getKey(st), email: st[2], sede: resolveStudentSede(st, session),
        dur, durStr: st[3], joinTime: st[4], leaveTime: st[5], joinMin
      };
    })
    .filter(s => s.dur >= 0.5);

  const durations = validStudents.map(s => s.dur);
  const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const joins = validStudents.map(s => s.joinMin).filter(j => j > 0);
  const sessionStart = joins.length ? Math.min(...joins) : 0;
  const startH = Math.floor(sessionStart / 60);
  const startM = sessionStart % 60;

  // Calcular puntaje por clase: duración 50% + puntualidad 50%
  const classScored = validStudents.map(s => {
    const durScore = Math.min(s.dur / 120, 1) * 100;
    const delay = sessionStart > 0 ? Math.max(0, s.joinMin - sessionStart) : 0;
    const punctScore = Math.max(0, 100 - delay * 2);
    return { ...s, classScore: Math.round((durScore * 0.5 + punctScore * 0.5) * 10) / 10 };
  }).sort((a, b) => b.classScore - a.classScore);

  // Info bar
  document.getElementById('rankingClassInfo').innerHTML = `
    <div class="ranking-info">
      <div class="ranking-info-item"><div class="ri-val">${icon('calendar', 22)}</div><div class="ri-lbl">${session.name}</div></div>
      <div class="ranking-info-item"><div class="ri-val">${session.date}</div><div class="ri-lbl">Fecha</div></div>
      <div class="ranking-info-item"><div class="ri-val">${validStudents.length}</div><div class="ri-lbl">Asistentes</div></div>
      <div class="ranking-info-item"><div class="ri-val">${fmtMins(avg)}</div><div class="ri-lbl">Duración Prom.</div></div>
      <div class="ranking-info-item"><div class="ri-val">${startH}:${String(startM).padStart(2, '0')}</div><div class="ri-lbl">Inicio (ref.)</div></div>
    </div>
    <div class="score-legend">
      <p>${icon('info', 14)} <strong>Puntaje por Clase</strong> (0-100): Duración 50% + Puntualidad 50%</p>
    </div>`;

  // Lista y podio
  const classRankList = classScored.map((s, i) => {
    const posClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'normal';
    const delay = sessionStart > 0 ? Math.max(0, s.joinMin - sessionStart) : 0;
    const delayLabel = delay <= 5 ? `<span class="status-dot green"></span> ${s.joinTime}`
      : delay <= 15 ? `<span class="status-dot yellow"></span> +${delay}m`
        : `<span class="status-dot red"></span> +${delay}m`;

    return `<div class="rank-item" onclick="openModal('${s.name.replace(/'/g, "\\'")}')" style="animation-delay:${i * 30}ms">
      <div class="rank-pos ${posClass}">${i + 1}</div>
      <div class="rank-name">${s.name}<br><span style="font-size:9px;color:var(--text2)">${s.sede} · ${fmtMins(s.dur)} · ${delayLabel}</span></div>
      <div><span class="rank-value">${s.classScore}</span><span class="rank-sub">/100</span></div>
    </div>`;
  }).join('');

  // Distribución de duración de la clase
  const distHtml = (() => {
    const ranges = [
      { label: '< 15 min', min: 0, max: 15, color: 'red' },
      { label: '15-30 min', min: 15, max: 30, color: 'red' },
      { label: '30-60 min', min: 30, max: 60, color: 'yellow' },
      { label: '1-1.5 h', min: 60, max: 90, color: 'blue' },
      { label: '1.5-2 h', min: 90, max: 120, color: 'green' },
      { label: '> 2 h', min: 120, max: 9999, color: 'purple' }
    ];
    const maxN = Math.max(...ranges.map(r => durations.filter(d => d >= r.min && d < r.max).length), 1);
    return ranges.map(r => {
      const n = durations.filter(d => d >= r.min && d < r.max).length;
      return `<div class="bar-row"><div class="bar-label">${r.label}</div>
        <div class="bar-track"><div class="bar-fill ${r.color}" style="width:${Math.max(n / maxN * 100, 3)}%">${n} est.</div></div></div>`;
    }).join('');
  })();

  document.getElementById('rankingContent').innerHTML = `
    <div class="chart-card">
      <h3>${icon('trophy')} Ranking por Puntaje — ${session.name}</h3>
      <p class="chart-desc">Puntaje = Duración (50%) + Puntualidad (50%)</p>
      ${makePodium(classScored.slice(0, 3), s => ({ val: s.classScore + '/100', sub: '' }))}
      ${classRankList}
    </div>
    <div class="chart-card">
      <h3>${icon('bar-chart')} Distribución de Duración — ${session.name}</h3>
      <p class="chart-desc">Cómo se distribuyeron los tiempos de permanencia</p>
      ${distHtml}
    </div>`;
}


// ─────────────────────────────────────────────
//  UTILIDADES DE RANKING (Podio y Lista)
// ─────────────────────────────────────────────

/**
 * Genera el HTML del podio (top 3) para el ranking.
 * 
 * @param {Array} top3 - Los 3 mejores estudiantes.
 * @param {Function} valueFn - Función que extrae {val, sub} del estudiante.
 * @returns {string} HTML del podio.
 */
function makePodium(top3, valueFn) {
  if (top3.length < 1) return '<div class="empty-state">Sin datos</div>';

  const heights = [120, 90, 70];
  const gradients = [
    'linear-gradient(135deg,#ffd700,#b8860b)',
    'linear-gradient(135deg,#c0c0c0,#808080)',
    'linear-gradient(135deg,#cd7f32,#8b4513)'
  ];
  const order = top3.length >= 3 ? [1, 0, 2] : top3.length === 2 ? [1, 0] : [0];

  return `<div class="ranking-podium">${order.map(idx => {
    const s = top3[idx];
    if (!s) return '';
    const { val, sub } = valueFn(s);
    return `<div class="podium-item" onclick="openModal('${s.name.replace(/'/g, "\\'")}')" style="animation-delay:${idx * 150}ms">
      <div style="font-size:18px;margin-bottom:4px">${icon('medal', 20)}</div>
      <div class="podium-name">${s.name}</div>
      <div class="podium-dur">${val} ${sub}</div>
      <div class="podium-block" style="width:80px;height:${heights[idx]}px;background:${gradients[idx]}">${idx + 1}°</div>
    </div>`;
  }).join('')}</div>`;
}

/**
 * Genera una lista de ranking con posiciones y valores.
 * 
 * @param {Array} items - Array de estudiantes ordenados.
 * @param {Function} valueFn - Función que extrae {val, sub} del estudiante.
 * @param {number} totalSessions - Total de sesiones para mostrar en detalle.
 * @returns {string} HTML de la lista.
 */
function renderRankList(items, valueFn, totalSessions) {
  return items.map((s, i) => {
    const posClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'normal';
    const { val, sub } = valueFn(s);
    return `<div class="rank-item" onclick="openModal('${s.name.replace(/'/g, "\\'")}')" style="animation-delay:${i * 30}ms">
      <div class="rank-pos ${posClass}">${i + 1}</div>
      <div class="rank-name">${s.name}<br><span style="font-size:9px;color:var(--text2)">${s.sede} · ${s.attended}/${totalSessions} ses.</span></div>
      <div><span class="rank-value">${val}</span><span class="rank-sub">${sub}</span></div>
    </div>`;
  }).join('');
}


// ─────────────────────────────────────────────
//  ALERTAS (Clasificación por riesgo)
// ─────────────────────────────────────────────

/** Renderiza la pestaña de Alertas con clasificación automática. */
function renderAlerts() {
  const students = Object.values(studentMap);
  const totalS = getFilteredSessions().length;

  const risk = students.filter(s => s.attRate < 0.5).sort((a, b) => a.attended - b.attended);
  const warn = students.filter(s => s.avgDuration < 45 && s.attRate >= 0.5);
  const excellent = students.filter(s => s.attended === totalS && s.avgDuration >= 90)
    .sort((a, b) => b.totalDuration - a.totalDuration);

  // Tarjetas resumen de alertas
  document.getElementById('alertSummary').innerHTML = `
    <div class="metric-card red"><div class="metric-icon"><span class="status-dot red lg"></span></div>
      <div class="metric-value">${risk.length}</div><div class="metric-label">Riesgo Alto</div></div>
    <div class="metric-card yellow"><div class="metric-icon"><span class="status-dot yellow lg"></span></div>
      <div class="metric-value">${warn.length}</div><div class="metric-label">Atención</div></div>
    <div class="metric-card green"><div class="metric-icon"><span class="status-dot green lg"></span></div>
      <div class="metric-value">${excellent.length}</div><div class="metric-label">Excelente</div></div>
    <div class="metric-card blue"><div class="metric-icon">${icon('phone')}</div>
      <div class="metric-value">${Object.keys(contacted).filter(k => contacted[k]).length}</div>
      <div class="metric-label">Contactados</div></div>`;

  // Listas de alertas
  const renderAlertList = (arr, detailFn) => {
    if (arr.length === 0) return '<div class="empty-state">Sin registros</div>';
    return arr.map((s, i) => {
      const isC = contacted[s.name];
      return `<div class="alert-item" onclick="openModal('${s.name.replace(/'/g, "\\'")}')" style="animation-delay:${i * 20}ms">
        <span class="name">${isC ? icon('check', 14) + ' ' : ''}${s.name}</span>
        <span class="detail">${detailFn(s)}</span>
      </div>`;
    }).join('');
  };

  document.getElementById('highRisk').innerHTML = renderAlertList(risk, s => `${s.attended}/${totalS} sesiones`);
  document.getElementById('medRisk').innerHTML = renderAlertList(warn, s => `Prom: ${fmtMins(s.avgDuration)}`);
  document.getElementById('excellent').innerHTML = renderAlertList(excellent, s => `Eng: ${s.engagement}`);
}


// ─────────────────────────────────────────────
//  SELECTOR DE INSTITUCIÓN + ÁREA
// ─────────────────────────────────────────────

/**
 * Renderiza las dos barras de filtro:
 *   1. Instituciones (SG, IETAC) — selector principal
 *   2. Áreas Académicas (Ciencias, Inglés, etc.) — selector secundario
 * 
 * Cada pill muestra el nombre, ícono, conteo y color de la config.
 * Se enlaza con selectSede() y selectArea() en data-manager.js.
 */
function renderInstitutionSelector() {
  const container = document.getElementById('institutionSelector');
  if (!container) return;

  // ── Contar ESTUDIANTES ÚNICOS por sede (no sesiones) ──
  // Porque una sesión puede mezclar SG e IETAC.
  const sedeStudentSets = {}; // sede → Set de nombres
  let totalUniqueStudents = new Set();

  SESSIONS.forEach(session => {
    session.students.forEach(st => {
      const key = getKey(st);
      if (EXCLUDED_ACCOUNTS.has(key)) return;
      totalUniqueStudents.add(key);

      const sede = resolveStudentSede(st, session);
      if (!sedeStudentSets[sede]) sedeStudentSets[sede] = new Set();
      sedeStudentSets[sede].add(key);
    });
  });

  const sedeCounts = { todas: totalUniqueStudents.size };
  Object.entries(sedeStudentSets).forEach(([sede, set]) => {
    sedeCounts[sede] = set.size;
  });

  // ── Contar sesiones por área ──
  const areaCounts = { todas: SESSIONS.length };
  SESSIONS.forEach(session => {
    const area = getSessionArea(session);
    areaCounts[area] = (areaCounts[area] || 0) + 1;
  });

  // ── Generar pills de instituciones ──
  let institutionPills = `<button class="institution-pill ${activeSede === 'todas' ? 'active' : ''}" onclick="selectSede('todas')">
    ${icon('building', 14)} Todas <span class="institution-count">${sedeCounts.todas}</span>
  </button>`;

  Object.entries(INSTITUTIONS).forEach(([key, config]) => {
    const count = sedeCounts[key] || 0;
    const isActive = activeSede === key ? 'active' : '';
    const disabled = count === 0 ? 'disabled' : '';

    institutionPills += `<button class="institution-pill ${isActive} ${disabled}"
      style="--pill-color:${config.color};--pill-bg:${config.bg}"
      onclick="${count > 0 ? `selectSede('${key}')` : ''}">
      ${icon(config.icon, 14)} ${config.fullName || key}
      <span class="institution-count">${count}</span>
    </button>`;
  });

  // ── Generar pills de áreas ──
  let areaPills = `<button class="institution-pill ${activeArea === 'todas' ? 'active' : ''}" onclick="selectArea('todas')">
    ${icon('filter', 14)} Todas las Áreas <span class="institution-count">${areaCounts.todas}</span>
  </button>`;

  Object.entries(AREAS).forEach(([key, config]) => {
    const count = areaCounts[key] || 0;
    if (count === 0) return;  // No mostrar áreas sin sesiones
    const isActive = activeArea === key ? 'active' : '';

    areaPills += `<button class="institution-pill ${isActive}"
      style="--pill-color:${config.color};--pill-bg:${config.bg}"
      onclick="selectArea('${key}')">
      ${icon(config.icon, 14)} ${key}
      <span class="institution-count">${count}</span>
    </button>`;
  });

  // ── Render ambos ──
  container.innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <span style="font-size:11px;font-weight:700;color:var(--text2);margin-right:4px">${icon('building', 14)} Sede:</span>
      ${institutionPills}
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:6px">
      <span style="font-size:11px;font-weight:700;color:var(--text2);margin-right:4px">${icon('book-open', 14)} Área:</span>
      ${areaPills}
    </div>`;
}
