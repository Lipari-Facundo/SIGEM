import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { existenciasMovilService } from '../services/api';
import './ExistenciasMovil.css';

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

const FORM_INICIAL = { nombre: '', categoria: '', cantidadMinima: '0' };

function categoriaInfo(key) {
  return CATEGORIAS.find(item => item.key === key) || {
    key,
    label: key === 'SIN_CATEGORIA'
      ? 'Sin categoría'
      : String(key || '').toLocaleLowerCase('es').replace(/(^|_)\w/g, letra => letra.replace('_', ' ').toLocaleUpperCase('es')),
    icon: '📦',
  };
}

export default function ExistenciasMovil() {
  const [insumos, setInsumos] = useState([]);
  const [archivados, setArchivados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingArchivados, setLoadingArchivados] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalArchivadosAbierto, setModalArchivadosAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formData, setFormData] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [operacionId, setOperacionId] = useState(null);

  useEffect(() => {
    cargarInsumos();
  }, []);

  const cargarInsumos = async () => {
    setLoading(true);
    try {
      const response = await existenciasMovilService.listar();
      setInsumos(response.data || []);
      setError('');
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudieron cargar las existencias del móvil.');
    } finally {
      setLoading(false);
    }
  };

  const cargarArchivados = async () => {
    setLoadingArchivados(true);
    try {
      const response = await existenciasMovilService.archivadas();
      setArchivados(response.data || []);
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudieron cargar las existencias archivadas.');
    } finally {
      setLoadingArchivados(false);
    }
  };

  const abrirAlta = () => {
    setError('');
    setFormData(FORM_INICIAL);
    setEditandoId(null);
    setModalAbierto(true);
  };

  const abrirEdicion = (item) => {
    setError('');
    setEditandoId(item.insumoId);
    setFormData({
      nombre: item.nombre,
      categoria: item.categoria || '',
      cantidadMinima: String(item.cantidadMinima ?? 0),
    });
    setModalAbierto(true);
  };

  const guardarInsumo = async (event) => {
    event.preventDefault();
    const cantidadMinima = Number(formData.cantidadMinima);
    if (!formData.nombre.trim()) {
      setError('Ingresá el nombre del insumo.');
      return;
    }
    if (!formData.categoria) {
      setError('Seleccioná una categoría.');
      return;
    }
    if (!Number.isInteger(cantidadMinima) || cantidadMinima < 0) {
      setError('La cantidad mínima debe ser un entero igual o mayor a cero.');
      return;
    }

    setGuardando(true);
    setError('');
    try {
      const payload = {
        nombre: formData.nombre.trim(),
        categoria: formData.categoria,
        cantidadMinima,
      };
      if (editandoId) {
        await existenciasMovilService.actualizar(editandoId, payload);
        setMensaje(`${payload.nombre} actualizado en las existencias del móvil.`);
      } else {
        await existenciasMovilService.crear(payload);
        setMensaje(`${payload.nombre} agregado a las existencias del móvil.`);
      }
      setModalAbierto(false);
      setEditandoId(null);
      setFormData(FORM_INICIAL);
      await cargarInsumos();
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo guardar la existencia del móvil.');
    } finally {
      setGuardando(false);
    }
  };

  const alternarArchivo = async (item) => {
    setOperacionId(item.insumoId);
    setError('');
    try {
      const response = await existenciasMovilService.alternarArchivo(item.insumoId);
      const archivado = Boolean(response.data?.archivado);
      setMensaje(archivado
        ? `${item.nombre} archivado de las existencias del móvil.`
        : `${item.nombre} restaurado en las existencias del móvil.`);
      await Promise.all([
        cargarInsumos(),
        modalArchivadosAbierto ? cargarArchivados() : Promise.resolve(),
      ]);
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo cambiar el estado de archivo.');
    } finally {
      setOperacionId(null);
    }
  };

  const abrirArchivados = async () => {
    setError('');
    setModalArchivadosAbierto(true);
    await cargarArchivados();
  };

  const categoriasDisponibles = useMemo(() => [...new Set(
    insumos.map(item => item.categoria || 'SIN_CATEGORIA')
  )].sort((a, b) => categoriaInfo(a).label.localeCompare(categoriaInfo(b).label, 'es')), [insumos]);

  const insumosFiltrados = useMemo(() => {
    const texto = searchTerm.trim().toLocaleLowerCase('es');
    return insumos.filter(item => {
      const coincideNombre = !texto || String(item.nombre || '').toLocaleLowerCase('es').includes(texto);
      const coincideCategoria = !selectedCategory || (item.categoria || 'SIN_CATEGORIA') === selectedCategory;
      return coincideNombre && coincideCategoria;
    });
  }, [insumos, searchTerm, selectedCategory]);

  const grupos = useMemo(() => {
    const agrupados = insumosFiltrados.reduce((resultado, item) => {
      const key = item.categoria || 'SIN_CATEGORIA';
      if (!resultado[key]) resultado[key] = [];
      resultado[key].push(item);
      return resultado;
    }, {});
    return Object.entries(agrupados)
      .map(([key, items]) => ({ ...categoriaInfo(key), items }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  }, [insumosFiltrados]);

  return (
    <div className="existencias-movil-page">
      <Sidebar />
      <main className="existencias-movil-main">
        <header className="existencias-movil-header">
          <div>
            <p className="existencias-movil-eyebrow">Inventario de móviles</p>
            <h1>Existencias del Móvil</h1>
            <p>Definí los insumos y las cantidades mínimas requeridas para los móviles.</p>
          </div>
          <div className="existencias-movil-actions">
            <Button type="button" onClick={abrirAlta}>＋ Alta Insumo</Button>
            <Button type="button" variant="secondary" onClick={abrirArchivados}>Ver Archivados</Button>
          </div>
        </header>

        {mensaje && <div className="existencias-movil-alert success" role="status">{mensaje}</div>}
        {error && !modalAbierto && !modalArchivadosAbierto && (
          <div className="existencias-movil-alert error" role="alert">{error}</div>
        )}

        {loading ? (
          <div className="existencias-movil-status">Cargando existencias del móvil...</div>
        ) : insumos.length === 0 ? (
          <EmptyState
            icon="📦"
            title="Sin existencias configuradas"
            description="Agregá los insumos que deben formar parte del móvil."
            action={<Button onClick={abrirAlta}>＋ Alta Insumo</Button>}
          />
        ) : (
          <>
            <div className="existencias-movil-filters">
              <label>
                <span>Buscar insumo</span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  placeholder="Nombre del insumo"
                />
              </label>
              <label>
                <span>Categoría</span>
                <select value={selectedCategory} onChange={event => setSelectedCategory(event.target.value)}>
                  <option value="">Todas las categorías</option>
                  {categoriasDisponibles.map(key => (
                    <option key={key} value={key}>{categoriaInfo(key).label}</option>
                  ))}
                </select>
              </label>
            </div>

            {grupos.length === 0 ? (
              <EmptyState icon="🔎" title="No se encontraron insumos" description="Probá con otro nombre o cambiá la categoría." />
            ) : (
              <div className="existencias-movil-grid">
                {grupos.map(categoria => {
                  const expandida = Boolean(expandedCategories[categoria.key]);
                  const itemsVisibles = expandida ? categoria.items : categoria.items.slice(0, 5);
                  return (
                    <section className="existencias-category-card" key={categoria.key}>
                      <header className="existencias-category-header">
                        <div className="existencias-category-title">
                          <span aria-hidden="true">{categoria.icon}</span>
                          <h2>{categoria.label}</h2>
                        </div>
                        <span className="existencias-category-count">{categoria.items.length}</span>
                      </header>
                      <div className="existencias-item-list">
                        {itemsVisibles.map(item => (
                          <article className="existencias-item-row" key={item.insumoId}>
                            <div className="existencias-item-info">
                              <strong>{item.nombre}</strong>
                              <span>{categoria.label}{item.unidadMedida ? ` · ${item.unidadMedida}` : ''}</span>
                            </div>
                            <strong className="existencias-minimum">Mínimo: {item.cantidadMinima}</strong>
                            <div className="existencias-row-actions">
                              <button
                                type="button"
                                className="existencias-icon-button edit"
                                disabled={operacionId === item.insumoId}
                                title={`Modificar ${item.nombre}`}
                                aria-label={`Modificar ${item.nombre}`}
                                onClick={() => abrirEdicion(item)}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.5 3.5 4 4M4 20l4.3-.9L20 7.4a2.1 2.1 0 0 0-3-3L5.3 16.1 4 20Z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="existencias-icon-button archive"
                                disabled={operacionId === item.insumoId}
                                title={`Archivar ${item.nombre}`}
                                aria-label={`Archivar ${item.nombre}`}
                                onClick={() => alternarArchivo(item)}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18v13H3zM3 4h18v3H3zM9 11h6" />
                                </svg>
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                      {categoria.items.length > 5 && (
                        <button
                          type="button"
                          className="existencias-expand-button"
                          aria-expanded={expandida}
                          onClick={() => setExpandedCategories(actual => ({
                            ...actual,
                            [categoria.key]: !actual[categoria.key],
                          }))}
                        >
                          <span>{expandida ? 'Ver menos' : `+ ${categoria.items.length - 5} insumos`}</span>
                          <svg className={expandida ? 'is-expanded' : ''} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
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
      </main>

      {modalAbierto && (
        <div className="existencias-overlay" onMouseDown={() => !guardando && setModalAbierto(false)}>
          <section
            className="existencias-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="existencias-form-title"
            onMouseDown={event => event.stopPropagation()}
          >
            <header className="existencias-modal-header">
              <div>
                <p className="existencias-modal-eyebrow">{editandoId ? 'Editar estándar' : 'Nueva existencia'}</p>
                <h2 id="existencias-form-title">{editandoId ? 'Modificar insumo' : 'Alta Insumo'}</h2>
              </div>
              <button type="button" className="existencias-close" disabled={guardando} onClick={() => setModalAbierto(false)} aria-label="Cerrar">×</button>
            </header>
            {error && <div className="existencias-m-modal-error" role="alert">{error}</div>}
            <form className="existencias-form" onSubmit={guardarInsumo}>
              <label>
                Nombre del insumo
                <input
                  type="text"
                  maxLength={255}
                  value={formData.nombre}
                  onChange={event => setFormData(actual => ({ ...actual, nombre: event.target.value }))}
                  required
                />
              </label>
              <label>
                Categoría
                <select
                  value={formData.categoria}
                  onChange={event => setFormData(actual => ({ ...actual, categoria: event.target.value }))}
                  required
                >
                  <option value="">Seleccionar categoría</option>
                  {CATEGORIAS.map(categoria => <option key={categoria.key} value={categoria.key}>{categoria.label}</option>)}
                </select>
              </label>
              <label>
                Cantidad mínima requerida
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.cantidadMinima}
                  onChange={event => setFormData(actual => ({ ...actual, cantidadMinima: event.target.value }))}
                  required
                />
              </label>
              <footer className="existencias-modal-actions">
                <Button type="button" variant="secondary" disabled={guardando} onClick={() => setModalAbierto(false)}>Cancelar</Button>
                <Button type="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</Button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {modalArchivadosAbierto && (
        <div className="existencias-overlay" onMouseDown={() => setModalArchivadosAbierto(false)}>
          <section
            className="existencias-modal existencias-archive-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="existencias-archived-title"
            onMouseDown={event => event.stopPropagation()}
          >
            <header className="existencias-modal-header">
              <div>
                <p className="existencias-modal-eyebrow">Existencias del móvil</p>
                <h2 id="existencias-archived-title">Existencias archivadas</h2>
              </div>
              <button type="button" className="existencias-close" onClick={() => setModalArchivadosAbierto(false)} aria-label="Cerrar">×</button>
            </header>
            {error && <div className="existencias-m-modal-error" role="alert">{error}</div>}
            {loadingArchivados ? (
              <p className="existencias-m-empty">Cargando archivados...</p>
            ) : archivados.length === 0 ? (
              <p className="existencias-m-empty">No hay existencias archivadas.</p>
            ) : (
              <div className="existencias-archived-list">
                {archivados.map(item => (
                  <article className="existencias-archived-row" key={item.insumoId}>
                    <div className="existencias-item-info">
                      <strong>{item.nombre}</strong>
                      <span>{categoriaInfo(item.categoria).label}{item.unidadMedida ? ` · ${item.unidadMedida}` : ''} · Mínimo: {item.cantidadMinima}</span>
                    </div>
                    <Button type="button" size="sm" disabled={operacionId === item.insumoId} onClick={() => alternarArchivo(item)}>
                      {operacionId === item.insumoId ? 'Restaurando...' : 'Desarchivar'}
                    </Button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
