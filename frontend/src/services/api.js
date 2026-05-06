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
    if (error.response?.status === 401 || error.response?.status === 403) {
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
  listar: () => api.get('/usuarios'),
  crear: (data) => api.post('/usuarios', data),
  modificar: (id, data) => api.put(`/usuarios/${id}`, data),
  cambiarEstado: (id, activo) => api.put(`/usuarios/${id}/estado`, { activo }),
  eliminar: (id) => api.delete(`/usuarios/${id}`),
};

export const empleadoService = {
  listar: () => api.get('/empleados'),
  crear: (data) => api.post('/empleados', data),
  modificar: (id, data) => api.put(`/empleados/${id}`, data),
  eliminar: (id) => api.delete(`/empleados/${id}`),
};

export default api;