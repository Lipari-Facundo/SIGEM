package com.sigem.backend.dto;

import com.sigem.backend.model.EstadoMovil;
import com.sigem.backend.model.TipoMovil;

import java.time.LocalDate;

public class MovilDTO {

    private Long id;
    private TipoMovil tipoMovil;
    private String marca;
    private String modelo;
    private String patente;
    private Integer anio;
    private String numeroInterno;
    private LocalDate fechaRegistro;
    private String baseOperativa;
    private Integer kilometrajeActual;
    private Integer capacidadPacientes;
    private String observaciones;
    private EstadoMovil estadoMovil;

    // ─── Getters y Setters ────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public TipoMovil getTipoMovil() { return tipoMovil; }
    public void setTipoMovil(TipoMovil tipoMovil) { this.tipoMovil = tipoMovil; }

    public String getMarca() { return marca; }
    public void setMarca(String marca) { this.marca = marca; }

    public String getModelo() { return modelo; }
    public void setModelo(String modelo) { this.modelo = modelo; }

    public String getPatente() { return patente; }
    public void setPatente(String patente) { this.patente = patente; }

    public Integer getAnio() { return anio; }
    public void setAnio(Integer anio) { this.anio = anio; }

    public String getNumeroInterno() { return numeroInterno; }
    public void setNumeroInterno(String numeroInterno) { this.numeroInterno = numeroInterno; }

    public LocalDate getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDate fechaRegistro) { this.fechaRegistro = fechaRegistro; }

    public String getBaseOperativa() { return baseOperativa; }
    public void setBaseOperativa(String baseOperativa) { this.baseOperativa = baseOperativa; }

    public Integer getKilometrajeActual() { return kilometrajeActual; }
    public void setKilometrajeActual(Integer kilometrajeActual) { this.kilometrajeActual = kilometrajeActual; }

    public Integer getCapacidadPacientes() { return capacidadPacientes; }
    public void setCapacidadPacientes(Integer capacidadPacientes) { this.capacidadPacientes = capacidadPacientes; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public EstadoMovil getEstadoMovil() { return estadoMovil; }
    public void setEstadoMovil(EstadoMovil estadoMovil) { this.estadoMovil = estadoMovil; }
}
