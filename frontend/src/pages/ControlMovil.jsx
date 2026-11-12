import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { controlService, guardiaService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './ControlMovil.css';

const CATEGORIAS = [
  { key: 'MEDICACION', label: 'Medicación', icon: '💊' },
  { key: 'SOLUCION', label: 'Soluciones', icon: '💧' },
  { key: 'DESCARTABLE', label: 'Descartables', icon: '🧤' },
  { key: 'CURACION', label: 'Curación', icon: '🩹' },
  { key: 'ANTISEPTICO', label: 'Antisépticos', icon: '🧴' },
  { key: 'MONITOREO', label: 'Monitoreo', icon: '📟' },
  { key: 'VIA_AEREA', label: 'Vía aérea', icon: '🫁' },
  { key: 'KIT', label: 'Kits', icon: '🧰' },
  { key: 'EQUIPO_MEDICO', label: 'Equipos médicos', icon: '🩺' },
];

const ESTADOS_EQUIPO = [
  { value: 'OPERATIVO', label: 'Operativo' },
  { value: 'DEFECTUOSO', label: 'Defectuoso' },
  { value: 'FALTANTE', label: 'Faltante' },
];
const MOTIVOS = ['Agotado', 'Vencido', 'Roto/dañado', 'Sin reponer'];
const COLLATOR_NATURAL = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });

export default function ControlMovil() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState('nuevo');
  const [plantilla, setPlantilla] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardiaActiva, setGuardiaActiva] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [cantidadPorInsumo, setCantidadPorInsumo] = useState({});
  const [estadoPorInsumo, setEstadoPorInsumo] = useState({});
  const [observacionPorInsumo, setObservacionPorInsumo] = useState({});
  const [motivoPorInsumo, setMotivoPorInsumo] = useState({});
  const [notaAbiertaPorInsumo, setNotaAbiertaPorInsumo] = useState({});
  const [masAbiertoPorInsumo, setMasAbiertoPorInsumo] = useState({});
  const [numeroSeriePorInsumo, setNumeroSeriePorInsumo] = useState({});
  const [equipoNoCoincidePorInsumo, setEquipoNoCoincidePorInsumo] = useState({});
  const [equipoObservadoPorInsumo, setEquipoObservadoPorInsumo] = useState({});
  const [testPorInsumo, setTestPorInsumo] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [misControles, setMisControles] = useState([]);
  const [loadingMis, setLoadingMis] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);
  const [movilId, setMovilId] = useState(null);
  const [guardiaActual, setGuardiaActual] = useState(null);
  const [borradorListo, setBorradorListo] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const referenciasSecciones = useRef({});
  const claveBorrador = user?.username && movilId
    ? `sigem:control-movil:${user.username}:${movilId}`
    : null;

  useEffect(() => {
    cargarPlantilla();
    cargarMisControles();
  }, []);

  const cargarPlantilla = async () => {
    try {
      const [plantillaResponse, guardiasResponse] = await Promise.all([
        controlService.plantilla(),
        guardiaService.listar(),
      ]);
      const items = Array.isArray(plantillaResponse.data) ? plantillaResponse.data : [];
      const guardia = (guardiasResponse.data || []).find((item) => item.estado === 'ACTIVA');
      const idMovil = guardia?.movil?.id;
      setGuardiaActual(guardia || null);
      const draftKey = user?.username && idMovil
        ? `sigem:control-movil:${user.username}:${idMovil}`
        : null;
      let borrador = null;
      if (draftKey) {
        try {
          borrador = JSON.parse(sessionStorage.getItem(draftKey) || 'null');
        } catch {
          sessionStorage.removeItem(draftKey);
        }
      }

      setPlantilla(items);
      setMovilId(idMovil || null);
      const estadoInicial = { ...(borrador?.estadoPorInsumo || {}) };
      const cantidadesIniciales = { ...(borrador?.cantidadPorInsumo || {}) };
      const seriesIniciales = { ...(borrador?.numeroSeriePorInsumo || {}) };
      items.forEach((item) => {
        if (item.tipo === 'REUTILIZABLE') {
          const esEquipoMedicoAsignable = Boolean(item.tipoEquipoSnapshot);
          const tieneAsignacionVigente = Boolean(item.asignacionEquipoId && item.equipoMedicoId);
          if (esEquipoMedicoAsignable && !tieneAsignacionVigente) {
            estadoInicial[item.insumoId] = 'FALTANTE';
          } else {
            estadoInicial[item.insumoId] ||= 'OPERATIVO';
          }
          if (item.requiereSerie) {
            seriesIniciales[item.insumoId] = esEquipoMedicoAsignable
              ? item.ultimoNumeroSerie || ''
              : seriesIniciales[item.insumoId] || item.ultimoNumeroSerie || '';
          }
        } else {
          if (!(item.insumoId in cantidadesIniciales)) cantidadesIniciales[item.insumoId] = '';
        }
      });
      setEstadoPorInsumo(estadoInicial);
      setCantidadPorInsumo(cantidadesIniciales);
      setNumeroSeriePorInsumo(seriesIniciales);
      setEquipoNoCoincidePorInsumo({});
      setEquipoObservadoPorInsumo({});
      setTestPorInsumo(borrador?.testPorInsumo || {});
      setObservacionPorInsumo(borrador?.observacionPorInsumo || {});
      setMotivoPorInsumo(borrador?.motivoPorInsumo || {});
      setNotaAbiertaPorInsumo(borrador?.notaAbiertaPorInsumo || {});
      setMasAbiertoPorInsumo(borrador?.masAbiertoPorInsumo || {});
      setObservaciones(borrador?.observaciones || '');
      setBorradorListo(Boolean(draftKey));
      setGuardiaActiva(true);
    } catch (exception) {
      const message = String(exception.response?.data?.message || '');
      const normalizedMessage = message.toLowerCase();

      if (normalizedMessage.includes('guardia') || normalizedMessage.includes('móvil') || normalizedMessage.includes('movil')) {
        setGuardiaActiva(false);
        setError('');
      } else if (message) {
        setError(message);
      } else {
        setError('No se pudo cargar la plantilla del control.');
      }
    } finally {
      setLoading(false);
    }
  };

  const cargarMisControles = async () => {
    setLoadingMis(true);
    try {
      const response = await controlService.mis();
      setMisControles(response.data || []);
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudieron cargar tus controles.');
    } finally {
      setLoadingMis(false);
    }
  };

  const grupos = useMemo(() => {
    const conocidos = new Set(CATEGORIAS.map(({ key }) => key));
    const secciones = CATEGORIAS.map((categoria) => ({
      ...categoria,
      insumos: plantilla.filter((item) => item.categoria === categoria.key),
    })).filter((grupo) => grupo.insumos.length > 0);
    const otros = plantilla.filter((item) => !conocidos.has(item.categoria));
    if (otros.length) secciones.push({ key: 'OTROS', label: 'Otros', icon: '＋', insumos: otros });
    return secciones;
  }, [plantilla]);

  const completitudPorId = useMemo(() => new Map(plantilla.map((item) => {
    const id = item.insumoId;
    if (item.tipo === 'CONSUMIBLE') {
      const cantidad = cantidadPorInsumo[id];
      return [id, cantidad !== '' && Number.isInteger(Number(cantidad)) && Number(cantidad) >= 0];
    }
    const estado = estadoPorInsumo[id];
    const completa = estado === 'FALTANTE' || (Boolean(estado)
      && (!item.requiereSerie || Boolean(numeroSeriePorInsumo[id]?.trim()))
      && (!item.requiereTest || typeof testPorInsumo[id] === 'boolean'));
    return [id, completa];
  })), [plantilla, cantidadPorInsumo, estadoPorInsumo, numeroSeriePorInsumo, testPorInsumo]);
  const itemCompleto = (item) => completitudPorId.get(item.insumoId) === true;

  const seccionesConEstado = useMemo(() => grupos.map((grupo) => {
    const completadosSeccion = grupo.insumos.filter((item) => completitudPorId.get(item.insumoId) === true).length;
    const completa = completadosSeccion === grupo.insumos.length;
    const conNovedades = completa && grupo.insumos.some((item) => {
      if (item.tipo === 'CONSUMIBLE') return Number(cantidadPorInsumo[item.insumoId]) < item.cantidadRecomendada;
      return estadoPorInsumo[item.insumoId] !== 'OPERATIVO' || testPorInsumo[item.insumoId] === false;
    });
    return { ...grupo, completados: completadosSeccion, completa, conNovedades };
  }), [grupos, completitudPorId, cantidadPorInsumo, estadoPorInsumo, testPorInsumo]);
  const currentCategory = seccionesConEstado[currentIndex] ?? null;
  const seccionAbierta = currentCategory?.key ?? null;

  const completados = [...completitudPorId.values()].filter(Boolean).length;
  const pendientesPorSeccion = seccionesConEstado
    .filter((seccion) => !seccion.completa)
    .map((seccion) => ({
      key: seccion.key,
      label: seccion.label,
      items: seccion.insumos.filter((item) => !itemCompleto(item)).map((item) => item.nombre),
    }));

  useEffect(() => {
    setCurrentIndex((previo) => Math.min(previo, Math.max(seccionesConEstado.length - 1, 0)));
  }, [seccionesConEstado.length]);

  useEffect(() => {
    if (!seccionAbierta) return;
    referenciasSecciones.current[seccionAbierta]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentIndex, seccionAbierta]);

  useEffect(() => {
    if (!claveBorrador || !borradorListo || resultado) return;
    sessionStorage.setItem(claveBorrador, JSON.stringify({
      cantidadPorInsumo,
      estadoPorInsumo,
      observacionPorInsumo,
      motivoPorInsumo,
      notaAbiertaPorInsumo,
      masAbiertoPorInsumo,
      numeroSeriePorInsumo,
      testPorInsumo,
      observaciones,
    }));
  }, [claveBorrador, borradorListo, resultado, cantidadPorInsumo, estadoPorInsumo,
    observacionPorInsumo, motivoPorInsumo, notaAbiertaPorInsumo, masAbiertoPorInsumo,
    numeroSeriePorInsumo, testPorInsumo, observaciones]);

  const abrirSeccion = (key) => {
    const index = seccionesConEstado.findIndex((seccion) => seccion.key === key);
    if (index >= 0) setCurrentIndex(index);
  };

  const irAlProximoPendiente = () => {
    const index = seccionesConEstado.findIndex((seccion) => !seccion.completa);
    if (index >= 0) setCurrentIndex(index);
  };

  const actualizarCantidad = (insumoId, valor) => {
    if (valor === '') {
      setCantidadPorInsumo((previo) => ({ ...previo, [insumoId]: '' }));
      return;
    }
    const cantidad = Number(valor);
    if (!Number.isFinite(cantidad) || cantidad < 0) {
      return;
    }
    setCantidadPorInsumo((previo) => ({ ...previo, [insumoId]: cantidad }));
  };

  const actualizarObservacion = (insumoId, nota) => {
    setObservacionPorInsumo((previo) => ({ ...previo, [insumoId]: nota }));
  };

  const observacionCompleta = (insumoId) => [motivoPorInsumo[insumoId], observacionPorInsumo[insumoId]]
    .filter(Boolean).join(' · ');

  const limpiarBorrador = () => {
    if (!window.confirm('¿Limpiar el borrador de este móvil?')) return;
    if (claveBorrador) sessionStorage.removeItem(claveBorrador);
    const cantidades = Object.fromEntries(plantilla.filter((item) => item.tipo === 'CONSUMIBLE').map((item) => [item.insumoId, '']));
    const estados = Object.fromEntries(plantilla.filter((item) => item.tipo === 'REUTILIZABLE').map((item) => [
      item.insumoId,
      item.tipoEquipoSnapshot && !item.equipoMedicoId ? 'FALTANTE' : 'OPERATIVO',
    ]));
    const series = Object.fromEntries(plantilla.filter((item) => item.requiereSerie).map((item) => [item.insumoId, item.ultimoNumeroSerie || '']));
    setCantidadPorInsumo(cantidades);
    setEstadoPorInsumo(estados);
    setNumeroSeriePorInsumo(series);
    setEquipoNoCoincidePorInsumo({});
    setEquipoObservadoPorInsumo({});
    setTestPorInsumo({});
    setObservacionPorInsumo({});
    setMotivoPorInsumo({});
    setNotaAbiertaPorInsumo({});
    setMasAbiertoPorInsumo({});
    setObservaciones('');
    setCurrentIndex(0);
  };

  const enviarControl = async () => {
    if (completados !== plantilla.length) {
      setError(`Quedan pendientes: ${pendientesPorSeccion.map((seccion) => `${seccion.label} (${seccion.items.join(', ')})`).join('; ')}`);
      irAlProximoPendiente();
      return;
    }

    if (!window.confirm('Este control es definitivo y actualiza el stock real de insumos consumibles del móvil. ¿Querés continuar?')) {
      return;
    }

    setError('');
    setGuardando(true);

    const items = plantilla.map((item) => ({
      insumoId: item.insumoId,
      cantidadContada: item.tipo === 'CONSUMIBLE' ? Number(cantidadPorInsumo[item.insumoId] ?? 0) : null,
      estadoEquipo: item.tipo === 'REUTILIZABLE' ? (estadoPorInsumo[item.insumoId] || 'OPERATIVO') : null,
      observacion: observacionCompleta(item.insumoId),
      numeroSerie: item.tipo !== 'REUTILIZABLE' || estadoPorInsumo[item.insumoId] === 'FALTANTE'
        ? null
        : item.tipoEquipoSnapshot
          ? item.ultimoNumeroSerie || null
          : numeroSeriePorInsumo[item.insumoId]?.trim().toUpperCase() || null,
      asignacionEquipoId: item.asignacionEquipoId ?? null,
      asignacionEquipoEnviada: Boolean(item.tipoEquipoSnapshot),
      testOk: item.tipo === 'REUTILIZABLE' && estadoPorInsumo[item.insumoId] !== 'FALTANTE'
        ? testPorInsumo[item.insumoId] ?? null : null,
      equipoNoCoincide: Boolean(equipoNoCoincidePorInsumo[item.insumoId]),
      equipoObservado: equipoNoCoincidePorInsumo[item.insumoId]
        ? equipoObservadoPorInsumo[item.insumoId]?.trim() || null
        : null,
    }));

    try {
      const response = await controlService.crear({
        observaciones: observaciones.trim() || null,
        items,
      });
      setResultado(response.data);
      window.dispatchEvent(new Event('sigem:control-movil-actualizado'));
      setMensaje('Control registrado correctamente.');
      setObservaciones('');
      setCantidadPorInsumo({});
      setEstadoPorInsumo({});
      setObservacionPorInsumo({});
      setEquipoNoCoincidePorInsumo({});
      setEquipoObservadoPorInsumo({});
      if (claveBorrador) sessionStorage.removeItem(claveBorrador);
      setBorradorListo(false);
      setTab('nuevo');
      await cargarMisControles();
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo guardar el control.');
    } finally {
      setGuardando(false);
    }
  };

  const abrirDetalle = async (id) => {
    try {
      const response = await controlService.detalle(id);
      setDetalleSeleccionado(response.data);
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo abrir el detalle del control.');
    }
  };

  const resultBadge = (resultadoControl) => ({
    ...S.badge,
    ...(resultadoControl === 'CONFORME' ? S.badgeOk : S.badgeWarn),
  });

  const itemsDetalle = detalleSeleccionado?.items || [];
  const categoriasDetalle = agruparItemsPorCategoria(itemsDetalle);

  const estadoSeccionLabel = (seccion) => {
    if (!seccion.completa) return seccion.completados > 0 ? 'En curso' : 'Pendiente';
    return seccion.conNovedades ? 'Con novedades' : 'Completa';
  };

  const renderItem = (item, tarjetaGrande = false) => {
    const id = item.insumoId;
    const recomendada = Number(item.cantidadRecomendada) || 0;
    const cantidad = cantidadPorInsumo[id];
    const equipoSinAsignacion = Boolean(item.tipoEquipoSnapshot && !item.equipoMedicoId);
    const estado = equipoSinAsignacion
      ? 'FALTANTE'
      : item.requiereTest && testPorInsumo[id] === false
      ? 'DEFECTUOSO'
      : estadoPorInsumo[id] || 'OPERATIVO';
    const equipoNoCoincide = Boolean(equipoNoCoincidePorInsumo[id]);
    const itemConNovedad = item.tipo === 'CONSUMIBLE'
      ? cantidad !== '' && Number(cantidad) < recomendada
      : estado !== 'OPERATIVO' || testPorInsumo[id] === false || equipoNoCoincide;
    const itemNoDisponible = item.tipo === 'REUTILIZABLE' && estado === 'FALTANTE';
    const etiquetaEstado = !itemCompleto(item)
      ? 'Pendiente'
      : itemNoDisponible
        ? 'No disponible'
        : item.tipo === 'CONSUMIBLE' && Number(cantidad) === 0 && recomendada > 0
          ? 'Faltante'
          : itemConNovedad ? 'Con novedad' : 'Completo';
    const requiereMotivo = item.tipo === 'CONSUMIBLE'
      ? cantidad !== '' && Number(cantidad) < recomendada
      : estado !== 'OPERATIVO';

    return (
      <article key={id} className={`control-item-row${tarjetaGrande ? ' control-equipment-row' : ''}`} style={tarjetaGrande ? S.equipmentCard : S.itemRow}>
        <div className="control-item-heading" style={S.itemHeading}>
          <strong style={S.itemName}>{item.nombre}</strong>
          <span style={S.itemMeta}>
            {item.tipo === 'CONSUMIBLE'
              ? `Requerido: ${recomendada} · Registrado: ${cantidad === '' ? '—' : cantidad} ${item.unidadMedida || ''}`
              : `Stock estándar: ${recomendada} ${item.unidadMedida || ''}`}
          </span>
          <span className={`control-item-status ${
            !itemCompleto(item) ? 'is-pending'
              : itemNoDisponible ? 'is-unavailable'
                : item.tipo === 'CONSUMIBLE' && Number(cantidad) === 0 && recomendada > 0 ? 'is-shortage'
                  : itemConNovedad ? 'is-warning' : 'is-complete'
          }`}>
            {etiquetaEstado}
          </span>
        </div>

        {item.tipo === 'CONSUMIBLE' ? (
          <div className="control-count-controls" style={S.countControls}>
            {recomendada <= 12 ? (
              <div style={S.choiceWrap} aria-label={`Cantidad contada de ${item.nombre}`}>
                {Array.from({ length: recomendada + 1 }, (_, valor) => (
                  <button
                    key={valor}
                    type="button"
                    className="control-choice"
                    style={{ ...S.choice, ...(Number(cantidad) === valor && cantidad !== '' ? S.choiceActive : {}) }}
                    aria-pressed={cantidad !== '' && Number(cantidad) === valor}
                    onClick={() => actualizarCantidad(id, valor)}
                  >{valor}</button>
                ))}
              </div>
            ) : (
              <select
                className="control-select"
                aria-label={`Cantidad contada de ${item.nombre}`}
                value={cantidad ?? ''}
                onChange={(event) => actualizarCantidad(id, event.target.value)}
                style={S.select}
              >
                <option value="">Seleccionar cantidad</option>
                {Array.from({ length: recomendada + 1 }, (_, valor) => <option key={valor} value={valor}>{valor}</option>)}
              </select>
            )}
            <button type="button" className="control-action" style={S.actionChip} onClick={() => actualizarCantidad(id, recomendada)}>Completo</button>
            <button
              type="button"
              className="control-action"
              style={S.actionChip}
              onClick={() => {
                setMasAbiertoPorInsumo((previo) => ({ ...previo, [id]: !previo[id] }));
                if (cantidad === '') actualizarCantidad(id, recomendada);
              }}
            >+ más</button>
            {masAbiertoPorInsumo[id] && (
              <div style={S.stepper} aria-label={`Ajuste por encima del recomendado para ${item.nombre}`}>
                <button type="button" className="control-step-button" style={S.stepButton} onClick={() => actualizarCantidad(id, Math.max(0, Number(cantidad || 0) - 1))} aria-label="Restar una unidad">−</button>
                <strong>{cantidad === '' ? recomendada : cantidad}</strong>
                <button type="button" className="control-step-button" style={S.stepButton} onClick={() => actualizarCantidad(id, Number(cantidad || 0) + 1)} aria-label="Sumar una unidad">＋</button>
              </div>
            )}
          </div>
        ) : (
          <div className="control-equipment-controls" style={S.equipmentControls}>
            <div style={S.segmentGroup} aria-label={`Estado de ${item.nombre}`}>
              {ESTADOS_EQUIPO.map((opcion) => (
                <button
                  type="button"
                  key={opcion.value}
                  className="control-segment"
                  aria-pressed={estado === opcion.value}
                  disabled={equipoSinAsignacion && opcion.value !== 'FALTANTE'}
                  style={{ ...S.segment, ...(estado === opcion.value ? S.segmentActive : {}) }}
                  onClick={() => {
                    setEstadoPorInsumo((previo) => ({ ...previo, [id]: opcion.value }));
                    if (opcion.value === 'FALTANTE') {
                      setEquipoNoCoincidePorInsumo((previo) => ({ ...previo, [id]: false }));
                      setEquipoObservadoPorInsumo((previo) => ({ ...previo, [id]: '' }));
                    }
                  }}
                >{opcion.label}</button>
              ))}
            </div>

            {item.requiereTest && estado !== 'FALTANTE' && (
              <div style={S.controlField}>
                <span className="controlFieldLabel" style={S.label}>Test de prueba</span>
                <div style={S.segmentGroup}>
                  {[{ value: true, label: 'Aprobó' }, { value: false, label: 'No aprobó' }].map((opcion) => (
                    <button
                      type="button"
                      key={String(opcion.value)}
                      className="control-segment"
                      aria-pressed={testPorInsumo[id] === opcion.value}
                      style={{ ...S.segment, ...(testPorInsumo[id] === opcion.value ? S.segmentActive : {}) }}
                      onClick={() => {
                        setTestPorInsumo((previo) => ({ ...previo, [id]: opcion.value }));
                        if (!opcion.value) setEstadoPorInsumo((previo) => ({ ...previo, [id]: 'DEFECTUOSO' }));
                      }}
                    >{opcion.label}</button>
                  ))}
                </div>
              </div>
            )}

            {item.tipoEquipoSnapshot && (
              <div style={S.controlField}>
                <span className="controlFieldLabel" style={S.label}>Serie asignada</span>
                <input
                  type="text"
                  className="control-serial"
                  value={item.ultimoNumeroSerie || ''}
                  readOnly
                  disabled
                  aria-label={`Número de serie asignado de ${item.nombre}`}
                  style={S.serialInput}
                  placeholder="Sin asignación vigente"
                />
                {!item.equipoMedicoId && <span style={S.reference}>FALTANTE · No hay equipo asignado actualmente.</span>}
              </div>
            )}

            {!item.tipoEquipoSnapshot && item.requiereSerie && estado !== 'FALTANTE' && (
              <label style={S.controlField}>
                <span className="controlFieldLabel" style={S.label}>N° de serie</span>
                <input
                  type="text"
                  className="control-serial"
                  maxLength={100}
                  autoCapitalize="characters"
                  value={numeroSeriePorInsumo[id] ?? ''}
                  onChange={(event) => setNumeroSeriePorInsumo((previo) => ({ ...previo, [id]: event.target.value.toUpperCase() }))}
                  style={S.serialInput}
                  placeholder="Ingresar número"
                />
                {item.ultimoNumeroSerie && <span style={S.reference}>Último registrado: {item.ultimoNumeroSerie}</span>}
              </label>
            )}

            {item.tipoEquipoSnapshot && item.equipoMedicoId && estado !== 'FALTANTE' && (
              <div style={S.controlField}>
                <label style={S.choiceWrap}>
                  <input
                    type="checkbox"
                    checked={equipoNoCoincide}
                    onChange={(event) => {
                      const noCoincide = event.target.checked;
                      setEquipoNoCoincidePorInsumo((previo) => ({ ...previo, [id]: noCoincide }));
                      if (!noCoincide) {
                        setEquipoObservadoPorInsumo((previo) => ({ ...previo, [id]: '' }));
                      }
                    }}
                  />
                  <span>El equipo físico no coincide con el asignado</span>
                </label>
                {equipoNoCoincide && (
                  <input
                    type="text"
                    maxLength={500}
                    value={equipoObservadoPorInsumo[id] || ''}
                    onChange={(event) => setEquipoObservadoPorInsumo(
                      (previo) => ({ ...previo, [id]: event.target.value }),
                    )}
                    style={S.noteInput}
                    aria-label={`Descripción del equipo observado para ${item.nombre}`}
                    placeholder="Equipo o número de serie observado (opcional)"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {requiereMotivo && (
          <div style={S.reasonBlock}>
            <div style={S.choiceWrap}>
              {MOTIVOS.map((motivo) => (
                <button
                  type="button"
                  key={motivo}
                  className="control-reason"
                  style={{ ...S.reasonChip, ...(motivoPorInsumo[id] === motivo ? S.reasonActive : {}) }}
                  aria-pressed={motivoPorInsumo[id] === motivo}
                  onClick={() => setMotivoPorInsumo((previo) => ({ ...previo, [id]: previo[id] === motivo ? '' : motivo }))}
                >{motivo}</button>
              ))}
              <button type="button" className="control-note-toggle" style={S.noteToggle} onClick={() => setNotaAbiertaPorInsumo((previo) => ({ ...previo, [id]: !previo[id] }))}>+ nota</button>
            </div>
            {notaAbiertaPorInsumo[id] && (
              <input
                type="text"
                className="control-note-input"
                value={observacionPorInsumo[id] || ''}
                onChange={(event) => actualizarObservacion(id, event.target.value)}
                style={S.noteInput}
                placeholder="Nota opcional"
              />
            )}
          </div>
        )}
      </article>
    );
  };

  const marcarSeccionCompleta = (event, currentCategory) => {
    event.preventDefault();

    const categoriasLength = seccionesConEstado.length;
    const categoryIndex = currentCategory
      ? seccionesConEstado.findIndex((category) => category.key === currentCategory.key)
      : -1;

    if (!currentCategory || categoryIndex < 0 || !Array.isArray(currentCategory.insumos)) {
      console.error('[ControlMovil] Invalid current checklist category', {
        currentIndex,
        currentCategory,
        categoriasLength,
      });
      setError('No se pudo identificar la sección actual. Seleccioná una categoría e intentá de nuevo.');
      return;
    }

    if (currentIndex !== categoryIndex) {
      console.error('[ControlMovil] Checklist category index mismatch', {
        currentIndex,
        currentCategory,
        categoriasLength,
        categoryIndex,
      });
      setError('La sección seleccionada cambió. Volvé a seleccionarla e intentá de nuevo.');
      return;
    }

    try {
      const pendientes = currentCategory.insumos.filter((item) => !itemCompleto(item));
      const consumiblesPendientes = pendientes.filter((item) => item.tipo === 'CONSUMIBLE');
      const equiposPendientes = pendientes.filter((item) => item.tipo === 'REUTILIZABLE');
      const cantidadesFinales = consumiblesPendientes.map((item) => ({
        insumoId: item.insumoId,
        cantidad: item.cantidadRecomendada === null
          || item.cantidadRecomendada === undefined
          || item.cantidadRecomendada === ''
          ? Number.NaN
          : Number(item.cantidadRecomendada),
      }));
      const cantidadInvalida = cantidadesFinales.find(({ cantidad }) => (
        !Number.isInteger(cantidad) || cantidad < 0
      ));

      if (cantidadInvalida) {
        const insumo = consumiblesPendientes.find((item) => item.insumoId === cantidadInvalida.insumoId);
        console.error('[ControlMovil] Invalid recommended quantity', {
          currentIndex,
          currentCategory,
          categoriasLength,
          insumo,
          cantidad: cantidadInvalida.cantidad,
        });
        setError(`No se puede completar la sección: la cantidad recomendada de ${insumo?.nombre || 'un insumo'} no es válida.`);
        return;
      }

      const testsResultado = new Map(equiposPendientes.map((item) => {
        const testActual = testPorInsumo[item.insumoId];
        const testFinal = typeof testActual === 'boolean'
          ? testActual
          : item.requiereTest && (estadoPorInsumo[item.insumoId] || 'OPERATIVO') === 'OPERATIVO'
            ? true
            : undefined;
        return [item.insumoId, testFinal];
      }));
      const faltantesManuales = equiposPendientes.filter((item) => (
        (item.requiereSerie
          && !(numeroSeriePorInsumo[item.insumoId] || item.ultimoNumeroSerie || '').trim())
        || (item.requiereTest && typeof testsResultado.get(item.insumoId) !== 'boolean')
      ));

      if (faltantesManuales.length > 0) {
        setError(`Completá los datos requeridos de: ${faltantesManuales.map((item) => item.nombre).join(', ')}.`);
        return;
      }

      if (pendientes.length > 0) {
        const confirmacion = equiposPendientes.length > 0
          ? `¿Completar “${currentCategory.label}” con las cantidades recomendadas y confirmar que los equipos reutilizables sin estado definido están operativos y aprobaron sus pruebas?`
          : `¿Asignar la cantidad recomendada a los consumibles pendientes de “${currentCategory.label}”?`;
        if (!window.confirm(confirmacion)) return;
      }

      console.log('[ControlMovil] Advancing checklist section', {
        currentIndex,
        currentCategory,
        categoriasLength,
        categoryIndex,
      });

      setCantidadPorInsumo((previo) => {
        const cantidades = { ...previo };
        cantidadesFinales.forEach(({ insumoId, cantidad }) => {
          cantidades[insumoId] = cantidad;
        });
        return cantidades;
      });

      setEstadoPorInsumo((previo) => {
        const estados = { ...previo };
        equiposPendientes.forEach((item) => {
          if (!estados[item.insumoId]) estados[item.insumoId] = 'OPERATIVO';
        });
        return estados;
      });

      setTestPorInsumo((previo) => {
        const tests = { ...previo };
        equiposPendientes.forEach((item) => {
          if (item.requiereTest && typeof tests[item.insumoId] !== 'boolean'
            && testsResultado.get(item.insumoId) === true) tests[item.insumoId] = true;
        });
        return tests;
      });

      setNumeroSeriePorInsumo((previo) => {
        const series = { ...previo };
        equiposPendientes.forEach((item) => {
          if (item.requiereSerie && !series[item.insumoId]?.trim() && item.ultimoNumeroSerie) {
            series[item.insumoId] = item.ultimoNumeroSerie;
          }
        });
        return series;
      });

      setError('');
      setCurrentIndex((previo) => {
        const lastIndex = Math.max(categoriasLength - 1, 0);
        const boundedIndex = Math.max(0, Math.min(previo, lastIndex));
        const baseIndex = boundedIndex === categoryIndex ? boundedIndex : categoryIndex;
        return Math.min(baseIndex + 1, lastIndex);
      });
    } catch (exception) {
      console.error('[ControlMovil] Failed to complete checklist section', {
        currentIndex,
        currentCategory,
        categoriasLength,
        exception,
      });
      setError('No se pudo completar la sección. Revisá los datos e intentá de nuevo.');
    }
  };

  if (loading) {
    return (
      <div className="controlPage" style={S.page}>
        <Sidebar />
        <main className="controlMain" style={S.main}>Cargando plantilla...</main>
      </div>
    );
  }

  if (!guardiaActiva) {
    return (
      <div className="controlPage" style={S.page}>
        <Sidebar />
        <main className="controlMain" style={S.main}>
          <EmptyState
            icon="🩺"
            title="No tenés una guardia activa"
            description="Iniciá la guardia para tomar el móvil y registrar el control."
            action={<Button onClick={() => navigate('/guardias')}>Ir a Guardia</Button>}
          />
        </main>
      </div>
    );
  }

  if (resultado) {
    const faltantes = (resultado.items || []).filter((item) => item.cantidadContada < item.cantidadRecomendada);
    const defectuosos = (resultado.items || []).filter((item) => item.estadoEquipo === 'DEFECTUOSO');
    const testFallidos = (resultado.items || []).filter((item) => item.testOk === false);

    return (
      <div className="controlPage" style={S.page}>
        <Sidebar />
        <main className="controlMain" style={S.main}>
          <div style={S.resultCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div style={S.overline}>Resultado del control</div>
                <h1 style={S.h1}>Control registrado</h1>
              </div>
              <span style={resultBadge(resultado.resultado)}>{resultado.resultado}</span>
            </div>

            <div style={S.statsGrid}>
              <div style={S.statBox}><strong>{resultado.totalFaltantes}</strong><span>Faltantes</span></div>
              <div style={S.statBox}><strong>{resultado.totalEquiposConNovedad}</strong><span>Equipos con novedad</span></div>
              <div style={S.statBox}><strong>{resultado.totalDiscrepanciasSistema}</strong><span>Discrepancias</span></div>
            </div>

            <div style={S.listBox}>
              <h3 style={S.sectionTitle}>Faltantes</h3>
              {faltantes.length === 0 ? <p style={S.muted}>Sin faltantes.</p> : (
                <ul style={S.ul}>
                  {faltantes.map((item, index) => <li key={index}>{item.insumoNombre}</li>)}
                </ul>
              )}
            </div>

            <div style={S.listBox}>
              <h3 style={S.sectionTitle}>Equipos defectuosos</h3>
              {defectuosos.length === 0 ? <p style={S.muted}>Sin equipos defectuosos.</p> : (
                <ul style={S.ul}>
                  {defectuosos.map((item, index) => <li key={index}>{item.insumoNombre}</li>)}
                </ul>
              )}
            </div>

            {testFallidos.length > 0 && (
              <div style={S.listBox}>
                <h3 style={S.sectionTitle}>Equipos que no aprobaron el test</h3>
                <ul style={S.ul}>{testFallidos.map((item, index) => <li key={index}>{item.insumoNombre}</li>)}</ul>
              </div>
            )}

            {resultado.totalFaltantes > 0 && (
              <Button onClick={() => navigate('/inventario', { state: { abrirReposicion: true } })}>Solicitar reposición</Button>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="controlPage" style={S.page}>
      <Sidebar />
      <main className="controlMain" style={S.main}>
        <header style={S.header}>
          <div className="control-heading">
            <p style={S.overline}>Control de móvil</p>
            <h1 style={S.h1}>Control del móvil asignado</h1>
            <div className="control-assignment">
              {guardiaActual?.movil && (
                <span><strong>Móvil</strong> {guardiaActual.movil.numeroInterno || guardiaActual.movil.patente}</span>
              )}
              {user && <span><strong>Responsable</strong> {user.nombre} {user.apellido}</span>}
              {guardiaActual?.fechaInicio && (
                <span><strong>Guardia desde</strong> {new Date(guardiaActual.fechaInicio).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</span>
              )}
            </div>
          </div>
          <div className="control-progress" style={S.progressPill}>
            <span>{completados} de {plantilla.length} ítems completados</span>
            <div className="control-progress-track" role="progressbar" aria-valuenow={completados} aria-valuemin={0} aria-valuemax={plantilla.length}>
              <span style={{ width: `${plantilla.length ? (completados / plantilla.length) * 100 : 0}%` }} />
            </div>
          </div>
        </header>

        {mensaje && <div style={S.success}>{mensaje}</div>}
        {error && <div style={S.error}>{error}</div>}

        <div style={S.tabs}>
          <button style={{ ...S.tab, ...(tab === 'nuevo' ? S.tabActive : {}) }} onClick={() => setTab('nuevo')}>Nuevo control</button>
          <button style={{ ...S.tab, ...(tab === 'mis' ? S.tabActive : {}) }} onClick={() => setTab('mis')}>Mis controles</button>
        </div>

        {tab === 'nuevo' ? (
          <section className="controlWorkspace" style={S.controlFlow}>
            <aside className="controlCategoryPanel" aria-label="Categorías del control">
              <div className="controlCategoryHeading">
                <strong>Categorías</strong>
                <span>{seccionesConEstado.length}</span>
              </div>
              <nav className="controlCategoryList">
                {seccionesConEstado.map((seccion, index) => (
                  <button
                    type="button"
                    key={seccion.key}
                    className={`controlCategoryButton${currentIndex === index ? ' is-active' : ''}`}
                    aria-current={currentIndex === index ? 'page' : undefined}
                    onClick={() => abrirSeccion(seccion.key)}
                  >
                    <span className="controlCategoryIcon" aria-hidden="true">{seccion.icon}</span>
                    <span className="controlCategoryLabel">{seccion.label}</span>
                    <span className="controlCategoryCount">{seccion.completados}/{seccion.insumos.length}</span>
                    <span className={`controlCategoryStatus ${seccion.completa ? seccion.conNovedades ? 'is-warning' : 'is-complete' : seccion.completados ? 'is-progress' : 'is-pending'}`}>
                      {estadoSeccionLabel(seccion)}
                    </span>
                  </button>
                ))}
              </nav>
              <div className="controlCategoryActions">
                <button type="button" style={S.actionChip} onClick={irAlProximoPendiente} disabled={completados === plantilla.length}>Ir al próximo pendiente</button>
                <button type="button" style={S.clearButton} onClick={limpiarBorrador}>Limpiar borrador</button>
              </div>
            </aside>

            <div className="controlContent">
              {currentCategory && (
                <section
                  key={currentCategory.key}
                  ref={(node) => { referenciasSecciones.current[currentCategory.key] = node; }}
                  className="controlSelectedCategory"
                  aria-label={currentCategory.label}
                >
                  <div className="controlSelectedHeader">
                    <div>
                      <p style={S.overline}>Categoría</p>
                      <h2><span aria-hidden="true">{currentCategory.icon}</span> {currentCategory.label}</h2>
                    </div>
                    <span className="controlSelectedCount">{currentCategory.completados} de {currentCategory.insumos.length} revisados</span>
                    <button
                      type="button"
                      style={S.actionChip}
                      disabled={currentCategory.completa && currentIndex >= seccionesConEstado.length - 1}
                      onClick={(event) => marcarSeccionCompleta(event, currentCategory)}
                    >{currentCategory.completa
                      ? currentIndex < seccionesConEstado.length - 1 ? 'Siguiente sección' : 'Sección completa'
                      : 'Marcar sección completa'}</button>
                  </div>
                  <div className="controlItemList">
                    {agruparVariantes(currentCategory.insumos).map((grupo) => (
                      <div key={grupo.key} style={grupo.esVariantes ? S.variantGroup : S.singleItem}>
                        {grupo.esVariantes && <h4 style={S.variantTitle}>{grupo.titulo}</h4>}
                        <div style={S.itemStack}>
                          {grupo.items.map((item) => renderItem(item, currentCategory.key === 'EQUIPO_MEDICO'))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {pendientesPorSeccion.length > 0 && (
                <details className="controlPendingSummary" style={S.pendingList}>
                  <summary><strong>Pendientes para completar el control ({pendientesPorSeccion.reduce((total, seccion) => total + seccion.items.length, 0)})</strong></summary>
                  {pendientesPorSeccion.map((seccion) => (
                    <div key={seccion.key} style={S.pendingRow}>
                      <strong>{seccion.label}</strong>
                      <span>{seccion.items.join(' · ')}</span>
                    </div>
                  ))}
                </details>
              )}

              <div className="controlFooter" style={S.footerBar}>
                <textarea
                  value={observaciones}
                  onChange={(event) => setObservaciones(event.target.value)}
                  placeholder="Observaciones generales del control"
                  style={S.textarea}
                />
                <Button
                  onClick={enviarControl}
                  disabled={guardando || completados !== plantilla.length}
                >
                  {guardando ? 'Guardando...' : 'Enviar control'}
                </Button>
              </div>
            </div>
          </section>
        ) : (
          <section style={S.historySection}>
            {loadingMis ? <div style={S.status}>Cargando controles...</div> : (
              <div style={S.listTable}>
                {misControles.length === 0 ? (
                  <div style={S.empty}>Todavía no registraste controles.</div>
                ) : (
                  misControles.map((control) => (
                    <div key={control.id} style={S.controlCard}>
                      <div style={S.controlCardMain}>
                        <div style={S.controlHeader}>
                          <div>
                            <strong>{new Date(control.fecha).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</strong>
                            <div style={S.meta}>Móvil {control.movilNumeroInterno} · {control.movilPatente}</div>
                          </div>
                          <span style={resultBadge(control.resultado)}>{control.resultado}</span>
                        </div>
                        <div style={S.controlStats}>
                          <span><strong>{control.totalFaltantes}</strong> faltantes</span>
                          <span><strong>{control.totalEquiposConNovedad}</strong> equipos con novedad</span>
                          <span><strong>{control.totalDiscrepanciasSistema}</strong> discrepancias</span>
                        </div>
                      </div>
                      <Button size="sm" variant="secondary" style={S.detailButton} onClick={() => abrirDetalle(control.id)}>Ver detalle</Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>
        )}

        {detalleSeleccionado && (
          <div className="controlHistoryOverlay" style={S.modalOverlay} onClick={() => setDetalleSeleccionado(null)}>
            <section className="controlHistoryModal" style={S.modal} aria-labelledby="control-history-title" onClick={(event) => event.stopPropagation()}>
              <header className="controlHistoryHeader">
                <div className="controlHistoryTitleBlock">
                  <p className="controlHistoryEyebrow">Constancia histórica · Solo lectura</p>
                  <h2 id="control-history-title">INFORME DE CONTROL</h2>
                  <div className="controlHistoryIdentity">
                    <strong>Móvil {detalleSeleccionado.movilNumeroInterno}</strong>
                    <span>Dominio {detalleSeleccionado.movilPatente}</span>
                  </div>
                </div>
                <button className="controlHistoryClose" type="button" aria-label="Cerrar informe" onClick={() => setDetalleSeleccionado(null)}>×</button>
                <div className="controlHistoryMeta">
                  <span><strong>Fecha y hora</strong>{new Date(detalleSeleccionado.fecha).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  {detalleSeleccionado.enfermeroNombre && (
                    <span><strong>Enfermero responsable</strong>{detalleSeleccionado.enfermeroNombre}</span>
                  )}
                  <span className="controlHistoryStatus is-complete"><strong>Realización</strong>Completado</span>
                  <span className={`controlHistoryStatus ${detalleSeleccionado.resultado === 'CONFORME' ? 'is-conforming' : 'is-nonconforming'}`}>
                    <strong>Resultado de inspección</strong>
                    {detalleSeleccionado.resultado === 'CONFORME'
                      ? 'Conforme'
                      : detalleSeleccionado.resultado === 'CON_NOVEDADES'
                        ? 'No conforme'
                        : detalleSeleccionado.resultado}
                  </span>
                </div>
              </header>

              <div className="controlHistoryBody" style={S.modalBody}>
                <div className="controlHistoryMetrics" aria-label="Resumen de inspección">
                  <div><strong>{itemsDetalle.length}</strong><span>Elementos revisados</span></div>
                  <div><strong>{detalleSeleccionado.totalFaltantes}</strong><span>Faltantes</span></div>
                  <div><strong>{detalleSeleccionado.totalEquiposConNovedad}</strong><span>Equipos con novedades</span></div>
                  <div><strong>{detalleSeleccionado.totalDiscrepanciasSistema}</strong><span>Discrepancias</span></div>
                </div>

                {detalleSeleccionado.observaciones && (
                  <p className="controlHistoryGeneralNote"><strong>Observaciones generales</strong>{detalleSeleccionado.observaciones}</p>
                )}

                <div className="controlHistoryCategories">
                  {categoriasDetalle.map(({ key, label, items }) => {
                    const discrepancias = items.filter(tieneDiscrepanciaHistorica).length;
                    const novedades = items.filter(tieneNovedadHistorica).length;
                    const incidencias = items.filter((item) => tieneDiscrepanciaHistorica(item) || tieneNovedadHistorica(item)).length;

                    return (
                      <details className={`controlHistoryCategory${incidencias ? ' has-issues' : ''}`} key={key}>
                        <summary>
                          <span className="controlHistoryCategoryName">{label}</span>
                          <span className="controlHistoryCategoryCount">{items.length} elementos · {items.length} revisados</span>
                          <span className={`controlHistoryCategoryState${incidencias ? ' is-warning' : ' is-ok'}`}>
                            {incidencias ? 'Con novedades' : 'Revisión correcta'}
                          </span>
                          <span className="controlHistoryCategoryIssues">
                            {discrepancias > 0 && <span>{discrepancias} discrepancias</span>}
                            {novedades > 0 && <span>{novedades} novedades</span>}
                          </span>
                          <span className="controlHistoryChevron" aria-hidden="true" />
                        </summary>
                        <div className="controlHistoryTableWrap">
                          <table className="controlHistoryTable">
                            <thead>
                              <tr>
                                <th>Elemento</th>
                                <th>Cantidad recomendada / estándar</th>
                                <th>Cantidad contada / registrada</th>
                                <th>Diferencia</th>
                                <th>Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item, index) => {
                                const tieneCantidades = item.cantidadContada !== null && item.cantidadContada !== undefined
                                  && item.cantidadRecomendada !== null && item.cantidadRecomendada !== undefined;
                                const diferencia = tieneCantidades ? item.cantidadContada - item.cantidadRecomendada : null;
                                const discrepancia = tieneDiscrepanciaHistorica(item);
                                const estadoPresentado = item.estadoEquipo
                                  || (item.testOk === false ? 'No aprobó el test'
                                    : item.testOk === true ? 'Test aprobado'
                                      : item.cantidadContada !== null && item.cantidadContada !== undefined
                                        ? discrepancia ? 'Con discrepancia' : 'Revisado'
                                          : '—');

                                return (
                                  <tr className={discrepancia || tieneNovedadHistorica(item) ? 'has-issues' : ''} key={`${item.insumoNombre}-${index}`}>
                                    <td data-label="Elemento">
                                      <strong>{item.insumoNombre}</strong>
                                      <span className="controlHistoryItemMeta">{item.tipo}</span>
                                      {item.numeroSerie && <span className="controlHistoryItemMeta">N° de serie: {item.numeroSerie}</span>}
                                      {item.testOk !== null && item.testOk !== undefined && (
                                        <span className="controlHistoryItemMeta">Test: {item.testOk ? 'Aprobó' : 'No aprobó'}</span>
                                      )}
                                      {item.observacion && <span className="controlHistoryItemNote"><strong>Novedad / observación:</strong> {item.observacion}</span>}
                                      {item.equipoNoCoincide && (
                                        <span className="controlHistoryItemNote">
                                          <strong>Equipo no coincide:</strong>{' '}
                                          esperado {item.tipoEquipoSnapshot || item.insumoNombre},
                                          serie {item.numeroSerieSnapshot || '—'}
                                          {item.equipoObservado ? ` · observado ${item.equipoObservado}` : ''}
                                        </span>
                                      )}
                                    </td>
                                    <td data-label="Cantidad recomendada / estándar">
                                      {item.cantidadRecomendada ?? '—'} {item.unidadMedida || ''}
                                    </td>
                                    <td data-label="Cantidad contada / registrada">
                                      {item.cantidadContada ?? '—'} {item.unidadMedida || ''}
                                      {item.cantidadSistema !== null && item.cantidadSistema !== undefined && (
                                        <span className="controlHistoryItemMeta">Sistema: {item.cantidadSistema} {item.unidadMedida || ''}</span>
                                      )}
                                    </td>
                                    <td data-label="Diferencia">
                                      {diferencia === null ? '—' : (
                                        <span className={diferencia < 0 ? 'controlHistoryDifference is-negative' : diferencia > 0 ? 'controlHistoryDifference is-positive' : 'controlHistoryDifference'}>
                                          {diferencia > 0 ? '+' : ''}{diferencia}
                                        </span>
                                      )}
                                    </td>
                                    <td data-label="Estado">
                                      <span className={`controlHistoryItemState${discrepancia || tieneNovedadHistorica(item) ? ' is-warning' : ''}`}>{estadoPresentado}</span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function agruparVariantes(items) {
  const ordenados = [...items].sort((a, b) => COLLATOR_NATURAL.compare(a.nombre, b.nombre));
  const grupos = new Map();

  ordenados.forEach((item) => {
    const separador = item.nombre.indexOf(' [');
    if (separador < 0) {
      grupos.set(`item:${item.insumoId}`, { key: `item:${item.insumoId}`, items: [item], esVariantes: false });
      return;
    }

    const titulo = item.nombre.slice(0, separador);
    const key = `variante:${titulo}`;
    if (!grupos.has(key)) grupos.set(key, { key, titulo, items: [], esVariantes: true });
    grupos.get(key).items.push(item);
  });

  return [...grupos.values()].map((grupo) => ({
    ...grupo,
    items: grupo.items.sort((a, b) => COLLATOR_NATURAL.compare(a.nombre, b.nombre)),
  }));
}

const ORDEN_CATEGORIAS_HISTORICAS = [
  'MEDICACION', 'DESCARTABLE', 'TRAUMA', 'VIA_AEREA', 'EQUIPO_MEDICO',
  'OXIGENO', 'ANTISEPTICO', 'KIT', 'MONITOREO', 'CURACION', 'SOLUCION',
];

const ETIQUETAS_CATEGORIAS_HISTORICAS = {
  MEDICACION: 'Medicación',
  DESCARTABLE: 'Descartables',
  TRAUMA: 'Trauma',
  VIA_AEREA: 'Vía aérea',
  EQUIPO_MEDICO: 'Equipos médicos',
  OXIGENO: 'Oxígeno',
  ANTISEPTICO: 'Antisépticos',
  KIT: 'Kits',
  MONITOREO: 'Monitoreo',
  CURACION: 'Curación',
  SOLUCION: 'Soluciones',
  SIN_CATEGORIA: 'Sin categoría',
};

function agruparItemsPorCategoria(items) {
  const grupos = new Map();
  items.forEach((item) => {
    const key = item.categoria || 'SIN_CATEGORIA';
    if (!grupos.has(key)) grupos.set(key, []);
    grupos.get(key).push(item);
  });

  return [...grupos.entries()]
    .sort(([categoriaA], [categoriaB]) => {
      const ordenA = ORDEN_CATEGORIAS_HISTORICAS.indexOf(categoriaA);
      const ordenB = ORDEN_CATEGORIAS_HISTORICAS.indexOf(categoriaB);
      if (ordenA < 0 && ordenB < 0) return COLLATOR_NATURAL.compare(categoriaA, categoriaB);
      if (ordenA < 0) return 1;
      if (ordenB < 0) return -1;
      return ordenA - ordenB;
    })
    .map(([key, categoriaItems]) => ({
      key,
      label: ETIQUETAS_CATEGORIAS_HISTORICAS[key] || key.replaceAll('_', ' ').toLowerCase(),
      items: categoriaItems,
    }));
}

function tieneDiscrepanciaHistorica(item) {
  return item.cantidadContada < item.cantidadRecomendada
    || item.cantidadContada !== item.cantidadSistema;
}

function tieneNovedadHistorica(item) {
  return (item.estadoEquipo && item.estadoEquipo !== 'OPERATIVO')
    || item.testOk === false
    || Boolean(item.observacion);
}

const S = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    background: 'var(--color-background)',
    color: 'var(--color-text-primary)',
  },
  main: {
    flex: 1,
    minWidth: 0,
    width: '100%',
    maxWidth: 'var(--max-content-width)',
    margin: '0 auto',
    padding: 'var(--spacing-7)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-5)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  overline: { margin: 0, fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-secondary)' },
  h1: { margin: '0.25rem 0 0', fontSize: '2rem', color: 'var(--color-text-primary)' },
  h3: { margin: 0, fontSize: '1.2rem' },
  progressPill: {
    padding: '0.6rem 0.9rem',
    borderRadius: '999px',
    background: 'var(--color-primary-soft)',
    color: 'var(--color-primary-strong)',
    fontWeight: 700,
  },
  controlFlow: { display: 'grid', gap: '0.65rem', minWidth: 0 },
  stickyProgress: {
    position: 'sticky',
    top: 0,
    zIndex: 8,
    display: 'grid',
    gap: '0.5rem',
    padding: '0.65rem',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-sm)',
  },
  stickyTopLine: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' },
  sectionChips: { display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.15rem' },
  sectionChip: {
    flex: '0 0 auto', minHeight: '40px', padding: '0.45rem 0.7rem',
    color: 'var(--color-text-primary)', background: 'var(--color-surface-muted)',
    border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
    cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap',
  },
  sectionChipDone: { color: 'var(--color-success-strong)', background: 'var(--color-success-soft)', borderColor: 'var(--color-success)' },
  clearButton: {
    minHeight: '40px', marginLeft: 'auto', padding: '0.45rem 0.8rem',
    color: 'var(--color-danger-strong)', background: 'transparent', border: '1px solid var(--color-danger)',
    borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700,
  },
  sectionAccordion: {
    scrollMarginTop: '10rem', overflow: 'hidden',
    background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
  },
  sectionHeader: {
    width: '100%', minHeight: '56px', display: 'flex', alignItems: 'center', gap: '0.65rem',
    padding: '0.7rem 0.85rem', textAlign: 'left', color: 'var(--color-text-primary)',
    background: 'var(--color-surface)', border: 'none', cursor: 'pointer', fontWeight: 700,
  },
  sectionIcon: { width: '1.5rem', flex: '0 0 auto', textAlign: 'center', fontSize: '1.1rem' },
  sectionHeaderName: { flex: 1, minWidth: 0 },
  sectionCount: { color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' },
  sectionStatus: { minWidth: '6.5rem', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '0.8rem' },
  sectionStatusDone: { color: 'var(--color-success-strong)' },
  sectionStatusWarn: { color: 'var(--color-warning-strong)' },
  sectionBody: { display: 'grid', gap: '0.65rem', padding: '0.7rem', borderTop: '1px solid var(--color-border)' },
  sectionActions: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' },
  variantGroup: { display: 'grid', gap: '0.45rem' },
  variantTitle: { margin: 0, padding: '0.4rem 0.2rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' },
  singleItem: { display: 'contents' },
  itemStack: { display: 'grid', gap: '0.5rem' },
  itemHeading: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' },
  countControls: { display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' },
  equipmentCard: {
    display: 'grid', gap: '0.75rem', padding: '0.85rem',
    background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
  },
  equipmentControls: { display: 'grid', gap: '0.75rem' },
  controlField: { display: 'grid', gap: '0.4rem', justifyItems: 'start' },
  choiceWrap: { display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' },
  choice: {
    minWidth: '42px', minHeight: '42px', padding: '0.35rem', color: 'var(--color-text-primary)',
    background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700,
  },
  choiceActive: { color: 'var(--color-on-primary)', background: 'var(--color-primary)', borderColor: 'var(--color-primary)' },
  select: {
    minWidth: '9rem', minHeight: '42px', padding: '0.55rem 0.7rem', color: 'var(--color-text-primary)',
    background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)',
  },
  actionChip: {
    minHeight: '42px', padding: '0.45rem 0.75rem', color: 'var(--color-primary-strong)',
    background: 'var(--color-primary-soft)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700,
  },
  stepper: { display: 'inline-flex', minHeight: '42px', alignItems: 'center', gap: '0.8rem', padding: '0 0.35rem', fontVariantNumeric: 'tabular-nums' },
  stepButton: {
    width: '42px', height: '42px', color: 'var(--color-primary-strong)', background: 'var(--color-surface)',
    border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '1.1rem',
  },
  segmentGroup: { display: 'flex', gap: '0.35rem', flexWrap: 'wrap' },
  segment: {
    minHeight: '42px', padding: '0.45rem 0.75rem', color: 'var(--color-text-primary)',
    background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700,
  },
  segmentActive: { color: 'var(--color-on-primary)', background: 'var(--color-primary)', borderColor: 'var(--color-primary)' },
  serialInput: {
    width: 'min(100%, 18rem)', minHeight: '42px', boxSizing: 'border-box', padding: '0.55rem 0.7rem',
    color: 'var(--color-text-primary)', background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)',
    borderRadius: 'var(--radius-sm)', textTransform: 'uppercase',
  },
  reference: { color: 'var(--color-text-muted)', fontSize: '0.78rem' },
  reasonBlock: { display: 'grid', gap: '0.45rem' },
  reasonChip: {
    minHeight: '40px', padding: '0.4rem 0.7rem', color: 'var(--color-warning-strong)',
    background: 'var(--color-warning-soft)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
    cursor: 'pointer', fontWeight: 700,
  },
  reasonActive: { borderColor: 'var(--color-warning)', boxShadow: 'inset 0 0 0 1px var(--color-warning)' },
  noteToggle: { minHeight: '40px', padding: '0.4rem 0.7rem', color: 'var(--color-primary-strong)', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700 },
  noteInput: { width: '100%', minHeight: '42px', boxSizing: 'border-box', padding: '0.55rem 0.7rem', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface)', color: 'var(--color-text-primary)' },
  pendingList: { display: 'grid', gap: '0.5rem', padding: '0.85rem', color: 'var(--color-warning-strong)', background: 'var(--color-warning-soft)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-sm)' },
  pendingRow: { display: 'grid', gridTemplateColumns: 'minmax(7rem, auto) minmax(0, 1fr)', gap: '0.5rem', color: 'var(--color-text-primary)' },
  tabs: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-2)',
    marginBottom: 0,
    borderBottom: '1px solid var(--color-border)',
    overflowX: 'auto',
    flexShrink: 0,
  },
  tab: {
    flex: '0 0 auto',
    minHeight: '44px',
    padding: '0.8rem 1rem',
    color: 'var(--color-text-secondary)',
    background: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontWeight: 700,
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
  tabActive: {
    color: 'var(--color-primary-strong)',
    borderBottomColor: 'var(--color-primary)',
  },
  panel: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)',
    padding: '1.2rem',
    display: 'grid',
    gap: '1rem',
  },
  group: {
    display: 'grid',
    gap: '0.8rem',
    paddingBottom: '0.6rem',
    borderBottom: '1px solid var(--color-border)',
  },
  groupTitle: {
    margin: 0,
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    color: 'var(--color-text-primary)',
  },
  itemRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: '0.65rem',
    alignItems: 'start',
    background: 'var(--color-surface-muted)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.7rem',
  },
  itemInfo: { display: 'grid', gap: '0.15rem' },
  itemName: { fontSize: '1rem' },
  itemMeta: { color: 'var(--color-text-secondary)', fontSize: '0.8rem' },
  fieldGroup: { display: 'grid', gap: '0.35rem' },
  label: { color: 'var(--color-text-secondary)', fontSize: '0.78rem', fontWeight: 700 },
  input: {
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: '0.72rem 0.8rem',
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    width: '100%',
  },
  referencia: { color: 'var(--color-text-secondary)', fontSize: '0.72rem' },
  footerBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 18rem), 1fr))',
    gap: '1rem',
    alignItems: 'end',
    marginTop: '0.5rem',
  },
  textarea: {
    width: '100%',
    minHeight: '90px',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: '0.8rem',
    background: 'var(--color-surface-muted)',
    color: 'var(--color-text-primary)',
    resize: 'vertical',
  },
  success: {
    background: 'var(--color-success-soft)',
    color: 'var(--color-success-strong)',
    border: '1px solid var(--color-success)',
    borderRadius: 'var(--radius-md)',
    padding: '0.8rem 1rem',
  },
  error: {
    background: 'var(--color-danger-soft)',
    color: 'var(--color-danger-strong)',
    border: '1px solid var(--color-danger)',
    borderRadius: 'var(--radius-md)',
    padding: '0.8rem 1rem',
  },
  listTable: { display: 'grid', gap: '0.65rem' },
  historySection: { display: 'grid', gap: 'var(--spacing-5)', minWidth: 0 },
  empty: { color: 'var(--color-text-secondary)', background: 'var(--color-surface-muted)', padding: '1rem', borderRadius: 'var(--radius-md)' },
  controlCard: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    alignItems: 'center',
    gap: 'var(--spacing-4)',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--spacing-5)',
    boxShadow: 'var(--shadow-sm)',
  },
  controlCardMain: { display: 'grid', gap: 'var(--spacing-3)', minWidth: 0 },
  controlHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' },
  meta: { color: 'var(--color-text-secondary)', fontSize: '0.82rem' },
  controlStats: { display: 'flex', gap: '0.4rem 1rem', flexWrap: 'wrap', color: 'var(--color-text-secondary)', fontSize: '0.8rem' },
  detailButton: { alignSelf: 'center', minHeight: '40px', padding: '0.55rem 0.8rem' },
  resultCard: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)',
    padding: '1.5rem',
    display: 'grid',
    gap: '1rem',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '999px',
    padding: '0.45rem 0.8rem',
    fontSize: '0.8rem',
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  badgeOk: { background: 'var(--color-success-soft)', color: 'var(--color-success-strong)' },
  badgeWarn: { background: 'var(--color-warning-soft)', color: 'var(--color-warning-strong)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' },
  statBox: {
    background: 'var(--color-surface-muted)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '0.9rem',
    display: 'grid',
    gap: '0.3rem',
    textAlign: 'center',
    color: 'var(--color-text-secondary)',
  },
  listBox: {
    background: 'var(--color-surface-muted)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1rem',
    display: 'grid',
    gap: '0.5rem',
  },
  sectionTitle: { margin: 0, fontSize: '1rem' },
  ul: { margin: 0, paddingLeft: '1.1rem', display: 'grid', gap: '0.3rem' },
  muted: { margin: 0, color: 'var(--color-text-secondary)' },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.35)',
    display: 'grid',
    placeItems: 'center',
    padding: '1rem',
    zIndex: 50,
  },
  modal: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
    width: 'min(920px, 100%)',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '1rem',
    display: 'grid',
    gap: '1rem',
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' },
  closeBtn: { border: 'none', background: 'transparent', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-primary)' },
  modalBody: { display: 'grid', gap: '0.8rem' },
  itemDetail: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr',
    gap: '0.75rem',
    padding: '0.8rem',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--color-surface-muted)',
    border: '1px solid var(--color-border)',
  },
  detailValues: { display: 'grid', gap: '0.2rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' },
  status: { color: 'var(--color-text-secondary)' },
};
