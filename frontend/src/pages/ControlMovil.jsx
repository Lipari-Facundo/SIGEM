import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { controlService, guardiaService } from '../services/api';
import { useAuth } from '../context/AuthContext';

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
  const [testPorInsumo, setTestPorInsumo] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [misControles, setMisControles] = useState([]);
  const [loadingMis, setLoadingMis] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);
  const [movilId, setMovilId] = useState(null);
  const [borradorListo, setBorradorListo] = useState(false);
  const [seccionAbierta, setSeccionAbierta] = useState(null);
  const referenciasSecciones = useRef({});
  const aperturaManual = useRef(false);
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
      const items = plantillaResponse.data || [];
      const guardia = (guardiasResponse.data || []).find((item) => item.estado === 'ACTIVA');
      const idMovil = guardia?.movil?.id;
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
      const estadoInicial = borrador?.estadoPorInsumo || {};
      const cantidadesIniciales = borrador?.cantidadPorInsumo || {};
      const seriesIniciales = borrador?.numeroSeriePorInsumo || {};
      items.forEach((item) => {
        if (item.tipo === 'REUTILIZABLE') {
          estadoInicial[item.insumoId] ||= 'OPERATIVO';
          if (item.requiereSerie && !seriesIniciales[item.insumoId]) {
            seriesIniciales[item.insumoId] = item.ultimoNumeroSerie || '';
          }
        } else {
          if (!(item.insumoId in cantidadesIniciales)) cantidadesIniciales[item.insumoId] = '';
        }
      });
      setEstadoPorInsumo(estadoInicial);
      setCantidadPorInsumo(cantidadesIniciales);
      setNumeroSeriePorInsumo(seriesIniciales);
      setTestPorInsumo(borrador?.testPorInsumo || {});
      setObservacionPorInsumo(borrador?.observacionPorInsumo || {});
      setMotivoPorInsumo(borrador?.motivoPorInsumo || {});
      setNotaAbiertaPorInsumo(borrador?.notaAbiertaPorInsumo || {});
      setMasAbiertoPorInsumo(borrador?.masAbiertoPorInsumo || {});
      setObservaciones(borrador?.observaciones || '');
      setBorradorListo(Boolean(draftKey));
      setGuardiaActiva(true);
    } catch (exception) {
      const message = String(exception.response?.data?.message || exception.message || '');
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

  const completados = [...completitudPorId.values()].filter(Boolean).length;
  const pendientesPorSeccion = seccionesConEstado
    .filter((seccion) => !seccion.completa)
    .map((seccion) => ({
      key: seccion.key,
      label: seccion.label,
      items: seccion.insumos.filter((item) => !itemCompleto(item)).map((item) => item.nombre),
    }));

  useEffect(() => {
    if (!seccionesConEstado.length) return;
    if (aperturaManual.current) {
      aperturaManual.current = false;
      return;
    }
    if (seccionAbierta && !seccionesConEstado.find((item) => item.key === seccionAbierta)?.completa) return;
    setSeccionAbierta(seccionesConEstado.find((item) => !item.completa)?.key || null);
  }, [seccionesConEstado, seccionAbierta]);

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
    aperturaManual.current = true;
    setSeccionAbierta(key);
    window.requestAnimationFrame(() => referenciasSecciones.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const irAlProximoPendiente = () => {
    const siguiente = seccionesConEstado.find((seccion) => !seccion.completa);
    if (siguiente) abrirSeccion(siguiente.key);
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
    const estados = Object.fromEntries(plantilla.filter((item) => item.tipo === 'REUTILIZABLE').map((item) => [item.insumoId, 'OPERATIVO']));
    const series = Object.fromEntries(plantilla.filter((item) => item.requiereSerie).map((item) => [item.insumoId, item.ultimoNumeroSerie || '']));
    setCantidadPorInsumo(cantidades);
    setEstadoPorInsumo(estados);
    setNumeroSeriePorInsumo(series);
    setTestPorInsumo({});
    setObservacionPorInsumo({});
    setMotivoPorInsumo({});
    setNotaAbiertaPorInsumo({});
    setMasAbiertoPorInsumo({});
    setObservaciones('');
  };

  const enviarControl = async () => {
    if (completados !== plantilla.length) {
      setError(`Quedan pendientes: ${pendientesPorSeccion.map((seccion) => `${seccion.label} (${seccion.items.join(', ')})`).join('; ')}`);
      irAlProximoPendiente();
      return;
    }

    if (!window.confirm('Este control es definitivo y ajusta el stock real del móvil. ¿Querés continuar?')) {
      return;
    }

    setError('');
    setGuardando(true);

    const items = plantilla.map((item) => ({
      insumoId: item.insumoId,
      cantidadContada: item.tipo === 'CONSUMIBLE' ? Number(cantidadPorInsumo[item.insumoId] ?? 0) : null,
      estadoEquipo: item.tipo === 'REUTILIZABLE' ? (estadoPorInsumo[item.insumoId] || 'OPERATIVO') : null,
      observacion: observacionCompleta(item.insumoId),
      numeroSerie: item.tipo === 'REUTILIZABLE' && estadoPorInsumo[item.insumoId] !== 'FALTANTE'
        ? numeroSeriePorInsumo[item.insumoId]?.trim().toUpperCase() || null : null,
      testOk: item.tipo === 'REUTILIZABLE' && estadoPorInsumo[item.insumoId] !== 'FALTANTE'
        ? testPorInsumo[item.insumoId] ?? null : null,
    }));

    try {
      const response = await controlService.crear({
        observaciones: observaciones.trim() || null,
        items,
      });
      setResultado(response.data);
      setMensaje('Control registrado correctamente.');
      setObservaciones('');
      setCantidadPorInsumo({});
      setEstadoPorInsumo({});
      setObservacionPorInsumo({});
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

  const renderItem = (item, tarjetaGrande = false) => {
    const id = item.insumoId;
    const recomendada = Number(item.cantidadRecomendada) || 0;
    const cantidad = cantidadPorInsumo[id];
    const estado = item.requiereTest && testPorInsumo[id] === false
      ? 'DEFECTUOSO'
      : estadoPorInsumo[id] || 'OPERATIVO';
    const requiereMotivo = item.tipo === 'CONSUMIBLE'
      ? cantidad !== '' && Number(cantidad) < recomendada
      : estado !== 'OPERATIVO';

    return (
      <article key={id} style={tarjetaGrande ? S.equipmentCard : S.itemRow}>
        <div style={S.itemHeading}>
          <strong style={S.itemName}>{item.nombre}</strong>
          <span style={S.itemMeta}>{item.tipo === 'CONSUMIBLE' ? 'Rec: ' : 'Stock estándar: '}{recomendada} {item.unidadMedida || ''}</span>
        </div>

        {item.tipo === 'CONSUMIBLE' ? (
          <div style={S.countControls}>
            {recomendada <= 12 ? (
              <div style={S.choiceWrap} aria-label={`Cantidad contada de ${item.nombre}`}>
                {Array.from({ length: recomendada + 1 }, (_, valor) => (
                  <button
                    key={valor}
                    type="button"
                    style={{ ...S.choice, ...(Number(cantidad) === valor && cantidad !== '' ? S.choiceActive : {}) }}
                    aria-pressed={cantidad !== '' && Number(cantidad) === valor}
                    onClick={() => actualizarCantidad(id, valor)}
                  >{valor}</button>
                ))}
              </div>
            ) : (
              <select
                aria-label={`Cantidad contada de ${item.nombre}`}
                value={cantidad ?? ''}
                onChange={(event) => actualizarCantidad(id, event.target.value)}
                style={S.select}
              >
                <option value="">Seleccionar cantidad</option>
                {Array.from({ length: recomendada + 1 }, (_, valor) => <option key={valor} value={valor}>{valor}</option>)}
              </select>
            )}
            <button type="button" style={S.actionChip} onClick={() => actualizarCantidad(id, recomendada)}>Completo</button>
            <button
              type="button"
              style={S.actionChip}
              onClick={() => {
                setMasAbiertoPorInsumo((previo) => ({ ...previo, [id]: !previo[id] }));
                if (cantidad === '') actualizarCantidad(id, recomendada);
              }}
            >+ más</button>
            {masAbiertoPorInsumo[id] && (
              <div style={S.stepper} aria-label={`Ajuste por encima del recomendado para ${item.nombre}`}>
                <button type="button" style={S.stepButton} onClick={() => actualizarCantidad(id, Math.max(0, Number(cantidad || 0) - 1))} aria-label="Restar una unidad">−</button>
                <strong>{cantidad === '' ? recomendada : cantidad}</strong>
                <button type="button" style={S.stepButton} onClick={() => actualizarCantidad(id, Number(cantidad || 0) + 1)} aria-label="Sumar una unidad">＋</button>
              </div>
            )}
          </div>
        ) : (
          <div style={S.equipmentControls}>
            <div style={S.segmentGroup} aria-label={`Estado de ${item.nombre}`}>
              {ESTADOS_EQUIPO.map((opcion) => (
                <button
                  type="button"
                  key={opcion.value}
                  aria-pressed={estado === opcion.value}
                  style={{ ...S.segment, ...(estado === opcion.value ? S.segmentActive : {}) }}
                  onClick={() => setEstadoPorInsumo((previo) => ({ ...previo, [id]: opcion.value }))}
                >{opcion.label}</button>
              ))}
            </div>

            {item.requiereTest && estado !== 'FALTANTE' && (
              <div style={S.controlField}>
                <span style={S.label}>Test de prueba</span>
                <div style={S.segmentGroup}>
                  {[{ value: true, label: 'Aprobó' }, { value: false, label: 'No aprobó' }].map((opcion) => (
                    <button
                      type="button"
                      key={String(opcion.value)}
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

            {item.requiereSerie && estado !== 'FALTANTE' && (
              <label style={S.controlField}>
                <span style={S.label}>N° de serie</span>
                <input
                  type="text"
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
          </div>
        )}

        {requiereMotivo && (
          <div style={S.reasonBlock}>
            <div style={S.choiceWrap}>
              {MOTIVOS.map((motivo) => (
                <button
                  type="button"
                  key={motivo}
                  style={{ ...S.reasonChip, ...(motivoPorInsumo[id] === motivo ? S.reasonActive : {}) }}
                  aria-pressed={motivoPorInsumo[id] === motivo}
                  onClick={() => setMotivoPorInsumo((previo) => ({ ...previo, [id]: previo[id] === motivo ? '' : motivo }))}
                >{motivo}</button>
              ))}
              <button type="button" style={S.noteToggle} onClick={() => setNotaAbiertaPorInsumo((previo) => ({ ...previo, [id]: !previo[id] }))}>+ nota</button>
            </div>
            {notaAbiertaPorInsumo[id] && (
              <input
                type="text"
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

  const marcarSeccionCompleta = (seccion) => {
    if (!window.confirm(`¿Asignar la cantidad recomendada a los consumibles pendientes de “${seccion.label}”?`)) return;
    setCantidadPorInsumo((previo) => {
      const cantidades = { ...previo };
      seccion.insumos.filter((item) => item.tipo === 'CONSUMIBLE' && !itemCompleto(item))
        .forEach((item) => { cantidades[item.insumoId] = item.cantidadRecomendada; });
      return cantidades;
    });
  };

  if (loading) {
    return (
      <div style={S.page}>
        <Sidebar />
        <main style={S.main}>Cargando plantilla...</main>
      </div>
    );
  }

  if (!guardiaActiva) {
    return (
      <div style={S.page}>
        <Sidebar />
        <main style={S.main}>
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
      <div style={S.page}>
        <Sidebar />
        <main style={S.main}>
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
    <div style={S.page}>
      <Sidebar />
      <main style={S.main}>
        <header style={S.header}>
          <div>
            <p style={S.overline}>Control de móvil</p>
            <h1 style={S.h1}>Control del móvil asignado</h1>
          </div>
          <div style={S.progressPill}>{completados} de {plantilla.length} ítems completados</div>
        </header>

        {mensaje && <div style={S.success}>{mensaje}</div>}
        {error && <div style={S.error}>{error}</div>}

        <div style={S.tabs}>
          <button style={{ ...S.tab, ...(tab === 'nuevo' ? S.tabActive : {}) }} onClick={() => setTab('nuevo')}>Nuevo control</button>
          <button style={{ ...S.tab, ...(tab === 'mis' ? S.tabActive : {}) }} onClick={() => setTab('mis')}>Mis controles</button>
        </div>

        {tab === 'nuevo' ? (
          <section style={S.controlFlow}>
            <div style={S.stickyProgress}>
              <div style={S.stickyTopLine}>
                <strong>{completados} de {plantilla.length}</strong>
                <button type="button" style={S.actionChip} onClick={irAlProximoPendiente} disabled={completados === plantilla.length}>Ir al próximo pendiente</button>
                <button type="button" style={S.clearButton} onClick={limpiarBorrador}>Limpiar</button>
              </div>
              <nav style={S.sectionChips} aria-label="Secciones del control">
                {seccionesConEstado.map((seccion) => (
                  <button
                    type="button"
                    key={seccion.key}
                    style={{ ...S.sectionChip, ...(seccion.completa ? S.sectionChipDone : {}) }}
                    onClick={() => abrirSeccion(seccion.key)}
                  >
                    {seccion.completa ? '✓ ' : ''}{seccion.label} {seccion.completados}/{seccion.insumos.length}
                  </button>
                ))}
              </nav>
            </div>

            {seccionesConEstado.map((seccion) => (
              <section
                key={seccion.key}
                ref={(node) => { referenciasSecciones.current[seccion.key] = node; }}
                style={S.sectionAccordion}
              >
                <button
                  type="button"
                  style={S.sectionHeader}
                  aria-expanded={seccionAbierta === seccion.key}
                  onClick={() => seccionAbierta === seccion.key
                    ? (aperturaManual.current = true, setSeccionAbierta(null))
                    : abrirSeccion(seccion.key)}
                >
                  <span style={S.sectionIcon}>{seccion.icon}</span>
                  <span style={S.sectionHeaderName}>{seccion.label}</span>
                  <span style={S.sectionCount}>{seccion.completados}/{seccion.insumos.length}</span>
                  <span style={{ ...S.sectionStatus, ...(seccion.completa ? (seccion.conNovedades ? S.sectionStatusWarn : S.sectionStatusDone) : {}) }}>
                    {seccion.completa ? (seccion.conNovedades ? 'Con novedades' : 'Completa') : 'Pendiente'}
                  </span>
                  <span aria-hidden="true">{seccionAbierta === seccion.key ? '−' : '+'}</span>
                </button>

                {seccionAbierta === seccion.key && (
                  <div style={S.sectionBody}>
                    <div style={S.sectionActions}>
                      <span style={S.itemMeta}>Completados: {seccion.completados} de {seccion.insumos.length}</span>
                      <button
                        type="button"
                        style={S.actionChip}
                        disabled={!seccion.insumos.some((item) => item.tipo === 'CONSUMIBLE' && !itemCompleto(item))}
                        onClick={() => marcarSeccionCompleta(seccion)}
                      >Marcar sección completa</button>
                    </div>
                    {agruparVariantes(seccion.insumos).map((grupo) => (
                      <div key={grupo.key} style={grupo.esVariantes ? S.variantGroup : S.singleItem}>
                        {grupo.esVariantes && <h4 style={S.variantTitle}>{grupo.titulo}</h4>}
                        <div style={S.itemStack}>
                          {grupo.items.map((item) => renderItem(item, seccion.key === 'EQUIPO_MEDICO'))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}

            {pendientesPorSeccion.length > 0 && (
              <div style={S.pendingList}>
                <strong>Pendientes para completar el control</strong>
                {pendientesPorSeccion.map((seccion) => (
                  <div key={seccion.key} style={S.pendingRow}>
                    <strong>{seccion.label}</strong>
                    <span>{seccion.items.join(' · ')}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={S.footerBar}>
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
          <div style={S.modalOverlay} onClick={() => setDetalleSeleccionado(null)}>
            <div style={S.modal} onClick={(event) => event.stopPropagation()}>
              <div style={S.modalHeader}>
                <div>
                  <div style={S.overline}>Detalle del control</div>
                  <h3 style={S.h3}>{detalleSeleccionado.movilNumeroInterno} · {detalleSeleccionado.movilPatente}</h3>
                </div>
                <button style={S.closeBtn} onClick={() => setDetalleSeleccionado(null)}>×</button>
              </div>

              <div style={S.modalBody}>
                <p style={S.muted}>Fecha: {new Date(detalleSeleccionado.fecha).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                <p style={S.muted}>Resultado: <span style={resultBadge(detalleSeleccionado.resultado)}>{detalleSeleccionado.resultado}</span></p>
                <div style={S.statsGrid}>
                  <div style={S.statBox}><strong>{detalleSeleccionado.totalFaltantes}</strong><span>Faltantes</span></div>
                  <div style={S.statBox}><strong>{detalleSeleccionado.totalEquiposConNovedad}</strong><span>Equipos con novedad</span></div>
                  <div style={S.statBox}><strong>{detalleSeleccionado.totalDiscrepanciasSistema}</strong><span>Discrepancias</span></div>
                </div>

                {detalleSeleccionado.observaciones && <p style={S.muted}>Observaciones: {detalleSeleccionado.observaciones}</p>}

                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {detalleSeleccionado.items.map((item, index) => (
                    <div key={index} style={{
                      ...S.itemDetail,
                      ...(item.cantidadContada < item.cantidadRecomendada || item.cantidadContada !== item.cantidadSistema ? { borderColor: 'var(--color-warning)', background: 'var(--color-warning-soft)' } : {}),
                    }}>
                      <div>
                        <strong>{item.insumoNombre}</strong>
                        <div style={S.meta}>{item.categoria} · {item.tipo}</div>
                      </div>
                      <div style={S.detailValues}>
                        <span>Recomendado: {item.cantidadRecomendada}</span>
                        <span>Sistema: {item.cantidadSistema}</span>
                        <span>Contado: {item.cantidadContada}</span>
                        <span>Estado: {item.estadoEquipo || '—'}</span>
                        {item.numeroSerie && <span>N° serie: {item.numeroSerie}</span>}
                        {item.testOk !== null && item.testOk !== undefined && <span>Test: {item.testOk ? 'Aprobó' : 'No aprobó'}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
