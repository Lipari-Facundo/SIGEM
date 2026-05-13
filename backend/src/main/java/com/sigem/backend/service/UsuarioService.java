package com.sigem.backend.service;

import com.sigem.backend.dto.UsuarioDTO;
import com.sigem.backend.model.Usuario;
import com.sigem.backend.repository.UsuarioRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import com.sigem.backend.model.Rol;
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
        if (usuarioRepository.existsByDni(dto.getDni())) {
            throw new RuntimeException("Ya existe un usuario con ese DNI");
        }
        validarPassword(dto.getPassword());

        Usuario usuario = new Usuario();
        usuario.setUsername(dto.getUsername());
        usuario.setPassword(passwordEncoder.encode(dto.getPassword())); // Hashea la contraseña
        usuario.setNombre(dto.getNombre());
        usuario.setApellido(dto.getApellido());
        usuario.setDni(dto.getDni());
        usuario.setEmail(dto.getEmail());
        usuario.setTelefono(dto.getTelefono());
        usuario.setFechaNacimiento(dto.getFechaNacimiento());
        usuario.setDomicilio(dto.getDomicilio());
        usuario.setFotoPerfil(dto.getFotoPerfil());
        usuario.setRol(dto.getRol());
        usuario.setDisponible(dto.isDisponible());
        usuario.setActivo(true);

        return usuarioRepository.save(usuario);
    }

    // Buscar por ID
    public Usuario buscarPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con id: " + id));
    }

    // Modificar usuario (solo ADM puede cambiar datos sensibles)
    public Usuario modificar(Long id, UsuarioDTO dto) {
        Usuario usuario = buscarPorId(id);
        usuario.setNombre(dto.getNombre());
        usuario.setApellido(dto.getApellido());
        usuario.setEmail(dto.getEmail());
        usuario.setTelefono(dto.getTelefono());
        usuario.setFechaNacimiento(dto.getFechaNacimiento());
        usuario.setDomicilio(dto.getDomicilio());
        usuario.setFotoPerfil(dto.getFotoPerfil());
        usuario.setRol(dto.getRol());
        usuario.setDisponible(dto.isDisponible());
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            validarPassword(dto.getPassword());
            usuario.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        return usuarioRepository.save(usuario);
    }

    // Modificar perfil propio - solo datos no sensibles
    public Usuario modificarPerfil(Long id, UsuarioDTO dto, Authentication authentication) {
        Usuario usuario = buscarPorId(id);
        String usuarioActual = authentication.getName();

        // Validar que el usuario solo pueda modificar su propio perfil
        if (!usuario.getUsername().equals(usuarioActual)) {
            throw new RuntimeException("No tienes permisos para modificar este perfil");
        }

        // Solo permite modificar datos no sensibles
        usuario.setNombre(dto.getNombre());
        usuario.setApellido(dto.getApellido());
        usuario.setTelefono(dto.getTelefono());
        usuario.setFechaNacimiento(dto.getFechaNacimiento());
        usuario.setDomicilio(dto.getDomicilio());
        usuario.setFotoPerfil(dto.getFotoPerfil());

        // Cambio de contraseña (opcional)
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            validarPassword(dto.getPassword());
            usuario.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        // Datos que NO se pueden modificar: dni, username, rol, email, disponible, activo
        return usuarioRepository.save(usuario);
    }

    // Cambiar estado activo/inactivo de un usuario
    @Transactional
    public Usuario cambiarEstado(Long id, boolean activo) {
        Usuario usuario = buscarPorId(id);
        if (usuario.getRol() == Rol.ADM && !activo) {
            throw new RuntimeException("No se puede desactivar un usuario administrador");
        }
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
        if (usuario.getRol() == Rol.ADM) {
            throw new RuntimeException("No se puede eliminar un usuario administrador");
        }
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

    // Obtener usuario actual desde el contexto de seguridad
    public Usuario obtenerUsuarioActual(Authentication authentication) {
        String username = authentication.getName();
        return usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario autenticado no encontrado"));
    }

    // Modificar solo campos de perfil (no toca username ni rol)
    public Usuario modificarPerfil(Long id, UsuarioDTO dto) {
        Usuario usuario = buscarPorId(id);
        usuario.setNombre(dto.getNombre());
        usuario.setApellido(dto.getApellido());
        usuario.setEmail(dto.getEmail());
        usuario.setTelefono(dto.getTelefono());
        usuario.setDni(dto.getDni());
        usuario.setFechaNacimiento(dto.getFechaNacimiento());
        usuario.setDomicilio(dto.getDomicilio());
        usuario.setFotoPerfil(dto.getFotoPerfil());
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            validarPassword(dto.getPassword());
            usuario.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        return usuarioRepository.save(usuario);
}

}