package com.sigem.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "consumo_insumo")
public class ConsumoInsumo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "movil_id", nullable = false)
    private Movil movil;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "insumo_id", nullable = false)
    private Insumo insumo;

    @Column(nullable = false)
    private Integer cantidad;

    @JsonIgnoreProperties({"password", "authorities"})
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "enfermero_id", nullable = false)
    private Usuario enfermero;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incidente_id")
    private Incidente incidente;

    @Column(name = "lote_id", nullable = false, length = 64)
    private String loteId;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @PrePersist
    protected void onCreate() {
        if (fecha == null) {
            fecha = LocalDateTime.now();
        }
        if (loteId == null) {
            loteId = UUID.randomUUID().toString();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Movil getMovil() { return movil; }
    public void setMovil(Movil movil) { this.movil = movil; }

    public Insumo getInsumo() { return insumo; }
    public void setInsumo(Insumo insumo) { this.insumo = insumo; }

    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }

    public Usuario getEnfermero() { return enfermero; }
    public void setEnfermero(Usuario enfermero) { this.enfermero = enfermero; }

    public Incidente getIncidente() { return incidente; }
    public void setIncidente(Incidente incidente) { this.incidente = incidente; }

    public String getLoteId() { return loteId; }
    public void setLoteId(String loteId) { this.loteId = loteId; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
}