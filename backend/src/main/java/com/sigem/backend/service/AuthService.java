package com.sigem.backend.service;

import com.sigem.backend.dto.LoginRequestDTO;
import com.sigem.backend.dto.LoginResponseDTO;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.repository.UsuarioRepository;
import com.sigem.backend.security.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final JwtUtil jwtUtil;

    public AuthService(AuthenticationManager authenticationManager,
                       UsuarioRepository usuarioRepository,
                       JwtUtil jwtUtil) {
        this.authenticationManager = authenticationManager;
        this.usuarioRepository = usuarioRepository;
        this.jwtUtil = jwtUtil;
    }

    public LoginResponseDTO login(LoginRequestDTO request) {
        // Delega la validación de credenciales a Spring Security
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        // Si llegamos acá, las credenciales son correctas
        Usuario usuario = usuarioRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));

        // Generamos el JWT
        String token = jwtUtil.generateToken(usuario);

        return new LoginResponseDTO(
                token,
                usuario.getUsername(),
                usuario.getRol().name(),
                usuario.getNombre(),
                usuario.getApellido()
        );
    }
}