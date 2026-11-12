import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';
import { depositoCentralService } from '../services/api';
import './DepositoCentral.css';

const CATEGORIAS_DEPOSITO = {
  MEDICACION: { label: 'Medicación', icon: '💊' },
  DESCARTABLE: { label: 'Descartables', icon: '🧤' },
  TRAUMA: { label: 'Trauma', icon: '🩹' },
  VIA_AEREA: { label: 'Vía aérea', icon: '🫁' },
  EQUIPO_MEDICO: { label: 'Equipos médicos', icon: '🩺' },
  OXIGENO: { label: 'Oxígeno', icon: '🫧' },
  ANTISEPTICO: { label: 'Antisépticos', icon: '🧴' },
  KIT: { label: 'Kits', icon: '🧰' },
  MONITOREO: { label: 'Monitoreo', icon: '📟' },
  CURACION: { label: 'Curación', icon: '🩹' },
  SOLUCION: { label: 'Soluciones', icon: '💉' },
};

const getCategoryInfo = (category) => CATEGORIAS_DEPOSITO[category] || {
  label: category === 'SIN_CATEGORIA'
    ? 'Sin categoría'
    : String(category).toLocaleLowerCase('es').replace(/(^|_)\w/g, (letter) => letter.replace('_', ' ').toLocaleUpperCase('es')),
  icon: '📦',
};

export default function DepositoCentral() {
  const { user } = useAuth();
  const [stock, setStock] = useState([]);
  const [archivados, setArchivados] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [vista, setVista] = useState('stock');
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modalAlta, setModalAlta] = useState(false);
  const [isReposicionModalOpen, setIsReposicionModalOpen] = useState(false);
  const [reposicionForm, setReposicionForm] = useState({ insumoId: '', cantidad: '' });
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    cantidadInicial: '0',
    cantidadMinima: '0',
  });
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [minimosEditados, setMinimosEditados] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const puedeGestionarArchivo = ['ADM', 'JEF'].includes(user?.rol);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [stockResponse, archivadosResponse, movimientosResponse] = await Promise.all([
        depositoCentralService.stock(true),
        depositoCentralService.stock(false),
        depositoCentralService.movimientos(),
      ]);
      setStock(stockResponse.data || []);
      setArchivados(archivadosResponse.data || []);
      setMovimientos(movimientosResponse.data || []);
      setError('');
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo cargar el depósito central.');
    } finally {
      setLoading(false);
    }
  };

  const agregarInsumo = async () => {
    if (!formData.nombre.trim()) {
      setError('Ingresá el nombre del insumo.');
      return;
    }
    if (!formData.categoria) {
      setError('Seleccioná la categoría del insumo.');
      return;
    }
    const inicial = Number(formData.cantidadInicial);
    const minimo = Number(formData.cantidadMinima);
    if (!Number.isInteger(inicial) || inicial < 0 || !Number.isInteger(minimo) || minimo < 0) {
      setError('La existencia inicial y el mínimo deben ser enteros iguales o mayores a cero.');
      return;
    }

    setGuardando(true);
    setError('');
    try {
      await depositoCentralService.agregarInsumo({
        nombre: formData.nombre.trim(),
        categoria: formData.categoria,
        cantidadInicial: inicial,
        cantidadMinima: minimo,
      });
      setMensaje(`${formData.nombre.trim()} creado y agregado al depósito.`);
      setModalAlta(false);
      setFormData({ nombre: '', categoria: '', cantidadInicial: '0', cantidadMinima: '0' });
      await cargarDatos();
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo agregar el insumo.');
    } finally {
      setGuardando(false);
    }
  };

  const abrirAltaInsumo = () => {
    setError('');
    setMensaje('');
    setFormData({ nombre: '', categoria: '', cantidadInicial: '0', cantidadMinima: '0' });
    setModalAlta(true);
  };

  const registrarIngresoStock = async (event) => {
    event.preventDefault();
    const insumoId = Number(reposicionForm.insumoId);
    const cantidad = Number(reposicionForm.cantidad);
    if (!Number.isInteger(insumoId) || insumoId <= 0) {
      setError('Seleccioná un insumo del depósito.');
      return;
    }
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      setError('La cantidad a ingresar debe ser un entero mayor a cero.');
      return;
    }

    const insumo = stock.find(item => item.insumoId === insumoId);
    setGuardando(true);
    setError('');
    try {
      await depositoCentralService.sumarStock(insumoId, cantidad);
      setIsReposicionModalOpen(false);
      setReposicionForm({ insumoId: '', cantidad: '' });
      setMensaje(`Ingreso de ${cantidad} ${insumo?.unidadMedida || 'unidades'} de ${insumo?.nombre || 'insumo'} registrado.`);
      await cargarDatos();
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo registrar el ingreso de stock.');
    } finally {
      setGuardando(false);
    }
  };

  const iniciarEdicionNombre = (item) => {
    setEditingItemId(item.insumoId);
    setEditingName(item.nombre);
    setError('');
  };

  const cancelarEdicionNombre = () => {
    setEditingItemId(null);
    setEditingName('');
  };

  const guardarNombreInsumo = async (item) => {
    const nombre = editingName.trim();
    if (!nombre) {
      setError('El nombre del insumo es obligatorio.');
      return;
    }
    if (nombre.length > 255) {
      setError('El nombre no puede superar 255 caracteres.');
      return;
    }
    if (nombre === item.nombre) {
      cancelarEdicionNombre();
      return;
    }

    setSavingName(true);
    setError('');
    try {
      await depositoCentralService.actualizarNombreInsumo(item.insumoId, nombre);
      setStock(current => current.map(stockItem => (
        stockItem.insumoId === item.insumoId ? { ...stockItem, nombre } : stockItem
      )));
      setArchivados(current => current.map(stockItem => (
        stockItem.insumoId === item.insumoId ? { ...stockItem, nombre } : stockItem
      )));
      setMovimientos(current => current.map(movement => (
        movement.insumoId === item.insumoId ? { ...movement, insumoNombre: nombre } : movement
      )));
      setMensaje(`Nombre actualizado a “${nombre}”.`);
      cancelarEdicionNombre();
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo actualizar el nombre del insumo.');
    } finally {
      setSavingName(false);
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
      await depositoCentralService.archivarInsumo(item.insumoId);
      setMensaje(`${item.nombre} archivado del depósito.`);
      await cargarDatos();
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo archivar el insumo.');
    } finally {
      setGuardando(false);
    }
  };

  const desarchivarInsumo = async (item) => {
    setGuardando(true);
    setError('');
    try {
      await depositoCentralService.desarchivarInsumo(item.insumoId);
      setMensaje(`${item.nombre} desarchivado del depósito.`);
      await cargarDatos();
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo desarchivar el insumo.');
    } finally {
      setGuardando(false);
    }
  };

  const bajoMinimo = stock.filter(item => item.cantidadActual <= item.cantidadMinima).length;
  const insumosEnVista = vista === 'archivados' ? archivados : stock;
  const categoriasDisponibles = useMemo(() => [...new Set(
    insumosEnVista.map(item => item.categoria || 'SIN_CATEGORIA')
  )].sort((first, second) => getCategoryInfo(first).label.localeCompare(getCategoryInfo(second).label, 'es')), [insumosEnVista]);
  const insumosFiltrados = useMemo(() => {
    const texto = searchTerm.trim().toLocaleLowerCase('es');
    return insumosEnVista.filter(item => {
      const coincideNombre = !texto || String(item.nombre || '').toLocaleLowerCase('es').includes(texto);
      const coincideCategoria = !selectedCategory || (item.categoria || 'SIN_CATEGORIA') === selectedCategory;
      return coincideNombre && coincideCategoria;
    });
  }, [insumosEnVista, searchTerm, selectedCategory]);
  const insumosPorCategoria = useMemo(() => insumosFiltrados.reduce((grupos, item) => {
    const categoria = item.categoria || 'SIN_CATEGORIA';
    if (!grupos[categoria]) grupos[categoria] = [];
    grupos[categoria].push(item);
    return grupos;
  }, {}), [insumosFiltrados]);
  const categoriasConInsumos = categoriasDisponibles.filter(categoria => insumosPorCategoria[categoria]?.length);

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={S.main}>
        <header style={S.header}>
          <div>
            <p style={S.headerOverline}>Abastecimiento · Central de operaciones</p>
            <h1 style={S.h1}>Depósito central</h1>
            <p style={S.sub}>Existencias generales, mínimos y movimientos de farmacia.</p>
          </div>
          {vista === 'stock' && (
            <div className="central-stock-header-actions">
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setError('');
                  setMensaje('');
                  setReposicionForm({ insumoId: '', cantidad: '' });
                  setIsReposicionModalOpen(true);
                }}
              >
                + Registrar reposición
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={abrirAltaInsumo}
              >
                + Alta Insumo
              </Button>
            </div>
          )}
        </header>

        {mensaje && <div style={S.success} role="status">{mensaje}</div>}
        {error && !modalAlta && !isReposicionModalOpen && <div style={S.error} role="alert">{error}</div>}

        <nav style={S.tabs} aria-label="Secciones del depósito">
          <button type="button" style={{ ...S.tab, ...(vista === 'stock' ? S.tabActive : {}) }} onClick={() => setVista('stock')}>Existencias</button>
          {puedeGestionarArchivo && <button type="button" style={{ ...S.tab, ...(vista === 'archivados' ? S.tabActive : {}) }} onClick={() => setVista('archivados')}>Archivados ({archivados.length})</button>}
          <button type="button" style={{ ...S.tab, ...(vista === 'movimientos' ? S.tabActive : {}) }} onClick={() => setVista('movimientos')}>Movimientos</button>
        </nav>

        {loading ? <div style={S.status}>Cargando depósito...</div> : vista === 'stock' || (vista === 'archivados' && puedeGestionarArchivo) ? (
          <>
            {vista === 'stock' && (
              <div style={S.summary}>
                <div><strong>{stock.length}</strong><span> insumos administrados</span></div>
                <div style={bajoMinimo ? S.lowStockSummary : undefined}><strong>{bajoMinimo}</strong><span> bajo mínimo</span></div>
              </div>
            )}
            <div className="central-stock-filters">
              <label className="central-stock-search">
                <span>Buscar insumo</span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder="Nombre del insumo"
                />
              </label>
              <label className="central-stock-category-filter">
                <span>Categoría</span>
                <select value={selectedCategory} onChange={event => setSelectedCategory(event.target.value)}>
                  <option value="">Todas las categorías</option>
                  {categoriasDisponibles.map(category => (
                    <option key={category} value={category}>{getCategoryInfo(category).label}</option>
                  ))}
                </select>
              </label>
            </div>
            {insumosEnVista.length === 0 ? (
              vista === 'stock'
                ? <EmptyState icon="🏥" title="Depósito aún sin insumos" description="Agregá insumos desde el catálogo para comenzar a administrar existencias." action={<Button onClick={abrirAltaInsumo}>Agregar insumo</Button>} />
                : <EmptyState icon="📦" title="Sin insumos archivados" description="Los insumos archivados aparecerán aquí." />
            ) : (
              categoriasConInsumos.length === 0 ? (
                <EmptyState icon="🔎" title="No se encontraron insumos" description="Probá con otro nombre o cambiá la categoría seleccionada." />
              ) : (
                <div className="central-stock-grid">
                  {categoriasConInsumos.map(category => {
                    const categoryInfo = getCategoryInfo(category);
                    const items = insumosPorCategoria[category];
                    const isExpanded = Boolean(expandedCategories[category]);
                    const visibleItems = isExpanded ? items : items.slice(0, 5);
                    return (
                      <section className="central-stock-category-card" key={category}>
                        <header className="central-stock-category-header">
                          <div className="central-stock-category-title">
                            <span className="central-stock-category-icon" aria-hidden="true">{categoryInfo.icon}</span>
                            <h2>{categoryInfo.label}</h2>
                          </div>
                          <span className="central-stock-count" aria-label={`${items.length} insumos`}>{items.length}</span>
                        </header>
                        <div className="central-stock-items">
                          {visibleItems.map(item => {
                            const cantidad = Number(item.cantidadActual) || 0;
                            const alerta = cantidad <= (Number(item.cantidadMinima) || 0);
                            const presentacion = [item.tipo, item.unidadMedida].filter(Boolean).join(' · ');
                            return (
                              <article className={`central-stock-row${alerta ? ' is-low' : ''}`} key={item.id}>
                                <div className="central-stock-item-info">
                                  <div className="central-stock-name-line">
                                    {editingItemId === item.insumoId ? (
                                      <div className="central-stock-inline-editor">
                                        <input
                                          type="text"
                                          maxLength={255}
                                          value={editingName}
                                          autoFocus
                                          aria-label={`Nuevo nombre para ${item.nombre}`}
                                          onChange={event => {
                                            setEditingName(event.target.value);
                                            setError('');
                                          }}
                                          onKeyDown={event => {
                                            if (event.key === 'Enter') {
                                              event.preventDefault();
                                              guardarNombreInsumo(item);
                                            } else if (event.key === 'Escape') {
                                              cancelarEdicionNombre();
                                            }
                                          }}
                                        />
                                        <button
                                          type="button"
                                          className="central-stock-inline-save"
                                          disabled={savingName}
                                          aria-label={`Guardar nombre de ${item.nombre}`}
                                          title="Guardar nombre"
                                          onClick={() => guardarNombreInsumo(item)}
                                        >
                                          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m4 10 4 4 8-8" />
                                          </svg>
                                        </button>
                                        <button
                                          type="button"
                                          className="central-stock-inline-cancel"
                                          disabled={savingName}
                                          aria-label="Cancelar edición del nombre"
                                          title="Cancelar"
                                          onClick={cancelarEdicionNombre}
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ) : (
                                      <strong>{item.nombre}</strong>
                                    )}
                                    {vista === 'archivados'
                                      ? <span style={S.lowBadge}>Archivado</span>
                                      : alerta && <span style={S.lowBadge}>Reponer</span>}
                                  </div>
                                  <span className="central-stock-presentation">{presentacion || 'Sin detalle de presentación'}</span>
                                  {vista === 'stock' && (
                                    <div className="central-stock-minimum">
                                      <label htmlFor={`minimum-${item.id}`}>Mínimo</label>
                                      <input
                                        id={`minimum-${item.id}`}
                                        type="number"
                                        min="0"
                                        value={minimosEditados[item.id] ?? item.cantidadMinima}
                                        onChange={event => setMinimosEditados(previous => ({
                                          ...previous,
                                          [item.id]: event.target.value,
                                        }))}
                                        aria-label={`Mínimo de ${item.nombre}`}
                                      />
                                      {minimosEditados[item.id] !== undefined && (
                                        <button
                                          type="button"
                                          className="central-stock-save-minimum"
                                          disabled={guardando}
                                          onClick={() => guardarMinimo(item)}
                                        >
                                          Guardar
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="central-stock-row-right">
                                  <div className="central-stock-quantity">
                                    <strong>{cantidad}</strong>
                                    <span>{item.unidadMedida || 'existencia'}</span>
                                  </div>
                                  {vista === 'stock' && puedeGestionarArchivo && (
                                    <div className="central-stock-row-actions">
                                      <button
                                        type="button"
                                        className="central-stock-archive"
                                        disabled={guardando || cantidad !== 0}
                                        title={cantidad !== 0 ? 'Para archivar, la existencia debe ser cero.' : `Archivar ${item.nombre}`}
                                        aria-label={`Archivar ${item.nombre}`}
                                        onClick={() => archivarInsumo(item)}
                                      >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18v13H3zM3 4h18v3H3zM9 11h6" />
                                        </svg>
                                      </button>
                                      <button
                                        type="button"
                                        className="central-stock-edit"
                                        disabled={guardando || savingName}
                                        title={`Modificar ${item.nombre}`}
                                        aria-label={`Modificar ${item.nombre}`}
                                        onClick={() => iniciarEdicionNombre(item)}
                                      >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.5 3.5 4 4M4 20l4.3-.9L20 7.4a2.1 2.1 0 0 0-3-3L5.3 16.1 4 20Z" />
                                        </svg>
                                      </button>
                                    </div>
                                  )}
                                  {vista === 'archivados' && puedeGestionarArchivo && (
                                    <button
                                      type="button"
                                      className="central-stock-restore"
                                      disabled={guardando}
                                      onClick={() => desarchivarInsumo(item)}
                                    >
                                      Desarchivar
                                    </button>
                                  )}
                                </div>
                              </article>
                            );
                          })}
                        </div>
                        {items.length > 5 && (
                          <button
                            type="button"
                            className="central-stock-expand"
                            aria-expanded={isExpanded}
                            onClick={() => setExpandedCategories(current => ({
                              ...current,
                              [category]: !current[category],
                            }))}
                          >
                            <span>{isExpanded ? 'Ver menos' : `+ ${items.length - 5} insumos`}</span>
                            <svg
                              className={isExpanded ? 'is-expanded' : ''}
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
              )
            )}
          </>
        ) : vista === 'movimientos' ? (
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
        ) : (
          <EmptyState icon="📦" title="Vista no disponible" description="No tenés permiso para consultar esta sección." />
        )}
      </main>

      {modalAlta && (
        <div style={S.overlay} onMouseDown={() => !guardando && setModalAlta(false)}>
          <section style={S.modal} onMouseDown={event => event.stopPropagation()}>
            <div style={S.modalHeader}><div><p style={S.overline}>Alta al depósito</p><h2 style={S.modalTitle}>Alta Insumo</h2></div><button type="button" style={S.close} onClick={() => setModalAlta(false)} aria-label="Cerrar">×</button></div>
            {error && <div style={S.error} role="alert">{error}</div>}
            <label style={S.field}>
              Nombre de insumo
              <input
                style={S.input}
                type="text"
                maxLength={255}
                value={formData.nombre}
                onChange={event => setFormData(current => ({ ...current, nombre: event.target.value }))}
                placeholder="Ej.: Guantes descartables"
              />
            </label>
            <div style={S.formGrid}>
              <label style={S.field}>
                Categoría
                <select
                  style={S.input}
                  value={formData.categoria}
                  onChange={event => setFormData(current => ({ ...current, categoria: event.target.value }))}
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {Object.entries(CATEGORIAS_DEPOSITO).map(([value, category]) => (
                    <option key={value} value={value}>{category.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <div style={S.formGrid}>
              <label style={S.field}>
                Existencia inicial
                <input
                  style={S.input}
                  type="number"
                  min="0"
                  step="1"
                  value={formData.cantidadInicial}
                  onChange={event => setFormData(current => ({ ...current, cantidadInicial: event.target.value }))}
                />
              </label>
              <label style={S.field}>
                Aviso de mínimo
                <input
                  style={S.input}
                  type="number"
                  min="0"
                  step="1"
                  value={formData.cantidadMinima}
                  onChange={event => setFormData(current => ({ ...current, cantidadMinima: event.target.value }))}
                />
              </label>
            </div>
            <p style={S.hint}>Una existencia inicial mayor a cero crea también un movimiento de ingreso auditable.</p>
            <div style={S.modalActions}>
              <Button type="button" variant="secondary" disabled={guardando} onClick={() => setModalAlta(false)}>Cancelar</Button>
              <Button type="button" disabled={guardando} onClick={agregarInsumo}>
                {guardando ? 'Guardando...' : 'Crear y agregar'}
              </Button>
            </div>
          </section>
        </div>
      )}

      {isReposicionModalOpen && (
        <div
          style={S.overlay}
          onMouseDown={() => {
            if (!guardando) {
              setIsReposicionModalOpen(false);
              setError('');
            }
          }}
        >
          <section
            style={S.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="central-stock-ingreso-title"
            onMouseDown={event => event.stopPropagation()}
          >
            <div style={S.modalHeader}>
              <div>
                <p style={S.overline}>Ingreso de mercadería</p>
                <h2 id="central-stock-ingreso-title" style={S.modalTitle}>Registrar reposición</h2>
              </div>
              <button
                type="button"
                style={S.close}
                disabled={guardando}
                onClick={() => {
                  setIsReposicionModalOpen(false);
                  setError('');
                }}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            {error && <div style={S.error} role="alert">{error}</div>}
            {stock.length === 0 ? (
              <>
                <p style={S.hint}>No hay insumos activos en el depósito para reponer.</p>
                <div style={S.modalActions}>
                  <Button type="button" variant="secondary" onClick={() => setIsReposicionModalOpen(false)}>Cerrar</Button>
                </div>
              </>
            ) : (
              <form onSubmit={registrarIngresoStock} style={{ display: 'grid', gap: 'var(--spacing-4)' }}>
                <div style={S.formGrid}>
                  <label style={S.field}>
                    Seleccionar Insumo
                    <select
                      style={S.input}
                      value={reposicionForm.insumoId}
                      onChange={event => setReposicionForm(current => ({ ...current, insumoId: event.target.value }))}
                      required
                    >
                      <option value="">Seleccionar insumo</option>
                      {stock.map(item => (
                        <option key={item.insumoId} value={item.insumoId}>
                          {item.nombre} · Stock actual: {item.cantidadActual}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label style={S.field}>
                    Cantidad a ingresar
                    <input
                      style={S.input}
                      type="number"
                      min="1"
                      step="1"
                      value={reposicionForm.cantidad}
                      onChange={event => setReposicionForm(current => ({ ...current, cantidad: event.target.value }))}
                      required
                    />
                  </label>
                </div>
                <div style={S.modalActions}>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={guardando}
                    onClick={() => {
                      setIsReposicionModalOpen(false);
                      setError('');
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={guardando}>
                    {guardando ? 'Registrando...' : 'Registrar ingreso'}
                  </Button>
                </div>
              </form>
            )}
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
    DESARCHIVO: 'Desarchivo de insumo',
  })[tipo] || tipo;
}

const S = {
  page: { display: 'flex', minHeight: '100vh', background: 'var(--color-page-bg)', color: 'var(--color-text-primary)' },
  main: { display: 'flex', flex: 1, minWidth: 0, maxWidth: 'var(--max-content-width)', flexDirection: 'column', gap: 'var(--spacing-5)', margin: '0 auto', padding: 'var(--spacing-5)', width: '100%' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-4)', padding: 'var(--spacing-5)', color: 'var(--color-on-primary)', background: 'var(--color-primary)', borderRadius: 'var(--radius-lg)' },
  headerOverline: { margin: '0 0 var(--spacing-1)', color: 'rgba(255,255,255,0.82)', fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase' },
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