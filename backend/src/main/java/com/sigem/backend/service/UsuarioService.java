package com.sigem.backend.service;

import com.sigem.backend.dto.UsuarioDTO;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.repository.UsuarioRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UsuarioService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Requerido por Spring Security — carga el usuario por username
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));
    }

    // Crear nuevo usuario
    public Usuario crear(UsuarioDTO dto) {
        if (usuarioRepository.existsByUsername(dto.getUsername())) {
            throw new RuntimeException("El username ya está en uso");
        }
        if (usuarioRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("El email ya está en uso");
        }

        Usuario usuario = new Usuario();
        usuario.setUsername(dto.getUsername());
        usuario.setPassword(passwordEncoder.encode(dto.getPassword())); // Hashea la contraseña
        usuario.setNombre(dto.getNombre());
        usuario.setApellido(dto.getApellido());
        usuario.setEmail(dto.getEmail());
        usuario.setRol(dto.getRol());
        usuario.setActivo(true);

        return usuarioRepository.save(usuario);
    }

    // Listar todos los usuarios
    public List<Usuario> listarTodos() {
        return usuarioRepository.findAll();
    }

    // Buscar por ID
    public Usuario buscarPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con id: " + id));
    }

    // Modificar usuario
    public Usuario modificar(Long id, UsuarioDTO dto) {
        Usuario usuario = buscarPorId(id);
        usuario.setNombre(dto.getNombre());
        usuario.setApellido(dto.getApellido());
        usuario.setEmail(dto.getEmail());
        usuario.setRol(dto.getRol());
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            usuario.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        return usuarioRepository.save(usuario);
    }

    // Desactivar usuario (soft delete — no se borra, se desactiva)
    public void desactivar(Long id) {
        Usuario usuario = buscarPorId(id);
        usuario.setActivo(false);
        usuarioRepository.save(usuario);
    }
}