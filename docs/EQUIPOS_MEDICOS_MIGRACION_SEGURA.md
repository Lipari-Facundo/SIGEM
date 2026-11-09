# Preparación segura de migraciones para Equipos Médicos

La aplicación no ejecuta `schema.sql` ni Flyway al arrancar con la configuración normal. Hibernate valida el esquema (`validate`) y las credenciales se obtienen exclusivamente de `SIGEM_DB_URL`, `SIGEM_DB_USERNAME` y `SIGEM_DB_PASSWORD`. Aun al activar el perfil `migration`, Flyway permanece deshabilitado salvo que se configure explícitamente `SIGEM_ENABLE_FLYWAY_MIGRATION=true`.

Los perfiles normales no crean usuarios ni sincronizan datos desde archivos. Los inicializadores heredados solo se habilitan con el perfil explícito `bootstrap`; no deben habilitarse sobre datos reales.

## Secreto JWT

La aplicación requiere `SIGEM_JWT_SECRET_BASE64`. Debe contener Base64 válido que decodifique a entre 48 y 63 bytes aleatorios; la firma continúa usando HS384. No se debe guardar el valor en el repositorio ni imprimirlo en logs. En PowerShell, generar un secreto para la sesión de desarrollo:

```powershell
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$bytes = New-Object byte[] 48
$rng.GetBytes($bytes)
$env:SIGEM_JWT_SECRET_BASE64 = [Convert]::ToBase64String($bytes)
$rng.Dispose()
```

Configurar el mismo valor en el gestor de secretos del entorno donde se ejecuta SIGEM. Al rotar desde la clave anterior, los tokens previamente emitidos dejan de validar y los usuarios deberán autenticarse nuevamente.

## Revisión futura (requiere autorización independiente)

No ejecutar el procedimiento sobre `sigem_dev`. Primero:

1. Detener los procesos que puedan escribir en la base afectada y obtener un respaldo consistente; registrar fecha, tamaño, checksum y versión del respaldo.
2. Restaurar ese respaldo en una instancia aislada y sin credenciales hacia producción. Verificar host, puerto, nombre de base y usuario de conexión desde el entorno aislado.
3. Comparar esquema, restricciones e historial de Flyway con el estado esperado. Como una ejecución anterior de Hibernate `ddl-auto=update` pudo crear objetos y `schema.sql` pudo haber ejecutado semillas, no asumir que el estado existente equivale a una migración aplicada. No borrar objetos ni reconstruir IDs.
4. Revisar y resolver manualmente, sobre esa copia, cualquier discrepancia o asignación activa duplicada. Esta migración no corrige esos datos.
5. Autorizar explícitamente la prueba y usar el perfil `migration` solo contra la copia restaurada, apuntando las variables `SIGEM_DB_*` a esa copia. Revisar la URL antes de configurar `SIGEM_ENABLE_FLYWAY_MIGRATION=true`; sin esa variable, Flyway queda apagado incluso con el perfil `migration`. Con la variable habilitada, Flyway puede marcar el esquema heredado como baseline `20261109163400` y ejecutar las migraciones pendientes. Hibernate permanece en `validate`.
6. Revisar `flyway_schema_history`, las restricciones, los registros históricos y el log. La migración incremental agrega snapshots nullable sin completar ni reescribir eventos existentes. En registros anteriores sin snapshots, la respuesta conserva compatibilidad usando referencias actuales cuando existen; esos valores no prueban cómo eran los datos al momento del evento y no se deben tratar como snapshots históricos ni completar por inferencia. Los eventos creados después de la migración guardan sus propios valores snapshot. La vista `vw_asignaciones_equipos_activas_sin_tipo` permite detectar asignaciones activas heredadas sin clasificación o con discrepancias.
7. Descartar la copia si la prueba no es satisfactoria; preparar y verificar un respaldo nuevo antes de una futura autorización de producción.

La migración del módulo presupone que las tablas preexistentes de SIGEM (`usuarios`, `moviles`, `insumos`, `equipos_medicos`, `asignaciones_equipos` y `control_movil_item`) ya existen. No es un bootstrap de una base vacía. La primera corrida de Flyway habilitado en una base no vacía realiza baseline; por eso no deben combinarse el perfil `migration` y `SIGEM_ENABLE_FLYWAY_MIGRATION=true` sin restauración y verificación previa. No se debe ejecutar `mvn test` para aplicar migraciones.

El inventario heredado puede contener equipos sin clasificar que no forman parte del alcance de este módulo. Las vistas de Equipos Médicos incluyen solo equipos con un tipo validado (`CARDIODESFIBRILADOR`, `ELECTROCARDIOGRAFO` o `RESPIRADOR`); los registros fuera del alcance se conservan en la base y no se reclasifican ni eliminan automáticamente.

Las relaciones de tipos a insumos permanecen sin asociar hasta que una correspondencia sea verificada con evidencia independiente; no se asignan por nombre.

## Pruebas

`src/test/resources/application.properties` y cada test Spring fijan una base H2 en memoria, `create-drop`, inicialización SQL deshabilitada y Flyway deshabilitado. `H2TestDataSourceGuard` aborta el contexto si la URL o el driver no son H2, si está habilitado `bootstrap`, SQL init o Flyway. No se depende exclusivamente de las propiedades de Maven Surefire y las pruebas no deben leer `SIGEM_DB_*`.
