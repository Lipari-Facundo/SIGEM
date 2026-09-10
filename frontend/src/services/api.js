import axios from 'axios';

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
    if (error.response?.status === 401) {
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
  pendientesReasignacion: () => api.get('/incidentes/pendientes-reasignacion'),
  atencionesDel:     ()       => api.get('/incidentes/atenciones-hoy'),
  dashboard:         (params) => api.get('/incidentes/dashboard', { params }),
};

export default api;