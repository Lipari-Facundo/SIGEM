package com.sigem.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "control_movil")
public class ControlMovil {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "movil_id", nullable = false)
    private Movil movil;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "guardia_id", nullable = false)
    private Guardia guardia;

    @JsonIgnoreProperties({"password", "authorities"})
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "enfermero_id", nullable = false)
    private Usuario enfermero;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResultadoControl resultado;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @Column(name = "total_faltantes", nullable = false)
    private Integer totalFaltantes;

    @Column(name = "total_equipos_con_novedad", nullable = false)
    private Integer totalEquiposConNovedad;

    @Column(name = "total_discrepancias_sistema", nullable = false)
    private Integer totalDiscrepanciasSistema;

    @PrePersist
    protected void onCreate() {
        if (this.fecha == null) {
            this.fecha = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Movil getMovil() {
        return movil;
    }

    public void setMovil(Movil movil) {
        this.movil = movil;
    }

    public Guardia getGuardia() {
        return guardia;
    }

    public void setGuardia(Guardia guardia) {
        this.guardia = guardia;
    }

    public Usuario getEnfermero() {
        return enfermero;
    }

    public void setEnfermero(Usuario enfermero) {
        this.enfermero = enfermero;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public ResultadoControl getResultado() {
        return resultado;
    }

    public void setResultado(ResultadoControl resultado) {
        this.resultado = resultado;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public Integer getTotalFaltantes() {
        return totalFaltantes;
    }

    public void setTotalFaltantes(Integer totalFaltantes) {
        this.totalFaltantes = totalFaltantes;
    }

    public Integer getTotalEquiposConNovedad() {
        return totalEquiposConNovedad;
    }

    public void setTotalEquiposConNovedad(Integer totalEquiposConNovedad) {
        this.totalEquiposConNovedad = totalEquiposConNovedad;
    }

    public Integer getTotalDiscrepanciasSistema() {
        return totalDiscrepanciasSistema;
    }

    public void setTotalDiscrepanciasSistema(Integer totalDiscrepanciasSistema) {
        this.totalDiscrepanciasSistema = totalDiscrepanciasSistema;
    }
}
