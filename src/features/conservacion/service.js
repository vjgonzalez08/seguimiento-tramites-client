import axios from '@/lib/api';

// Obtener total de trámites devueltos
export const getTotalTramitesDevueltos = async () => {
  try {
    const response = await axios.get('/conservacion/devueltos');
    return response.data;
  } catch (error) {
    console.error('Error al obtener total de trámites devueltos:', error);
    return { success: false };
  }
};

// Obtener total de trámites devueltos con respuesta
export const getTotalTramitesDevueltosConRespuesta = async () => {
  try {
    const response = await axios.get('/conservacion/devueltos-con-respuesta');
    return response.data;
  } catch (error) {
    console.error('Error al obtener trámites devueltos con respuesta:', error);
    return { success: false };
  }
};

// Obtener total de trámites devueltos sin respuesta
export const getTotalTramitesDevueltosSinRespuesta = async () => {
  try {
    const response = await axios.get('/conservacion/devueltos-sin-respuesta');
    return response.data;
  } catch (error) {
    console.error('Error al obtener trámites devueltos sin respuesta:', error);
    return { success: false };
  }
};

// Corte Datos SAP
export const getCorteDatosSap = async () => {
  try {
    const response = await axios.get('/conservacion/corte-datos');
    return response.data;
  } catch (error) {
    console.error('Error al obtener corte de datos SAP:', error);
    return { success: false };
  }
};
