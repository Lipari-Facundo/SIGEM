import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificacionService } from '../services/api';

export default function useNotificaciones() {
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);

  useEffect(() => {
    const puedeRecibirNotificaciones = ['ENF', 'JEF', 'DES'].includes(user?.rol);
    if (!user || !puedeRecibirNotificaciones) {
      setNotificaciones([]);
      setNoLeidas(0);
      return undefined;
    }

    let activo = true;

    const cargar = async () => {
      const resultados = await Promise.allSettled([
        notificacionService.misNotificaciones(),
        notificacionService.contarNoLeidas(),
      ]);

      if (!activo) return;

      const [lista, contador] = resultados;
      if (lista.status === 'fulfilled') {
        setNotificaciones(lista.value.data);
      } else {
        console.error('No se pudieron cargar las notificaciones:', lista.reason);
      }
      if (contador.status === 'fulfilled') {
        setNoLeidas(Number(contador.value.data) || 0);
      } else {
        console.error('No se pudo consultar el contador de notificaciones:', contador.reason);
      }
    };

    cargar();
    const intervalo = setInterval(() => {
      if (document.visibilityState === 'visible') cargar();
    }, 15000);

    return () => {
      activo = false;
      clearInterval(intervalo);
    };
  }, [user]);

  const refrescar = async () => {
    if (!user) return;
    const [lista, contador] = await Promise.all([
      notificacionService.misNotificaciones(),
      notificacionService.contarNoLeidas(),
    ]);
    setNotificaciones(lista.data);
    setNoLeidas(Number(contador.data) || 0);
  };

  const marcarLeida = async (id) => {
    await notificacionService.marcarLeida(id);
    setNotificaciones(actuales => actuales.map(notificacion => (
      notificacion.id === id ? { ...notificacion, leida: true } : notificacion
    )));
    setNoLeidas(actual => Math.max(0, actual - 1));
  };

  return { notificaciones, noLeidas, refrescar, marcarLeida };
}