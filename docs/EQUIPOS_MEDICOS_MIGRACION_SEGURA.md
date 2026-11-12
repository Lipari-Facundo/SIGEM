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

## Reposiciones — historial, coordinación y auditoría

La migración `V20261111234600__reposiciones_coordinador_historial_notificaciones.sql` está pendiente y debe aplicarse después de las migraciones de catálogo e Inventario Móvil. Agrega la relación nullable entre solicitud y guardia sin completar solicitudes históricas, habilita una única notificación compartida por solicitud nueva, y crea `solicitud_reposicion_gestion` para auditorías inmutables de modificaciones, entregas y rechazos.

`GET /api/inventario/reposicion/historial` lista todas las solicitudes externas, sin filtrar por el coordinador que las creó o gestionó. `PUT /api/inventario/reposicion/{id}` permite editar únicamente solicitudes abiertas y conserva cantidades ya entregadas; `GET /api/inventario/reposicion/{id}/catalogo-edicion` limita las opciones al estándar del móvil. Las entregas continúan usando `POST /api/inventario/reposicion/{id}/entregas` y el movimiento transaccional existente; los equipos reutilizables siguen excluidos de cualquier movimiento de stock.

Las notificaciones de nuevas solicitudes se guardan una vez y se muestran como compartidas únicamente a coordinadores con guardia central activa. Marcarla como leída cambia el mismo registro persistido para todos. Solicitudes antiguas sin vínculo de guardia o auditoría conservan sus datos tal cual; los movimientos históricos continúan disponibles como fuente de participación y stock.

Esta etapa añade el archivo de migración, pero no ejecuta SQL ni modifica la base. No se conectó a `sigem_dev`.

## Pruebas

`src/test/resources/application.properties` y cada test Spring fijan una base H2 en memoria, `create-drop`, inicialización SQL deshabilitada y Flyway deshabilitado. `H2TestDataSourceGuard` aborta el contexto si la URL o el driver no son H2, si está habilitado `bootstrap`, SQL init o Flyway. No se depende exclusivamente de las propiedades de Maven Surefire y las pruebas no deben leer `SIGEM_DB_*`.

## Auditoría Etapa 5 — flujos y límites de verificación

### Uso y reposición

- El control se consulta por la guardia activa. Registrar consumo o crear reposición exige control completado o una excepción con motivo; la excepción queda junto al consumo/solicitud, con usuario y fecha.
- El consumo valida cantidades y actualiza el saldo del móvil y el registro de consumo dentro de la operación transaccional. La aceptación de incidentes no consulta el control.
- Las solicitudes usan `PENDIENTE`, `EN_PROCESO`, `PARCIAL`, `COMPLETADA`, `RECHAZADA` o `CANCELADA`. El detalle distingue solicitado, entregado y pendiente. El Enfermero consulta; la gestión/rechazo corresponde a Coordinación.
- Modificar una solicitud abierta audita coordinador, fecha, valores previos y nuevos, y no permite reducir cantidades debajo de lo ya entregado. Los movimientos ya registrados no se reescriben.
- Cada entrega valida saldo central y cantidad pendiente, bloquea los registros de stock, actualiza depósito y móvil, registra el movimiento y la gestión y crea la notificación en la misma transacción. Un error revierte esas escrituras; la notificación no se confirma separadamente.
- Cardiodesfibrilador, Electrocardiógrafo, Respirador y los demás reutilizables se registran como solicitud informativa con motivo. No son entregables de stock y no producen asignaciones ni movimientos de Equipos Médicos.
- La solicitud nueva genera un único registro compartido dirigido a un coordinador de la guardia central activa; los demás JEF activos pueden verla y cualquiera que la abra la marca leída en el registro persistido. La notificación de entrega se emite después de actualizar los stocks dentro de la misma transacción; parcial y completa se distinguen.
- El historial del coordinador hace lecturas agrupadas para entregas, gestiones, items, stocks y controles, en vez de repetir esas consultas por solicitud. Las asociaciones de relaciones principales se cargan mediante `EntityGraph`.

### Alcance de las pruebas

La última ejecución de `mvn test` terminó correctamente: 54 pruebas, sin fallas ni errores, usando H2 en memoria. Incluye una prueba de aceptación que verifica permiso por asignación, transición a `EN_PROCESO` y ausencia de interacción con guardias/control; además, el mapeo del endpoint conserva `PUT /api/incidentes/{id}/estado` y `hasRole('ENF')`. No se modificaron el controlador ni el servicio de incidentes.

`npm run lint`, `npm run build` y `git diff --check` finalizaron correctamente. El build advierte que el bundle principal supera 500 kB (1.43 MB minificado); no se cambió la configuración para ocultar el aviso.

No hay un runner E2E configurado en el frontend. Por tanto, no se simuló inicio de sesión ni navegación real de ambos roles. La prueba aislada valida lógica de servicio, no la conciliación de saldos contra una base con datos reales. No se obtuvo inventario de duplicados, negativos, huérfanos o diferencias entre saldos y movimientos: para eso hace falta una copia de datos aislada y autorizada. En consecuencia, la integridad histórica/operativa de una base persistente no está certificada por esta auditoría. No se consultó ninguna base para intentar inferirla.

## Inventario pendiente de migraciones

Las siete migraciones siguientes están pendientes según el inventario de trabajo. No se consultó `flyway_schema_history` ni se intentó conectar a una base, de modo que no se afirma un estado observado de una instancia. Orden Flyway ascendente:

1. **`V20261109163500__equipos_medicos_modelo.sql`**
   - Dependencias: tablas preexistentes `usuarios`, `moviles`, `insumos`, `equipos_medicos`, `asignaciones_equipos` y `control_movil_item`.
   - Crea `tipos_equipos_medicos`, `movimientos_equipos`, `movimientos_equipos_detalle` y `mantenimientos_equipos`. Agrega `tipo_equipo_id` a equipos y asignaciones; en `control_movil_item`, `equipo_medico_id`, `tipo_equipo_snapshot` y `numero_serie_snapshot`.
   - Índices: unicidad de equipo activo, tipo único activo por móvil y número de serie; búsquedas de historial de asignaciones, movimientos, detalle y mantenimiento; índices parciales por movimiento original, mantenimiento con movimiento y control con equipo.
   - Restricciones: FKs de tipo, actor/responsable, equipos, móvil y control; unicidad de `(id,tipo_equipo_id)` y `(movimiento_id,equipo_id)`; checks de estados, clasificación y orden de fechas. Algunos checks y la FK compuesta están `NOT VALID`.
   - Datos: inserta los tres tipos si no existen; no clasifica equipos/asignaciones heredadas ni inventa snapshots. Aborta ante asignaciones activas duplicadas o varios equipos activos de igual tipo por móvil.
   - Riesgo: constraints `ADD CONSTRAINT` no están todos protegidos contra re-ejecución manual y los datos existentes deben revisarse antes; la FK compuesta requiere coherencia de tipo.
2. **`V20261109175000__equipos_medicos_snapshots_integridad.sql`**
   - Dependencias: tablas y columnas de la anterior.
   - Agrega snapshots de actor/responsable a movimientos; tipo, serie, marca, modelo y móviles anterior/nuevo a detalles; actor y snapshots de equipo/estado/ubicación/móvil a mantenimiento.
   - Índices: ninguno. Restricción: FK nullable de `mantenimientos_equipos.actor_id`.
   - Crea la vista `vw_asignaciones_equipos_activas_sin_tipo`, función de validación y triggers de asignación/tipo, baja y bloqueo de mutaciones del historial de movimientos/mantenimientos.
   - Datos: snapshots anteriores permanecen nulos, no se rellenan desde el estado actual. Riesgo: historial heredado sin snapshots es incompleto para reconstruir el pasado; los triggers requieren revisar escrituras existentes y reglas de estados.
3. **`V20261110210000__solicitudes_internas_prioridad.sql`**
   - Dependencia: `solicitud_reposicion` preexistente.
   - Permite `movil_id` nulo y agrega `prioridad varchar(20) NOT NULL DEFAULT 'NORMAL'`, `es_interna boolean NOT NULL DEFAULT false` y check de prioridad (`URGENTE`, `NORMAL`, `PROGRAMADA`).
   - Índices: ninguno. Datos existentes reciben prioridad normal y quedan externos. Riesgo: valida las prioridades actuales al agregar el check.
4. **`V20261110214000__default_internal_replenishment_true.sql`**
   - Dependencia: columna `es_interna` de la migración anterior.
   - Agrega esa columna solo si falta y establece `DEFAULT true`; sin índices ni restricciones nuevas.
   - Si la columna falta, el `ADD` usa temporalmente `DEFAULT false`; filas ya existentes conservan el valor externo. Riesgo: aplicada por fuera de orden, puede modificar el default inesperadamente.
5. **`V20261111230000__catalogo_equipos_y_discrepancias_control.sql`**
   - Dependencias: `control_movil_item`, `insumos`, `tipos_equipos_medicos`, `stock_estandar_movil` y catálogo de tipos de móvil ya existentes.
   - Agrega `equipo_no_coincide boolean NOT NULL DEFAULT false` y `equipo_observado varchar(500)`. No agrega índices ni restricciones.
   - Datos: conserva el ID del insumo exacto `Desfibrilador` al renombrarlo; crea los insumos faltantes; asocia explícitamente tipos e insumos y añade Respirador al estándar de los cuatro tipos de móvil. No actualiza saldos actuales.
   - Riesgo: aborta si hay nombres duplicados, ambos nombres de desfibrilador, categoría/tipo incompatible, tipos faltantes o asociaciones contradictorias; requiere conciliar esos datos en copia aislada.
6. **`V20261111232000__inventario_movil_control_excepcion_y_notificaciones.sql`**
   - Dependencias: tablas `consumo_insumo`, `solicitud_reposicion`, `usuarios`, `notificaciones`; debe preceder a la migración 7.
   - Agrega observaciones, motivo (500), usuario con FK y fecha a consumos y solicitudes; permite `notificaciones.incidente_id` nulo y agrega `solicitud_id` con FK.
   - Índices: ninguno. Datos históricos no reciben motivos ni usuario/fecha inferidos. Riesgo: el campo de incidente pasa a ser nullable; clientes consumidores deben tolerar notificaciones asociadas solo a reposición.
7. **`V20261111234600__reposiciones_coordinador_historial_notificaciones.sql`**
   - Dependencias: migraciones 3, 5 y 6; tablas `guardias`, `usuarios`, `solicitud_reposicion` y `notificaciones`.
   - Agrega `solicitud_reposicion.guardia_id` nullable con FK y `notificaciones.compartida boolean NOT NULL DEFAULT false`. Crea `solicitud_reposicion_gestion` con ID, solicitud, coordinador, acción, detalle, observaciones y fecha.
   - Índices: ninguno declarado. Datos históricos mantienen `guardia_id` nulo, no se asocian por inferencia y no reciben gestiones retroactivas. Riesgo: historial antiguo tendrá menos metadatos de guardia/participantes que solicitudes creadas luego de aplicar la migración.

No se ejecutó ninguna de estas migraciones, SQL manual ni operación contra `sigem_dev`.
