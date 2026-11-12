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

## Solicitudes internas de reposición

El error `column "es_interna" ... does not exist` indica que la base de datos usada por la aplicación todavía no tiene aplicada la migración `backend/src/main/resources/db/migration/V20261110210000__solicitudes_internas_prioridad.sql`. La configuración normal deshabilita Flyway y `schema.sql`, así que reiniciar o reconstruir el frontend no agrega esas columnas.

Aplicar las migraciones a la base de datos correcta antes de volver a registrar solicitudes. La migración `V20261110210000` agrega `prioridad`, permite que `movil_id` sea nulo para solicitudes internas y crea la restricción de prioridad; la migración posterior `V20261110214000` establece `DEFAULT true` para `es_interna`. Al crear la columna, el script conserva las solicitudes existentes como externas (`false`); las nuevas solicitudes internas se marcan explícitamente como `true` en el servicio. Si se usa Flyway, seguir el procedimiento de respaldo, revisión y autorización de arriba; el perfil `migration` puede baselinar un esquema heredado y ejecutar también migraciones anteriores. No se debe habilitar sobre producción sin validar previamente el destino y el respaldo. Si se aplican manualmente, ejecutar ambos archivos completos, en orden. Luego verificar que `es_interna` y `prioridad` existan en `solicitud_reposicion` antes de reiniciar la aplicación.

El inventario heredado puede contener equipos sin clasificar que no forman parte del alcance de este módulo. Las vistas de Equipos Médicos incluyen solo equipos con un tipo validado (`CARDIODESFIBRILADOR`, `ELECTROCARDIOGRAFO` o `RESPIRADOR`); los registros fuera del alcance se conservan en la base y no se reclasifican ni eliminan automáticamente.

Las relaciones de tipos a insumos permanecen sin asociar hasta que una correspondencia sea verificada con evidencia independiente; no se asignan por nombre.

## Integración del catálogo reutilizable y Control de Móvil

La migración `V20261111230000__catalogo_equipos_y_discrepancias_control.sql` está pendiente de aplicación. Renombra el registro exacto `Desfibrilador` a `Cardiodesfibrilador` conservando su ID y las relaciones históricas; crea `Respirador` si no existe; establece las tres asociaciones tipo-equipo/insumo de forma explícita; y agrega `Respirador` al estándar con una unidad en cada tipo de móvil. No crea ni ajusta saldos de `movil_insumo` o del depósito central. Si encuentra nombres duplicados, dos registros de desfibrilador o asociaciones incompatibles, aborta para requerir conciliación manual en una copia aislada.

La misma migración agrega `equipo_no_coincide` y `equipo_observado` a `control_movil_item`. El tipo, serie esperada, móvil, guardia, control, enfermero y fecha se conservan en las relaciones y snapshots existentes; las columnas nuevas registran solo la novedad y la descripción observada. Los registros históricos reciben `false` por defecto y no se completan por inferencia. El Control de Móvil obtiene series únicamente de asignaciones activas; las series históricas no se consideran asignaciones.

Antes de habilitar estos cambios en un entorno persistente, aplicar esta migración únicamente mediante el procedimiento aislado y autorizado indicado arriba. Este trabajo no ejecuta SQL ni migraciones.

## Inventario Móvil — control, excepciones y avisos

La migración `V20261111232000__inventario_movil_control_excepcion_y_notificaciones.sql` está pendiente y depende de la migración del catálogo anterior. Agrega observaciones y auditoría de excepción (motivo, usuario y fecha) a consumos y solicitudes, y permite notificaciones vinculadas a una solicitud de reposición sin incidente asociado. Aplicarlas en orden únicamente luego de revisar el respaldo y el destino conforme al procedimiento de esta guía.

El endpoint `GET /api/inventario/mi-movil/estado-control` informa si hay guardia activa y si existe un control para esa guardia. `POST /api/inventario/consumo` y `POST /api/inventario/reposicion` exigen el control o un motivo de excepción no vacío (máximo 500 caracteres); la excepción queda persistida en el registro correspondiente. `GET /api/inventario/reposicion/mias` incluye entregas y auditoría de excepción. Las entregas notifican dentro de la misma transacción que actualiza los saldos, por lo que una transacción fallida no genera aviso.

El rol Enfermero ya no dispone de operación para cancelar o rechazar solicitudes ni registrar entregas; las gestiona desde consulta. Estos cambios no ejecutan SQL ni migraciones y no alteran aceptación de incidentes.

## Pruebas

`src/test/resources/application.properties` y cada test Spring fijan una base H2 en memoria, `create-drop`, inicialización SQL deshabilitada y Flyway deshabilitado. `H2TestDataSourceGuard` aborta el contexto si la URL o el driver no son H2, si está habilitado `bootstrap`, SQL init o Flyway. No se depende exclusivamente de las propiedades de Maven Surefire y las pruebas no deben leer `SIGEM_DB_*`.
