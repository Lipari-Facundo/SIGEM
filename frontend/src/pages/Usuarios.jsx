// ─────────────────────────────────────────────────────────────────────────────
// Usuarios.jsx — Gestión de Usuarios (rol ADM)
//
// Funcionalidades:
//   • Tabla ordenada por rol
//   • Filtro por rol mediante tabs
//   • Búsqueda por texto (nombre, apellido, DNI)
//   • Toggle de estado activo/inactivo
//   • Alta y edición de usuario en modal
//   • Exportación a PDF (excluye ADM)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Sidebar from '../components/Sidebar';
import { usuarioService } from '../services/api';

// ─── Constantes de dominio ────────────────────────────────────────────────────

// Orden visual de los roles (de mayor a menor jerarquía operativa)
const ROL_ORDEN = {
  JEF: 1,
  DES: 2,
  ENF: 3,
  DIR: 4,
  ADM: 99, // el ADM siempre va último (y se excluye del PDF)
};

const ROL_LABELS = {
  ADM: 'Administrador',
  DES: 'Despachador',
  ENF: 'Enfermero',
  JEF: 'Jefe Enfermería',
  DIR: 'Directivo',
};

const ROL_COLORS = {
  ADM: { bg: '#EDE9FE', color: '#5B21B6' },
  DES: { bg: '#E0F2FE', color: '#0369A1' },
  ENF: { bg: '#DCFCE7', color: '#166534' },
  JEF: { bg: '#FEF3C7', color: '#92400E' },
  DIR: { bg: '#FFE4E6', color: '#9F1239' },
};

// Tabs de filtro: "TODOS" más cada rol existente
const TABS = [
  { key: 'TODOS', label: 'Todos' },
  { key: 'JEF',   label: 'Jefe Enfermería' },
  { key: 'DES',   label: 'Despachador' },
  { key: 'ENF',   label: 'Enfermero' },
  { key: 'DIR',   label: 'Directivo' },
  { key: 'ADM',   label: 'Administrador' },
];

const ROLES_FORMULARIO = ['ADM', 'DES', 'ENF', 'JEF', 'DIR'];

const EMPTY_FORM = {
  username:  '',
  nombre:    '',
  apellido:  '',
  dni:       '',
  email:     '',
  telefono:  '',
  rol:       'ENF',
  password:  '',
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Usuarios() {
  const [lista, setLista]         = useState([]);
  const [busqueda, setBusqueda]   = useState('');
  const [tabActivo, setTabActivo] = useState('TODOS');
  const [modal, setModal]         = useState(null); // null | 'crear' | 'editar'
  const [form, setForm]           = useState(EMPTY_FORM);
  const [editId, setEditId]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [msg, setMsg]             = useState('');
  const [error, setError]         = useState('');
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => { cargar(); }, []);

  // ─── Carga ──────────────────────────────────────────────────

  const cargar = async () => {
    try {
      const res = await usuarioService.listar();
      setLista(res.data);
    } catch {
      mostrarError('No se pudo cargar la lista de usuarios.');
    }
  };

  // ─── Mensajes ───────────────────────────────────────────────

  const mostrarMsg   = (t) => { setMsg(t);   setTimeout(() => setMsg(''),   3500); };
  const mostrarError = (t) => { setError(t); setTimeout(() => setError(''), 4500); };

  // ─── Filtro y orden ─────────────────────────────────────────
  //
  // 1. Filtrar por tab de rol
  // 2. Filtrar por texto de búsqueda
  // 3. Ordenar por jerarquía de rol y luego alfabéticamente
  //
  const listaFiltrada = lista
    .filter(u => tabActivo === 'TODOS' || u.rol === tabActivo)
    .filter(u => {
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      return (
        u.username?.toLowerCase().includes(q) ||
        u.nombre?.toLowerCase().includes(q)   ||
        u.apellido?.toLowerCase().includes(q) ||
        u.dni?.includes(q)
      );
    })
    .sort((a, b) => {
      // Primero por jerarquía de rol
      const ordenA = ROL_ORDEN[a.rol] ?? 50;
      const ordenB = ROL_ORDEN[b.rol] ?? 50;
      if (ordenA !== ordenB) return ordenA - ordenB;
      // Dentro del mismo rol, ordenar alfabéticamente por apellido
      return (a.apellido || '').localeCompare(b.apellido || '', 'es');
    });

  // ─── Contador por tab (para badges en los tabs) ─────────────

  const contarPorRol = (rol) =>
    rol === 'TODOS'
      ? lista.length
      : lista.filter(u => u.rol === rol).length;

  // ─── Modales ─────────────────────────────────────────────────

  const abrirCrear = () => {
    setError('');
    setForm(EMPTY_FORM);
    setModal('crear');
  };

  const abrirEditar = (u) => {
    setError('');
    setForm({
      username:  u.username  || '',
      nombre:    u.nombre    || '',
      apellido:  u.apellido  || '',
      dni:       u.dni       || '',
      email:     u.email     || '',
      telefono:  u.telefono  || '',
      rol:       u.rol       || 'ENF',
      password:  '',          // no se muestra la contraseña actual
    });
    setEditId(u.id);
    setModal('editar');
  };

  // ─── Guardar ─────────────────────────────────────────────────

  const guardar = async () => {
    setError('');

    // Validaciones básicas en frontend
    if (!form.username.trim()) { setError('El nombre de usuario es obligatorio'); return; }
    if (!form.nombre.trim())   { setError('El nombre es obligatorio'); return; }
    if (!form.apellido.trim()) { setError('El apellido es obligatorio'); return; }
    if (!form.email.trim())    { setError('El correo electrónico es obligatorio'); return; }
    if (modal === 'crear' && !form.password.trim()) {
      setError('La contraseña es obligatoria al crear un usuario'); return;
    }

    setLoading(true);
    try {
      const payload = { ...form };
      // En edición, si no ingresó nueva contraseña, no la enviamos
      if (modal === 'editar' && !payload.password.trim()) {
        delete payload.password;
      }

      if (modal === 'crear') {
        await usuarioService.crear(payload);
        mostrarMsg('✅ Usuario creado correctamente');
      } else {
        await usuarioService.modificar(editId, payload);
        mostrarMsg('✅ Usuario modificado correctamente');
      }
      setModal(null);
      cargar();
    } catch (e) {
      setError(e.response?.data?.message || 'Error al guardar el usuario');
    } finally {
      setLoading(false);
    }
  };

  // ─── Toggle activo/inactivo ──────────────────────────────────

  const toggleEstado = async (u) => {
    try {
      await usuarioService.cambiarEstado(u.id, !u.activo);
      mostrarMsg(`✅ Usuario ${!u.activo ? 'activado' : 'desactivado'}`);
      cargar();
    } catch {
      mostrarError('No se pudo cambiar el estado del usuario');
    }
  };

  // ─── Eliminar ────────────────────────────────────────────────

  const eliminar = async (id) => {
    try {
      await usuarioService.eliminar(id);
      mostrarMsg('✅ Usuario eliminado');
      setConfirmId(null);
      cargar();
    } catch (e) {
      mostrarError(e.response?.data?.message || 'Error al eliminar el usuario');
      setConfirmId(null);
    }
  };

  // ─── Exportar PDF ────────────────────────────────────────────
  //
  // Decisión: excluimos al ADM del PDF porque es información
  // sensible de configuración del sistema, no operativa.
  //
  // Ordenamos igual que la tabla: por jerarquía de rol.
  //
  const exportarPDF = () => {
    // Respeta el tab activo: si estás en "Enfermero", exporta solo enfermeros
    const usuariosParaPDF = lista
      .filter(u => u.rol !== 'ADM')
      .filter(u => tabActivo === 'TODOS' || u.rol === tabActivo)
      .sort((a, b) => {
        const ordenA = ROL_ORDEN[a.rol] ?? 50;
        const ordenB = ROL_ORDEN[b.rol] ?? 50;
        if (ordenA !== ordenB) return ordenA - ordenB;
        return (a.apellido || '').localeCompare(b.apellido || '', 'es');
      });

    if (usuariosParaPDF.length === 0) {
      mostrarError('No hay usuarios para exportar con el filtro actual.');
      return;
    }

    // Título y nombre de archivo dinámicos según el tab activo
    const tituloPDF = tabActivo === 'TODOS'
      ? 'Listado de Personal Operativo'
      : `Listado de Personal — ${ROL_LABELS[tabActivo]}`;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // ── Encabezado del documento ──
    doc.setFillColor(15, 42, 42);
    doc.rect(0, 0, 297, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SIGEM — Sistema Integral de Gestión de Emergencias Médicas', 14, 10);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(tituloPDF, 14, 17);

    // Fecha de generación alineada a la derecha
    const ahora = new Date().toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    doc.text(`Generado: ${ahora}`, 283, 17, { align: 'right' });

    // ── Tabla ──
    autoTable(doc, {
      startY: 28,
      head: [[
        { content: 'Apellido', styles: { halign: 'left' } },
        { content: 'Nombre',   styles: { halign: 'left' } },
        { content: 'DNI',      styles: { halign: 'center' } },
        { content: 'Correo electrónico', styles: { halign: 'left' } },
        { content: 'Rol',      styles: { halign: 'center' } },
        { content: 'Estado',   styles: { halign: 'center' } },
      ]],
      body: usuariosParaPDF.map(u => [
        (u.apellido || '').toUpperCase(),
        u.nombre || '',
        u.dni || '—',
        u.email || '—',
        ROL_LABELS[u.rol] || u.rol,
        u.activo ? 'Activo' : 'Inactivo',
      ]),
      headStyles: {
        fillColor: [27, 107, 107],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [40, 40, 40],
      },
      alternateRowStyles: {
        fillColor: [240, 247, 247],
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 70 },
        4: { cellWidth: 35, halign: 'center' },
        5: { cellWidth: 25, halign: 'center' },
      },
      // Línea divisoria entre grupos de rol
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 0) {
          const fila  = usuariosParaPDF[data.row.index];
          const siguiente = usuariosParaPDF[data.row.index + 1];
          if (fila && siguiente && fila.rol !== siguiente.rol) {
            data.row.cells[0].styles = {
              ...data.row.cells[0].styles,
            };
          }
        }
      },
      // Agrupación visual: fondo diferente por rol
      willDrawCell: (data) => {
        if (data.section === 'body') {
          const fila = usuariosParaPDF[data.row.index];
          if (!fila) return;
          // Color de fila según rol (muy suave)
          const bgPorRol = {
            JEF: [255, 250, 235],
            DES: [235, 248, 255],
            ENF: [235, 250, 240],
            DIR: [255, 235, 238],
          };
          const bg = bgPorRol[fila.rol];
          if (bg) {
            const { doc: d, cell } = data;
            d.setFillColor(...bg);
            d.rect(cell.x, cell.y, cell.width, cell.height, 'F');
          }
        }
      },
      margin: { left: 14, right: 14 },
      tableLineColor: [200, 220, 220],
      tableLineWidth: 0.2,
    });

    // ── Pie de página ──
    const totalPaginas = doc.getNumberOfPages();
    for (let i = 1; i <= totalPaginas; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${i} de ${totalPaginas} — Documento generado por SIGEM`,
        148.5, 205, { align: 'center' }
      );
    }

    // ── Resumen al final ──
    const yFinal = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(
      `Total de personal listado: ${usuariosParaPDF.length} usuario${usuariosParaPDF.length !== 1 ? 's' : ''}`,
      14, yFinal
    );

    const fecha   = new Date().toISOString().split('T')[0];
    const sufijo  = tabActivo === 'TODOS'
      ? 'Todo_el_Personal'
      : ROL_LABELS[tabActivo].replace(/\s+/g, '_');
    const nombreArchivo = `SIGEM_${sufijo}_${fecha}.pdf`;
    doc.save(nombreArchivo);
    mostrarMsg(`✅ PDF generado: ${nombreArchivo}`);
  };

  // ─── Etiqueta dinámica del botón PDF ────────────────────────
  //
  // Cambia según el tab activo para que el usuario sepa exactamente
  // qué va a descargar antes de hacer clic.
  //
  const LABEL_PDF_POR_ROL = {
    TODOS: 'Exportar PDF ',
    JEF:   'Exportar PDF — Jefes de Enfermería',
    DES:   'Exportar PDF — Despachadores',
    ENF:   'Exportar PDF — Enfermeros',
    DIR:   'Exportar PDF — Directivos',
    ADM:   'Exportar PDF — Administradores',
  };
 const labelPDF = LABEL_PDF_POR_ROL[tabActivo] ?? 'Exportar PDF';


  // ─── Render ──────────────────────────────────────────────────

  return (
    <div style={S.page}>
      <Sidebar />

      <main style={S.main}>

        {/* Header */}
        <header style={S.header}>
          <div>
            <h1 style={S.h1}>Gestión de Usuarios</h1>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={exportarPDF}
              disabled={listaFiltrada.filter(u => u.rol !== 'ADM').length === 0}
              style={{
                ...S.btnPDF,
                ...(listaFiltrada.filter(u => u.rol !== 'ADM').length === 0 ? S.btnPDFDisabled : {}),
              }}
            >
              📄 {labelPDF}
            </button>
            <button onClick={abrirCrear} style={S.btnPrimary}>
              + Nuevo Usuario
            </button>
          </div>
        </header>

        {/* Mensajes */}
        {msg   && <div style={S.msgBar}>{msg}</div>}
        {error && <div style={S.errorBar}>{error}</div>}

        {/* ── Tabs de filtro por rol ── */}
        <div style={S.tabsBar}>
          {TABS.map(tab => {
            const activo = tabActivo === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setTabActivo(tab.key)}
                style={{ ...S.tab, ...(activo ? S.tabActivo : {}) }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Barra de búsqueda ── */}
        <div style={S.searchRow}>
          <input
            style={S.searchInput}
            placeholder="🔍 Buscar por usuario, nombre, apellido o DNI..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} style={S.btnLimpiar}>
              Limpiar
            </button>
          )}
        </div>

        {/* ── Tabla ── */}
        <div style={S.tableCard}>
          <table style={S.table}>
            <thead>
              <tr style={S.tableHead}>
                {['Usuario','Nombre','DNI','Correo electrónico','Rol','Estado','Acciones'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listaFiltrada.length === 0 && (
                <tr>
                  <td colSpan={7} style={S.empty}>
                    {busqueda
                      ? `No se encontraron usuarios para "${busqueda}".`
                      : `No hay usuarios con rol ${ROL_LABELS[tabActivo] || ''} registrados.`}
                  </td>
                </tr>
              )}

              {listaFiltrada.map((u, idx) => {
                const rolAnterior   = idx > 0 ? listaFiltrada[idx - 1].rol : null;
                const esPrimerDeRol = tabActivo === 'TODOS' && u.rol !== rolAnterior;
                const rolColor      = ROL_COLORS[u.rol] || { bg: '#F3F4F6', color: '#374151' };

                // KEY en el Fragment es OBLIGATORIO para que React no desmonte
                // la tabla al cambiar de tab. Sin key, React pierde el árbol del DOM.
                return (
                  <React.Fragment key={u.id}>
                    {esPrimerDeRol && (
                      <tr style={S.groupRow}>
                        <td colSpan={7} style={{
                          ...S.groupCell,
                          background: rolColor.bg,
                          color:      rolColor.color,
                        }}>
                          <span style={S.groupLabel}>
                            {ROL_LABELS[u.rol] || u.rol}
                            <span style={S.groupCount}>
                              {lista.filter(x => x.rol === u.rol).length}
                            </span>
                          </span>
                        </td>
                      </tr>
                    )}

                    <tr style={S.tr}>
                      <td style={{ ...S.td, fontWeight: '600', color: '#0F2A2A' }}>
                        {u.username}
                      </td>
                      <td style={S.td}>
                        {u.apellido?.toUpperCase()}, {u.nombre}
                      </td>
                      <td style={S.td}>{u.dni || '—'}</td>
                      <td style={S.td}>{u.email}</td>
                      <td style={S.td}>
                        <span style={{
                          ...S.rolBadge,
                          background: rolColor.bg,
                          color:      rolColor.color,
                        }}>
                          {ROL_LABELS[u.rol] || u.rol}
                        </span>
                      </td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {/* Toggle */}
                          <div
                            onClick={() => toggleEstado(u)}
                            title={u.activo ? 'Desactivar usuario' : 'Activar usuario'}
                            style={{
                              ...S.toggle,
                              background: u.activo ? '#1B6B6B' : '#D1D5DB',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{
                              ...S.toggleThumb,
                              transform: u.activo ? 'translateX(18px)' : 'translateX(2px)',
                            }} />
                          </div>
                          <span style={{ fontSize: '12px', color: u.activo ? '#166534' : '#9CA3AF' }}>
                            {u.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </td>
                      <td style={S.td}>
                        <div style={S.actions}>
                          <button onClick={() => abrirEditar(u)} style={S.btnEdit}>
                            Editar
                          </button>
                          <button onClick={() => setConfirmId(u.id)} style={S.btnDanger}>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* ── Modal Crear / Editar ──────────────────────────────── */}
      {modal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <h3 style={S.modalTitle}>
              {modal === 'crear' ? '👤 Nuevo Usuario' : '✏️ Editar Usuario'}
            </h3>

            {error && <div style={{ ...S.errorBar, marginBottom: '16px' }}>{error}</div>}

            <p style={S.sectionLabel}>Datos personales</p>
            <div style={S.grid2}>
              <Field label="Nombre *">
                <input style={S.input} value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Juan" />
              </Field>
              <Field label="Apellido *">
                <input style={S.input} value={form.apellido}
                  onChange={e => setForm({ ...form, apellido: e.target.value })}
                  placeholder="Ej: Pérez" />
              </Field>
              <Field label="DNI">
                <input style={S.input} value={form.dni}
                  onChange={e => setForm({ ...form, dni: e.target.value })}
                  placeholder="Ej: 30123456" maxLength={10} />
              </Field>
              <Field label="Teléfono">
                <input style={S.input} value={form.telefono}
                  onChange={e => setForm({ ...form, telefono: e.target.value })}
                  placeholder="Ej: 3512345678" />
              </Field>
            </div>

            <p style={S.sectionLabel}>Datos de acceso</p>
            <div style={S.grid2}>
              <Field label="Nombre de usuario *">
                <input style={S.input} value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder="Ej: juan.perez"
                  disabled={modal === 'editar'} />
              </Field>
              <Field label="Correo electrónico *">
                <input style={S.input} type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="Ej: juan@sigem.com" />
              </Field>
              <Field label="Rol *">
                <select style={S.input} value={form.rol}
                  onChange={e => setForm({ ...form, rol: e.target.value })}>
                  {ROLES_FORMULARIO.map(r => (
                    <option key={r} value={r}>{ROL_LABELS[r]}</option>
                  ))}
                </select>
              </Field>
              <Field label={modal === 'crear' ? 'Contraseña *' : 'Nueva contraseña (opcional)'}>
                <input style={S.input} type="password" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder={modal === 'crear' ? 'Mínimo 8 caracteres' : 'Dejar vacío para no cambiar'} />
              </Field>
            </div>

            <div style={S.modalActions}>
              <button onClick={() => { setModal(null); setError(''); }} style={S.btnSecondary}>
                Cancelar
              </button>
              <button onClick={guardar} style={S.btnPrimary} disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Confirmar Eliminación ───────────────────────── */}
      {confirmId && (
        <div style={S.overlay}>
          <div style={{ ...S.modal, maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ ...S.modalTitle, justifyContent: 'center' }}>
              ¿Eliminar usuario?
            </h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
              Esta acción no se puede deshacer. El usuario perderá acceso al sistema.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => setConfirmId(null)} style={S.btnSecondary}>Cancelar</button>
              <button
                onClick={() => eliminar(confirmId)}
                style={{ ...S.btnPrimary, background: '#C62828' }}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-componente Field ─────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>{label}</label>
      {children}
    </div>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const S = {
  page:        { display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" },
  main:        { flex: 1, background: '#F0F7F7', padding: '32px', minWidth: 0 },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  h1:          { fontSize: '26px', fontWeight: '700', color: '#0F2A2A', margin: 0 },
  sub:         { color: '#888', margin: '4px 0 0', fontSize: '13px' },

  // Tabs + PDF row
  tabsRow:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '12px', flexWrap: 'wrap' },
  tabsBar:        { display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 },
  tab:            { padding: '8px 14px', borderRadius: '20px', border: '1.5px solid #E5E7EB', background: '#fff', color: '#4B5563', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s' },
  tabActivo:      { background: '#1B6B6B', borderColor: '#1B6B6B', color: '#fff' },

  // Búsqueda
  searchRow:   { display: 'flex', gap: '8px', marginBottom: '16px' },
  searchInput: { flex: 1, padding: '11px 16px', borderRadius: '8px', border: '1.5px solid #B2DFDB', fontSize: '14px', outline: 'none', background: '#fff' },
  btnLimpiar:  { padding: '11px 18px', borderRadius: '8px', border: '1.5px solid #B2DFDB', background: '#fff', cursor: 'pointer', fontSize: '14px', color: '#555' },

  // Mensajes
  msgBar:      { background: '#E8F5E9', border: '1px solid #A5D6A7', color: '#2E7D32', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  errorBar:    { background: '#FFEBEE', border: '1px solid #EF9A9A', color: '#C62828', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },

  // Tabla
  tableCard:   { background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'auto' },
  table:       { width: '100%', borderCollapse: 'collapse', minWidth: '750px' },
  tableHead:   { background: '#1B6B6B' },
  th:          { color: '#fff', padding: '13px 14px', textAlign: 'left', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' },
  tr:          { borderBottom: '1px solid #F0F7F7' },
  td:          { padding: '12px 14px', fontSize: '13px', color: '#333', verticalAlign: 'middle' },
  empty:       { textAlign: 'center', padding: '48px', color: '#999', fontSize: '14px' },

  // Separadores de grupo de rol
  groupRow:    {},
  groupCell:   { padding: '6px 14px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', border: 'none' },
  groupLabel:  { display: 'flex', alignItems: 'center', gap: '8px' },
  groupCount:  { background: 'rgba(0,0,0,0.1)', borderRadius: '20px', padding: '1px 8px', fontSize: '11px', fontWeight: '700' },

  // Badges
  rolBadge:    { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' },

  // Toggle
  toggle:      { width: '40px', height: '22px', borderRadius: '11px', position: 'relative', flexShrink: 0, transition: 'background 0.2s' },
  toggleThumb: { position: 'absolute', top: '3px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'transform 0.2s' },

  // Botones de acciones en tabla
  actions:     { display: 'flex', gap: '6px' },
  btnEdit:     { background: '#E3F2FD', color: '#1565C0', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' },
  btnDanger:   { background: '#FFEBEE', color: '#C62828', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' },

  // Botones principales
  btnPrimary:  { background: 'linear-gradient(135deg, #1B6B6B, #2A9090)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  btnSecondary:{ background: '#F0F7F7', color: '#1B6B6B', border: '1.5px solid #1B6B6B', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px' },
  btnPDF:         { background: '#fff', color: '#1B6B6B', border: '1.5px solid #1B6B6B', borderRadius: '8px', padding: '10px 18px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' },
  btnPDFDisabled: { background: '#F9FAFB', color: '#9CA3AF', border: '1.5px solid #E5E7EB', cursor: 'not-allowed' },

  // Modal
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal:       { background: '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '660px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalTitle:  { color: '#0F2A2A', fontSize: '20px', fontWeight: '700', marginBottom: '24px', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' },
  sectionLabel:{ fontSize: '11px', fontWeight: '700', color: '#1B6B6B', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px', borderBottom: '1px solid #E0F2F1', paddingBottom: '6px' },
  grid2:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' },
  input:       { padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #B2DFDB', fontSize: '14px', outline: 'none', background: '#fff', color: '#333', width: '100%', boxSizing: 'border-box' },
  modalActions:{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' },
};