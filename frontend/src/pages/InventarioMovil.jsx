import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { incidenteService, inventarioService } from '../services/api';
import { useControlMovilEstado } from '../context/ControlMovilEstadoContext';
import './InventarioMovil.css';

const CATEGORIAS = [
  { key: 'MEDICACION', label: 'Medicación', icon: '💊' },
  { key: 'DESCARTABLE', label: 'Descartables', icon: '🧤' },
  { key: 'TRAUMA', label: 'Trauma', icon: '🩹' },
  { key: 'VIA_AEREA', label: 'Vía aérea', icon: '🫁' },
  { key: 'EQUIPO_MEDICO', label: 'Equipos médicos', icon: '🩺' },
  { key: 'OXIGENO', label: 'Oxígeno', icon: '🫧' },
  { key: 'ANTISEPTICO', label: 'Antisépticos', icon: '🧴' },
  { key: 'KIT', label: 'Kits', icon: '🧰' },
  { key: 'MONITOREO', label: 'Monitoreo', icon: '📟' },
  { key: 'CURACION', label: 'Curación', icon: '🩹' },
  { key: 'SOLUCION', label: 'Soluciones', icon: '💉' },
];
const MOTIVOS_CAMBIO_EQUIPO = [
  { value: 'ROTURA', label: 'Ruptura' },
  { value: 'FALTANTE', label: 'Faltante' },
  { value: 'FALLA', label: 'No funciona' },
  { value: 'DESGASTE', label: 'Desgaste' },
  { value: 'OTRO', label: 'Otro' },
];

export default function InventarioMovil() {
  const navigate = useNavigate();
  const location = useLocation();
  const solicitudesDetallePendientes = useRef(new Map());
  const { estado: estadoControl, cargando: cargandoControl, error: errorControl } = useControlMovilEstado();
  const [inventario, setInventario] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [equiposMedicosMovil, setEquiposMedicosMovil] = useState(null);
  const [errorEquiposMedicos, setErrorEquiposMedicos] = useState('');
  const [historial, setHistorial] = useState([]);
  const [atenciones, setAtenciones] = useState([]);
  const [vista, setVista] = useState('inventario');
  const [loading, setLoading] = useState(true);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [guardiaActiva, setGuardiaActiva] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cantidades, setCantidades] = useState({});
  const [seccionConsumoAbierta, setSeccionConsumoAbierta] = useState(null);
  const [incidenteId, setIncidenteId] = useState('');
  const [observacionesConsumo, setObservacionesConsumo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [solicitudes, setSolicitudes] = useState([]);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(false);
  const [modalReposicion, setModalReposicion] = useState(false);
  const [reposicionSeleccionados, setReposicionSeleccionados] = useState([]);
  const [reposicionCantidades, setReposicionCantidades] = useState({});
  const [idsSugeridosReposicion, setIdsSugeridosReposicion] = useState([]);
  const [observacionesReposicion, setObservacionesReposicion] = useState('');
  const [motivosCambioEquipo, setMotivosCambioEquipo] = useState({});
  const [detallesCambioEquipo, setDetallesCambioEquipo] = useState({});
  const [seccionReposicionAbierta, setSeccionReposicionAbierta] = useState(null);
  const [guardandoReposicion, setGuardandoReposicion] = useState(false);
  const [usarExcepcionControl, setUsarExcepcionControl] = useState(false);
  const [motivoExcepcionControl, setMotivoExcepcionControl] = useState('');
  const [fechaFiltroHistorial, setFechaFiltroHistorial] = useState('');
  const [incidenteFiltroHistorial, setIncidenteFiltroHistorial] = useState('');
  const [fechaFiltroSolicitud, setFechaFiltroSolicitud] = useState('');
  const [estadoFiltroSolicitud, setEstadoFiltroSolicitud] = useState('');
  const [usoDetalle, setUsoDetalle] = useState(null);
  const [solicitudDetalle, setSolicitudDetalle] = useState(null);
  const controlPendiente = Boolean(estadoControl?.guardiaActiva && !estadoControl?.controlCompletado);
  const excepcionCompleta = usarExcepcionControl && motivoExcepcionControl.trim().length > 0;
  const puedeRealizarOperacion = Boolean(
    !cargandoControl
      && !errorControl
      && estadoControl?.guardiaActiva
      && (estadoControl.controlCompletado || excepcionCompleta),
  );

  useEffect(() => {
    cargarInventario();
    cargarHistorial();
    cargarSolicitudes();
  }, []);

  useEffect(() => {
    if (location.state?.abrirReposicion && puedeRealizarOperacion) {
      abrirModalReposicion();
    }
  }, [location.state, puedeRealizarOperacion]);

  useEffect(() => {
    const solicitudId = location.state?.solicitudId;
    if (!solicitudId) return undefined;
    let vigente = true;
    const claveSolicitud = String(solicitudId);
    let solicitudDetalleRequest = solicitudesDetallePendientes.current.get(claveSolicitud);
    if (!solicitudDetalleRequest) {
      solicitudDetalleRequest = inventarioService.miSolicitud(solicitudId);
      solicitudesDetallePendientes.current.set(claveSolicitud, solicitudDetalleRequest);
    }
    solicitudDetalleRequest
      .then(response => {
        if (!vigente) return;
        setVista('solicitudes');
        setSolicitudDetalle(response.data);
      })
      .catch(exception => {
        if (vigente) setError(exception.response?.data?.message || 'No se pudo cargar el detalle de la solicitud.');
      })
      .finally(() => {
        if (solicitudesDetallePendientes.current.get(claveSolicitud) === solicitudDetalleRequest) {
          solicitudesDetallePendientes.current.delete(claveSolicitud);
        }
        if (!vigente) return;
        navigate(location.pathname, { replace: true, state: null });
      });
    return () => { vigente = false; };
  }, [location.pathname, location.state?.solicitudId, navigate]);

  const cargarInventario = async () => {
    try {
      const response = await inventarioService.miInventario();
      setInventario(response.data);
      setGuardiaActiva(true);
      try {
        const equiposResponse = await inventarioService.misEquiposMedicos();
        setEquiposMedicosMovil(equiposResponse.data);
        setErrorEquiposMedicos('');
      } catch {
        setEquiposMedicosMovil(null);
        setErrorEquiposMedicos('No se pudieron consultar los equipos médicos asignados al móvil.');
      }
    } catch (exception) {
      const message = exception.response?.data?.message || '';
      if (message.includes('guardia activa')) setGuardiaActiva(false);
      else setError('No se pudo cargar el inventario. Volvé a intentarlo.');
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorial = async () => {
    setLoadingHistorial(true);
    try {
      const response = await inventarioService.miHistorial();
      setHistorial(response.data);
    } catch (exception) {
      const message = exception.response?.data?.message || '';
      if (!message.includes('guardia activa')) setError('No se pudo cargar el historial de uso.');
    } finally {
      setLoadingHistorial(false);
    }
  };

  const cargarSolicitudes = async () => {
    setLoadingSolicitudes(true);
    try {
      const response = await inventarioService.misSolicitudes();
      setSolicitudes(response.data);
    } catch {
      setError('No se pudieron cargar las solicitudes de reposición.');
    } finally {
      setLoadingSolicitudes(false);
    }
  };

  const abrirModal = async () => {
    if (!puedeRealizarOperacion) return;
    setError('');
    setMensaje('');
    setCantidades({});
    setIncidenteId('');
    setObservacionesConsumo('');
    setSeccionConsumoAbierta(seccionesConsumo[0]?.key || null);
    setModalAbierto(true);
    try {
      const response = await incidenteService.listarAsignados();
      setAtenciones((response.data || []).filter(atencion => atencion.estado === 'EN_PROCESO'));
    } catch {
      setAtenciones([]);
      setError('No se pudieron cargar las atenciones activas.');
    }
  };

  const cerrarModal = () => {
    if (!guardando) setModalAbierto(false);
  };

  const actualizarCantidad = (insumoId, valor, maximo) => {
    if (valor === '') {
      setCantidades(previo => ({ ...previo, [insumoId]: '' }));
      return;
    }
    const cantidad = Math.max(0, Math.min(Number(valor) || 0, maximo));
    setCantidades(previo => ({ ...previo, [insumoId]: cantidad }));
  };

  const registrarConsumo = async () => {
    setError('');
    if (!puedeRealizarOperacion) {
      setError('Completá el control de móvil o ingresá el motivo obligatorio de excepción.');
      return;
    }
    const items = inventario
      .filter(insumo => insumo.tipo === 'CONSUMIBLE')
      .map(insumo => ({ insumoId: insumo.insumoId, cantidad: Number(cantidades[insumo.insumoId]) || 0 }))
      .filter(item => item.cantidad > 0);

    if (items.length === 0) {
      setError('Seleccioná al menos un insumo y una cantidad mayor a cero.');
      return;
    }

    setGuardando(true);
    try {
      await inventarioService.registrarConsumo({
        incidenteId: incidenteId ? Number(incidenteId) : null,
        motivoExcepcionControl: estadoControl?.controlCompletado ? null : motivoExcepcionControl.trim(),
        observaciones: observacionesConsumo.trim() || null,
        items,
      });
      setMensaje('Uso registrado correctamente.');
      setModalAbierto(false);
      await Promise.all([cargarInventario(), cargarHistorial()]);
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo registrar el uso.');
    } finally {
      setGuardando(false);
    }
  };

  const abrirModalReposicion = async () => {
    if (!puedeRealizarOperacion) return;
    setError('');
    setMensaje('');
    setObservacionesReposicion('');
    try {
      const response = await inventarioService.sugerenciaReposicion();
      const sugerencias = (response.data || []).filter(item => {
        const insumo = inventario.find(actual => actual.insumoId === item.insumoId);
        return insumo?.tipo === 'CONSUMIBLE';
      });
      const idsSugeridos = sugerencias.filter(item => item.cantidadSugerida > 0).map(item => item.insumoId);
      setIdsSugeridosReposicion(idsSugeridos);
      setReposicionSeleccionados(idsSugeridos);
      setReposicionCantidades(Object.fromEntries(
        sugerencias.map(item => [item.insumoId, Math.min(item.cantidadSugerida, item.cantidadRecomendada)])
      ));
      setMotivosCambioEquipo({});
      setDetallesCambioEquipo({});
      const primeraSeccionSugerida = CATEGORIAS.find(categoria => sugerencias.some(sugerencia => {
        const insumo = inventario.find(actual => actual.insumoId === sugerencia.insumoId);
        return insumo?.categoria === categoria.key && sugerencia.cantidadSugerida > 0;
      }));
      setSeccionReposicionAbierta(primeraSeccionSugerida?.key || CATEGORIAS.find(categoria => inventario.some(insumo => insumo.tipo === 'CONSUMIBLE' && insumo.categoria === categoria.key))?.key || 'CAMBIO_EQUIPO');
      setModalReposicion(true);
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo calcular la sugerencia de reposición.');
    }
  };

  const quitarInsumoReposicion = (insumoId) => {
    setReposicionSeleccionados(previo => previo.filter(id => id !== insumoId));
    setReposicionCantidades(previo => {
      const copia = { ...previo };
      delete copia[insumoId];
      return copia;
    });
    setMotivosCambioEquipo(previo => {
      const copia = { ...previo };
      delete copia[insumoId];
      return copia;
    });
    setDetallesCambioEquipo(previo => {
      const copia = { ...previo };
      delete copia[insumoId];
      return copia;
    });
  };

  const alternarInsumoReposicion = (insumo) => {
    if (reposicionSeleccionados.includes(insumo.insumoId)) {
      quitarInsumoReposicion(insumo.insumoId);
      return;
    }
    setReposicionSeleccionados(previo => [...previo, insumo.insumoId]);
    setReposicionCantidades(previo => ({
      ...previo,
      [insumo.insumoId]: insumo.tipo === 'REUTILIZABLE' ? 1 : 0,
    }));
  };

  const crearReposicion = async () => {
    setError('');
    if (!puedeRealizarOperacion) {
      setError('Completá el control de móvil o ingresá el motivo obligatorio de excepción.');
      return;
    }
    const equiposCambio = reposicionSeleccionados
      .map(insumoId => inventario.find(insumo => insumo.insumoId === insumoId))
      .filter(insumo => insumo?.tipo === 'REUTILIZABLE');
    const equipoIncompleto = equiposCambio.find(insumo => (
      !motivosCambioEquipo[insumo.insumoId]
      || (motivosCambioEquipo[insumo.insumoId] === 'OTRO' && !detallesCambioEquipo[insumo.insumoId]?.trim())
    ));
    if (equipoIncompleto) {
      setError(`Completá el motivo de cambio para ${nombreEquipoCanonico(equipoIncompleto.nombre)}.`);
      setSeccionReposicionAbierta('CAMBIO_EQUIPO');
      return;
    }

    const items = reposicionSeleccionados
      .map(insumoId => {
        const insumo = inventario.find(actual => actual.insumoId === insumoId);
        return {
          insumoId,
          cantidad: insumo?.tipo === 'REUTILIZABLE' ? 1 : Number(reposicionCantidades[insumoId]) || 0,
          motivoCambio: insumo?.tipo === 'REUTILIZABLE' ? motivosCambioEquipo[insumoId] : null,
          detalleCambio: insumo?.tipo === 'REUTILIZABLE' ? detallesCambioEquipo[insumoId]?.trim() || null : null,
        };
      })
      .filter(item => item.cantidad > 0);
    if (items.length === 0) {
      setError('Seleccioná al menos un insumo con una cantidad mayor a cero.');
      return;
    }
    setGuardandoReposicion(true);
    try {
      await inventarioService.crearReposicion({
        observaciones: observacionesReposicion.trim() || null,
        motivoExcepcionControl: estadoControl?.controlCompletado ? null : motivoExcepcionControl.trim(),
        items,
      });
      setMensaje('Solicitud de reposición creada correctamente.');
      setModalReposicion(false);
      await cargarSolicitudes();
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo crear la solicitud de reposición.');
    } finally {
      setGuardandoReposicion(false);
    }
  };

  const consumibles = inventario.filter(insumo => insumo.tipo === 'CONSUMIBLE');
  const seccionesConsumo = CATEGORIAS.map(categoria => ({
    ...categoria,
    insumos: consumibles.filter(insumo => insumo.categoria === categoria.key),
  })).filter(seccion => seccion.insumos.length > 0);
  const categoriasConsumo = new Set(CATEGORIAS.map(categoria => categoria.key));
  const otrosConsumibles = consumibles.filter(insumo => !categoriasConsumo.has(insumo.categoria));
  if (otrosConsumibles.length) seccionesConsumo.push({ key: 'OTROS', label: 'Otros', icon: '＋', insumos: otrosConsumibles });
  const consumosElegidos = consumibles
    .map(insumo => ({ insumo, cantidad: Number(cantidades[insumo.insumoId]) || 0 }))
    .filter(item => item.cantidad > 0);
  const totalUnidadesConsumo = consumosElegidos.reduce((total, item) => total + item.cantidad, 0);
  const categoriasDisponibles = useMemo(() => [...new Set(
    inventario.map(insumo => insumo.categoria || 'SIN_CATEGORIA')
  )].sort((a, b) => a.localeCompare(b, 'es')), [inventario]);
  const inventarioFiltrado = useMemo(() => {
    const texto = searchTerm.trim().toLocaleLowerCase('es');
    return inventario.filter(insumo => {
      const coincideNombre = !texto || String(insumo.nombre || '').toLocaleLowerCase('es').includes(texto);
      const coincideCategoria = !selectedCategory || (insumo.categoria || 'SIN_CATEGORIA') === selectedCategory;
      return coincideNombre && coincideCategoria;
    });
  }, [inventario, searchTerm, selectedCategory]);
  const grupos = useMemo(() => {
    const agrupados = inventarioFiltrado.reduce((resultado, insumo) => {
      const categoria = insumo.categoria || 'SIN_CATEGORIA';
      if (!resultado[categoria]) resultado[categoria] = [];
      resultado[categoria].push(insumo);
      return resultado;
    }, {});
    const conocidos = CATEGORIAS
      .filter(categoria => agrupados[categoria.key]?.length)
      .map(categoria => ({ ...categoria, insumos: agrupados[categoria.key] }));
    const otros = Object.entries(agrupados)
      .filter(([categoria]) => !CATEGORIAS.some(conocida => conocida.key === categoria))
      .map(([key, insumos]) => ({
        key,
        label: key === 'SIN_CATEGORIA'
          ? 'Sin categoría'
          : key.toLocaleLowerCase('es').replace(/(^|_)\w/g, letra => letra.replace('_', ' ').toLocaleUpperCase('es')),
        icon: '📦',
        insumos,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
    return [...conocidos, ...otros];
  }, [inventarioFiltrado]);
  const seccionesReposicion = CATEGORIAS.map(categoria => ({
    ...categoria,
    insumos: inventario.filter(insumo => insumo.tipo === 'CONSUMIBLE'
      && insumo.categoria === categoria.key
      && typeof insumo.cantidadRecomendada === 'number'),
  })).filter(seccion => seccion.insumos.length > 0);
  const otrasReposiciones = inventario.filter(insumo => insumo.tipo === 'CONSUMIBLE'
    && !CATEGORIAS.some(categoria => categoria.key === insumo.categoria)
    && typeof insumo.cantidadRecomendada === 'number');
  if (otrasReposiciones.length) seccionesReposicion.push({ key: 'OTROS', label: 'Otros', icon: '＋', insumos: otrasReposiciones });
  const equiposReutilizables = inventario.filter(insumo => insumo.tipo === 'REUTILIZABLE'
    && typeof insumo.cantidadRecomendada === 'number');
  const seleccionadosReposicion = reposicionSeleccionados.filter(insumoId => {
    const insumo = inventario.find(actual => actual.insumoId === insumoId);
    return insumo?.tipo === 'CONSUMIBLE' && Number(reposicionCantidades[insumoId]) > 0;
  }).length;
  const cambiosEquipoSeleccionados = reposicionSeleccionados.filter(insumoId => (
    inventario.find(actual => actual.insumoId === insumoId)?.tipo === 'REUTILIZABLE'
  )).length;
  const lotes = Object.values(historial.reduce((gruposPorLote, registro) => {
    const grupo = gruposPorLote[registro.loteId] || { loteId: registro.loteId, registros: [] };
    grupo.registros.push(registro);
    gruposPorLote[registro.loteId] = grupo;
    return gruposPorLote;
  }, {}));
  const lotesFiltrados = lotes.filter(lote => {
    const primerRegistro = lote.registros[0];
    return (!fechaFiltroHistorial || primerRegistro.fecha?.slice(0, 10) === fechaFiltroHistorial)
      && (!incidenteFiltroHistorial
        || String(primerRegistro.numeroIncidente || '').includes(incidenteFiltroHistorial.trim()));
  });
  const solicitudesFiltradas = solicitudes.filter(solicitud => (
    (!fechaFiltroSolicitud || solicitud.fecha?.slice(0, 10) === fechaFiltroSolicitud)
    && (!estadoFiltroSolicitud || solicitud.estado === estadoFiltroSolicitud)
  ));

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={S.main}>
        <header style={S.header}>
          <div>
            <p style={S.overline}>Operación del móvil</p>
            <h1 style={S.h1}>Inventario móvil</h1>
            <p style={S.sub}>Consultá y registrá el uso de los insumos de tu guardia.</p>
          </div>
          <div style={S.headerActions}>
            {guardiaActiva && (
              <>
                <button style={{ ...S.btnHeader, ...(!puedeRealizarOperacion ? S.btnDisabled : {}) }}
                  onClick={abrirModal} disabled={!puedeRealizarOperacion}>📦 Registrar uso</button>
                <button style={{ ...S.btnHeader, ...(!puedeRealizarOperacion ? S.btnDisabled : {}) }}
                  onClick={abrirModalReposicion} disabled={!puedeRealizarOperacion}>📋 Solicitar reposición</button>
              </>
            )}
            <div style={S.headerIcon}>🎒</div>
          </div>
        </header>

        {mensaje && <div style={S.success}>{mensaje}</div>}
        {error && !modalAbierto && <div style={S.error}>{error}</div>}
        {guardiaActiva && (cargandoControl || errorControl || controlPendiente
          || (!cargandoControl && !errorControl && !estadoControl?.guardiaActiva)) && (
          <section className="inventario-control-notice" style={S.controlNotice} role={errorControl ? 'alert' : 'status'}>
            {cargandoControl && <span>Consultando el control de la guardia activa…</span>}
            {errorControl && <span>{errorControl} Las operaciones permanecen bloqueadas hasta verificarlo.</span>}
            {!cargandoControl && !errorControl && !estadoControl?.guardiaActiva && (
              <span>No se detectó una guardia activa para este móvil. Las operaciones permanecen bloqueadas.</span>
            )}
            {!cargandoControl && !errorControl && controlPendiente && (
              <>
                <div>
                  <strong>Control de móvil pendiente</strong>
                  <p style={S.controlNoticeText}>
                    Completá el control para registrar uso o pedir reposición. Si necesitás continuar antes,
                    podés informar una excepción justificada.
                  </p>
                </div>
                <label style={S.exceptionToggle}>
                  <input
                    type="checkbox"
                    checked={usarExcepcionControl}
                    onChange={event => setUsarExcepcionControl(event.target.checked)}
                  />
                  Registrar una excepción
                </label>
                {usarExcepcionControl && (
                  <textarea
                    style={S.exceptionInput}
                    maxLength={500}
                    rows={2}
                    value={motivoExcepcionControl}
                    onChange={event => setMotivoExcepcionControl(event.target.value)}
                    placeholder="Motivo obligatorio (máximo 500 caracteres)"
                    aria-label="Motivo obligatorio de excepción por control incompleto"
                  />
                )}
              </>
            )}
          </section>
        )}

        {!loading && !guardiaActiva && (
          <EmptyState
            icon="🩺"
            title="No tenés una guardia activa"
            description="Iniciá tu guardia para ver el inventario del móvil asignado."
            action={<Button onClick={() => navigate('/guardias')}>Ir a Guardia</Button>}
          />
        )}
        {loading && <div style={S.status}>Cargando inventario...</div>}

        {!loading && guardiaActiva && (
          <>
            <div style={S.tabs}>
              <button style={{ ...S.tab, ...(vista === 'inventario' ? S.tabActive : {}) }} onClick={() => setVista('inventario')}>Stock actual</button>
              <button style={{ ...S.tab, ...(vista === 'historial' ? S.tabActive : {}) }} onClick={() => setVista('historial')}>Historial de uso</button>
              <button style={{ ...S.tab, ...(vista === 'solicitudes' ? S.tabActive : {}) }} onClick={() => setVista('solicitudes')}>Solicitudes de reposición</button>
            </div>

            {vista === 'inventario' && (
              <>
                <section className="nurse-medical-equipment" aria-labelledby="nurse-medical-equipment-title">
                  <div className="nurse-medical-equipment__header">
                    <div>
                      <p className="nurse-medical-equipment__eyebrow">Inventario de equipos</p>
                      <h2 id="nurse-medical-equipment-title">Equipos médicos del móvil</h2>
                      {equiposMedicosMovil && (
                        <p className="nurse-medical-equipment__mobile">
                          Móvil {equiposMedicosMovil.movil}
                        </p>
                      )}
                    </div>
                    <span className="nurse-medical-equipment__source">Asignación vigente</span>
                  </div>
                  {errorEquiposMedicos && (
                    <p className="nurse-medical-equipment__error" role="alert">{errorEquiposMedicos}</p>
                  )}
                  {equiposMedicosMovil && (
                    <div className="nurse-medical-equipment__grid">
                      {equiposMedicosMovil.equipos.map(equipo => (
                        <article
                          key={equipo.tipo}
                          className={`nurse-medical-equipment__item${equipo.faltante ? ' is-missing' : ''}`}
                        >
                          <div className="nurse-medical-equipment__item-heading">
                            <h3>{equipo.tipoNombre}</h3>
                            <span className="nurse-medical-equipment__status">
                              {equipo.faltante ? 'Faltante / no disponible' : equipo.estado}
                            </span>
                          </div>
                          <p className="nurse-medical-equipment__serial">
                            {equipo.faltante ? 'Sin asignación operativa' : `N.º de serie: ${equipo.numeroSerie}`}
                          </p>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                {inventario.length === 0 ? (
                  <EmptyState icon="📦" title="Inventario sin cargar" description="El móvil todavía no tiene insumos inicializados." />
                ) : (
                  <>
                    <div className="inventario-stock-filters">
                      <label className="inventario-stock-filter">
                        <span>Buscar insumo</span>
                        <input
                          type="search"
                          value={searchTerm}
                          onChange={event => setSearchTerm(event.target.value)}
                          placeholder="Nombre del insumo"
                        />
                      </label>
                      <label className="inventario-stock-filter">
                        <span>Categoría</span>
                        <select value={selectedCategory} onChange={event => setSelectedCategory(event.target.value)}>
                          <option value="">Todas las categorías</option>
                          {categoriasDisponibles.map(key => {
                            const conocida = CATEGORIAS.find(categoria => categoria.key === key);
                            const label = conocida?.label || (key === 'SIN_CATEGORIA'
                              ? 'Sin categoría'
                              : key.toLocaleLowerCase('es').replace(/(^|_)\w/g, letra => letra.replace('_', ' ').toLocaleUpperCase('es')));
                            return <option key={key} value={key}>{label}</option>;
                          })}
                        </select>
                      </label>
                    </div>
                    {grupos.length === 0 ? (
                      <EmptyState icon="🔎" title="No se encontraron insumos" description="Probá con otro nombre o cambiá la categoría seleccionada." />
                    ) : (
                      <div style={S.categoryGrid}>
                        {grupos.map(categoria => {
                          const expandida = Boolean(expandedCategories[categoria.key]);
                          const insumosVisibles = expandida ? categoria.insumos : categoria.insumos.slice(0, 5);
                          return (
                            <section key={categoria.key} style={S.category}>
                              <div style={S.categoryHeader}>
                                <span style={S.categoryIcon}>{categoria.icon}</span>
                                <h2 style={S.categoryTitle}>{categoria.label}</h2>
                                <span style={S.count}>{categoria.insumos.length}</span>
                              </div>
                              <div style={S.itemList}>
                                {insumosVisibles.map(insumo => (
                                  <div key={insumo.insumoId} style={S.item}>
                                    <div style={S.itemInfo}>
                                      <span style={S.itemName}>{insumo.nombre}</span>
                                      {insumo.tipo === 'REUTILIZABLE' && <span style={S.reusable}>Reutilizable</span>}
                                    </div>
                                    <div style={S.quantity}>
                                      <strong>{insumo.cantidadActual}</strong>
                                      {insumo.unidadMedida && <span>{insumo.unidadMedida}</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {categoria.insumos.length > 5 && (
                                <button
                                  type="button"
                                  className="inventario-stock-expand"
                                  aria-expanded={expandida}
                                  onClick={() => setExpandedCategories(actual => ({
                                    ...actual,
                                    [categoria.key]: !actual[categoria.key],
                                  }))}
                                >
                                  <span>{expandida ? 'Ver menos' : `+ ${categoria.insumos.length - 5} insumos`}</span>
                                  <svg
                                    className={expandida ? 'is-expanded' : ''}
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    aria-hidden="true"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m5 7.5 5 5 5-5" />
                                  </svg>
                                </button>
                              )}
                            </section>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {vista === 'historial' && (
              loadingHistorial
                ? <div style={S.status}>Cargando historial...</div>
                : (
                  <>
                    <div style={S.filterBar}>
                      <label style={S.filterField}>Fecha
                        <input type="date" style={S.filterInput} value={fechaFiltroHistorial}
                          onChange={event => setFechaFiltroHistorial(event.target.value)} />
                      </label>
                      <label style={S.filterField}>Número de incidente
                        <input type="search" style={S.filterInput} value={incidenteFiltroHistorial}
                          onChange={event => setIncidenteFiltroHistorial(event.target.value)}
                          placeholder="Buscar número" />
                      </label>
                    </div>
                    {lotesFiltrados.length === 0
                  ? <EmptyState icon="🧾" title={historial.length ? 'Sin resultados' : 'Sin registros de uso'}
                    description={historial.length ? 'No hay registros que coincidan con los filtros.' : 'Todavía no hay consumos registrados para este móvil.'} />
                      : <div style={S.tableWrap}>
                        <table className="inventario-data-table" style={S.dataTable}>
                          <thead><tr><th>Fecha</th><th>Atención asociada</th><th>Enfermero</th><th>Acción</th></tr></thead>
                          <tbody>{lotesFiltrados.map(lote => {
                            const registro = lote.registros[0];
                            return (
                              <tr key={lote.loteId}>
                                <td>{formatearFecha(registro.fecha)}</td>
                                <td>{registro.numeroIncidente
                                  ? `Incidente N.º ${registro.numeroIncidente}${registro.incidenteUbicacion ? ` · ${registro.incidenteUbicacion}` : ''}`
                                  : 'Sin atención asociada'}</td>
                                <td>{registro.enfermeroNombre}</td>
                                <td><button type="button" style={S.detailButton}
                                  onClick={() => setUsoDetalle(lote)}>Ver detalle</button></td>
                              </tr>
                            );
                          })}</tbody>
                        </table>
                      </div>}
                  </>
                )
            )}

            {vista === 'solicitudes' && (
              loadingSolicitudes
                ? <div style={S.status}>Cargando solicitudes...</div>
                : (
                  <>
                    <div style={S.filterBar}>
                      <label style={S.filterField}>Fecha
                        <input type="date" style={S.filterInput} value={fechaFiltroSolicitud}
                          onChange={event => setFechaFiltroSolicitud(event.target.value)} />
                      </label>
                      <label style={S.filterField}>Estado
                        <select style={S.filterInput} value={estadoFiltroSolicitud}
                          onChange={event => setEstadoFiltroSolicitud(event.target.value)}>
                          <option value="">Todos</option>
                          <option value="PENDIENTE">Pendiente</option>
                          <option value="PARCIAL">Parcial</option>
                          <option value="COMPLETADA">Completada</option>
                          <option value="RECHAZADA">Rechazada</option>
                          <option value="CANCELADA">Cancelada</option>
                        </select>
                      </label>
                    </div>
                    {solicitudesFiltradas.length === 0
                  ? <EmptyState icon="📋" title={solicitudes.length ? 'Sin resultados' : 'Sin solicitudes'}
                    description={solicitudes.length ? 'No hay solicitudes que coincidan con los filtros.' : 'Todavía no enviaste solicitudes de reposición.'} />
                      : <div style={S.tableWrap}>
                        <table className="inventario-data-table" style={S.dataTable}>
                          <thead><tr><th>Fecha</th><th>Hora</th><th>Enfermero</th><th>Estado de solicitud</th><th>Acción</th></tr></thead>
                          <tbody>{solicitudesFiltradas.map(solicitud => (
                            <tr key={solicitud.id}>
                              <td>{formatearDia(solicitud.fecha)}</td>
                              <td>{formatearHora(solicitud.fecha)}</td>
                              <td>{solicitud.enfermeroNombre}</td>
                              <td><span style={{ ...S.statusBadge, ...estiloEstado(solicitud.estado) }}>
                                {etiquetaEstado(solicitud.estado)}
                              </span></td>
                              <td><button type="button" style={S.detailButton}
                                onClick={() => setSolicitudDetalle(solicitud)}>Ver detalle</button></td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>}
                  </>
                )
            )}
          </>
        )}
      </main>

      {modalAbierto && (
        <div style={S.overlay} onMouseDown={cerrarModal}>
          <div style={S.modal} onMouseDown={event => event.stopPropagation()}>
            <div style={S.modalHeader}>
              <div>
                <p style={S.sectionLabel}>Stock del móvil</p>
                <h2 style={S.modalTitle}>Registrar uso de insumos</h2>
              </div>
              <button style={S.closeButton} onClick={cerrarModal} aria-label="Cerrar">×</button>
            </div>
            {error && <div style={S.error}>{error}</div>}
            <label style={S.label} htmlFor="incidente">Atención asociada (opcional)</label>
            <select id="incidente" style={S.input} value={incidenteId} onChange={event => setIncidenteId(event.target.value)}>
              <option value="">Sin atención asociada</option>
              {atenciones.map(atencion => (
                <option key={atencion.id} value={atencion.id}>
                  {atencion.numeroIncidente ? `Incidente N.º ${atencion.numeroIncidente}` : 'Incidente sin número'} — {atencion.ubicacion}
                </option>
              ))}
            </select>
            <label style={S.label} htmlFor="observaciones-consumo">Observaciones (opcional)</label>
            <textarea id="observaciones-consumo" style={S.input} rows={2} maxLength={2000}
              value={observacionesConsumo}
              onChange={event => setObservacionesConsumo(event.target.value)}
              placeholder="Notas asociadas al uso" />
            <div style={S.consumptionSummary}>
              <div><strong>{consumosElegidos.length}</strong><span> insumos</span></div>
              <div><strong>{totalUnidadesConsumo}</strong><span> unidades a registrar</span></div>
            </div>
            <div style={S.consumptionSections}>
              {seccionesConsumo.map(seccion => {
                const abierta = seccionConsumoAbierta === seccion.key;
                const usados = seccion.insumos.filter(insumo => Number(cantidades[insumo.insumoId]) > 0).length;
                return (
                  <section key={seccion.key} style={S.consumptionAccordion}>
                    <button
                      type="button"
                      style={S.consumptionAccordionHeader}
                      aria-expanded={abierta}
                      onClick={() => setSeccionConsumoAbierta(abierta ? null : seccion.key)}
                    >
                      <span style={S.consumptionIcon}>{seccion.icon}</span>
                      <strong style={S.consumptionCategory}>{seccion.label}</strong>
                      <span style={S.reposicionCount}>{usados}/{seccion.insumos.length} en uso</span>
                      <span aria-hidden="true">{abierta ? '−' : '+'}</span>
                    </button>
                    {abierta && (
                      <div style={S.consumptionRows}>
                        {seccion.insumos.map(insumo => {
                          const disponible = Math.max(0, Number(insumo.cantidadActual) || 0);
                          const cantidad = Number(cantidades[insumo.insumoId]) || 0;
                          return (
                            <div key={insumo.insumoId} style={{ ...S.consumptionItem, ...(cantidad > 0 ? S.consumptionItemActive : {}) }}>
                              <div style={S.consumptionItemInfo}>
                                <strong>{nombreEquipoCanonico(insumo.nombre)}</strong>
                                <span style={S.available}>Disponible: {disponible} {insumo.unidadMedida || ''}</span>
                              </div>
                              {disponible <= 8 ? (
                                <div style={S.consumptionChoices} aria-label={`Cantidad de ${insumo.nombre}`}>
                                  {Array.from({ length: disponible + 1 }, (_, valor) => (
                                    <button
                                      key={valor}
                                      type="button"
                                      aria-pressed={cantidad === valor}
                                      style={{ ...S.consumptionChoice, ...(cantidad === valor ? S.consumptionChoiceActive : {}) }}
                                      onClick={() => actualizarCantidad(insumo.insumoId, valor, disponible)}
                                    >{valor}</button>
                                  ))}
                                </div>
                              ) : (
                                <select
                                  style={S.consumptionSelect}
                                  value={cantidad}
                                  onChange={event => actualizarCantidad(insumo.insumoId, event.target.value, disponible)}
                                  aria-label={`Cantidad de ${insumo.nombre}`}
                                >
                                  {Array.from({ length: disponible + 1 }, (_, valor) => <option key={valor} value={valor}>{valor}</option>)}
                                </select>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
              {seccionesConsumo.length === 0 && <p style={S.hint}>No hay consumibles cargados para este móvil.</p>}
            </div>
            <div style={S.consumptionActions}>
              <span style={S.consumptionFooterMeta}>{consumosElegidos.length ? `${consumosElegidos.length} insumos · ${totalUnidadesConsumo} unidades` : 'Elegí cantidades para registrar'}</span>
              <div style={S.modalActions}>
                <Button size="sm" variant="secondary" onClick={cerrarModal}>Cancelar</Button>
                <Button size="sm" onClick={registrarConsumo} disabled={!puedeRealizarOperacion || guardando || consumosElegidos.length === 0}>{guardando ? 'Guardando...' : 'Confirmar uso'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalReposicion && (
        <div style={S.overlay} onMouseDown={() => !guardandoReposicion && setModalReposicion(false)}>
          <div style={S.modal} onMouseDown={event => event.stopPropagation()}>
            <div style={S.modalHeader}>
              <div>
                <p style={S.sectionLabel}>Stock real contra estándar</p>
                <h2 style={S.modalTitle}>Solicitar reposición</h2>
              </div>
              <button style={S.closeButton} onClick={() => !guardandoReposicion && setModalReposicion(false)} aria-label="Cerrar">×</button>
            </div>
            {error && <div style={S.error}>{error}</div>}
            <div style={S.reposicionSummary}>
              <div><strong>{seleccionadosReposicion}</strong><span> insumos para reponer</span></div>
              <div><strong>{cambiosEquipoSeleccionados}</strong><span> cambios de equipo</span></div>
            </div>
            <section style={S.reposicionSection}>
              <div style={S.reposicionSectionIntro}>
                <span style={S.reposicionSectionIcon}>📦</span>
                <div>
                  <h3 style={S.reposicionSectionTitle}>Reposición de insumos</h3>
                  <p style={S.hint}>Las sugerencias por faltante ya están seleccionadas. Ajustá cantidades hasta el estándar.</p>
                </div>
              </div>
              <div style={S.reposicionAccordionList}>
                {seccionesReposicion.map(seccion => {
                  const seleccionados = seccion.insumos.filter(insumo => reposicionSeleccionados.includes(insumo.insumoId)).length;
                  const abierta = seccionReposicionAbierta === seccion.key;
                  return (
                    <section key={seccion.key} style={S.reposicionAccordion}>
                      <button
                        type="button"
                        style={S.reposicionAccordionHeader}
                        aria-expanded={abierta}
                        onClick={() => setSeccionReposicionAbierta(abierta ? null : seccion.key)}
                      >
                        <span style={S.reposicionSectionIcon}>{seccion.icon}</span>
                        <strong style={S.reposicionAccordionName}>{seccion.label}</strong>
                        <span style={S.reposicionCount}>{seleccionados}/{seccion.insumos.length}</span>
                        <span aria-hidden="true">{abierta ? '−' : '+'}</span>
                      </button>
                      {abierta && (
                        <div style={S.reposicionRows}>
                          {seccion.insumos.map(insumo => {
                            const seleccionado = reposicionSeleccionados.includes(insumo.insumoId);
                            return (
                              <div key={insumo.insumoId} style={{ ...S.reposicionItem, ...(seleccionado ? S.reposicionItemSelected : {}) }}>
                                <label style={S.reposicionCheckLabel}>
                                  <input
                                    type="checkbox"
                                    checked={seleccionado}
                                    onChange={() => alternarInsumoReposicion(insumo)}
                                    style={S.reposicionCheckbox}
                                  />
                                  <span style={S.reposicionItemInfo}>
                                    <strong>{insumo.nombre}{idsSugeridosReposicion.includes(insumo.insumoId) && <span style={S.suggestedBadge}>Sugerido</span>}</strong>
                                    <span style={S.available}>Actual: {insumo.cantidadActual} · Estándar: {insumo.cantidadRecomendada} {insumo.unidadMedida || ''}</span>
                                  </span>
                                </label>
                                {seleccionado && (
                                  <select
                                    style={S.reposicionQuantity}
                                    value={reposicionCantidades[insumo.insumoId] ?? 0}
                                    onChange={event => setReposicionCantidades(previo => ({ ...previo, [insumo.insumoId]: Number(event.target.value) }))}
                                    aria-label={`Cantidad a reponer de ${insumo.nombre}`}
                                  >
                                    {Array.from({ length: Math.max(0, insumo.cantidadRecomendada) + 1 }, (_, cantidad) => (
                                      <option key={cantidad} value={cantidad}>{cantidad}</option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })}
                {seccionesReposicion.length === 0 && <p style={S.hint}>No hay consumibles con cantidad estándar cargada para este móvil.</p>}
              </div>
            </section>

            <section style={S.equipmentChangeSection}>
              <button
                type="button"
                style={S.equipmentChangeHeader}
                aria-expanded={seccionReposicionAbierta === 'CAMBIO_EQUIPO'}
                onClick={() => setSeccionReposicionAbierta(seccionReposicionAbierta === 'CAMBIO_EQUIPO' ? null : 'CAMBIO_EQUIPO')}
              >
                <span style={S.reposicionSectionIcon}>🩺</span>
                <span style={S.equipmentChangeHeading}>
                  <strong>Cambio de equipo reutilizable</strong>
                  <small>Para roturas, faltantes, fallas, desgaste u otros motivos.</small>
                </span>
                <span style={S.reposicionCount}>{cambiosEquipoSeleccionados} seleccionados</span>
                <span aria-hidden="true">{seccionReposicionAbierta === 'CAMBIO_EQUIPO' ? '−' : '+'}</span>
              </button>
              {seccionReposicionAbierta === 'CAMBIO_EQUIPO' && (
                <div style={S.equipmentChangeList}>
                  {equiposReutilizables.map(insumo => {
                    const seleccionado = reposicionSeleccionados.includes(insumo.insumoId);
                    return (
                      <article key={insumo.insumoId} style={{ ...S.equipmentChangeItem, ...(seleccionado ? S.reposicionItemSelected : {}) }}>
                        <label style={S.reposicionCheckLabel}>
                          <input
                            type="checkbox"
                            checked={seleccionado}
                            onChange={() => alternarInsumoReposicion(insumo)}
                            style={S.reposicionCheckbox}
                          />
                          <span style={S.reposicionItemInfo}>
                            <strong>{nombreEquipoCanonico(insumo.nombre)}</strong>
                            <span style={S.available}>Actual: {insumo.cantidadActual} · Estándar: {insumo.cantidadRecomendada} {insumo.unidadMedida || ''} · Solicitud por 1 unidad</span>
                          </span>
                        </label>
                        {seleccionado && (
                          <div style={S.changeReasonBlock}>
                            <span style={S.changeReasonLabel}>Motivo del cambio</span>
                            <div style={S.changeReasonChoices}>
                              {MOTIVOS_CAMBIO_EQUIPO.map(motivo => (
                                <button
                                  key={motivo.value}
                                  type="button"
                                  aria-pressed={motivosCambioEquipo[insumo.insumoId] === motivo.value}
                                  style={{ ...S.changeReasonChip, ...(motivosCambioEquipo[insumo.insumoId] === motivo.value ? S.changeReasonChipActive : {}) }}
                                  onClick={() => setMotivosCambioEquipo(previo => ({ ...previo, [insumo.insumoId]: motivo.value }))}
                                >{motivo.label}</button>
                              ))}
                            </div>
                            {motivosCambioEquipo[insumo.insumoId] === 'OTRO' && (
                              <input
                                type="text"
                                maxLength={500}
                                value={detallesCambioEquipo[insumo.insumoId] || ''}
                                onChange={event => setDetallesCambioEquipo(previo => ({ ...previo, [insumo.insumoId]: event.target.value }))}
                                style={S.changeReasonNote}
                                placeholder="Describí el motivo para que logística pueda gestionarlo"
                              />
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                  {equiposReutilizables.length === 0 && <p style={S.hint}>No hay equipos reutilizables en el estándar de este móvil.</p>}
                </div>
              )}
            </section>
            <label style={S.label} htmlFor="observaciones-reposicion">Observaciones (opcional)</label>
            <textarea id="observaciones-reposicion" style={S.textarea} value={observacionesReposicion} onChange={event => setObservacionesReposicion(event.target.value)} placeholder="Información general para logística (opcional)" />
            <div style={S.modalActions}>
              <Button variant="secondary" onClick={() => setModalReposicion(false)}>Cancelar</Button>
              <Button onClick={crearReposicion} disabled={!puedeRealizarOperacion || guardandoReposicion || (seleccionadosReposicion === 0 && cambiosEquipoSeleccionados === 0)}>{guardandoReposicion ? 'Enviando...' : `Enviar solicitud (${seleccionadosReposicion + cambiosEquipoSeleccionados})`}</Button>
            </div>
          </div>
        </div>
      )}

      {usoDetalle && (
        <div style={S.overlay} onMouseDown={() => setUsoDetalle(null)}>
          <section style={S.detailModal} role="dialog" aria-modal="true" aria-labelledby="usage-detail-title"
            onMouseDown={event => event.stopPropagation()}>
            <header style={S.modalHeader}>
              <div>
                <p style={S.sectionLabel}>Historial de uso</p>
                <h2 id="usage-detail-title" style={S.modalTitle}>Detalle del registro</h2>
              </div>
              <button type="button" style={S.closeButton} onClick={() => setUsoDetalle(null)} aria-label="Cerrar">×</button>
            </header>
            {(() => {
              const primero = usoDetalle.registros[0];
              return (
                <>
                  <dl className="inventario-detail-grid" style={S.detailGrid}>
                    <DetailField label="Fecha y hora" value={formatearFecha(primero.fecha)} />
                    <DetailField label="Atención / incidente" value={primero.numeroIncidente
                      ? `N.º ${primero.numeroIncidente}${primero.incidenteUbicacion ? ` · ${primero.incidenteUbicacion}` : ''}`
                      : 'Sin atención asociada'} />
                    <DetailField label="Móvil" value={primero.movilNumeroInterno || '—'} />
                    <DetailField label="Enfermero" value={primero.enfermeroNombre || '—'} />
                  </dl>
                  <CompactTable headers={['Insumo', 'Cantidad']} rows={usoDetalle.registros.map(item => [
                    item.insumoNombre, item.cantidad,
                  ])} />
                  {primero.observaciones && <DetailNote title="Observaciones" text={primero.observaciones} />}
                  {primero.motivoExcepcionControl && (
                    <DetailNote title="Excepción por control incompleto"
                      text={`${primero.motivoExcepcionControl}${primero.usuarioExcepcionControl ? ` · ${primero.usuarioExcepcionControl}` : ''}${primero.fechaExcepcionControl ? ` · ${formatearFecha(primero.fechaExcepcionControl)}` : ''}`} />
                  )}
                </>
              );
            })()}
          </section>
        </div>
      )}

      {solicitudDetalle && (
        <div style={S.overlay} onMouseDown={() => setSolicitudDetalle(null)}>
          <section style={S.detailModal} role="dialog" aria-modal="true" aria-labelledby="request-detail-title"
            onMouseDown={event => event.stopPropagation()}>
            <header style={S.modalHeader}>
              <div>
                <p style={S.sectionLabel}>Solicitud N.º {solicitudDetalle.id}</p>
                <h2 id="request-detail-title" style={S.modalTitle}>Detalle de reposición</h2>
              </div>
              <button type="button" style={S.closeButton} onClick={() => setSolicitudDetalle(null)} aria-label="Cerrar">×</button>
            </header>
            <dl className="inventario-detail-grid" style={S.detailGrid}>
              <DetailField label="Fecha y hora" value={formatearFecha(solicitudDetalle.fecha)} />
              <DetailField label="Móvil" value={solicitudDetalle.movilNumeroInterno || '—'} />
              <DetailField label="Enfermero" value={solicitudDetalle.enfermeroNombre || '—'} />
              <DetailField label="Estado" value={etiquetaEstado(solicitudDetalle.estado)} />
            </dl>
            <h3 style={S.detailSectionTitle}>Insumos y cambios solicitados</h3>
            <div style={S.tableWrap}>
              <table className="inventario-data-table" style={S.dataTable}>
                <thead><tr><th>Insumo</th><th>Solicitado</th><th>Entregado</th><th>Pendiente</th></tr></thead>
                <tbody>{(solicitudDetalle.items || []).map(item => {
                  const reutilizable = item.tipo === 'REUTILIZABLE' || item.motivoCambio;
                  const solicitudAbierta = ['PENDIENTE', 'PARCIAL'].includes(solicitudDetalle.estado);
                  return (
                    <tr key={item.id}>
                      <td>
                        <strong>{nombreEquipoCanonico(item.insumoNombre)}</strong>
                        {reutilizable && <small style={S.detailSubtext}>
                          Cambio informativo{item.motivoCambio ? ` · ${etiquetaMotivoCambio(item.motivoCambio)}` : ''}
                          {item.detalleCambio ? `: ${item.detalleCambio}` : ''}
                        </small>}
                      </td>
                      <td>{reutilizable ? 'Cambio' : item.cantidadSolicitada}</td>
                      <td>{reutilizable ? '—' : item.cantidadEntregada || 0}</td>
                      <td>{reutilizable || !solicitudAbierta
                        ? '—'
                        : Math.max(0, item.cantidadSolicitada - (item.cantidadEntregada || 0))}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
            {solicitudDetalle.observaciones && <DetailNote title="Observaciones" text={solicitudDetalle.observaciones} />}
            {solicitudDetalle.motivoExcepcionControl && (
              <DetailNote title="Excepción por control incompleto"
                text={`${solicitudDetalle.motivoExcepcionControl}${solicitudDetalle.usuarioExcepcionControl ? ` · ${solicitudDetalle.usuarioExcepcionControl}` : ''}${solicitudDetalle.fechaExcepcionControl ? ` · ${formatearFecha(solicitudDetalle.fechaExcepcionControl)}` : ''}`} />
            )}
            {(solicitudDetalle.entregas || []).length > 0 && (
              <>
                <h3 style={S.detailSectionTitle}>Entregas realizadas</h3>
                <div style={S.tableWrap}>
                  <table className="inventario-data-table" style={S.dataTable}>
                    <thead><tr><th>Fecha y hora</th><th>Insumo</th><th>Cantidad</th><th>Detalle</th></tr></thead>
                    <tbody>{solicitudDetalle.entregas.map((entrega, index) => (
                      <tr key={`${entrega.fecha}-${index}`}>
                        <td>{formatearFecha(entrega.fecha)}</td>
                        <td>{entrega.insumoNombre}</td>
                        <td>{entrega.cantidad}</td>
                        <td>{entrega.detalle}{entrega.usuario ? ` · ${entrega.usuario}` : ''}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </>
            )}
            {solicitudDetalle.motivoResolucion && <DetailNote title="Motivo de resolución" text={solicitudDetalle.motivoResolucion} />}
          </section>
        </div>
      )}
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div style={S.detailField}>
      <dt style={S.detailLabel}>{label}</dt>
      <dd style={S.detailValue}>{value}</dd>
    </div>
  );
}

function DetailNote({ title, text }) {
  return <section className="detailNote" style={S.detailNote}><strong>{title}</strong><p>{text}</p></section>;
}

function CompactTable({ headers, rows }) {
  return (
    <div style={S.tableWrap}>
      <table className="inventario-data-table" style={S.dataTable}>
        <thead><tr>{headers.map(header => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function etiquetaEstado(estado) {
  return ({
    PENDIENTE: 'Pendiente',
    PARCIAL: 'Parcial',
    COMPLETADA: 'Completada',
    RECHAZADA: 'Rechazada',
    CANCELADA: 'Cancelada',
  }[estado] || estado);
}

function estiloEstado(estado) {
  if (estado === 'PENDIENTE') return S.pendingBadge;
  if (estado === 'PARCIAL') return S.partialBadge;
  if (estado === 'COMPLETADA') return S.completedBadge;
  if (estado === 'RECHAZADA') return S.rejectedBadge;
  return S.cancelledBadge;
}

function etiquetaMotivoCambio(motivo) {
  return MOTIVOS_CAMBIO_EQUIPO.find(item => item.value === motivo)?.label || motivo;
}

function nombreEquipoCanonico(nombre) {
  return nombre?.toLocaleLowerCase('es-AR') === 'desfibrilador'
    ? 'Cardiodesfibrilador' : nombre;
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
}

function formatearDia(fecha) {
  return new Date(fecha).toLocaleDateString('es-AR', { dateStyle: 'medium' });
}

function formatearHora(fecha) {
  return new Date(fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

const S = {
  page: { display: 'flex', minHeight: '100vh', background: 'var(--color-page-bg)', color: 'var(--color-text-primary)' },
  main: { flex: 1, minWidth: 0, padding: 'var(--spacing-7)', maxWidth: 'var(--max-content-width)', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-5)', padding: 'var(--spacing-6)', marginBottom: 'var(--spacing-6)', background: 'var(--color-primary)', borderRadius: 'var(--radius-xl)', color: 'var(--color-on-primary)', boxShadow: 'var(--shadow-md)' },
  overline: { margin: '0 0 var(--spacing-2)', color: 'rgba(255,255,255,0.72)', fontSize: 'var(--font-size-xs)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' },
  h1: { margin: 0, color: 'var(--color-on-primary)', fontSize: 'var(--font-size-4xl)', lineHeight: 'var(--line-height-heading)' },
  sub: { margin: 'var(--spacing-2) 0 0', color: 'rgba(255,255,255,0.86)', fontSize: 'var(--font-size-md)' },
  headerActions: { display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' },
  btnHeader: { padding: '0.75rem 1rem', color: 'var(--color-primary-strong)', background: 'var(--color-surface)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 700 },
  btnDisabled: { opacity: 0.48, cursor: 'not-allowed' },
  headerIcon: { display: 'grid', placeItems: 'center', width: '4.5rem', height: '4.5rem', flexShrink: 0, borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.16)', fontSize: '2.2rem' },
  success: { marginBottom: 'var(--spacing-5)', padding: 'var(--spacing-4) var(--spacing-5)', color: 'var(--color-success)', background: '#eaf7ef', border: '1px solid #b9e4c8', borderRadius: 'var(--radius-md)' },
  error: { marginBottom: 'var(--spacing-4)', padding: 'var(--spacing-4) var(--spacing-5)', color: 'var(--color-danger)', background: '#fff0f0', border: '1px solid #f1c6c6', borderRadius: 'var(--radius-md)' },
  status: { padding: 'var(--spacing-7)', textAlign: 'center', color: 'var(--color-text-secondary)' },
  tabs: { display: 'flex', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-5)', borderBottom: '1px solid var(--color-border)' },
  controlNotice: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(13rem, 0.42fr)', gap: 'var(--spacing-3)', alignItems: 'center', marginBottom: 'var(--spacing-4)', padding: 'var(--spacing-3) var(--spacing-4)', background: '#fff8e8', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)' },
  controlNoticeText: { margin: '0.2rem 0 0', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' },
  exceptionToggle: { display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', fontSize: 'var(--font-size-sm)', fontWeight: 700 },
  exceptionInput: { gridColumn: '1 / -1', width: '100%', boxSizing: 'border-box', resize: 'vertical', padding: '0.55rem 0.7rem', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)', font: 'inherit' },
  tab: { padding: '0.8rem 1rem', color: 'var(--color-text-secondary)', background: 'transparent', border: 'none', borderBottom: '3px solid transparent', cursor: 'pointer', fontWeight: 700 },
  tabActive: { color: 'var(--color-primary-strong)', borderBottomColor: 'var(--color-primary)' },
  categoryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(19rem, 1fr))', gap: 'var(--spacing-5)' },
  category: { overflow: 'hidden', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' },
  categoryHeader: { display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', padding: 'var(--spacing-4) var(--spacing-5)', background: 'var(--color-surface-alt)', borderBottom: '1px solid var(--color-border)' },
  categoryIcon: { fontSize: '1.35rem' },
  categoryTitle: { flex: 1, margin: 0, fontSize: 'var(--font-size-lg)' },
  count: { minWidth: '1.6rem', padding: '0.2rem 0.4rem', textAlign: 'center', color: 'var(--color-primary-strong)', background: 'var(--color-primary-soft)', borderRadius: 'var(--radius-pill)', fontSize: 'var(--font-size-xs)', fontWeight: 700 },
  itemList: { padding: '0 var(--spacing-5)' },
  item: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-4)', padding: 'var(--spacing-4) 0', borderBottom: '1px solid var(--color-border)' },
  itemInfo: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-2)', minWidth: 0 },
  itemName: { fontSize: 'var(--font-size-md)', fontWeight: 600 },
  reusable: { padding: '0.2rem 0.45rem', color: 'var(--color-info)', background: '#e8f3fb', borderRadius: 'var(--radius-pill)', fontSize: 'var(--font-size-xxs)', fontWeight: 700 },
  quantity: { display: 'flex', alignItems: 'baseline', gap: '0.3rem', flexShrink: 0, color: 'var(--color-text-secondary)' },
  historyList: { display: 'grid', gap: 'var(--spacing-5)' },
  filterBar: { display: 'flex', alignItems: 'end', flexWrap: 'wrap', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-3)', padding: 'var(--spacing-3)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' },
  filterField: { display: 'grid', gap: '0.25rem', minWidth: '12rem', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', fontWeight: 700 },
  filterInput: { minHeight: '2.35rem', boxSizing: 'border-box', padding: '0.4rem 0.6rem', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-primary)', background: 'var(--color-surface)', font: 'inherit' },
  tableWrap: { width: '100%', overflowX: 'auto', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' },
  dataTable: { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' },
  detailButton: { padding: '0.38rem 0.65rem', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-sm)', color: 'var(--color-primary-strong)', background: 'var(--color-surface)', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  detailModal: { width: 'min(100%, 54rem)', maxHeight: '88vh', overflowY: 'auto', padding: 'var(--spacing-5)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--spacing-3)', margin: '0 0 var(--spacing-4)' },
  detailField: { minWidth: 0, padding: '0.55rem 0.7rem', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-sm)' },
  detailLabel: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', fontWeight: 700 },
  detailValue: { margin: '0.2rem 0 0', overflowWrap: 'anywhere', fontSize: 'var(--font-size-sm)' },
  detailSectionTitle: { margin: 'var(--spacing-4) 0 var(--spacing-2)', fontSize: 'var(--font-size-md)' },
  detailSubtext: { display: 'block', marginTop: '0.2rem', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' },
  detailNote: { marginTop: 'var(--spacing-3)', padding: 'var(--spacing-3)', background: 'var(--color-surface-alt)', borderLeft: '3px solid var(--color-primary)', borderRadius: 'var(--radius-sm)' },
  historyCard: { padding: 'var(--spacing-5)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' },
  historyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-4)' },
  historyTitle: { margin: 'var(--spacing-1) 0 0', fontSize: 'var(--font-size-lg)' },
  historyMeta: { margin: 'var(--spacing-3) 0', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' },
  loteBadge: { padding: '0.3rem 0.55rem', color: 'var(--color-primary-strong)', background: 'var(--color-primary-soft)', borderRadius: 'var(--radius-pill)', fontSize: 'var(--font-size-xs)', fontWeight: 700 },
  historyItems: { display: 'grid', gap: 'var(--spacing-2)' },
  historyItem: { display: 'flex', justifyContent: 'space-between', padding: 'var(--spacing-3)', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-sm)' },
  overlay: { position: 'fixed', inset: 0, zIndex: 'var(--z-modal)', display: 'grid', placeItems: 'center', padding: 'var(--spacing-5)', background: 'rgba(15,42,48,0.48)' },
  modal: { width: 'min(100%, 48rem)', maxHeight: '90vh', overflowY: 'auto', padding: 'var(--spacing-6)', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-5)' },
  modalTitle: { margin: 'var(--spacing-1) 0 0', fontSize: 'var(--font-size-2xl)' },
  closeButton: { alignSelf: 'flex-start', color: 'var(--color-text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.8rem', lineHeight: 1 },
  sectionLabel: { margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' },
  label: { display: 'block', margin: '0 0 var(--spacing-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', fontWeight: 700 },
  input: { width: '100%', boxSizing: 'border-box', marginBottom: 'var(--spacing-5)', padding: '0.75rem', color: 'var(--color-text-primary)', background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-md)' },
  reposicionSummary: { display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap', padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' },
  reposicionSection: { display: 'grid', gap: 'var(--spacing-3)' },
  reposicionSectionIntro: { display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-3)' },
  reposicionSectionIcon: { flex: '0 0 auto', width: '2.4rem', height: '2.4rem', display: 'grid', placeItems: 'center', background: 'var(--color-primary-soft)', borderRadius: 'var(--radius-sm)', fontSize: '1.15rem' },
  reposicionSectionTitle: { margin: 0, fontSize: 'var(--font-size-md)' },
  reposicionAccordionList: { display: 'grid', gap: 'var(--spacing-2)' },
  reposicionAccordion: { overflow: 'hidden', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' },
  reposicionAccordionHeader: { width: '100%', minHeight: '48px', display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', padding: 'var(--spacing-2) var(--spacing-3)', textAlign: 'left', background: 'var(--color-surface)', border: 'none', cursor: 'pointer', color: 'var(--color-text-primary)' },
  reposicionAccordionName: { flex: 1 },
  reposicionCount: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', whiteSpace: 'nowrap' },
  reposicionRows: { display: 'grid', borderTop: '1px solid var(--color-border)' },
  reposicionItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-3)', padding: 'var(--spacing-3)', borderBottom: '1px solid var(--color-border)' },
  reposicionItemSelected: { background: 'var(--color-primary-soft)' },
  reposicionCheckLabel: { minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', cursor: 'pointer' },
  reposicionCheckbox: { width: '1.2rem', height: '1.2rem', flex: '0 0 auto', accentColor: 'var(--color-primary)' },
  reposicionItemInfo: { minWidth: 0, display: 'grid', gap: '0.2rem' },
  suggestedBadge: { display: 'inline-block', marginLeft: 'var(--spacing-2)', padding: '0.12rem 0.4rem', color: 'var(--color-success-strong)', background: 'var(--color-success-soft)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-xxs)', verticalAlign: 'middle' },
  reposicionQuantity: { width: '5.5rem', minHeight: '42px', padding: '0.45rem', textAlign: 'center', color: 'var(--color-text-primary)', background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)' },
  equipmentChangeSection: { overflow: 'hidden', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-sm)', background: 'var(--color-warning-soft)' },
  equipmentChangeHeader: { width: '100%', minHeight: '62px', display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', padding: 'var(--spacing-3)', textAlign: 'left', color: 'var(--color-text-primary)', background: 'transparent', border: 'none', cursor: 'pointer' },
  equipmentChangeHeading: { flex: 1, minWidth: 0, display: 'grid', gap: '0.2rem' },
  equipmentChangeList: { display: 'grid', gap: 'var(--spacing-2)', padding: 'var(--spacing-3)', borderTop: '1px solid var(--color-warning)' },
  equipmentChangeItem: { display: 'grid', gap: 'var(--spacing-3)', padding: 'var(--spacing-3)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' },
  changeReasonBlock: { display: 'grid', gap: 'var(--spacing-2)', paddingLeft: '2rem' },
  changeReasonLabel: { color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', fontWeight: 700 },
  changeReasonChoices: { display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)' },
  changeReasonChip: { minHeight: '40px', padding: '0.45rem 0.7rem', color: 'var(--color-text-primary)', background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700 },
  changeReasonChipActive: { color: 'var(--color-on-primary)', background: 'var(--color-primary)', borderColor: 'var(--color-primary)' },
  changeReasonNote: { width: '100%', minHeight: '42px', boxSizing: 'border-box', padding: '0.6rem', color: 'var(--color-text-primary)', background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)' },
  requestReason: { display: 'block', marginTop: '0.2rem', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' },
  consumableList: { display: 'grid', gap: 'var(--spacing-2)', maxHeight: '22rem', overflowY: 'auto', marginBottom: 'var(--spacing-5)' },
  consumableRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--spacing-4)', padding: 'var(--spacing-3)', background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' },
  consumableInfo: { display: 'grid', gap: '0.2rem', minWidth: 0 },
  available: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' },
  quantityInput: { width: '5rem', padding: '0.6rem', textAlign: 'center', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-md)' },
  consumptionSummary: { display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-3)', padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' },
  consumptionSections: { display: 'grid', alignContent: 'start', gap: 'var(--spacing-2)', maxHeight: 'min(48vh, 28rem)', overflowY: 'auto' },
  consumptionAccordion: { overflow: 'hidden', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' },
  consumptionAccordionHeader: { width: '100%', minHeight: '48px', display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', padding: 'var(--spacing-2) var(--spacing-3)', textAlign: 'left', color: 'var(--color-text-primary)', background: 'var(--color-surface)', border: 'none', cursor: 'pointer' },
  consumptionIcon: { width: '2rem', height: '2rem', flex: '0 0 auto', display: 'grid', placeItems: 'center', background: 'var(--color-primary-soft)', borderRadius: 'var(--radius-sm)' },
  consumptionCategory: { flex: 1, minWidth: 0 },
  consumptionRows: { display: 'grid', borderTop: '1px solid var(--color-border)' },
  consumptionItem: { display: 'grid', gap: 'var(--spacing-2)', padding: 'var(--spacing-3)', borderBottom: '1px solid var(--color-border)' },
  consumptionItemActive: { background: 'var(--color-primary-soft)' },
  consumptionItemInfo: { minWidth: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--spacing-2)', flexWrap: 'wrap' },
  consumptionChoices: { display: 'flex', gap: '0.35rem', flexWrap: 'wrap' },
  consumptionChoice: { minWidth: '40px', minHeight: '40px', padding: '0.35rem', color: 'var(--color-text-primary)', background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700 },
  consumptionChoiceActive: { color: 'var(--color-on-primary)', background: 'var(--color-primary)', borderColor: 'var(--color-primary)' },
  consumptionSelect: { width: '100%', minHeight: '42px', padding: '0.5rem 0.7rem', color: 'var(--color-text-primary)', background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)' },
  consumptionActions: { position: 'sticky', bottom: '-1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-3)', flexWrap: 'wrap', margin: '0 calc(-1 * var(--spacing-6)) calc(-1 * var(--spacing-6))', padding: 'var(--spacing-3) var(--spacing-6)', background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' },
  consumptionFooterMeta: { color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)', flexWrap: 'wrap' },
  manualRow: { display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--spacing-2)', alignItems: 'start' },
  btnSecondary: { padding: '0.7rem 0.9rem', color: 'var(--color-primary-strong)', background: 'var(--color-primary-soft)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 700 },
  hint: { margin: 'var(--spacing-1) 0 0', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' },
  textarea: { width: '100%', minHeight: '5rem', boxSizing: 'border-box', marginBottom: 'var(--spacing-5)', padding: '0.75rem', resize: 'vertical', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-md)', fontFamily: 'inherit', fontSize: 'var(--font-size-md)' },
  removeButton: { color: 'var(--color-danger)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.3rem' },
  statusBadge: { padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-pill)', fontSize: 'var(--font-size-xs)', fontWeight: 700 },
  pendingBadge: { color: '#8a5a00', background: '#fff3d6' },
  partialBadge: { color: 'var(--color-primary-strong)', background: 'var(--color-primary-soft)' },
  rejectedBadge: { color: 'var(--color-danger-strong)', background: 'var(--color-danger-soft)' },
  cancelledBadge: { color: 'var(--color-text-muted)', background: 'var(--color-surface-muted)' },
  cancelButton: { marginTop: 'var(--spacing-4)', padding: '0.6rem 0.85rem', color: 'var(--color-danger)', background: 'transparent', border: '1px solid #e4bcbc', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 700 },
  completedBadge: { color: 'var(--color-success-strong)', background: 'var(--color-success-soft)' },
};
