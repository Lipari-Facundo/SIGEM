package com.sigem.backend.dto;

public class GuardiaDTO {

    private Long movilId;
    private String turno;

    public Long getMovilId() {
        return movilId;
    }

    public void setMovilId(Long movilId) {
        this.movilId = movilId;
    }

    public String getTurno() {
        return turno;
    }

    public void setTurno(String turno) {
        this.turno = turno;
    }
}
