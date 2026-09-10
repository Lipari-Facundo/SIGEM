package com.sigem.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "movil_insumo", uniqueConstraints = {
        @UniqueConstraint(name = "uk_movil_insumo", columnNames = {"movil_id", "insumo_id"})
})
public class MovilInsumo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "movil_id", nullable = false)
    private Movil movil;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "insumo_id", nullable = false)
    private Insumo insumo;

    @Column(name = "cantidad_actual", nullable = false)
    private Integer cantidadActual = 0;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Movil getMovil() { return movil; }
    public void setMovil(Movil movil) { this.movil = movil; }

    public Insumo getInsumo() { return insumo; }
    public void setInsumo(Insumo insumo) { this.insumo = insumo; }

    public Integer getCantidadActual() { return cantidadActual; }
    public void setCantidadActual(Integer cantidadActual) { this.cantidadActual = cantidadActual; }
}