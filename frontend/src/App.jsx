import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login      from './pages/Login';
import Dashboard  from './pages/Dashboard';
import Usuarios   from './pages/Usuarios';
import Moviles    from './pages/Moviles';
import Guardias   from './pages/Guardias';
import Incidentes from './pages/Incidentes';
import Perfil     from './pages/Perfil';
import DirectorDashboard from './pages/DirectorDashboard';
import MetricasUGL from './pages/MetricasUGL';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"      element={<Login />} />
          <Route path="/dashboard"  element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/usuarios"   element={<PrivateRoute><Usuarios /></PrivateRoute>} />
          <Route path="/moviles"    element={<PrivateRoute><Moviles /></PrivateRoute>} />
          <Route path="/guardias"   element={<PrivateRoute><Guardias /></PrivateRoute>} />
          <Route path="/incidentes" element={<PrivateRoute><Incidentes /></PrivateRoute>} />
          <Route path="/perfil"     element={<PrivateRoute><Perfil /></PrivateRoute>} />
          <Route path="/director-dashboard" element={<PrivateRoute><DirectorDashboard /></PrivateRoute>} />
          <Route path="/metricas-ugl" element={<PrivateRoute><MetricasUGL /></PrivateRoute>} />
          <Route path="*"           element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}