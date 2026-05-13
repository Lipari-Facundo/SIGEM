package com.sigem.backend.dto;

public class LoginResponseDTO {

    private String token;
    private String username;
    private String rol;
    private String nombre;
    private String apellido;
    private boolean activo;
    private String fotoPerfil;

    public LoginResponseDTO(String token, String username, String rol, String nombre, String apellido, boolean activo, String fotoPerfil) {
        this.token = token;
        this.username = username;
        this.rol = rol;
        this.nombre = nombre;
        this.apellido = apellido;
        this.activo = activo;
        this.fotoPerfil = fotoPerfil;
    }

    public String getToken() { return token; }
    public String getUsername() { return username; }
    public String getRol() { return rol; }
    public String getNombre() { return nombre; }
    public String getApellido() { return apellido; }
    public boolean isActivo() { return activo; }
    public String getFotoPerfil() { return fotoPerfil; }
}