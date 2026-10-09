import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { incidenteService, inventarioService } from '../services/api';

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
  const [inventario, setInventario] = useState([]);
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

  useEffect(() => {
    cargarInventario();
    cargarHistorial();
    cargarSolicitudes();
  }, []);

  useEffect(() => {
    if (location.state?.abrirReposicion) {
      abrirModalReposicion();
    }
  }, [location.state]);

  const cargarInventario = async () => {
    try {
      const response = await inventarioService.miInventario();
      setInventario(response.data);
      setGuardiaActiva(true);
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
    setError('');
    setMensaje('');
    setCantidades({});
    setIncidenteId('');
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
    const equiposCambio = reposicionSeleccionados
      .map(insumoId => inventario.find(insumo => insumo.insumoId === insumoId))
      .filter(insumo => insumo?.tipo === 'REUTILIZABLE');
    const equipoIncompleto = equiposCambio.find(insumo => (
      !motivosCambioEquipo[insumo.insumoId]
      || (motivosCambioEquipo[insumo.insumoId] === 'OTRO' && !detallesCambioEquipo[insumo.insumoId]?.trim())
    ));
    if (equipoIncompleto) {
      setError(`Completá el motivo de cambio para ${equipoIncompleto.nombre}.`);
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

  const cancelarSolicitud = async (id) => {
    if (!window.confirm('¿Querés cancelar esta solicitud de reposición?')) return;
    try {
      await inventarioService.cancelarSolicitud(id);
      setMensaje('Solicitud cancelada correctamente.');
      await cargarSolicitudes();
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo cancelar la solicitud.');
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
  const grupos = CATEGORIAS.map(categoria => ({
    ...categoria,
    insumos: inventario.filter(insumo => insumo.categoria === categoria.key),
  })).filter(categoria => categoria.insumos.length > 0);
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
            {guardiaActiva && <button style={S.btnHeader} onClick={abrirModal}>📦 Registrar uso</button>}
            {guardiaActiva && <button style={S.btnHeader} onClick={abrirModalReposicion}>📋 Solicitar reposición</button>}
            <div style={S.headerIcon}>🎒</div>
          </div>
        </header>

        {mensaje && <div style={S.success}>{mensaje}</div>}
        {error && !modalAbierto && <div style={S.error}>{error}</div>}

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
              inventario.length === 0
                ? <EmptyState icon="📦" title="Inventario sin cargar" description="El móvil todavía no tiene insumos inicializados." />
                : <div style={S.categoryGrid}>
                  {grupos.map(categoria => (
                    <section key={categoria.key} style={S.category}>
                      <div style={S.categoryHeader}>
                        <span style={S.categoryIcon}>{categoria.icon}</span>
                        <h2 style={S.categoryTitle}>{categoria.label}</h2>
                        <span style={S.count}>{categoria.insumos.length}</span>
                      </div>
                      <div style={S.itemList}>
                        {categoria.insumos.map(insumo => (
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
                    </section>
                  ))}
                </div>
            )}

            {vista === 'historial' && (
              loadingHistorial
                ? <div style={S.status}>Cargando historial...</div>
                : lotes.length === 0
                  ? <EmptyState icon="🧾" title="Sin registros de uso" description="Todavía no hay consumos registrados para este móvil." />
                  : <div style={S.historyList}>{lotes.map(lote => <LoteCard key={lote.loteId} lote={lote} />)}</div>
            )}

            {vista === 'solicitudes' && (
              loadingSolicitudes
                ? <div style={S.status}>Cargando solicitudes...</div>
                : solicitudes.length === 0
                  ? <EmptyState icon="📋" title="Sin solicitudes" description="Todavía no enviaste solicitudes de reposición." />
                  : <div style={S.historyList}>{solicitudes.map(solicitud => (
                    <SolicitudCard key={solicitud.id} solicitud={solicitud} onCancelar={cancelarSolicitud} />
                  ))}</div>
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
                  #{atencion.numeroIncidente || atencion.id} — {atencion.ubicacion}
                </option>
              ))}
            </select>
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
                                <strong>{insumo.nombre}</strong>
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
                <Button size="sm" onClick={registrarConsumo} disabled={guardando || consumosElegidos.length === 0}>{guardando ? 'Guardando...' : 'Confirmar uso'}</Button>
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
                            <strong>{insumo.nombre}</strong>
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
              <Button onClick={crearReposicion} disabled={guardandoReposicion || (seleccionadosReposicion === 0 && cambiosEquipoSeleccionados === 0)}>{guardandoReposicion ? 'Enviando...' : `Enviar solicitud (${seleccionadosReposicion + cambiosEquipoSeleccionados})`}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoteCard({ lote }) {
  const primero = lote.registros[0];
  return (
    <section style={S.historyCard}>
      <div style={S.historyHeader}>
        <div>
          <p style={S.sectionLabel}>Lote de uso</p>
          <h2 style={S.historyTitle}>{formatearFecha(primero.fecha)}</h2>
        </div>
        <span style={S.loteBadge}>{lote.registros.length} insumo{lote.registros.length !== 1 ? 's' : ''}</span>
      </div>
      <p style={S.historyMeta}>
        {primero.enfermeroNombre} · {primero.incidenteId ? `Atención #${primero.incidenteId}${primero.incidenteUbicacion ? ` · ${primero.incidenteUbicacion}` : ''}` : 'Sin atención asociada'}
      </p>
      <div style={S.historyItems}>
        {lote.registros.map(registro => (
          <div key={registro.id} style={S.historyItem}><span>{registro.insumoNombre}</span><strong>{registro.cantidad}</strong></div>
        ))}
      </div>
    </section>
  );
}

function SolicitudCard({ solicitud, onCancelar }) {
  const pendiente = solicitud.estado === 'PENDIENTE';
  const estadoSolicitud = {
    PENDIENTE: 'Pendiente',
    PARCIAL: 'Entrega parcial',
    COMPLETADA: 'Completada',
    RECHAZADA: 'Rechazada',
    CANCELADA: 'Cancelada',
  }[solicitud.estado] || solicitud.estado;
  return (
    <section style={S.historyCard}>
      <div style={S.historyHeader}>
        <div>
          <p style={S.sectionLabel}>Solicitud #{solicitud.id}</p>
          <h2 style={S.historyTitle}>{formatearFecha(solicitud.fecha)}</h2>
        </div>
        <span style={{ ...S.statusBadge, ...(pendiente ? S.pendingBadge : solicitud.estado === 'PARCIAL' ? S.partialBadge : solicitud.estado === 'RECHAZADA' ? S.rejectedBadge : S.cancelledBadge) }}>{estadoSolicitud}</span>
      </div>
      {solicitud.observaciones && <p style={S.historyMeta}>{solicitud.observaciones}</p>}
      {solicitud.motivoResolucion && <p style={S.historyMeta}>Motivo: {solicitud.motivoResolucion}</p>}
      {solicitud.usuarioUltimaGestion && <p style={S.historyMeta}>Última gestión: {solicitud.usuarioUltimaGestion} · {formatearFecha(solicitud.fechaUltimaGestion)}</p>}
      <div style={S.historyItems}>
        {solicitud.items.map((item, index) => (
          <div key={`${item.insumoNombre}-${index}`} style={S.historyItem}>
            <span>
              {item.insumoNombre}
              {item.motivoCambio && <small style={S.requestReason}>{MOTIVOS_CAMBIO_EQUIPO.find(motivo => motivo.value === item.motivoCambio)?.label || item.motivoCambio}{item.detalleCambio ? ` · ${item.detalleCambio}` : ''}</small>}
            </span>
            <strong>{item.motivoCambio ? `Cambio · entregado ${item.cantidadEntregada || 0}/1` : `Entregado ${item.cantidadEntregada || 0}/${item.cantidadSolicitada}`}</strong>
          </div>
        ))}
      </div>
      {pendiente && <button style={S.cancelButton} onClick={() => onCancelar(solicitud.id)}>Cancelar solicitud</button>}
    </section>
  );
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
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
  headerIcon: { display: 'grid', placeItems: 'center', width: '4.5rem', height: '4.5rem', flexShrink: 0, borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.16)', fontSize: '2.2rem' },
  success: { marginBottom: 'var(--spacing-5)', padding: 'var(--spacing-4) var(--spacing-5)', color: 'var(--color-success)', background: '#eaf7ef', border: '1px solid #b9e4c8', borderRadius: 'var(--radius-md)' },
  error: { marginBottom: 'var(--spacing-4)', padding: 'var(--spacing-4) var(--spacing-5)', color: 'var(--color-danger)', background: '#fff0f0', border: '1px solid #f1c6c6', borderRadius: 'var(--radius-md)' },
  status: { padding: 'var(--spacing-7)', textAlign: 'center', color: 'var(--color-text-secondary)' },
  tabs: { display: 'flex', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-5)', borderBottom: '1px solid var(--color-border)' },
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
};
