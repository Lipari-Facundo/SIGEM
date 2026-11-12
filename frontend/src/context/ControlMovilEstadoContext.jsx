import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { inventarioService } from '../services/api';

const ControlMovilEstadoContext = createContext(null);
let solicitudEstadoControlEnCurso = null;

export function ControlMovilEstadoProvider({ children }) {
  const { user } = useAuth();
  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const refrescar = useCallback(async (forzar = false) => {
    if (user?.rol !== 'ENF') {
      setEstado(null);
      setError('');
      setCargando(false);
      return;
    }

    setCargando(true);
    try {
      if (forzar || solicitudEstadoControlEnCurso?.usuarioId !== user.id) {
        const solicitud = {
          usuarioId: user.id,
          promesa: inventarioService.estadoControlGuardia().then(response => response.data),
        };
        solicitudEstadoControlEnCurso = solicitud;
        solicitud.promesa.then(
          () => { if (solicitudEstadoControlEnCurso === solicitud) solicitudEstadoControlEnCurso = null; },
          () => { if (solicitudEstadoControlEnCurso === solicitud) solicitudEstadoControlEnCurso = null; },
        );
      }
      const resultado = await solicitudEstadoControlEnCurso.promesa;
      setEstado(resultado);
      setError('');
    } catch (exception) {
      setEstado(null);
      setError(exception.response?.data?.message || 'No se pudo consultar el estado del control de móvil.');
    } finally {
      setCargando(false);
    }
  }, [user?.id, user?.rol]);

  useEffect(() => {
    refrescar();
    const refrescarLuegoDeCambio = () => refrescar(true);
    window.addEventListener('sigem:control-movil-actualizado', refrescarLuegoDeCambio);
    window.addEventListener('sigem:guardia-actualizada', refrescarLuegoDeCambio);
    return () => {
      window.removeEventListener('sigem:control-movil-actualizado', refrescarLuegoDeCambio);
      window.removeEventListener('sigem:guardia-actualizada', refrescarLuegoDeCambio);
    };
  }, [refrescar]);

  const value = useMemo(() => ({
    estado,
    cargando,
    error,
    refrescar,
    controlPendiente: Boolean(estado?.guardiaActiva && !estado?.controlCompletado),
  }), [estado, cargando, error, refrescar]);

  return (
    <ControlMovilEstadoContext.Provider value={value}>
      {children}
    </ControlMovilEstadoContext.Provider>
  );
}

export function useControlMovilEstado() {
  const context = useContext(ControlMovilEstadoContext);
  if (!context) {
    throw new Error('useControlMovilEstado debe utilizarse dentro de ControlMovilEstadoProvider');
  }
  return context;
}
