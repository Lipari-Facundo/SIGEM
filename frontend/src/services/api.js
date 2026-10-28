import axios from 'axios';

const API_ERROR_TRANSLATIONS = {
  'bad credentials': 'Usuario o contraseña incorrectos',
  'dni is required': 'El DNI es obligatorio',
  'name is required': 'El nombre es obligatorio',
  'first name is required': 'El nombre es obligatorio',
  'last name is required': 'El apellido es obligatorio',
};

const localizeApiMessage = (message) => {
  if (typeof message !== 'string') return message;
  return API_ERROR_TRANSLATIONS[message.trim().toLowerCase()] || message;
};

const api = axios.create({
  baseURL: 'http://localhost:8081/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const responseData = error.response?.data;
    if (responseData && typeof responseData === 'object') {
      error.response.data = {
        ...responseData,
        ...(typeof responseData.message === 'string'
          ? { message: localizeApiMessage(responseData.message) }
          : {}),
        ...(typeof responseData.error === 'string'
          ? { error: localizeApiMessage(responseData.error) }
          : {}),
      };
    }

    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
};

export const usuarioService = {
  listar:            (buscar)    => api.get('/usuarios', { params: buscar ? { buscar } : {} }),
  miPerfil:          ()          => api.get('/usuarios/me'),
  actualizarMiPerfil:(data)      => api.put('/usuarios/me', data),
  crear:             (data)      => api.post('/usuarios', data),
  modificar:         (id, data)  => api.put(`/usuarios/${id}`, data),
  cambiarEstado:     (id, activo)=> api.put(`/usuarios/${id}/estado`, { activo }),
  eliminar:          (id)        => api.delete(`/usuarios/${id}`),
  exportar:          (params)    => api.get('/usuarios/export', { params, responseType: 'blob' }),
};

export const movilService = {
  listar:           ()           => api.get('/moviles'),
  listarOperativos: ()           => api.get('/moviles/operativos'),
  metricasEstado:   ()           => api.get('/moviles/metricas-estado'),
  registrar:        (data)       => api.post('/moviles', data),
  modificar:        (id, data)   => api.put(`/moviles/${id}`, data),
  cambiarEstado:    (id, estado) => api.put(`/moviles/${id}/estado`, { estadoMovil: estado }),
  eliminar:         (id)         => api.delete(`/moviles/${id}`),
};

export const inventarioService = {
  miInventario:       ()       => api.get('/inventario/mi-movil'),
  inventarioDeMovil:  (movilId) => api.get(`/inventario/movil/${movilId}`),
  inicializar:        (movilId) => api.post(`/inventario/movil/${movilId}/inicializar`),
  registrarConsumo:   (dto)    => api.post('/inventario/consumo', dto),
  miHistorial:        ()       => api.get('/inventario/mi-movil/historial'),
  historialDeMovil:   (movilId) => api.get(`/inventario/movil/${movilId}/historial`),
  sugerenciaReposicion: () => api.get('/inventario/mi-movil/sugerencia-reposicion'),
  crearReposicion:    (dto)    => api.post('/inventario/reposicion', dto),
  misSolicitudes:    ()       => api.get('/inventario/reposicion/mias'),
  cancelarSolicitud: (id)     => api.put(`/inventario/reposicion/${id}/cancelar`),
  solicitudesPendientes: ()   => api.get('/inventario/reposicion/pendientes'),
  entregarReposicion: (id, data) => api.post(`/inventario/reposicion/${id}/entregas`, data),
  rechazarReposicion: (id, motivo) => api.put(`/inventario/reposicion/${id}/rechazar`, { motivo }),
};

export const depositoCentralService = {
  stock: (activo = true) => api.get('/deposito-central/stock', { params: { activo } }),
  catalogo: () => api.get('/deposito-central/catalogo'),
  movimientos: () => api.get('/deposito-central/movimientos'),
  agregarInsumo: (data) => api.post('/deposito-central/stock', data),
  actualizarMinimo: (id, cantidadMinima) => api.put(`/deposito-central/stock/${id}/minimo`, { cantidadMinima }),
  archivarInsumo: (id) => api.put(`/insumos/${id}/archivar`),
  desarchivarInsumo: (id) => api.put(`/insumos/${id}/desarchivar`),
  registrarMovimiento: (data) => api.post('/deposito-central/movimientos', data),
};

export const equipoMedicoService = {
  disponibles: () => api.get('/equipos/disponibles'),
  asignados: () => api.get('/equipos/asignados'),
  asignar: (data) => api.post('/equipos/asignar', data),
  desasignar: (id) => api.put(`/equipos/${id}/desasignar`),
};

export const controlService = {
  plantilla: () => api.get('/controles/mi-movil/plantilla'),
  crear:     (dto) => api.post('/controles', dto),
  mis:       () => api.get('/controles/mis'),
  listar:    () => api.get('/controles'),
  detalle:   (id) => api.get(`/controles/${id}`),
};

export const guardiaService = {
  listar:    ()       => api.get('/guardias/mias'),
  iniciar:   (data)   => api.post('/guardias', data),
  finalizar: (id)     => api.put(`/guardias/${id}/finalizar`),
};

export const notificacionService = {
  misNotificaciones: () => api.get('/notificaciones/mias'),
  contarNoLeidas:    () => api.get('/notificaciones/mias/no-leidas/count'),
  marcarLeida:       (id) => api.put(`/notificaciones/${id}/leer`),
};

export const incidenteService = {
  listarAsignados:   ()       => api.get('/incidentes/asignados'),
  listarSeguimiento: ()       => api.get('/incidentes/seguimiento'),
  listarGuardias:    ()       => api.get('/incidentes/guardias-disponibles'),
  listarTodos:       ()       => api.get('/incidentes'),
  metricasUGL:       ()       => api.get('/incidentes/metricas-ugl'),
  crear:             (data)   => api.post('/incidentes', data),
  cambiarEstado:     (id, estado) => api.put(`/incidentes/${id}/estado`, { estado }),
  rechazar:          (id, motivo) => api.put(`/incidentes/${id}/rechazar`, { motivo }),
  marcarLlegada:     (id) => api.put(`/incidentes/${id}/llegada`),
  reasignar:         (id, guardiaId) => api.put(`/incidentes/${id}/reasignar`, { guardiaId }),
  cancelar:          (id, motivo) => api.put(`/incidentes/${id}/cancelar`, { motivo }),
  pendientesReasignacion: () => api.get('/incidentes/pendientes-reasignacion'),
  atencionesDel:     ()       => api.get('/incidentes/atenciones-hoy'),
  dashboard:         (params) => api.get('/incidentes/dashboard', { params }),
};

export default api;