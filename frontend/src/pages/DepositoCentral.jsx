import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { depositoCentralService } from '../services/api';

const TIPOS_MOVIMIENTO = [
  { value: 'INGRESO', label: 'Ingreso de mercadería' },
  { value: 'AJUSTE_POSITIVO', label: 'Ajuste positivo' },
  { value: 'AJUSTE_NEGATIVO', label: 'Ajuste negativo' },
];

export default function DepositoCentral() {
  const [stock, setStock] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [vista, setVista] = useState('stock');
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modalAlta, setModalAlta] = useState(false);
  const [insumoId, setInsumoId] = useState('');
  const [cantidadInicial, setCantidadInicial] = useState('0');
  const [cantidadMinima, setCantidadMinima] = useState('0');
  const [minimosEditados, setMinimosEditados] = useState({});
  const [movimiento, setMovimiento] = useState(null);
  const [tipoMovimiento, setTipoMovimiento] = useState('INGRESO');
  const [cantidadMovimiento, setCantidadMovimiento] = useState('');
  const [motivoMovimiento, setMotivoMovimiento] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [stockResponse, catalogoResponse, movimientosResponse] = await Promise.all([
        depositoCentralService.stock(),
        depositoCentralService.catalogo(),
        depositoCentralService.movimientos(),
      ]);
      setStock(stockResponse.data || []);
      setCatalogo(catalogoResponse.data || []);
      setMovimientos(movimientosResponse.data || []);
      setError('');
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo cargar el depósito central.');
    } finally {
      setLoading(false);
    }
  };

  const agregarInsumo = async () => {
    if (!insumoId) {
      setError('Seleccioná un insumo del catálogo.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await depositoCentralService.agregarInsumo({
        insumoId: Number(insumoId),
        cantidadInicial: Number(cantidadInicial) || 0,
        cantidadMinima: Number(cantidadMinima) || 0,
      });
      setMensaje('Insumo agregado al depósito.');
      setModalAlta(false);
      setInsumoId('');
      setCantidadInicial('0');
      setCantidadMinima('0');
      await cargarDatos();
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo agregar el insumo.');
    } finally {
      setGuardando(false);
    }
  };

  const guardarMinimo = async (item) => {
    const value = Number(minimosEditados[item.id] ?? item.cantidadMinima);
    if (!Number.isInteger(value) || value < 0) {
      setError('El mínimo debe ser un número entero igual o mayor a cero.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await depositoCentralService.actualizarMinimo(item.id, value);
      setMensaje(`Mínimo de ${item.nombre} actualizado.`);
      setMinimosEditados(previous => {
        const next = { ...previous };
        delete next[item.id];
        return next;
      });
      await cargarDatos();
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo actualizar el mínimo.');
    } finally {
      setGuardando(false);
    }
  };

  const archivarInsumo = async (item) => {
    if (!window.confirm(`¿Archivar ${item.nombre} del depósito? El historial de movimientos se conserva.`)) return;
    setGuardando(true);
    setError('');
    try {
      await depositoCentralService.archivarInsumo(item.id);
      setMensaje(`${item.nombre} archivado del depósito.`);
      await cargarDatos();
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo archivar el insumo.');
    } finally {
      setGuardando(false);
    }
  };

  const abrirMovimiento = (item) => {
    setMovimiento(item);
    setTipoMovimiento('INGRESO');
    setCantidadMovimiento('');
    setMotivoMovimiento('');
    setError('');
  };

  const registrarMovimiento = async () => {
    if (!cantidadMovimiento || Number(cantidadMovimiento) <= 0 || !motivoMovimiento.trim()) {
      setError('Indicá una cantidad mayor a cero y el motivo del movimiento.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await depositoCentralService.registrarMovimiento({
        insumoId: movimiento.insumoId,
        tipo: tipoMovimiento,
        cantidad: Number(cantidadMovimiento),
        motivo: motivoMovimiento.trim(),
      });
      setMensaje(`Movimiento registrado para ${movimiento.nombre}.`);
      setMovimiento(null);
      await cargarDatos();
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo registrar el movimiento.');
    } finally {
      setGuardando(false);
    }
  };

  const catalogoDisponible = catalogo.filter(item => !stock.some(row => row.insumoId === item.insumoId));
  const bajoMinimo = stock.filter(item => item.cantidadActual <= item.cantidadMinima).length;

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={S.main}>
        <header style={S.header}>
          <div>
            <p style={S.overline}>Abastecimiento · Central de operaciones</p>
            <h1 style={S.h1}>Depósito central</h1>
            <p style={S.sub}>Existencias generales, mínimos y movimientos de farmacia.</p>
          </div>
          {vista === 'stock' && <Button onClick={() => { setError(''); setModalAlta(true); }}>＋ Agregar insumo</Button>}
        </header>

        {mensaje && <div style={S.success}>{mensaje}</div>}
        {error && !modalAlta && !movimiento && <div style={S.error}>{error}</div>}

        <nav style={S.tabs} aria-label="Secciones del depósito">
          <button type="button" style={{ ...S.tab, ...(vista === 'stock' ? S.tabActive : {}) }} onClick={() => setVista('stock')}>Existencias</button>
          <button type="button" style={{ ...S.tab, ...(vista === 'movimientos' ? S.tabActive : {}) }} onClick={() => setVista('movimientos')}>Movimientos</button>
        </nav>

        {loading ? <div style={S.status}>Cargando depósito...</div> : vista === 'stock' ? (
          <>
            <div style={S.summary}>
              <div><strong>{stock.length}</strong><span> insumos administrados</span></div>
              <div style={bajoMinimo ? S.lowStockSummary : undefined}><strong>{bajoMinimo}</strong><span> bajo mínimo</span></div>
            </div>
            {stock.length === 0 ? (
              <EmptyState icon="🏥" title="Depósito aún sin insumos" description="Agregá insumos desde el catálogo para comenzar a administrar existencias." action={<Button onClick={() => setModalAlta(true)}>Agregar insumo</Button>} />
            ) : (
              <div style={S.stockList}>
                {stock.map(item => {
                  const alerta = item.cantidadActual <= item.cantidadMinima;
                  return (
                    <article key={item.id} style={{ ...S.stockItem, ...(alerta ? S.stockItemLow : {}) }}>
                      <div style={S.stockIdentity}>
                        <div style={S.stockNameLine}>
                          <strong>{item.nombre}</strong>
                          {alerta && <span style={S.lowBadge}>Reponer</span>}
                        </div>
                        <span style={S.muted}>{item.categoria} · {item.tipo}{item.unidadMedida ? ` · ${item.unidadMedida}` : ''}</span>
                      </div>
                      <div style={S.quantityBlock}>
                        <strong style={S.quantityValue}>{item.cantidadActual}</strong>
                        <span style={S.muted}>existencia</span>
                      </div>
                      <label style={S.minimumField}>
                        <span>Mínimo</span>
                        <input
                          style={S.minimumInput}
                          type="number"
                          min="0"
                          value={minimosEditados[item.id] ?? item.cantidadMinima}
                          onChange={event => setMinimosEditados(previous => ({ ...previous, [item.id]: event.target.value }))}
                          aria-label={`Mínimo de ${item.nombre}`}
                        />
                      </label>
                      <div style={S.rowActions}>
                        {minimosEditados[item.id] !== undefined && (
                          <button type="button" style={S.smallAction} disabled={guardando} onClick={() => guardarMinimo(item)}>Guardar mínimo</button>
                        )}
                        <button type="button" style={S.smallAction} disabled={guardando} onClick={() => abrirMovimiento(item)}>Registrar movimiento</button>
                        {item.cantidadActual === 0 && <button type="button" style={S.archiveAction} disabled={guardando} onClick={() => archivarInsumo(item)}>Archivar</button>}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          movimientos.length === 0 ? (
            <EmptyState icon="↕" title="Sin movimientos todavía" description="Los ingresos, ajustes y entregas de reposición aparecerán aquí con usuario y motivo." />
          ) : (
            <div style={S.movementList}>
              {movimientos.map(item => (
                <article key={item.id} style={S.movementItem}>
                  <div style={S.movementHeader}>
                    <div><strong>{item.insumoNombre}</strong><span style={S.muted}>{new Date(item.fecha).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</span></div>
                    <span style={S.movementType}>{etiquetaMovimiento(item.tipo)}</span>
                  </div>
                  <div style={S.movementMeta}>
                    <span>{item.cantidadAnterior} → {item.cantidadNueva} unidades</span>
                    <span>{item.usuarioNombre}</span>
                    {item.solicitudId && <span>Solicitud #{item.solicitudId}</span>}
                  </div>
                  <p style={S.movementReason}>{item.motivo}</p>
                </article>
              ))}
            </div>
          )
        )}
      </main>

      {modalAlta && (
        <div style={S.overlay} onMouseDown={() => !guardando && setModalAlta(false)}>
          <section style={S.modal} onMouseDown={event => event.stopPropagation()}>
            <div style={S.modalHeader}><div><p style={S.overline}>Alta al depósito</p><h2 style={S.modalTitle}>Agregar insumo</h2></div><button type="button" style={S.close} onClick={() => setModalAlta(false)} aria-label="Cerrar">×</button></div>
            {error && <div style={S.error}>{error}</div>}
            <label style={S.field}>Insumo del catálogo<select style={S.input} value={insumoId} onChange={event => setInsumoId(event.target.value)}><option value="">Seleccionar insumo</option>{catalogoDisponible.map(item => <option key={item.insumoId} value={item.insumoId}>{item.nombre} · {item.categoria}</option>)}</select></label>
            <div style={S.formGrid}>
              <label style={S.field}>Existencia inicial<input style={S.input} type="number" min="0" value={cantidadInicial} onChange={event => setCantidadInicial(event.target.value)} /></label>
              <label style={S.field}>Aviso de mínimo<input style={S.input} type="number" min="0" value={cantidadMinima} onChange={event => setCantidadMinima(event.target.value)} /></label>
            </div>
            <p style={S.hint}>Una existencia inicial mayor a cero crea también un movimiento de ingreso auditable.</p>
            <div style={S.modalActions}><Button variant="secondary" onClick={() => setModalAlta(false)}>Cancelar</Button><Button disabled={guardando || !insumoId} onClick={agregarInsumo}>{guardando ? 'Guardando...' : 'Agregar al depósito'}</Button></div>
          </section>
        </div>
      )}

      {movimiento && (
        <div style={S.overlay} onMouseDown={() => !guardando && setMovimiento(null)}>
          <section style={S.modal} onMouseDown={event => event.stopPropagation()}>
            <div style={S.modalHeader}><div><p style={S.overline}>Existencia actual: {movimiento.cantidadActual}</p><h2 style={S.modalTitle}>{movimiento.nombre}</h2></div><button type="button" style={S.close} onClick={() => setMovimiento(null)} aria-label="Cerrar">×</button></div>
            {error && <div style={S.error}>{error}</div>}
            <label style={S.field}>Tipo<select style={S.input} value={tipoMovimiento} onChange={event => setTipoMovimiento(event.target.value)}>{TIPOS_MOVIMIENTO.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label style={S.field}>Cantidad<input style={S.input} type="number" min="1" value={cantidadMovimiento} onChange={event => setCantidadMovimiento(event.target.value)} /></label>
            <label style={S.field}>Motivo<textarea style={S.input} maxLength={500} rows={3} value={motivoMovimiento} onChange={event => setMotivoMovimiento(event.target.value)} placeholder="Factura, recuento, vencimiento, rotura..." /></label>
            <div style={S.modalActions}><Button variant="secondary" onClick={() => setMovimiento(null)}>Cancelar</Button><Button disabled={guardando} onClick={registrarMovimiento}>{guardando ? 'Registrando...' : 'Guardar movimiento'}</Button></div>
          </section>
        </div>
      )}
    </div>
  );
}

function etiquetaMovimiento(tipo) {
  return ({
    ALTA: 'Alta en depósito',
    INGRESO: 'Ingreso',
    AJUSTE_POSITIVO: 'Ajuste +',
    AJUSTE_NEGATIVO: 'Ajuste −',
    ENTREGA_REPOSICION: 'Entrega a móvil',
    CAMBIO_MINIMO: 'Cambio de mínimo',
    ARCHIVO: 'Archivo de insumo',
  })[tipo] || tipo;
}

const S = {
  page: { display: 'flex', minHeight: '100vh', background: 'var(--color-page-bg)', color: 'var(--color-text-primary)' },
  main: { display: 'flex', flex: 1, minWidth: 0, maxWidth: 'var(--max-content-width)', flexDirection: 'column', gap: 'var(--spacing-5)', margin: '0 auto', padding: 'var(--spacing-5)', width: '100%' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-4)', padding: 'var(--spacing-5)', color: 'var(--color-on-primary)', background: 'var(--color-primary)', borderRadius: 'var(--radius-lg)' },
  overline: { margin: '0 0 var(--spacing-1)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase' },
  h1: { margin: 0, color: 'var(--color-on-primary)', fontSize: 'var(--font-size-2xl)' },
  sub: { margin: 'var(--spacing-1) 0 0', color: 'rgba(255,255,255,0.82)', fontSize: 'var(--font-size-sm)' },
  tabs: { display: 'flex', gap: 'var(--spacing-2)', overflowX: 'auto', borderBottom: '1px solid var(--color-border)' },
  tab: { flex: '0 0 auto', minHeight: '44px', padding: '0.75rem 1rem', color: 'var(--color-text-secondary)', background: 'transparent', border: 'none', borderBottom: '3px solid transparent', fontWeight: 700, whiteSpace: 'nowrap' },
  tabActive: { color: 'var(--color-primary-strong)', borderBottomColor: 'var(--color-primary)' },
  summary: { display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap', padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' },
  lowStockSummary: { color: 'var(--color-warning-strong)' },
  stockList: { display: 'grid', gap: 'var(--spacing-2)' },
  stockItem: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', gap: 'var(--spacing-3)', padding: 'var(--spacing-4)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' },
  stockItemLow: { borderInlineStart: '4px solid var(--color-warning)' },
  stockIdentity: { minWidth: 0, display: 'grid', gap: '0.25rem' },
  stockNameLine: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-2)' },
  lowBadge: { padding: '0.15rem 0.45rem', color: 'var(--color-warning-strong)', background: 'var(--color-warning-soft)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-xxs)', fontWeight: 700 },
  quantityBlock: { display: 'grid', justifyItems: 'end' },
  quantityValue: { fontSize: 'var(--font-size-xl)', fontVariantNumeric: 'tabular-nums' },
  muted: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' },
  minimumField: { display: 'grid', gap: '0.2rem', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' },
  minimumInput: { width: '5rem', minHeight: '40px', boxSizing: 'border-box', padding: '0.4rem', textAlign: 'center', color: 'var(--color-text-primary)', background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)' },
  rowActions: { display: 'flex', justifyContent: 'flex-end', gridColumn: '1 / -1', gap: 'var(--spacing-2)', flexWrap: 'wrap' },
  smallAction: { minHeight: '40px', padding: '0.45rem 0.7rem', color: 'var(--color-primary-strong)', background: 'var(--color-primary-soft)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700 },
  archiveAction: { minHeight: '40px', padding: '0.45rem 0.7rem', color: 'var(--color-danger-strong)', background: 'transparent', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700 },
  movementList: { display: 'grid', gap: 'var(--spacing-2)' },
  movementItem: { display: 'grid', gap: 'var(--spacing-2)', padding: 'var(--spacing-4)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' },
  movementHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-3)' },
  movementType: { padding: '0.25rem 0.5rem', color: 'var(--color-primary-strong)', background: 'var(--color-primary-soft)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-xs)', fontWeight: 700 },
  movementMeta: { display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' },
  movementReason: { margin: 0, color: 'var(--color-text-primary)', fontSize: 'var(--font-size-sm)' },
  status: { padding: 'var(--spacing-6)', textAlign: 'center', color: 'var(--color-text-secondary)' },
  success: { padding: 'var(--spacing-3)', color: 'var(--color-success-strong)', background: 'var(--color-success-soft)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-sm)' },
  error: { padding: 'var(--spacing-3)', color: 'var(--color-danger-strong)', background: 'var(--color-danger-soft)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)' },
  overlay: { position: 'fixed', inset: 0, zIndex: 'var(--z-modal)', display: 'grid', placeItems: 'center', padding: 'var(--spacing-4)', background: 'rgba(15,42,48,0.48)' },
  modal: { display: 'grid', gap: 'var(--spacing-4)', width: 'min(100%, 34rem)', maxHeight: '90vh', overflowY: 'auto', padding: 'var(--spacing-5)', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--spacing-3)' },
  modalTitle: { margin: 0, fontSize: 'var(--font-size-xl)' },
  close: { minWidth: '40px', minHeight: '40px', color: 'var(--color-text-secondary)', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '1.3rem' },
  field: { display: 'grid', gap: 'var(--spacing-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', fontWeight: 700 },
  input: { width: '100%', minHeight: '44px', boxSizing: 'border-box', padding: '0.65rem 0.75rem', color: 'var(--color-text-primary)', background: 'var(--color-surface)', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)', fontWeight: 400 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(9rem, 1fr))', gap: 'var(--spacing-3)' },
  hint: { margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)', flexWrap: 'wrap' },
};