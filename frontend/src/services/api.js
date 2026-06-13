import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
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
};

export const movilService = {
  listar:           ()           => api.get('/moviles'),
  listarOperativos: ()           => api.get('/moviles/operativos'),
  registrar:        (data)       => api.post('/moviles', data),
  modificar:        (id, data)   => api.put(`/moviles/${id}`, data),
  cambiarEstado:    (id, estado) => api.put(`/moviles/${id}/estado`, { estadoMovil: estado }),
  eliminar:         (id)         => api.delete(`/moviles/${id}`),
};

export const guardiaService = {
  listar:    ()       => api.get('/guardias/mias'),
  iniciar:   (data)   => api.post('/guardias', data),
  finalizar: (id)     => api.put(`/guardias/${id}/finalizar`),
};

export const incidenteService = {
  listarAsignados:   ()       => api.get('/incidentes/asignados'),
  listarSeguimiento: ()       => api.get('/incidentes/seguimiento'),
  listarGuardias:    ()       => api.get('/incidentes/guardias-disponibles'),
  crear:             (data)   => api.post('/incidentes', data),
  cambiarEstado:     (id, estado) => api.put(`/incidentes/${id}/estado`, { estado }),
  atencionesDel:     ()       => api.get('/incidentes/atenciones-hoy'),
};

export default api;