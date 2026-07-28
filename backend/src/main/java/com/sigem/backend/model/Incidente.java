package com.sigem.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "incidentes")
public class Incidente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    @Column(columnDefinition = "text")
    private String descripcion;

    @Column(nullable = false)
    private String ubicacion;

    @Column(nullable = false)
    private String motivo;

    @Column(name = "paciente_nombre", nullable = false)
    private String pacienteNombre;

    @Column(name = "paciente_dni", nullable = false)
    private String pacienteDni;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PrioridadIncidente prioridad;

    @Column(name = "numero_incidente", nullable = false)
    private Long numeroIncidente;

    @JsonIgnoreProperties({"password", "authorities"})
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "asignado_a_id")
    private Usuario asignadoA;

    @JsonIgnoreProperties({"password", "authorities"})
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "creado_por_id")
    private Usuario creadoPor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "movil_id")
    private Movil movil;

    @Column(name = "fecha_asignacion", nullable = false)
    private LocalDateTime fechaAsignacion;

    @Column(name = "fecha_cierre")
    private LocalDateTime fechaCierre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoIncidente estado;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public String getUbicacion() { return ubicacion; }
    public void setUbicacion(String ubicacion) { this.ubicacion = ubicacion; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }

    public String getPacienteNombre() { return pacienteNombre; }
    public void setPacienteNombre(String pacienteNombre) { this.pacienteNombre = pacienteNombre; }

    public String getPacienteDni() { return pacienteDni; }
    public void setPacienteDni(String pacienteDni) { this.pacienteDni = pacienteDni; }

    public PrioridadIncidente getPrioridad() { return prioridad; }
    public void setPrioridad(PrioridadIncidente prioridad) { this.prioridad = prioridad; }

    public Long getNumeroIncidente() { return numeroIncidente; }
    public void setNumeroIncidente(Long numeroIncidente) { this.numeroIncidente = numeroIncidente; }

    public Usuario getAsignadoA() { return asignadoA; }
    public void setAsignadoA(Usuario asignadoA) { this.asignadoA = asignadoA; }

    public Usuario getCreadoPor() { return creadoPor; }
    public void setCreadoPor(Usuario creadoPor) { this.creadoPor = creadoPor; }

    public Movil getMovil() { return movil; }
    public void setMovil(Movil movil) { this.movil = movil; }

    public LocalDateTime getFechaAsignacion() { return fechaAsignacion; }
    public void setFechaAsignacion(LocalDateTime fechaAsignacion) { this.fechaAsignacion = fechaAsignacion; }

    public LocalDateTime getFechaCierre() { return fechaCierre; }
    public void setFechaCierre(LocalDateTime fechaCierre) { this.fechaCierre = fechaCierre; }

    public EstadoIncidente getEstado() { return estado; }
    public void setEstado(EstadoIncidente estado) { this.estado = estado; }
}
