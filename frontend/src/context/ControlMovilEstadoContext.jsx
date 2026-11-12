import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { inventarioService } from '../services/api';

const ControlMovilEstadoContext = createContext(null);

export function ControlMovilEstadoProvider({ children }) {
  const { user } = useAuth();
  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const numeroSolicitud = useRef(0);

  const refrescar = useCallback(async () => {
    const solicitudActual = ++numeroSolicitud.current;
    if (user?.rol !== 'ENF') {
      setEstado(null);
      setError('');
      setCargando(false);
      return;
    }

    setCargando(true);
    try {
      const response = await inventarioService.estadoControlGuardia();
      if (solicitudActual !== numeroSolicitud.current) return;
      const resultado = response.data;
      setEstado(resultado);
      setError('');
    } catch (exception) {
      if (solicitudActual !== numeroSolicitud.current) return;
      setEstado(null);
      setError(exception.response?.data?.message || 'No se pudo consultar el estado del control de móvil.');
    } finally {
      if (solicitudActual === numeroSolicitud.current) setCargando(false);
    }
  }, [user?.id, user?.rol]);

  useEffect(() => {
    refrescar();
    const refrescarLuegoDeCambio = () => refrescar();
    window.addEventListener('sigem:control-movil-actualizado', refrescarLuegoDeCambio);
    window.addEventListener('sigem:guardia-actualizada', refrescarLuegoDeCambio);
    return () => {
      numeroSolicitud.current += 1;
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
