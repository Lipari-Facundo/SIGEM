package com.sigem.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "stock_estandar_movil", uniqueConstraints = {
        @UniqueConstraint(name = "uk_stock_estandar_tipo_insumo", columnNames = {"tipo_movil", "insumo_id"})
})
public class StockEstandarMovil {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_movil", nullable = false)
    private TipoMovil tipoMovil;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "insumo_id", nullable = false)
    private Insumo insumo;

    @Column(name = "cantidad_recomendada", nullable = false)
    private Integer cantidadRecomendada;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public TipoMovil getTipoMovil() { return tipoMovil; }
    public void setTipoMovil(TipoMovil tipoMovil) { this.tipoMovil = tipoMovil; }

    public Insumo getInsumo() { return insumo; }
    public void setInsumo(Insumo insumo) { this.insumo = insumo; }

    public Integer getCantidadRecomendada() { return cantidadRecomendada; }
    public void setCantidadRecomendada(Integer cantidadRecomendada) { this.cantidadRecomendada = cantidadRecomendada; }
}