import { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Sidebar from '../components/Sidebar';
import Button from '../components/ui/Button';
import { controlService } from '../services/api';

const RESULTADO_FILTROS = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'CONFORME', label: 'Conforme' },
  { value: 'CON_NOVEDADES', label: 'Con novedades' },
];

export default function InformesControl() {
  const [controles, setControles] = useState([]);
  const [filtroResultado, setFiltroResultado] = useState('TODOS');
  const [filtroMovil, setFiltroMovil] = useState('TODOS');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detalle, setDetalle] = useState(null);

  useEffect(() => {
    cargarControles();
  }, []);

  const cargarControles = async () => {
    try {
      const response = await controlService.listar();
      setControles(response.data || []);
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudieron cargar los informes.');
    } finally {
      setLoading(false);
    }
  };

  const moviles = useMemo(() => {
    const mapa = new Map();
    controles.forEach((control) => {
      if (!mapa.has(control.movilId)) {
        mapa.set(control.movilId, {
          id: control.movilId,
          label: `${control.movilNumeroInterno} / ${control.movilPatente}`,
        });
      }
    });
    return Array.from(mapa.values());
  }, [controles]);

  const controlesFiltrados = useMemo(() => {
    return controles.filter((control) => {
      const pasaResultado = filtroResultado === 'TODOS' || control.resultado === filtroResultado;
      const pasaMovil = filtroMovil === 'TODOS' || String(control.movilId) === String(filtroMovil);
      return pasaResultado && pasaMovil;
    });
  }, [controles, filtroResultado, filtroMovil]);

  const abrirDetalle = async (id) => {
    try {
      const response = await controlService.detalle(id);
      setDetalle(response.data);
    } catch (exception) {
      setError(exception.response?.data?.message || 'No se pudo abrir el detalle del informe.');
    }
  };

  const exportarPDF = () => {
    if (!detalle) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    doc.setFillColor(15, 42, 42);
    doc.rect(0, 0, 210, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SIGEM — Informe de Control de Móvil', 14, 10);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const fechaGeneracion = new Date().toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    doc.text(`Generado: ${fechaGeneracion}`, 14, 17);

    autoTable(doc, {
      startY: 28,
      head: [['Insumo', 'Tipo', 'Recomendado', 'Sistema', 'Contado', 'Estado', 'N° serie', 'Test', 'Observación']],
      body: (detalle.items || []).map((item) => [
        item.insumoNombre,
        item.tipo,
        item.cantidadRecomendada,
        item.cantidadSistema,
        item.cantidadContada,
        item.estadoEquipo || '—',
        item.numeroSerie || '—',
        item.testOk === null || item.testOk === undefined ? '—' : item.testOk ? 'Aprobó' : 'No aprobó',
        item.observacion || '—',
      ]),
      headStyles: {
        fillColor: [27, 107, 107],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [40, 40, 40],
      },
      alternateRowStyles: { fillColor: [240, 247, 247] },
      margin: { left: 14, right: 14 },
      styles: { overflow: 'linebreak', cellPadding: 2 },
      didParseCell: (data) => {
        const fila = detalle.items[data.row.index];
        if (!fila) return;
        const esNovedad = fila.cantidadContada < fila.cantidadRecomendada || fila.cantidadContada !== fila.cantidadSistema;
        if (data.section === 'body' && esNovedad) {
          data.cell.styles.fillColor = [255, 244, 214];
        }
      },
    });

    const totalPaginas = doc.getNumberOfPages();
    for (let i = 1; i <= totalPaginas; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(140);
      doc.text(
        `Página ${i} de ${totalPaginas} — SIGEM`,
        105,
        205,
        { align: 'center' }
      );
    }

    doc.setFontSize(9);
    doc.setTextColor(60);
    doc.text(`Resumen: faltantes ${detalle.totalFaltantes} | equipos con novedad ${detalle.totalEquiposConNovedad} | discrepancias ${detalle.totalDiscrepanciasSistema}`, 14, doc.lastAutoTable.finalY + 10);

    doc.save(`SIGEM_Informe_Control_${detalle.movilNumeroInterno}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div style={S.page}>
      <Sidebar />
      <main style={S.main}>
        <header style={S.header}>
          <div>
            <p style={S.overline}>Informes de control</p>
            <h1 style={S.h1}>Controles de móvil</h1>
          </div>
        </header>

        {error && <div style={S.error}>{error}</div>}

        <div style={S.controlsBar}>
          <div style={S.filterHeading}>
            <strong>Filtrar informes</strong>
            <span style={S.filterCount}>{controlesFiltrados.length} de {controles.length} controles</span>
          </div>
          <div style={S.chips}>
            {RESULTADO_FILTROS.map((filtro) => (
              <button
                key={filtro.value}
                onClick={() => setFiltroResultado(filtro.value)}
                style={{ ...S.chip, ...(filtroResultado === filtro.value ? S.chipActive : {}) }}
              >
                {filtro.label}
              </button>
            ))}
          </div>

          <select value={filtroMovil} onChange={(event) => setFiltroMovil(event.target.value)} style={S.select}>
            <option value="TODOS">Todos los móviles</option>
            {moviles.map((movil) => (
              <option key={movil.id} value={movil.id}>{movil.label}</option>
            ))}
          </select>
          {(filtroResultado !== 'TODOS' || filtroMovil !== 'TODOS') && (
            <button type="button" style={S.resetButton} onClick={() => { setFiltroResultado('TODOS'); setFiltroMovil('TODOS'); }}>
              Limpiar filtros
            </button>
          )}
        </div>

        {loading ? <div style={S.status}>Cargando informes...</div> : controlesFiltrados.length === 0 ? (
          <div style={S.emptyState}>
            <strong>{controles.length ? 'No hay controles con estos filtros' : 'Todavía no hay controles registrados'}</strong>
            <span>{controles.length ? 'Probá cambiar el resultado o seleccionar otro móvil.' : 'Los controles enviados desde los móviles aparecerán aquí.'}</span>
          </div>
        ) : (
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Fecha</th>
                  <th style={S.th}>Móvil</th>
                  <th style={S.th}>Enfermero</th>
                  <th style={S.th}>Resultado</th>
                  <th style={S.th}>Faltantes</th>
                  <th style={S.th}>Equipos con novedad</th>
                  <th style={S.th}>Discrepancias</th>
                </tr>
              </thead>
              <tbody>
                {controlesFiltrados.map((control) => (
                  <tr
                    key={control.id}
                    style={S.row}
                    tabIndex={0}
                    role="button"
                    aria-label={`Ver control del ${new Date(control.fecha).toLocaleDateString('es-AR')} para el móvil ${control.movilNumeroInterno}`}
                    onClick={() => abrirDetalle(control.id)}
                    onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); abrirDetalle(control.id); } }}
                  >
                    <td style={S.td}>{new Date(control.fecha).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td style={S.td}>{control.movilNumeroInterno} / {control.movilPatente}</td>
                    <td style={S.td}>{control.enfermeroNombre}</td>
                    <td style={S.td}>
                      <span style={{ ...S.badge, ...(control.resultado === 'CONFORME' ? S.badgeOk : S.badgeWarn) }}>{control.resultado}</span>
                    </td>
                    <td style={S.td}>{control.totalFaltantes}</td>
                    <td style={S.td}>{control.totalEquiposConNovedad}</td>
                    <td style={S.td}>{control.totalDiscrepanciasSistema}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {detalle && (
          <div style={S.modalOverlay} onClick={() => setDetalle(null)}>
            <div style={S.modal} onClick={(event) => event.stopPropagation()}>
              <div style={S.modalHeader}>
                <div>
                  <div style={S.overline}>Detalle del control</div>
                  <h3 style={S.h3}>{detalle.movilNumeroInterno} / {detalle.movilPatente}</h3>
                </div>
                <button style={S.closeBtn} onClick={() => setDetalle(null)}>×</button>
              </div>

              <div style={S.modalBody}>
                <div style={S.metaGrid}>
                  <div><strong>Fecha:</strong> {new Date(detalle.fecha).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</div>
                  <div><strong>Enfermero:</strong> {detalle.enfermeroNombre}</div>
                  <div><strong>Resultado:</strong> <span style={{ ...S.badge, ...(detalle.resultado === 'CONFORME' ? S.badgeOk : S.badgeWarn) }}>{detalle.resultado}</span></div>
                  <div><strong>Observaciones:</strong> {detalle.observaciones || '—'}</div>
                </div>

                <div style={S.summaryGrid}>
                  <div style={S.summaryBox}><strong>{detalle.totalFaltantes}</strong><span>Faltantes</span></div>
                  <div style={S.summaryBox}><strong>{detalle.totalEquiposConNovedad}</strong><span>Equipos con novedad</span></div>
                  <div style={S.summaryBox}><strong>{detalle.totalDiscrepanciasSistema}</strong><span>Discrepancias</span></div>
                </div>

                <div style={S.itemsTableWrap}>
                  {['MEDICACION', 'DESCARTABLE', 'TRAUMA', 'VIA_AEREA', 'EQUIPO_MEDICO', 'OXIGENO', 'ANTISEPTICO', 'KIT', 'MONITOREO', 'CURACION', 'SOLUCION'].map((categoria) => {
                    const itemsCategoria = (detalle.items || []).filter((item) => item.categoria === categoria);
                    if (itemsCategoria.length === 0) return null;
                    return (
                      <div key={categoria} style={S.categoryBox}>
                        <h4 style={S.categoryTitle}>{categoria}</h4>
                        <table style={S.innerTable}>
                          <thead>
                            <tr>
                              <th style={S.th}>Insumo</th>
                              <th style={S.th}>Recomendado</th>
                              <th style={S.th}>Sistema</th>
                              <th style={S.th}>Contado</th>
                              <th style={S.th}>Estado</th>
                              <th style={S.th}>N° serie</th>
                              <th style={S.th}>Test</th>
                              <th style={S.th}>Obs.</th>
                            </tr>
                          </thead>
                          <tbody>
                            {itemsCategoria.map((item, index) => (
                              <tr key={index} style={{
                                ...(item.cantidadContada < item.cantidadRecomendada || item.cantidadContada !== item.cantidadSistema ? { background: 'var(--color-warning-soft)' } : {}),
                              }}>
                                <td style={S.td}>{item.insumoNombre}</td>
                                <td style={S.td}>{item.cantidadRecomendada}</td>
                                <td style={S.td}>{item.cantidadSistema}</td>
                                <td style={S.td}>{item.cantidadContada}</td>
                                <td style={S.td}>{item.estadoEquipo || '—'}</td>
                                <td style={S.td}>{item.numeroSerie || '—'}</td>
                                <td style={S.td}>{item.testOk === null || item.testOk === undefined ? '—' : item.testOk ? 'Aprobó' : 'No aprobó'}</td>
                                <td style={S.td}>{item.observacion || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>

                <Button onClick={exportarPDF}>Exportar PDF</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
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
    padding: 'var(--spacing-5)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--spacing-4)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
  },
  overline: { margin: 0, fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-secondary)' },
  h1: { margin: '0.25rem 0 0', fontSize: '2rem' },
  h3: { margin: 0, fontSize: '1.2rem' },
  controlsBar: {
    display: 'flex',
    justifyContent: 'flex-start',
    gap: '0.65rem 1rem',
    alignItems: 'center',
    flexWrap: 'wrap',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: '0.75rem 0.9rem',
  },
  filterHeading: { display: 'grid', gap: '0.1rem', marginRight: 'auto', color: 'var(--color-text-primary)', fontSize: 'var(--font-size-sm)' },
  filterCount: { color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' },
  chips: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' },
  chip: {
    background: 'transparent',
    border: '1px solid var(--color-border)',
    borderRadius: '999px',
    minHeight: '40px',
    padding: '0.45rem 0.8rem',
    cursor: 'pointer',
    color: 'var(--color-text-primary)',
    fontWeight: 700,
  },
  chipActive: { background: 'var(--color-primary-soft)', borderColor: 'var(--color-primary)', color: 'var(--color-primary-strong)' },
  select: {
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    minHeight: '40px',
    padding: '0.55rem 0.7rem',
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
  },
  resetButton: { minHeight: '40px', padding: '0.45rem 0.7rem', color: 'var(--color-primary-strong)', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700 },
  tableWrap: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    overflow: 'auto',
    alignSelf: 'stretch',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.85rem 1rem', background: 'var(--color-surface-muted)', color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)' },
  td: { padding: '0.85rem 1rem', borderBottom: '1px solid var(--color-border)', verticalAlign: 'top' },
  row: { cursor: 'pointer', outlineOffset: '-2px' },
  emptyState: { display: 'grid', gap: '0.25rem', padding: 'var(--spacing-5)', color: 'var(--color-text-secondary)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '999px',
    padding: '0.35rem 0.7rem',
    fontSize: '0.75rem',
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  badgeOk: { background: 'var(--color-success-soft)', color: 'var(--color-success-strong)' },
  badgeWarn: { background: 'var(--color-warning-soft)', color: 'var(--color-warning-strong)' },
  error: {
    background: 'var(--color-danger-soft)',
    color: 'var(--color-danger-strong)',
    border: '1px solid var(--color-danger)',
    borderRadius: 'var(--radius-md)',
    padding: '0.8rem 1rem',
  },
  status: { color: 'var(--color-text-secondary)' },
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
    width: 'min(980px, 100%)',
    maxHeight: '90vh',
    overflowY: 'auto',
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--color-border)',
    padding: '1rem',
    display: 'grid',
    gap: '1rem',
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' },
  closeBtn: { border: 'none', background: 'transparent', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-primary)' },
  modalBody: { display: 'grid', gap: '1rem' },
  metaGrid: { display: 'grid', gap: '0.5rem', color: 'var(--color-text-secondary)' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' },
  summaryBox: {
    background: 'var(--color-surface-muted)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '0.9rem',
    display: 'grid',
    gap: '0.3rem',
    textAlign: 'center',
    color: 'var(--color-text-secondary)',
  },
  itemsTableWrap: { display: 'grid', gap: '1rem' },
  categoryBox: {
    background: 'var(--color-surface-muted)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '0.8rem',
  },
  categoryTitle: { margin: '0 0 0.75rem', fontSize: '1rem' },
  innerTable: { width: '100%', borderCollapse: 'collapse' },
};
