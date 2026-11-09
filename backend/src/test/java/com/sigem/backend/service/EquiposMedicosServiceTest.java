package com.sigem.backend.service;

import com.sigem.backend.dto.EquipoMantenimientoDTO;
import com.sigem.backend.dto.EquipoClasificacionDTO;
import com.sigem.backend.dto.EquipoMedicoCreateDTO;
import com.sigem.backend.dto.EquipoMovimientoDTO;
import com.sigem.backend.dto.EquipoReemplazoDTO;
import com.sigem.backend.H2TestDataSourceGuard;
import com.sigem.backend.exception.ResourceConflictException;
import com.sigem.backend.model.AsignacionEquipo;
import com.sigem.backend.model.CategoriaInsumo;
import com.sigem.backend.model.EquipoMedico;
import com.sigem.backend.model.EstadoEquipoMedico;
import com.sigem.backend.model.EstadoMovil;
import com.sigem.backend.model.Guardia;
import com.sigem.backend.model.Insumo;
import com.sigem.backend.model.MantenimientoEquipo;
import com.sigem.backend.model.Movil;
import com.sigem.backend.model.MovimientoEquipoDetalle;
import com.sigem.backend.model.Rol;
import com.sigem.backend.model.TipoEquipoMedico;
import com.sigem.backend.model.TipoMantenimientoEquipo;
import com.sigem.backend.model.TipoInsumo;
import com.sigem.backend.model.TipoMovil;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.repository.AsignacionEquipoRepository;
import com.sigem.backend.repository.EquipoMedicoRepository;
import com.sigem.backend.repository.MantenimientoEquipoRepository;
import com.sigem.backend.repository.MovilRepository;
import com.sigem.backend.repository.MovimientoEquipoDetalleRepository;
import com.sigem.backend.repository.MovimientoEquipoRepository;
import com.sigem.backend.repository.InsumoRepository;
import com.sigem.backend.repository.TipoEquipoMedicoRepository;
import com.sigem.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:equipos-service-tests;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.sql.init.mode=never",
        "spring.flyway.enabled=false",
        "sigem.jwt.secret-base64=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
})
@Import(H2TestDataSourceGuard.class)
class EquiposMedicosServiceTest {
    @MockBean(name = "initData")
    private CommandLineRunner initData;

    @Autowired private EquiposMedicosService service;
    @Autowired private TipoEquipoMedicoRepository tipoRepository;
    @Autowired private EquipoMedicoRepository equipoRepository;
    @Autowired private AsignacionEquipoRepository asignacionRepository;
    @Autowired private MovimientoEquipoRepository movimientoRepository;
    @Autowired private MovimientoEquipoDetalleRepository detalleRepository;
    @Autowired private MantenimientoEquipoRepository mantenimientoRepository;
    @Autowired private MovilRepository movilRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private InsumoRepository insumoRepository;

    private Usuario actor;
    private Usuario enfermero;

    @BeforeEach
    void setUp() {
        detalleRepository.deleteAll();
        mantenimientoRepository.deleteAll();
        movimientoRepository.deleteAll();
        asignacionRepository.deleteAll();
        equipoRepository.deleteAll();
        movilRepository.deleteAll();
        usuarioRepository.deleteAll();
        tipoRepository.deleteAll();
        insumoRepository.deleteAll();

        actor = guardarUsuario(Rol.JEF);
        enfermero = guardarUsuario(Rol.ENF);
        tipoRepository.saveAndFlush(new TipoEquipoMedico("ELECTROCARDIOGRAFO", "Electrocardiógrafo"));
        tipoRepository.saveAndFlush(new TipoEquipoMedico("CARDIODESFIBRILADOR", "Cardiodesfibrilador"));
        tipoRepository.saveAndFlush(new TipoEquipoMedico("RESPIRADOR", "Respirador"));
    }

    @Test
    void altaRechazaNumeroDeSerieDuplicado() {
        service.registrarEquipo(actor, alta("SERIE-DUPLICADA"));
        assertThrows(ResourceConflictException.class,
                () -> service.registrarEquipo(actor, alta("SERIE-DUPLICADA")));
    }

    @Test
    void asignacionInicialMantieneUnSoloEquipoPorTipoYMovil() {
        Movil movil = guardarMovil();
        EquipoMedico primero = registrar("ECG-001");
        service.asignarInicialmente(actor, movimiento(primero, movil, "Ingreso"));
        assertEquals(1, asignacionRepository.findByMovilIdAndActivoTrue(movil.getId()).size());

        EquipoMedico segundo = registrar("ECG-002");
        assertThrows(ResourceConflictException.class,
                () -> service.asignarInicialmente(actor, movimiento(segundo, movil, "Ingreso")));
    }

    @Test
    void equipoNoPuedeAsignarseSimultaneamenteADosMoviles() {
        EquipoMedico equipo = registrar("ECG-003");
        Movil movilUno = guardarMovil();
        Movil movilDos = guardarMovil();
        service.asignarInicialmente(actor, movimiento(equipo, movilUno, "Ingreso"));

        assertThrows(ResourceConflictException.class,
                () -> service.asignarInicialmente(actor, movimiento(equipo, movilDos, "Segundo móvil")));
    }

    @Test
    void reemplazoPorAveriaYPorCambioConservaEstadosEsperados() {
        Movil movil = guardarMovil();
        EquipoMedico averiadoSaliente = registrar("ECG-004");
        EquipoMedico entranteAveria = registrar("ECG-005");
        service.asignarInicialmente(actor, movimiento(averiadoSaliente, movil, "Ingreso"));
        service.reemplazar(actor, new EquipoReemplazoDTO(averiadoSaliente.getId(), entranteAveria.getId(),
                movil.getId(), enfermero.getId(), "EQUIPO_AVERIADO", null));
        assertEquals(EstadoEquipoMedico.AVERIADO, equipoRepository.findById(averiadoSaliente.getId()).orElseThrow().getEstado());
        assertEquals(EstadoEquipoMedico.OPERATIVO, equipoRepository.findById(entranteAveria.getId()).orElseThrow().getEstado());

        EquipoMedico cambioSaliente = registrar("ECG-006");
        EquipoMedico entranteCambio = registrar("ECG-007");
        service.reemplazar(actor, new EquipoReemplazoDTO(entranteAveria.getId(), cambioSaliente.getId(),
                movil.getId(), enfermero.getId(), "CAMBIO_EQUIPO", null));
        service.reemplazar(actor, new EquipoReemplazoDTO(cambioSaliente.getId(), entranteCambio.getId(),
                movil.getId(), enfermero.getId(), "CAMBIO_EQUIPO", null));
        assertEquals(EstadoEquipoMedico.FUNCIONANDO, equipoRepository.findById(cambioSaliente.getId()).orElseThrow().getEstado());
        assertEquals(EstadoEquipoMedico.OPERATIVO, equipoRepository.findById(entranteCambio.getId()).orElseThrow().getEstado());
    }

    @Test
    void noPermiteAsignarEquipoAveriado() {
        EquipoMedico equipo = registrar("ECG-008");
        equipo.setEstado(EstadoEquipoMedico.AVERIADO);
        equipoRepository.saveAndFlush(equipo);

        assertThrows(ResourceConflictException.class,
                () -> service.asignarInicialmente(actor, movimiento(equipo, guardarMovil(), "Ingreso")));
    }

    @Test
    void bajaLogicaCierraAsignacionYConservaEquipoEHistorial() {
        Movil movil = guardarMovil();
        EquipoMedico equipo = registrar("ECG-009");
        service.asignarInicialmente(actor, movimiento(equipo, movil, "Ingreso"));

        service.darDeBaja(actor, equipo.getId(), "Fin de vida útil", null);

        assertEquals(EstadoEquipoMedico.BAJA, equipoRepository.findById(equipo.getId()).orElseThrow().getEstado());
        assertFalse(asignacionRepository.findByEquipoIdAndActivoTrue(equipo.getId()).isPresent());
        assertNotNull(equipoRepository.findById(equipo.getId()).orElseThrow());
        assertThrows(ResourceConflictException.class,
                () -> service.asignarInicialmente(actor, movimiento(equipo, guardarMovil(), "Reasignar")));
    }

    @Test
    void vencimientoPreventivoUsaUnAñoCalendarioYUmbralDeTreintaDias() {
        EquipoMedico proximo = registrar("ECG-010");
        service.registrarMantenimientoPreventivo(actor,
                mantenimiento(proximo, LocalDate.now().plusDays(30).minusYears(1)));
        assertEquals("PROXIMO_A_VENCER", service.obtenerEquipo(actor, proximo.getId()).mantenimientoPreventivo());
        var mantenimientoRegistrado = service.listarMantenimientos(actor, proximo.getId()).get(0);
        assertEquals(actor.getNombre() + " " + actor.getApellido(), mantenimientoRegistrado.actor());
        assertEquals(enfermero.getNombre() + " " + enfermero.getApellido(), mantenimientoRegistrado.responsable());
        assertEquals("ELECTROCARDIOGRAFO", mantenimientoRegistrado.tipoEquipo());
        assertEquals("ECG-010", mantenimientoRegistrado.numeroSerie());

        EquipoMedico vigente = registrar("ECG-013");
        service.registrarMantenimientoPreventivo(actor,
                mantenimiento(vigente, LocalDate.now().plusDays(31).minusYears(1)));
        assertEquals("VIGENTE", service.obtenerEquipo(actor, vigente.getId()).mantenimientoPreventivo());

        EquipoMedico vencido = registrar("ECG-014");
        service.registrarMantenimientoPreventivo(actor,
                mantenimiento(vencido, LocalDate.now().minusYears(1).minusDays(1)));
        assertEquals("VENCIDO", service.obtenerEquipo(actor, vencido.getId()).mantenimientoPreventivo());
        assertEquals(EstadoEquipoMedico.OPERATIVO, equipoRepository.findById(vencido.getId()).orElseThrow().getEstado());
    }

    @Test
    void mantenimientoCorrectivoNoReiniciaVencimientoPreventivo() {
        EquipoMedico equipo = registrar("ECG-011");
        service.registrarMantenimientoPreventivo(actor,
                mantenimiento(equipo, LocalDate.now().minusYears(1).minusDays(1)));
        service.enviarAMantenimiento(actor, new EquipoMovimientoDTO(
                equipo.getId(), null, enfermero.getId(), "AVERÍA", "Envío al centro"));
        service.recibirDeMantenimiento(actor, mantenimiento(equipo, LocalDate.now()));

        assertEquals("VENCIDO", service.obtenerEquipo(actor, equipo.getId()).mantenimientoPreventivo());
        assertEquals(1, mantenimientoRepository.findByEquipoIdOrderByFechaRealizacionDescIdDesc(equipo.getId())
                .stream().filter(item -> item.getTipo() == TipoMantenimientoEquipo.CORRECTIVO).count());
    }

    @Test
    void enfermeroNoPuedeAdministrarElModulo() {
        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> service.listarInventario(enfermero, null, null, null, null));
    }

    @Test
    void inventarioDelModuloIncluyeSoloLosTresTiposMedicosSoportados() {
        EquipoMedico equipoLegacy = new EquipoMedico();
        equipoLegacy.setNombre("Monitor multiparamétrico");
        equipoLegacy.setNumeroSerie("LEGADO-MONITOR-001");
        equipoLegacy.setEstado(EstadoEquipoMedico.DISPONIBLE);
        equipoRepository.saveAndFlush(equipoLegacy);

        registrar("ECG-SOLO-001");

        var inventario = service.listarInventario(actor, null, null, null, null);

        assertEquals(1, inventario.size());
        assertEquals("ECG-SOLO-001", inventario.get(0).numeroSerie());
        assertEquals(3, service.listarTipos(actor).size());
    }

    @Test
    void responsablesDebenSerEnfermerosActivosYDisponibles() {
        assertEquals(1, service.listarResponsables(actor).size());
        enfermero.setDisponible(false);
        usuarioRepository.saveAndFlush(enfermero);
        assertTrue(service.listarResponsables(actor).isEmpty());
    }

    @Test
    void vinculoTipoInsumoEsExplicitoYUnico() {
        Insumo insumo = new Insumo();
        insumo.setNombre("Elemento verificado manualmente");
        insumo.setCategoria(CategoriaInsumo.EQUIPO_MEDICO);
        insumo.setTipo(TipoInsumo.REUTILIZABLE);
        insumo.setActivo(true);
        Insumo savedInsumo = insumoRepository.saveAndFlush(insumo);

        service.asociarInsumo(actor, "ELECTROCARDIOGRAFO", savedInsumo.getId());

        assertEquals(savedInsumo.getId(), service.listarTipos(actor).stream()
                .filter(tipo -> tipo.codigo().equals("ELECTROCARDIOGRAFO"))
                .findFirst().orElseThrow().insumoId());
        assertThrows(ResourceConflictException.class,
                () -> service.asociarInsumo(actor, "RESPIRADOR", savedInsumo.getId()));
    }

    @Test
    void clasificaEquipoFisicoExistenteSinReemplazarSuAsignacion() {
        Movil movil = guardarMovil();
        EquipoMedico equipo = new EquipoMedico();
        equipo.setNombre("Equipo legado");
        equipo.setNumeroSerie("LEGADO-001");
        equipo.setEstado(EstadoEquipoMedico.EN_USO);
        equipo = equipoRepository.saveAndFlush(equipo);

        AsignacionEquipo asignacion = new AsignacionEquipo();
        asignacion.setEquipo(equipo);
        asignacion.setMovil(movil);
        asignacion.setCoordinador(actor);
        asignacion.setFechaAsignacion(LocalDateTime.now().minusDays(10));
        asignacion.setActivo(true);
        asignacion = asignacionRepository.saveAndFlush(asignacion);
        Long asignacionId = asignacion.getId();

        service.clasificarEquipoExistente(actor, equipo.getId(),
                new EquipoClasificacionDTO("ELECTROCARDIOGRAFO", "Serie verificada"));

        AsignacionEquipo vigente = asignacionRepository.findById(asignacionId).orElseThrow();
        assertTrue(vigente.isActivo());
        assertEquals(movil.getId(), vigente.getMovil().getId());
        assertEquals("ELECTROCARDIOGRAFO", vigente.getTipoEquipo().getCodigo());
        assertEquals("CLASIFICACION", service.listarHistorial(actor, equipo.getId()).get(0).tipoEvento());
    }

    @Test
    void coordinadorEnfermeriaTieneAccesoSoloAlModuloPorReglaDeServicio() {
        Usuario coordinador = new Usuario();
        coordinador.setRol(Rol.COORD_ENF);
        assertNotNull(service.listarInventario(coordinador, null, null, null, null));
    }

    @Test
    void movimientosTienenDetalleHistoricoYNoSeModificaElEstadoPreventivo() {
        EquipoMedico equipo = registrar("ECG-012");
        service.registrarMantenimientoPreventivo(actor, mantenimiento(equipo, LocalDate.now()));
        assertEquals(EstadoEquipoMedico.OPERATIVO, equipoRepository.findById(equipo.getId()).orElseThrow().getEstado());
        assertEquals(1, detalleRepository.findAll().size());
        assertEquals(1, mantenimientoRepository.findByEquipoIdOrderByFechaRealizacionDescIdDesc(equipo.getId()).size());
        assertTrue(movimientoRepository.count() >= 1);
    }

    private EquipoMedicoCreateDTO alta(String serie) {
        return new EquipoMedicoCreateDTO("ELECTROCARDIOGRAFO", serie, null, null);
    }

    private EquipoMedico registrar(String serie) {
        EquipoMedicoCreateDTO dto = alta(serie);
        service.registrarEquipo(actor, dto);
        return equipoRepository.findAll().stream()
                .filter(item -> item.getNumeroSerie().equals(serie))
                .findFirst().orElseThrow();
    }

    private EquipoMovimientoDTO movimiento(EquipoMedico equipo, Movil movil, String motivo) {
        return new EquipoMovimientoDTO(equipo.getId(), movil.getId(), enfermero.getId(), motivo, null);
    }

    private EquipoMantenimientoDTO mantenimiento(EquipoMedico equipo, LocalDate fecha) {
        return new EquipoMantenimientoDTO(equipo.getId(), fecha, enfermero.getId(), "Servicio registrado");
    }

    private Usuario guardarUsuario(Rol rol) {
        Usuario usuario = new Usuario();
        String key = UUID.randomUUID().toString().substring(0, 8);
        usuario.setUsername("usuario-" + key);
        usuario.setPassword("password");
        usuario.setNombre("Nombre");
        usuario.setApellido("Prueba");
        usuario.setDni(key);
        usuario.setEmail(key + "@example.test");
        usuario.setRol(rol);
        usuario.setActivo(true);
        usuario.setDisponible(true);
        return usuarioRepository.saveAndFlush(usuario);
    }

    private Movil guardarMovil() {
        Movil movil = new Movil();
        String key = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        movil.setTipo("AMBULANCIA");
        movil.setTipoMovil(TipoMovil.AMBULANCIA_UTIM);
        movil.setMarca("Marca");
        movil.setModelo("Modelo");
        movil.setPatente(key);
        movil.setAnio(LocalDate.now().getYear());
        movil.setNumeroInterno("M-" + key);
        movil.setFechaRegistro(LocalDate.now());
        movil.setBaseOperativa("Base");
        movil.setEstado(EstadoMovil.OPERATIVO);
        movil.setEstadoMovil(EstadoMovil.OPERATIVO);
        return movilRepository.saveAndFlush(movil);
    }
}
