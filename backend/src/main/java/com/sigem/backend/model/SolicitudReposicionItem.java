package com.sigem.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "solicitud_reposicion_item")
public class SolicitudReposicionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "solicitud_id", nullable = false)
    private SolicitudReposicion solicitud;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "insumo_id", nullable = false)
    private Insumo insumo;

    @Column(name = "cantidad_solicitada", nullable = false)
    private Integer cantidadSolicitada;

    @Column(name = "cantidad_actual_al_momento", nullable = false)
    private Integer cantidadActualAlMomento;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public SolicitudReposicion getSolicitud() { return solicitud; }
    public void setSolicitud(SolicitudReposicion solicitud) { this.solicitud = solicitud; }
    public Insumo getInsumo() { return insumo; }
    public void setInsumo(Insumo insumo) { this.insumo = insumo; }
    public Integer getCantidadSolicitada() { return cantidadSolicitada; }
    public void setCantidadSolicitada(Integer cantidadSolicitada) { this.cantidadSolicitada = cantidadSolicitada; }
    public Integer getCantidadActualAlMomento() { return cantidadActualAlMomento; }
    public void setCantidadActualAlMomento(Integer cantidadActualAlMomento) { this.cantidadActualAlMomento = cantidadActualAlMomento; }
}