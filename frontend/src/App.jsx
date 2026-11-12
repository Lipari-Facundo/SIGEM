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
import InventarioMovil from './pages/InventarioMovil';
import ControlMovil from './pages/ControlMovil';
import InformesControl from './pages/InformesControl';
import SolicitudesReposicion from './pages/SolicitudesReposicion';
import DepositoCentral from './pages/DepositoCentral';
import EquiposMedicos from './pages/EquiposMedicos';
import RegistrarReposicionEnfermeria from './pages/RegistrarReposicionEnfermeria';
import { ControlMovilEstadoProvider } from './context/ControlMovilEstadoContext';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ControlMovilEstadoProvider>
          <Routes>
          <Route path="/login"      element={<Login />} />
          <Route path="/dashboard"  element={<PrivateRoute roles={['ADM', 'ENF', 'JEF', 'DES', 'DIR']}><Dashboard /></PrivateRoute>} />
          <Route path="/usuarios"   element={<PrivateRoute roles={['ADM']}><Usuarios /></PrivateRoute>} />
          <Route path="/moviles"    element={<PrivateRoute roles={['ADM']}><Moviles /></PrivateRoute>} />
          <Route path="/guardias"   element={<PrivateRoute roles={['ENF', 'JEF']}><Guardias /></PrivateRoute>} />
          <Route path="/inventario" element={<PrivateRoute roles={['ENF']}><InventarioMovil /></PrivateRoute>} />
          <Route path="/control-movil" element={<PrivateRoute roles={['ENF']}><ControlMovil /></PrivateRoute>} />
          <Route path="/informes-control" element={<PrivateRoute roles={['JEF', 'ADM', 'DIR']}><InformesControl /></PrivateRoute>} />
          <Route path="/solicitudes-reposicion" element={<PrivateRoute roles={['JEF', 'ADM', 'DES']}><SolicitudesReposicion /></PrivateRoute>} />
          <Route path="/reposicion-interna-enfermeria" element={<PrivateRoute roles={['JEF', 'ADM']}><RegistrarReposicionEnfermeria /></PrivateRoute>} />
          <Route path="/deposito-central" element={<PrivateRoute roles={['JEF', 'ADM']}><DepositoCentral /></PrivateRoute>} />
          <Route path="/equipos-medicos" element={<PrivateRoute roles={['ADM', 'JEF', 'COORD_ENF']}><EquiposMedicos /></PrivateRoute>} />
          <Route path="/asignacion-equipos" element={<PrivateRoute roles={['JEF','ADM']}><Navigate to="/equipos-medicos" replace /></PrivateRoute>} />
          <Route path="/incidentes" element={<PrivateRoute roles={['ENF', 'DES']}><Incidentes /></PrivateRoute>} />
          <Route path="/perfil"     element={<PrivateRoute><Perfil /></PrivateRoute>} />
          <Route path="/director-dashboard" element={<PrivateRoute roles={['DIR', 'ADM']}><DirectorDashboard /></PrivateRoute>} />
          <Route path="/metricas-ugl" element={<PrivateRoute roles={['DIR', 'ADM']}><MetricasUGL /></PrivateRoute>} />
          <Route path="*"           element={<Navigate to="/login" replace />} />
          </Routes>
        </ControlMovilEstadoProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}