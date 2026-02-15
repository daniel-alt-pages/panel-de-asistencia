/**
 * ============================================================
 *  EXPORT.JS — Exportación de Reportes
 * ============================================================
 * 
 * Módulo de exportación de datos en formatos CSV y Excel (.xlsx).
 * Las exportaciones respetan el filtro de sede activo.
 * 
 * FORMATOS SOPORTADOS:
 *  - CSV: Reporte simple con datos de cada estudiante
 *  - Excel: Reporte por institución con múltiples hojas
 * 
 * DEPENDENCIAS:
 *  - icons.js (icon())
 *  - utils.js (fmtMins())
 *  - data-manager.js (studentMap, notes, contacted, getFilteredSessions)
 *  - SheetJS (xlsx.full.min.js) para exportación Excel
 * 
 * CARGADO POR: index.html (después de modals.js)
 * ============================================================
 */


// ─────────────────────────────────────────────
//  EXPORTACIÓN CSV
// ─────────────────────────────────────────────

/**
 * Genera y descarga un archivo CSV con el reporte de asistencia.
 * 
 * El reporte incluye: nombre, sede, correo, sesiones, asistencia,
 * duración promedio, engagement, estado, contacto y notas.
 * 
 * NOTA: Respeta la sede activa (activeSede).
 */
function exportCSV() {
    const sessions = getFilteredSessions();
    const totalS = sessions.length;
    const students = Object.values(studentMap);

    // Generar nombre descriptivo del archivo
    const sedeLabel = activeSede !== 'todas' ? `_${activeSede}` : '';
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `reporte_asistencia${sedeLabel}_${dateStr}.csv`;

    // Header del CSV
    const headers = [
        'Estudiante', 'Sede', 'Correo', 'Sesiones Asistidas',
        'Total Sesiones', '% Asistencia', 'Duración Promedio',
        'Engagement', 'Estado', 'Contactado', 'Nota'
    ];

    // Filas de datos
    const rows = students.map(student => {
        const rate = Math.round(student.attRate * 100);
        const status = rate >= 80 ? 'Excelente' : rate >= 50 ? 'Atención' : 'Riesgo';
        const note = (notes[student.name] || '').replace(/,/g, ';').replace(/\n/g, ' ');

        return [
            `"${student.name}"`,
            `"${student.sede}"`,
            `"${student.email}"`,
            student.attended,
            totalS,
            `${rate}%`,
            `"${fmtMins(student.avgDuration)}"`,
            student.engagement,
            `"${status}"`,
            `"${contacted[student.name] ? 'Sí' : 'No'}"`,
            `"${note}"`
        ].join(',');
    });

    // Combinar y descargar
    const csvContent = '\ufeff' + headers.join(',') + '\n' + rows.join('\n');
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
    showToast(`${icon('download')} Reporte CSV exportado`);
}


// ─────────────────────────────────────────────
//  EXPORTACIÓN EXCEL (por institución)
// ─────────────────────────────────────────────

/**
 * Genera y descarga un archivo Excel con hojas por institución.
 * 
 * Estructura del Excel:
 *  - Hoja "Resumen": Métricas generales
 *  - Hoja por sede (e.g., "SG", "IETAC"): Datos de estudiantes
 *  - Hoja "Historial": Detalle de sesiones
 * 
 * REQUIERE: SheetJS (xlsx.full.min.js) cargada globalmente.
 */
function exportExcelByInstitution() {
    // Verificar que SheetJS esté disponible
    if (typeof XLSX === 'undefined') {
        showToast(`${icon('alert')} Error: SheetJS no está cargada`);
        return;
    }

    const sessions = getFilteredSessions();
    const totalS = sessions.length;
    const students = Object.values(studentMap);
    const workbook = XLSX.utils.book_new();

    // ── Hoja 1: Resumen General ──
    const summaryData = [
        ['Reporte de Asistencia', '', '', new Date().toLocaleDateString('es-CO')],
        ['Sede Filtrada:', activeSede !== 'todas' ? activeSede : 'Todas'],
        [''],
        ['Métrica', 'Valor'],
        ['Total Estudiantes', students.length],
        ['Total Sesiones', totalS],
        ['Tasa Promedio', Math.round((students.reduce((s, st) => s + st.attRate, 0) / Math.max(students.length, 1)) * 100) + '%'],
        ['Duración Promedio', fmtMins(students.reduce((s, st) => s + st.avgDuration, 0) / Math.max(students.length, 1))],
        ['Engagement Promedio', Math.round(students.reduce((s, st) => s + st.engagement, 0) / Math.max(students.length, 1))],
        ['En Riesgo (<50%)', students.filter(s => s.attRate < 0.5).length],
        ['Contactados', Object.keys(contacted).filter(k => contacted[k]).length]
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

    // ── Hojas por Sede ──
    const sedeGroups = {};
    students.forEach(s => {
        if (!sedeGroups[s.sede]) sedeGroups[s.sede] = [];
        sedeGroups[s.sede].push(s);
    });

    Object.entries(sedeGroups).forEach(([sede, sedeStudents]) => {
        const headers = ['Estudiante', 'Correo', 'Sesiones', 'Total', '% Asistencia', 'Duración Prom.', 'Engagement', 'Estado', 'Contactado', 'Nota'];
        const rows = sedeStudents.map(s => {
            const rate = Math.round(s.attRate * 100);
            return [
                s.name, s.email, s.attended, totalS,
                `${rate}%`, fmtMins(s.avgDuration), s.engagement,
                rate >= 80 ? 'Excelente' : rate >= 50 ? 'Atención' : 'Riesgo',
                contacted[s.name] ? 'Sí' : 'No',
                (notes[s.name] || '').substring(0, 200)
            ];
        });

        const sheetData = [headers, ...rows];
        const sheet = XLSX.utils.aoa_to_sheet(sheetData);

        // Aplicar anchos de columna
        sheet['!cols'] = [
            { wch: 35 }, { wch: 30 }, { wch: 10 }, { wch: 8 },
            { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
            { wch: 12 }, { wch: 40 }
        ];

        // Nombre de hoja limitado a 31 caracteres (restricción Excel)
        XLSX.utils.book_append_sheet(workbook, sheet, sede.substring(0, 31));
    });

    // ── Hoja de Historial de Sesiones ──
    const historyHeaders = ['Sesión', 'Fecha', 'Estudiante', 'Sede', 'Duración', 'Ingreso', 'Salida'];
    const historyRows = [];

    sessions.forEach(session => {
        session.students.forEach(st => {
            if (EXCLUDED_ACCOUNTS.has(getKey(st))) return;
            historyRows.push([
                session.name, session.date, getKey(st), resolveStudentSede(st, session), st[3], st[4], st[5]
            ]);
        });
    });

    const historySheet = XLSX.utils.aoa_to_sheet([historyHeaders, ...historyRows]);
    historySheet['!cols'] = [
        { wch: 25 }, { wch: 12 }, { wch: 35 }, { wch: 10 },
        { wch: 14 }, { wch: 14 }, { wch: 14 }
    ];
    XLSX.utils.book_append_sheet(workbook, historySheet, 'Historial');

    // ── Descargar ──
    const sedeLabel = activeSede !== 'todas' ? `_${activeSede}` : '';
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `reporte_asistencia${sedeLabel}_${dateStr}.xlsx`);
    showToast(`${icon('download')} Excel exportado con ${Object.keys(sedeGroups).length} hoja(s) por sede`);
}


// ─────────────────────────────────────────────
//  UTILIDAD: Descarga de Archivos
// ─────────────────────────────────────────────

/**
 * Crea un enlace temporal y descarga el contenido como archivo.
 * 
 * @param {string} content - Contenido del archivo.
 * @param {string} filename - Nombre del archivo con extensión.
 * @param {string} mimeType - Tipo MIME del archivo.
 */
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');

    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    // Liberar la URL temporal
    URL.revokeObjectURL(link.href);
}
