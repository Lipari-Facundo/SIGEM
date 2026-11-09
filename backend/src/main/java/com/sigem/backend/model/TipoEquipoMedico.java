package com.sigem.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.Check;

@Entity
@Check(constraints = "codigo IN ('ELECTROCARDIOGRAFO', 'CARDIODESFIBRILADOR', 'RESPIRADOR')")
@Table(name = "tipos_equipos_medicos")
public class TipoEquipoMedico {

    @Id
    @Column(name = "codigo", length = 50, nullable = false, updatable = false)
    private String codigo;

    @Column(name = "nombre", length = 100, nullable = false)
    private String nombre;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "insumo_id", unique = true)
    private Insumo insumo;

    protected TipoEquipoMedico() {
    }

    public TipoEquipoMedico(String codigo, String nombre) {
        this.codigo = codigo;
        this.nombre = nombre;
    }

    public String getCodigo() {
        return codigo;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public Insumo getInsumo() {
        return insumo;
    }

    public void setInsumo(Insumo insumo) {
        this.insumo = insumo;
    }
}
