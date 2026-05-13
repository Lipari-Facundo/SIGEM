import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

// Agrega el token JWT a cada request automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el token expiró, redirige al login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Solo en 401 (token vencido/inválido), NO en 403 (sin permisos)
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
  listar: (buscar) => api.get('/usuarios', { params: buscar ? { buscar } : {} }),
  crear: (data) => api.post('/usuarios', data),
  modificar: (id, data) => api.put(`/usuarios/${id}`, data),
  cambiarEstado: (id, activo) => api.put(`/usuarios/${id}/estado`, { activo }),
  eliminar: (id) => api.delete(`/usuarios/${id}`),
   miPerfil: () => api.get('/usuarios/me'),
  actualizarMiPerfil: (data) => api.put('/usuarios/me', data),
};

export const empleadoService = {
  listar: () => api.get('/empleados'),
  crear: (data) => api.post('/empleados', data),
  modificar: (id, data) => api.put(`/empleados/${id}`, data),
  eliminar: (id) => api.delete(`/empleados/${id}`),
};

export default api;