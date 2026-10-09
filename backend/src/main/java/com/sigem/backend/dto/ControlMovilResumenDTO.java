package com.sigem.backend.dto;

import com.sigem.backend.model.ResultadoControl;

import java.time.LocalDateTime;

public class ControlMovilResumenDTO {

    private Long id;
    private LocalDateTime fecha;
    private Long movilId;
    private String movilNumeroInterno;
    private String movilPatente;
    private String enfermeroNombre;
    private ResultadoControl resultado;
    private Integer totalFaltantes;
    private Integer totalEquiposConNovedad;
    private Integer totalDiscrepanciasSistema;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public Long getMovilId() {
        return movilId;
    }

    public void setMovilId(Long movilId) {
        this.movilId = movilId;
    }

    public String getMovilNumeroInterno() {
        return movilNumeroInterno;
    }

    public void setMovilNumeroInterno(String movilNumeroInterno) {
        this.movilNumeroInterno = movilNumeroInterno;
    }

    public String getMovilPatente() {
        return movilPatente;
    }

    public void setMovilPatente(String movilPatente) {
        this.movilPatente = movilPatente;
    }

    public String getEnfermeroNombre() {
        return enfermeroNombre;
    }

    public void setEnfermeroNombre(String enfermeroNombre) {
        this.enfermeroNombre = enfermeroNombre;
    }

    public ResultadoControl getResultado() {
        return resultado;
    }

    public void setResultado(ResultadoControl resultado) {
        this.resultado = resultado;
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
