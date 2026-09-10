package com.sigem.backend.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "incidente_historial_asignacion")
public class IncidenteHistorialAsignacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "incidente_id", nullable = false)
    private Incidente incidente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "enfermero_id", nullable = false)
    private Usuario enfermero;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movil_id")
    private Movil movil;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoDesasignacion tipo;

    @Column(columnDefinition = "text")
    private String motivo;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @PrePersist
    protected void alCrear() {
        if (fecha == null) fecha = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Incidente getIncidente() { return incidente; }
    public void setIncidente(Incidente incidente) { this.incidente = incidente; }

    public Usuario getEnfermero() { return enfermero; }
    public void setEnfermero(Usuario enfermero) { this.enfermero = enfermero; }

    public Movil getMovil() { return movil; }
    public void setMovil(Movil movil) { this.movil = movil; }

    public TipoDesasignacion getTipo() { return tipo; }
    public void setTipo(TipoDesasignacion tipo) { this.tipo = tipo; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
}