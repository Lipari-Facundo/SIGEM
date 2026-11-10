package com.sigem.backend.model;

import com.sigem.backend.H2TestDataSourceGuard;
import jakarta.persistence.PersistenceException;
import org.junit.jupiter.api.Test;
import org.hibernate.annotations.Immutable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.sql.init.mode=never",
        "spring.flyway.enabled=false"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@Import(H2TestDataSourceGuard.class)
class EquipoMedicoPersistenceTest {

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void persisteTipoEquipoYAsignacionSinDuplicarElEquipo() {
        TipoEquipoMedico tipo = entityManager.persistAndFlush(
                new TipoEquipoMedico("ELECTROCARDIOGRAFO", "Electrocardiógrafo"));
        EquipoMedico equipo = crearEquipo("SIGEM-ECG-001", tipo);
        entityManager.persistAndFlush(equipo);

        Usuario coordinador = entityManager.persistAndFlush(crearUsuario("coord", Rol.COORD_ENF));
        assertTrue(coordinador.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_COORD_ENF")));
        Movil movil = entityManager.persistAndFlush(crearMovil());
        AsignacionEquipo asignacion = new AsignacionEquipo();
        asignacion.setEquipo(equipo);
        asignacion.setTipoEquipo(tipo);
        asignacion.setMovil(movil);
        asignacion.setCoordinador(coordinador);
        asignacion.setFechaAsignacion(LocalDateTime.of(2026, 11, 9, 12, 0));
        entityManager.persistAndFlush(asignacion);
        entityManager.clear();

        AsignacionEquipo guardada = entityManager.find(AsignacionEquipo.class, asignacion.getId());
        assertEquals(equipo.getId(), guardada.getEquipo().getId());
        assertEquals("ELECTROCARDIOGRAFO", guardada.getTipoEquipo().getCodigo());
        assertEquals(movil.getId(), guardada.getMovil().getId());
    }

    @Test
    void conservaRegistrosLegadosSinTipoYControlesSinVinculoDeEquipo() {
        EquipoMedico legado = crearEquipo("SERIE-LEGADA-001", null);
        legado.setEstado(EstadoEquipoMedico.DISPONIBLE);
        entityManager.persistAndFlush(legado);

        Usuario enfermero = entityManager.persistAndFlush(crearUsuario("enf", Rol.ENF));
        Movil movil = entityManager.persistAndFlush(crearMovil());
        Guardia guardia = crearGuardia(enfermero, movil);
        entityManager.persistAndFlush(guardia);
        ControlMovil control = crearControl(enfermero, movil, guardia);
        entityManager.persistAndFlush(control);
        Insumo insumo = crearInsumo();
        entityManager.persistAndFlush(insumo);

        ControlMovilItem item = new ControlMovilItem();
        item.setControl(control);
        item.setInsumo(insumo);
        item.setCantidadRecomendada(1);
        item.setCantidadSistema(1);
        item.setCantidadContada(1);
        item.setNumeroSerie("SERIE-HISTORICA");
        entityManager.persistAndFlush(item);
        entityManager.clear();

        EquipoMedico equipoGuardado = entityManager.find(EquipoMedico.class, legado.getId());
        ControlMovilItem itemGuardado = entityManager.find(ControlMovilItem.class, item.getId());
        assertNull(equipoGuardado.getTipoEquipo());
        assertEquals(EstadoEquipoMedico.DISPONIBLE, equipoGuardado.getEstado());
        assertNull(itemGuardado.getEquipoMedico());
        assertNull(itemGuardado.getTipoEquipoSnapshot());
        assertEquals("SERIE-HISTORICA", itemGuardado.getNumeroSerie());
    }

    @Test
    void rechazaNumeroDeSerieDuplicado() {
        entityManager.persistAndFlush(crearEquipo("SERIE-UNICA-001", null));
        entityManager.clear();

        assertThrows(PersistenceException.class, () ->
                entityManager.persistAndFlush(crearEquipo("SERIE-UNICA-001", null)));
    }

    @Test
    void incorporaEstadosOperativosYMarcaElHistorialComoInmutable() {
        assertTrue(Set.of(EstadoEquipoMedico.values()).containsAll(Set.of(
                EstadoEquipoMedico.OPERATIVO,
                EstadoEquipoMedico.FUNCIONANDO,
                EstadoEquipoMedico.AVERIADO,
                EstadoEquipoMedico.EN_MANTENIMIENTO,
                EstadoEquipoMedico.BAJA)));
        assertTrue(MovimientoEquipo.class.isAnnotationPresent(Immutable.class));
        assertTrue(MovimientoEquipoDetalle.class.isAnnotationPresent(Immutable.class));
        assertTrue(MantenimientoEquipo.class.isAnnotationPresent(Immutable.class));
    }

    @Test
    void persisteMovimientoDetalleYMantenimientoComoEntidadesDeHistorial() {
        TipoEquipoMedico tipo = entityManager.persistAndFlush(
                new TipoEquipoMedico("RESPIRADOR", "Respirador"));
        EquipoMedico equipo = crearEquipo("SERIE-HIST-001", tipo);
        equipo.setMarca("Marca histórica");
        equipo.setModelo("Modelo histórico");
        equipo = entityManager.persistAndFlush(equipo);
        Usuario responsable = entityManager.persistAndFlush(crearUsuario("responsable", Rol.ENF));
        Movil movil = entityManager.persistAndFlush(crearMovil());

        MovimientoEquipo movimiento = entityManager.persistAndFlush(new MovimientoEquipo(
                LocalDateTime.of(2026, 11, 9, 12, 0),
                TipoMovimientoEquipo.ENVIO_MANTENIMIENTO,
                responsable,
                responsable,
                "Actor de prueba",
                "Responsable de prueba",
                "Falla reportada",
                "Envío al centro de reparación",
                null));
        MovimientoEquipoDetalle detalle = entityManager.persistAndFlush(new MovimientoEquipoDetalle(
                movimiento,
                equipo,
                EstadoEquipoMedico.AVERIADO,
                EstadoEquipoMedico.EN_MANTENIMIENTO,
                UbicacionEquipoMedico.DEPOSITO_ENFERMERIA,
                UbicacionEquipoMedico.CENTRO_REPARACION,
                null,
                movil));
        MantenimientoEquipo mantenimiento = entityManager.persistAndFlush(new MantenimientoEquipo(
                equipo,
                TipoMantenimientoEquipo.CORRECTIVO,
                LocalDate.of(2026, 11, 9),
                responsable,
                responsable,
                "Reparación realizada",
                movimiento,
                EstadoEquipoMedico.AVERIADO,
                EstadoEquipoMedico.FUNCIONANDO,
                UbicacionEquipoMedico.CENTRO_REPARACION,
                UbicacionEquipoMedico.DEPOSITO_ENFERMERIA,
                null));
        entityManager.clear();

        MovimientoEquipoDetalle detallePersistido =
                entityManager.find(MovimientoEquipoDetalle.class, detalle.getId());
        MantenimientoEquipo mantenimientoPersistido =
                entityManager.find(MantenimientoEquipo.class, mantenimiento.getId());
        assertEquals(equipo.getId(), detallePersistido.getEquipo().getId());
        assertEquals("RESPIRADOR", detallePersistido.getTipoEquipoSnapshot());
        assertEquals("SERIE-HIST-001", detallePersistido.getNumeroSerieSnapshot());
        assertEquals("Marca histórica", detallePersistido.getMarcaSnapshot());
        assertEquals("Modelo histórico", detallePersistido.getModeloSnapshot());
        assertEquals("Actor de prueba", movimiento.getActorNombreSnapshot());
        assertEquals(movimiento.getId(), mantenimientoPersistido.getMovimiento().getId());
        assertEquals(responsable.getId(), mantenimientoPersistido.getActor().getId());
        assertEquals("RESPIRADOR", mantenimientoPersistido.getTipoEquipoSnapshot());
        assertEquals("SERIE-HIST-001", mantenimientoPersistido.getNumeroSerieSnapshot());
        assertTrue(responsable.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ENF")));
    }

    private EquipoMedico crearEquipo(String serie, TipoEquipoMedico tipo) {
        EquipoMedico equipo = new EquipoMedico();
        equipo.setNombre("Equipo de prueba");
        equipo.setNumeroSerie(serie);
        equipo.setTipoEquipo(tipo);
        equipo.setEstado(EstadoEquipoMedico.FUNCIONANDO);
        return equipo;
    }

    private Usuario crearUsuario(String username, Rol rol) {
        Usuario usuario = new Usuario();
        usuario.setUsername(username);
        usuario.setPassword("hash");
        usuario.setNombre("Usuario");
        usuario.setApellido("SIGEM");
        usuario.setDni("DNI-" + username);
        usuario.setEmail(username + "@example.test");
        usuario.setRol(rol);
        return usuario;
    }

    private Movil crearMovil() {
        Movil movil = new Movil();
        movil.setTipo("Ambulancia");
        movil.setTipoMovil(TipoMovil.AMBULANCIA_UTIM);
        movil.setMarca("Marca");
        movil.setModelo("Modelo");
        movil.setPatente("AA000AA");
        movil.setAnio(2024);
        movil.setNumeroInterno("MOV-TEST");
        movil.setFechaRegistro(LocalDate.of(2024, 1, 1));
        movil.setBaseOperativa("Base de prueba");
        movil.setEstado(EstadoMovil.OPERATIVO);
        movil.setEstadoMovil(EstadoMovil.OPERATIVO);
        return movil;
    }

    private Guardia crearGuardia(Usuario enfermero, Movil movil) {
        Guardia guardia = new Guardia();
        guardia.setEnfermero(enfermero);
        guardia.setMovil(movil);
        guardia.setTipoGuardia(TipoGuardia.MOVIL);
        guardia.setTurno("Mañana");
        guardia.setFechaInicio(LocalDateTime.of(2026, 11, 9, 8, 0));
        guardia.setEstado(GuardiaEstado.ACTIVA);
        return guardia;
    }

    private ControlMovil crearControl(Usuario enfermero, Movil movil, Guardia guardia) {
        ControlMovil control = new ControlMovil();
        control.setEnfermero(enfermero);
        control.setMovil(movil);
        control.setGuardia(guardia);
        control.setResultado(ResultadoControl.CONFORME);
        control.setTotalFaltantes(0);
        control.setTotalEquiposConNovedad(0);
        control.setTotalDiscrepanciasSistema(0);
        return control;
    }

    private Insumo crearInsumo() {
        Insumo insumo = new Insumo();
        insumo.setNombre("Insumo de control");
        insumo.setCategoria(CategoriaInsumo.EQUIPO_MEDICO);
        insumo.setTipo(TipoInsumo.REUTILIZABLE);
        return insumo;
    }
}
