/**
 * ============================================================
 *  APP.JS — Punto de Entrada del Panel de Asistencia
 * ============================================================
 * 
 * Este archivo es el punto de entrada principal de la aplicación.
 * Inicializa los datos, renderiza la UI y expone la API pública
 * bajo el namespace `PanelAsistencia` para integración con otros
 * sistemas.
 * 
 * ORDEN DE CARGA (index.html):
 *  1. data.js         → Datos de sesiones (SESSIONS)
 *  2. icons.js        → Íconos SVG + configuración de instituciones
 *  3. utils.js        → Funciones utilitarias puras
 *  4. data-manager.js → Procesamiento de datos + estado global
 *  5. ui-render.js    → Renderizado de toda la interfaz
 *  6. modals.js       → Modales de detalle y ayuda
 *  7. export.js       → Exportación CSV y Excel
 *  8. app.js          → Inicialización y API pública (este archivo)
 * 
 * INTEGRACIÓN CON OTROS PROYECTOS:
 *  Toda la funcionalidad está expuesta a través de `window.PanelAsistencia`:
 * 
 *    PanelAsistencia.processData()       → Recalcular métricas
 *    PanelAsistencia.renderAll()         → Refrescar toda la UI
 *    PanelAsistencia.selectSede('SG')    → Filtrar por sede
 *    PanelAsistencia.exportCSV()         → Exportar CSV
 *    PanelAsistencia.exportExcel()       → Exportar Excel
 *    PanelAsistencia.getStudentMap()     → Obtener datos procesados
 *    PanelAsistencia.getFilteredSessions() → Obtener sesiones filtradas
 * 
 * DEPENDENCIAS: Todos los módulos anteriores
 * ============================================================
 */


// ─────────────────────────────────────────────
//  RENDERIZADO MAESTRO
// ─────────────────────────────────────────────

/**
 * Ejecuta todas las funciones de renderizado.
 * Se llama al iniciar la app, al cargar CSV y al cambiar la sede.
 */
function renderAll() {
    renderInstitutionSelector();
    renderSummary();
    renderAdvanced();
    renderSessions();
    renderStudents();
    renderRanking();
    renderAlerts();
}


// ─────────────────────────────────────────────
//  INICIALIZACIÓN
// ─────────────────────────────────────────────

/**
 * Inicializa la aplicación al cargar el DOM.
 * 
 * 1. Procesa los datos iniciales (SESSIONS de data.js)
 * 2. Renderiza el selector de instituciones
 * 3. Renderiza todas las vistas
 */
document.addEventListener('DOMContentLoaded', () => {
    // Procesar datos iniciales
    processData();

    // Renderizar selector de instituciones
    renderInstitutionSelector();

    // Renderizar toda la interfaz
    renderAll();
});


// ─────────────────────────────────────────────
//  API PÚBLICA (Namespace para integración)
// ─────────────────────────────────────────────

/**
 * Namespace global que expone la API del Panel de Asistencia.
 * Permite que otros proyectos o scripts externos interactúen
 * con el panel de forma controlada.
 * 
 * @namespace PanelAsistencia
 * 
 * @example
 *   // Desde otro script:
 *   PanelAsistencia.selectSede('IETAC');
 *   const data = PanelAsistencia.getStudentMap();
 *   console.log(data);
 */
window.PanelAsistencia = {
    // Datos
    getStudentMap: () => studentMap,
    getFilteredSessions: () => getFilteredSessions(),
    getSessions: () => SESSIONS,
    getInstitutions: () => INSTITUTIONS,
    getNotes: () => notes,
    getContacted: () => contacted,
    getActiveSede: () => activeSede,
    getActiveArea: () => activeArea,
    getAreas: () => AREAS,

    // Acciones
    processData: processData,
    renderAll: renderAll,
    selectSede: selectSede,
    selectArea: selectArea,
    handleCSVUpload: handleCSVUpload,
    exportCSV: exportCSV,
    exportExcel: exportExcelByInstitution,
    openModal: openModal,
    showToast: showToast,

    // Versión
    version: '2.0.0'
};
