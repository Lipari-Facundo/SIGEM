package com.sigem.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "guardias")
public class Guardia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnoreProperties({"password", "authorities"})
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "enfermero_id", nullable = false)
    private Usuario enfermero;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "movil_id")
    private Movil movil;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_guardia", nullable = false)
    private TipoGuardia tipoGuardia = TipoGuardia.MOVIL;

    @Column(nullable = false)
    private String turno;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDateTime fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDateTime fechaFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GuardiaEstado estado;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Usuario getEnfermero() {
        return enfermero;
    }

    public void setEnfermero(Usuario enfermero) {
        this.enfermero = enfermero;
    }

    public Movil getMovil() {
        return movil;
    }

    public void setMovil(Movil movil) {
        this.movil = movil;
    }

    public TipoGuardia getTipoGuardia() {
        return tipoGuardia;
    }

    public void setTipoGuardia(TipoGuardia tipoGuardia) {
        this.tipoGuardia = tipoGuardia;
    }

    public String getTurno() {
        return turno;
    }

    public void setTurno(String turno) {
        this.turno = turno;
    }

    public LocalDateTime getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(LocalDateTime fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public LocalDateTime getFechaFin() {
        return fechaFin;
    }

    public void setFechaFin(LocalDateTime fechaFin) {
        this.fechaFin = fechaFin;
    }

    public GuardiaEstado getEstado() {
        return estado;
    }

    public void setEstado(GuardiaEstado estado) {
        this.estado = estado;
    }
}
