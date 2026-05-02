package com.sigem.backend.dto;

public class LoginResponseDTO {

    private String token;
    private String username;
    private String rol;
    private String nombre;
    private String apellido;

    public LoginResponseDTO(String token, String username, String rol, String nombre, String apellido) {
        this.token = token;
        this.username = username;
        this.rol = rol;
        this.nombre = nombre;
        this.apellido = apellido;
    }

    public String getToken() { return token; }
    public String getUsername() { return username; }
    public String getRol() { return rol; }
    public String getNombre() { return nombre; }
    public String getApellido() { return apellido; }
}