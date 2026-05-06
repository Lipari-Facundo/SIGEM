package com.sigem.backend.dto;

import com.sigem.backend.model.Rol;

public class EmpleadoDTO {
    private String nombre;
    private String apellido;
    private String dni;
    private String email;
    private String telefono;
    private Rol rol;
    private boolean disponible;

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { this.apellido = apellido; }
    public String getDni() { return dni; }
    public void setDni(String dni) { this.dni = dni; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public Rol getRol() { return rol; }
    public void setRol(Rol rol) { this.rol = rol; }
    public boolean isDisponible() { return disponible; }
    public void setDisponible(boolean disponible) { this.disponible = disponible; }
}