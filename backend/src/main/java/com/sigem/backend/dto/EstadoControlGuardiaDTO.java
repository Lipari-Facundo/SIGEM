package com.sigem.backend.dto;

public class EstadoControlGuardiaDTO {
    private boolean guardiaActiva;
    private boolean controlCompletado;
    private String movilNumeroInterno;

    public boolean isGuardiaActiva() { return guardiaActiva; }
    public void setGuardiaActiva(boolean guardiaActiva) { this.guardiaActiva = guardiaActiva; }
    public boolean isControlCompletado() { return controlCompletado; }
    public void setControlCompletado(boolean controlCompletado) {
        this.controlCompletado = controlCompletado;
    }
    public String getMovilNumeroInterno() { return movilNumeroInterno; }
    public void setMovilNumeroInterno(String movilNumeroInterno) {
        this.movilNumeroInterno = movilNumeroInterno;
    }
}
