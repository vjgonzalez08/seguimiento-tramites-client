import axios from '@/lib/api';

// Obtener total de trámites devueltos
export const getTotalTramitesDevueltos = async () => {
  try {
    const response = await axios.get('/actualizacion/devueltos');
    return response.data;
  } catch (error) {
    console.error('Error al obtener total de trámites devueltos:', error);
    return { success: false };
  }
};

// Obtener total de trámites devueltos con respuesta
export const getTotalTramitesDevueltosConRespuesta = async () => {
  try {
    const response = await axios.get('/actualizacion/devueltos-con-respuesta');
    return response.data;
  } catch (error) {
    console.error('Error al obtener trámites devueltos con respuesta:', error);
    return { success: false };
  }
};

// Obtener total de trámites devueltos sin respuesta
export const getTotalTramitesDevueltosSinRespuesta = async () => {
  try {
    const response = await axios.get('/actualizacion/devueltos-sin-respuesta');
    return response.data;
  } catch (error) {
    console.error('Error al obtener trámites devueltos sin respuesta:', error);
    return { success: false };
  }
};

// Corte Datos SAP
export const getCorteDatosSap = async () => {
  try {
    const response = await axios.get('/actualizacion/corte-datos');
    return response.data;
  } catch (error) {
    console.error('Error al obtener corte de datos SAP:', error);
    return { success: false };
  }
};

// Datos para solid gauge (cumplen SLA con respuesta)
export const getTramitesDevueltosCumplen = async () => {
  try {
    const response = await axios.get('/actualizacion/cumplen');
    return response.data;
  } catch (error) {
    console.error('Error al obtener cumplimiento de trámites:', error);
    return { success: false };
  }
};

// BLOQUE 2
// Trámites devueltos SIN respuesta clasificados por SLA
export const getTramitesDevueltosSinRespuestaSla = async () => {
  try {
    const response = await axios.get('/actualizacion/sin-respuesta-sla');
    return response.data;
  } catch (error) {
    console.error('Error al obtener SLA sin respuesta:', error);
    return { success: false };
  }
};

// =======================
// BLOQUE 3 — NUEVOS
// =======================

// Días promedio de respuesta (trámites devueltos CON respuesta)
export const getPromedioDiasRespuesta = async () => {
  try {
    const response = await axios.get('/actualizacion/promedio-respuesta');
    return response.data;
  } catch (error) {
    console.error('Error al obtener promedio de días de respuesta:', error);
    return { success: false };
  }
};

// Días promedio sin respuesta (trámites devueltos SIN respuesta)
export const getPromedioDiasSinRespuesta = async () => {
  try {
    const response = await axios.get('/actualizacion/promedio-sin-respuesta');
    return response.data;
  } catch (error) {
    console.error('Error al obtener promedio de días sin respuesta:', error);
    return { success: false };
  }
};

// =======================
// BLOQUE 5 — PREDIADORES
// =======================

// Gráfica: resumen por prediador (quien recibe la devolución)
export const getDevueltosPorPrediadorResumen = async () => {
  try {
    const response = await axios.get('/actualizacion/prediadores/resumen');
    return response.data;
  } catch (error) {
    console.error('Error al obtener resumen de devueltos por prediador:', error);
    return { success: false };
  }
};

// Tabla: detalle paginado + filtro + ordenamiento
export const getDevueltosPorPrediadorDetalle = async (params = {}) => {
  try {
    const {
      prediadorSap = null,
      page = 1,
      pageSize = 10,
      sortField = 'dias_transcurridos',
      sortOrder = 'descend',
    } = params;

    const query = new URLSearchParams();
    if (prediadorSap) query.set('prediadorSap', prediadorSap);
    query.set('page', String(page));
    query.set('pageSize', String(pageSize));
    query.set('sortField', String(sortField));
    query.set('sortOrder', String(sortOrder));

    const response = await axios.get(`/actualizacion/prediadores/detalle?${query.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalle de devueltos por prediador:', error);
    return { success: false };
  }
};
