# Migraciones automáticas con Flyway

## Mecanismo y orden de inicio

Flyway es el mecanismo oficial para evolucionar el esquema de PostgreSQL. En el arranque normal:

1. Spring Boot resuelve `SIGEM_DB_URL`, `SIGEM_DB_USERNAME` y `SIGEM_DB_PASSWORD`.
2. Flyway valida `flyway_schema_history` y los checksums, y ejecuta en orden solo las migraciones versionadas pendientes.
3. Si una migración o validación falla, Spring Boot detiene el arranque. No repara ni limpia el esquema.
4. Hibernate valida el esquema con `ddl-auto=validate`; no crea ni actualiza objetos.

La configuración común fija `spring.flyway.enabled=true`, `spring.flyway.baseline-on-migrate=false`, `spring.flyway.clean-disabled=true`, `spring.flyway.validate-on-migrate=true`, `spring.sql.init.mode=never` y `spring.jpa.hibernate.ddl-auto=validate`. El perfil `migration` hereda la misma configuración segura. El perfil `test` es una excepción deliberada: H2 en memoria, `create-drop`, Flyway apagado y validación por `H2TestDataSourceGuard`.

No habilitar baseline automático, `clean`, `repair`, `ddl-auto=update` ni SQL de inicialización. No ejecutar `schema.sql`: es un script heredado de compatibilidad, no una migración y no es una fuente de verdad.

## Configuración de PostgreSQL

Configurar estas variables en el proceso, el IDE o un gestor de secretos. No guardarlas en Git:

```powershell
$env:SIGEM_DB_URL = "jdbc:postgresql://localhost:5433/sigem_local"
$env:SIGEM_DB_USERNAME = "sigem"
$env:SIGEM_DB_PASSWORD = "<contraseña-local>"
$env:SIGEM_JWT_SECRET_BASE64 = "<secreto-base64>"
```

Iniciar desde `backend` con `.\mvnw.cmd spring-boot:run`, o ejecutar la configuración principal del IDE con las mismas variables. No activar los perfiles `test` ni `bootstrap` para el uso normal. `bootstrap` crea usuario y datos de desarrollo; solo usarlo deliberadamente contra una base desechable.

Se agregó `application-local.properties.example` como referencia sin credenciales. El archivo local `application-local.properties` preexistente no se reemplazó porque es una configuración local sin seguimiento. Antes de usar `-Dspring-boot.run.profiles=local`, revisar y reemplazar manualmente ese archivo con la referencia y una URL propia. No activar el perfil `local` mientras conserve una URL antigua.

### PostgreSQL con Docker Compose

Desde `backend`, defina un password local y un nombre de base local:

```powershell
$env:POSTGRES_PASSWORD = "<contraseña-local>"
$env:POSTGRES_DB = "sigem_local"
$env:POSTGRES_PORT = "5433"
docker compose up -d db
```

Use las mismas credenciales en `SIGEM_DB_*` y arranque el backend normalmente. El Compose crea solo PostgreSQL; Flyway migra cuando se inicia el backend. No se versiona un password por defecto.

## Base nueva

Crear una base PostgreSQL vacía (sin tablas de SIGEM) y arrancar la aplicación con `SIGEM_DB_*`. Flyway crea las tablas base y aplica las versiones posteriores, sin usuarios, móviles ni datos de demostración. La base queda sin usuarios hasta que estos se creen por mecanismos administrativos aprobados. No activar `bootstrap` en una base compartida.

## Base existente y adopción

No se aplica baseline automático. Si Flyway encuentra una base no vacía sin `flyway_schema_history`, el arranque debe fallar de forma segura: no asumir que las tablas conocidas tienen las columnas, índices, restricciones ni datos correctos.

Antes de adoptar una base heredada:

1. Crear y probar una copia de seguridad consistente; restaurarla en una instancia PostgreSQL aislada.
2. Inspeccionar `flyway_schema_history` y comparar el esquema y los datos con el último estado esperado. Buscar objetos incompletos/duplicados y dependencias heredadas.
3. Si ya hay versiones SIGEM aplicadas por Flyway, la migración `20261109163450` valida las tablas y columnas base antes de las migraciones pendientes y falla si detecta un esquema parcial. La migración base `20261109160000`, por ser anterior al baseline existente, no se ejecuta en esa base. La migración `20261112010000` agrega `archivado` si falta, sin cambiar sus valores existentes.
4. Si no hay historial, detenerse. Solo un DBA puede aprobar y realizar un `flyway baseline` explícito, tras demostrar que la estructura corresponde exactamente a la versión que se declara. Baseline registra una marca, no ejecuta migraciones anteriores. Nunca declarar una versión superior a la estructura comprobada.
5. Si la estructura no corresponde con una versión conocida, no baselinar: preparar una migración de compatibilidad aditiva, revisar su efecto sobre una copia restaurada y desplegarla con autorización.
6. Probar el proceso completo en una copia antes de apuntar una configuración compartida a esa base.

Para verificar la tabla de historial desde PowerShell, con PostgreSQL local:

```powershell
$env:PGPASSWORD = $env:SIGEM_DB_PASSWORD
psql -h localhost -p 5433 -U $env:SIGEM_DB_USERNAME -d sigem_local `
  -c "SELECT installed_rank, version, description, type, success FROM flyway_schema_history ORDER BY installed_rank;"
Remove-Item Env:PGPASSWORD
```

Adapte host, puerto y base a la copia aprobada. Evite escribir la contraseña en el historial de comandos. No editar, borrar ni insertar filas de `flyway_schema_history` manualmente.

## Migraciones incluidas y orden

El proyecto contiene diez migraciones versionadas:

| Versión | Archivo | Dependencias y alcance |
|---|---|---|
| `20261109160000` | `V20261109160000__base_schema.sql` | Crea tablas base solo si no existe ninguna tabla SIGEM. Si encuentra tablas, valida la presencia de todas las tablas/columnas base y no las recrea. |
| `20261109163450` | `V20261109163450__baseline_schema_compatibility.sql` | Valida tablas y columnas base cuando una base heredada tiene un baseline posterior a la migración base. No modifica datos ni esquema. |
| `20261109163500` | `V20261109163500__equipos_medicos_modelo.sql` | Requiere tablas base de usuarios, móviles, insumos, equipos, asignaciones y controles. Crea tipos, movimientos de equipos y restricciones; aborta ante asignaciones activas duplicadas. |
| `20261109175000` | `V20261109175000__equipos_medicos_snapshots_integridad.sql` | Requiere el modelo de equipos; agrega snapshots, validaciones y triggers. |
| `20261110210000` | `V20261110210000__solicitudes_internas_prioridad.sql` | Requiere `solicitud_reposicion`; permite móvil nullable y agrega prioridad/clasificación interna. |
| `20261110214000` | `V20261110214000__default_internal_replenishment_true.sql` | Depende de `es_interna`; establece su valor por defecto para nuevas solicitudes. |
| `20261111230000` | `V20261111230000__catalogo_equipos_y_discrepancias_control.sql` | Depende del modelo de equipos y del catálogo/estándar base. Agrega discrepancias, clasifica los tres equipos y añade Respirador al estándar. Puede abortar si hay nombres o relaciones ambiguos. |
| `20261111232000` | `V20261111232000__inventario_movil_control_excepcion_y_notificaciones.sql` | Agrega auditoría de excepción y referencia de notificaciones a solicitudes. |
| `20261111234600` | `V20261111234600__reposiciones_coordinador_historial_notificaciones.sql` | Depende de solicitudes, guardias y notificaciones; agrega guardia, compartición y gestión histórica. |
| `20261112010000` | `V20261112010000__solicitud_reposicion_archivado.sql` | Agrega `archivado` con valor inicial `false`; no elimina ni reescribe solicitudes. |

La versión `20261109160000` se incorporó para permitir una base vacía. Flyway no ejecuta versiones inferiores a un baseline ya registrado, aun con `out-of-order=true`; por eso `20261109163450` valida de forma explícita las bases heredadas con baseline `20261109163400`. En una base nueva se ejecutan ambas: la primera crea el esquema y la segunda lo valida. Flyway advierte que el historial no es reproducible en orden estricto cuando aplica migraciones fuera de orden. Esta opción aumenta el riesgo de aceptar migraciones antiguas omitidas: no agregar ni omitir versiones sin revisión. Baseline automático permanece desactivado.

Las versiones históricas no se reescribieron. La versión `20261112010000` resuelve el error `solicitud_reposicion.archivado does not exist`. La migración de catálogo conserva el ID de `Desfibrilador` al renombrar y aborta ante colisiones o asociaciones contradictorias. Las migraciones de equipos revisan asignaciones duplicadas y agregan restricciones que deben validarse contra una copia de datos real antes de adoptar una base existente. `CREATE TABLE IF NOT EXISTS` por sí solo no valida estructuras; el validador de esquema base comprueba columnas antes de continuar sobre tablas heredadas.

## Resolver fallos

- Leer la excepción raíz del arranque y consultar `flyway_schema_history`; distinguir conexión, checksum, conflicto de datos y objeto incompatible.
- No borrar tablas/columnas, no hacer `repair` automáticamente, no editar un script versionado que pudo haberse aplicado y no marcar migraciones como exitosas manualmente.
- Para corregir una versión ya aplicada, crear una migración nueva con versión superior. Probarla sobre una copia restaurada y obtener revisión antes de desplegar.
- Si Flyway falla, el backend debe permanecer detenido. Corregir la causa en una copia y repetir allí antes de reintentar en cualquier entorno compartido.

## Incorporar una migración

1. Elegir una versión única posterior a la última existente y nombrarla `V<version>__<descripcion>.sql`.
2. Preferir cambios aditivos, proteger los datos existentes y definir el tratamiento de duplicados/inconsistencias. No asumir que `IF NOT EXISTS` valida la forma de una tabla.
3. No incluir datos demo, usuarios iniciales o secretos. Los catálogos indispensables requieren inserciones idempotentes, una clave inequívoca y manejo explícito de conflictos.
4. Probar base vacía, migración ya aplicada, migraciones pendientes y base heredada con datos.
5. Revisar historial, validación Hibernate, índices, FKs, checks y datos en PostgreSQL aislado. No reescribir una versión liberada.

## Respaldo y restauración

Antes de adoptar o actualizar una base compartida, detener escritores, generar un `pg_dump` consistente a una ruta local segura y validar una restauración en otra instancia aislada:

```powershell
$env:PGPASSWORD = $env:SIGEM_DB_PASSWORD
pg_dump -h localhost -p 5433 -U $env:SIGEM_DB_USERNAME -Fc `
  -f .\sigem-backup.dump sigem_local
Remove-Item Env:PGPASSWORD
```

Restaurar solo en una base aislada nueva:

```powershell
createdb -h localhost -p 55439 -U $env:SIGEM_DB_USERNAME sigem_restore_test
pg_restore -h localhost -p 55439 -U $env:SIGEM_DB_USERNAME `
  -d sigem_restore_test .\sigem-backup.dump
```

No sobrescribir el respaldo original. Protegerlo fuera del repositorio y limitar acceso: contiene información sensible. Confirmar host, puerto y base antes de ejecutar.

## Operaciones prohibidas

- No ejecutar `schema.sql` ni `DataInitializer` para actualizar una base existente.
- No utilizar `spring.jpa.hibernate.ddl-auto=update`, Flyway `clean` o `repair` como solución rápida.
- No configurar baseline automático ni declarar una versión sin comprobar el esquema.
- No ejecutar migraciones manualmente, borrar/alterar historial de Flyway ni aplicar cambios a `sigem_dev` u otra base compartida sin autorización y respaldo verificado.
