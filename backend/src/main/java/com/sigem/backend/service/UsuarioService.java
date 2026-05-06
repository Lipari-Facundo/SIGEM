package com.sigem.backend.service;

import com.sigem.backend.dto.UsuarioDTO;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.repository.UsuarioRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UsuarioService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @PersistenceContext
    private EntityManager entityManager;

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
        validarPassword(dto.getPassword());

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
            validarPassword(dto.getPassword());
            usuario.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        return usuarioRepository.save(usuario);
    }

    // Cambiar estado activo/inactivo de un usuario
    @Transactional
    public Usuario cambiarEstado(Long id, boolean activo) {
        Usuario usuario = buscarPorId(id);
        usuario.setActivo(activo);
        Usuario updated = usuarioRepository.save(usuario);
        usuarioRepository.flush();
        entityManager.clear();
        return updated;
    }

    // Eliminar usuario definitivamente
    @Transactional
    public void eliminar(Long id) {
        Usuario usuario = buscarPorId(id);
        usuarioRepository.delete(usuario);
        usuarioRepository.flush();
        entityManager.clear();
    }

    public List<Usuario> listarTodos() {
        entityManager.clear();
        return usuarioRepository.findAll();
    }

    private void validarPassword(String password) {
        if (password == null || password.isBlank()) {
            throw new RuntimeException("La contraseña es obligatoria");
        }
        if (!password.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$")) {
            throw new RuntimeException("La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.");
        }
    }
}