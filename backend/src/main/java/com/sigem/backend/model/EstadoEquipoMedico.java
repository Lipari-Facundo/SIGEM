package com.sigem.backend.model;

public enum EstadoEquipoMedico {
    OPERATIVO,
    FUNCIONANDO,
    AVERIADO,
    EN_MANTENIMIENTO,
    BAJA,

    // Valores históricos conservados hasta completar la transición de datos y servicios.
    DISPONIBLE,
    EN_USO,
    MANTENIMIENTO,
    FUERA_DE_SERVICIO
}
