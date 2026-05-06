package com.sigem.backend.controller;

import com.sigem.backend.dto.EmpleadoDTO;
import com.sigem.backend.model.Empleado;
import com.sigem.backend.service.EmpleadoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/empleados")
public class EmpleadoController {

    private final EmpleadoService empleadoService;

    public EmpleadoController(EmpleadoService empleadoService) {
        this.empleadoService = empleadoService;
    }

    @GetMapping
    public ResponseEntity<List<Empleado>> listar() {
        return ResponseEntity.ok(empleadoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Empleado> buscar(@PathVariable Long id) {
        return ResponseEntity.ok(empleadoService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<Empleado> registrar(@RequestBody EmpleadoDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(empleadoService.registrar(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Empleado> modificar(@PathVariable Long id, @RequestBody EmpleadoDTO dto) {
        return ResponseEntity.ok(empleadoService.modificar(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        empleadoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}