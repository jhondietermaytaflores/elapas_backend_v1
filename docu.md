

# Documentación general del backend

## 1. Objetivo del backend

El backend desarrollado tiene como objetivo gestionar el ciclo completo del servicio de agua potable:

```txt
Ciudadano → Medidor → Lectura → Factura → Pago → Corte → Reconexión
```

Además, incluye módulos administrativos para:

```txt
Usuarios
Roles
Distritos
Categorías tarifarias
Métodos de pago
Tarifas
Dashboard
Auditoría
Consulta pública
Portal ciudadano
```

El sistema permite que ELAPAS administre ciudadanos, registre lecturas de medidor, genere facturas, registre pagos, controle cortes de servicio y gestione reconexiones.

---

# 2. Flujo funcional entre módulos

## 2.1. Usuarios y Roles

El sistema inicia con la gestión de usuarios y roles.

Los roles principales son:

```txt
ADMIN
SUPERVISOR
CAJERO
TECNICO
CIUDADANO
```

Cada usuario tiene un rol asociado. Esto permite controlar qué acciones puede realizar dentro del sistema.

Ejemplo:

```txt
ADMIN       → administra todo el sistema
SUPERVISOR  → revisa, confirma y controla operaciones
CAJERO      → registra pagos y consulta facturas
TECNICO     → registra lecturas, ejecuta cortes y reconexiones
CIUDADANO   → consulta sus datos desde el portal ciudadano
```

La autenticación se realiza mediante:

```txt
CI + Contraseña
```

Luego el sistema genera un token JWT para acceder a rutas protegidas.

---

## 2.2. Ciudadanos y Catastro

Un usuario con rol `CIUDADANO` puede tener datos catastrales asociados.

La tabla `Usuario` guarda los datos de cuenta:

```txt
nombre
apellido
ci
email
password
telefono
rol
activo
```

La tabla `Ciudadano` guarda los datos propios del servicio:

```txt
codigoCliente
categoriaTarifa
distrito
direccion
referencia
estadoServicio
```

Esto evita mezclar datos de autenticación con datos del catastro.

Flujo:

```txt
Crear usuario con rol CIUDADANO
        ↓
Registrar datos catastrales del ciudadano
        ↓
Asignar uno o más medidores
```

Un ciudadano puede tener varios medidores:

```txt
Ciudadano 1 ─── Medidor 1
            ├── Medidor 2
            └── Medidor 3
```

---

## 2.3. Medidores

Los medidores se asocian directamente al ciudadano.

Cada medidor tiene:

```txt
codigoMedidor
numeroSerie
marca
modelo
fechaInstalacion
lecturaInicial
estado
```

Estados posibles:

```txt
ACTIVO
DANADO
RETIRADO
REEMPLAZADO
```

El módulo permite crear, listar, buscar, reasignar, cambiar estado y eliminar medidores cuando no tienen lecturas relacionadas.

---

## 2.4. Lecturas

Las lecturas son registradas por usuarios con rol:

```txt
TECNICO
ADMIN
SUPERVISOR
```

Cada lectura pertenece a un medidor y a un periodo mensual:

```txt
2026-05
2026-06
2026-07
```

El sistema valida:

```txt
No duplicar lectura por medidor y periodo.
La lectura actual no puede ser menor a la lectura anterior.
El consumo se calcula automáticamente.
```

Fórmula aplicada:

```txt
consumoM3 = lecturaActual - lecturaAnterior
```

Estados de lectura:

```txt
REGISTRADA
CONFIRMADA
ANULADA
```

Flujo:

```txt
Técnico registra lectura
        ↓
Supervisor/Admin confirma lectura
        ↓
Lectura queda lista para facturación
```

---

## 2.5. Tarifas

El módulo de tarifas permite definir precios según categoría tarifaria y rango de consumo.

Ejemplo:

```txt
DOMESTICO
0 a 10 m3      → 2.50 Bs/m3
10.01 a 20 m3 → 3.20 Bs/m3
20.01 o más   → 4.00 Bs/m3
```

Cada tarifa tiene:

```txt
categoriaId
rangoDesde
rangoHasta
precioM3
cargoFijo
activo
```

Esto permite que el cálculo de facturas sea dinámico y configurable.

---

## 2.6. Facturación

Las facturas se generan desde lecturas confirmadas.

Flujo:

```txt
Lectura CONFIRMADA
        ↓
Generar factura
        ↓
Buscar tarifa aplicable
        ↓
Calcular monto
        ↓
Registrar detalle de factura
        ↓
Ciudadano pasa a estado CON_DEUDA
```

La factura contiene:

```txt
numeroFactura
periodo
consumoM3
montoAgua
cargoFijo
multa
montoTotal
estado
fechaEmision
fechaVencimiento
```

Estados de factura:

```txt
PENDIENTE
PAGADA
VENCIDA
ANULADA
```

---

## 2.7. Pagos y Recaudaciones

Los pagos se registran sobre facturas pendientes o vencidas.

Roles permitidos:

```txt
ADMIN
SUPERVISOR
CAJERO
```

Flujo:

```txt
Factura PENDIENTE/VENCIDA
        ↓
Registrar pago
        ↓
Factura pasa a PAGADA
        ↓
Si el ciudadano no tiene más deuda, pasa a ACTIVO
```

Cada pago registra:

```txt
factura
usuario que registró el pago
método de pago
código de pago
monto pagado
estado
referencia de transacción
QR
fecha de pago
```

Estados de pago:

```txt
PENDIENTE
CONFIRMADO
ANULADO
```

---

## 2.8. Cortes de Servicio

El módulo de cortes se utiliza cuando un ciudadano tiene deuda pendiente o vencida.

Flujo:

```txt
Ciudadano con deuda
        ↓
Generar corte por deuda
        ↓
Corte queda PENDIENTE
        ↓
Técnico ejecuta corte
        ↓
Ciudadano pasa a CORTADO
```

Cada corte almacena:

```txt
ciudadano
técnico responsable
motivo
deudaTotal
facturasVencidas
estado
fechaProgramada
fechaEjecucion
fotoEvidencia
latitud
longitud
observacion
```

Estados de corte:

```txt
PENDIENTE
EJECUTADO
CANCELADO
```

---

## 2.9. Reconexiones

La reconexión ocurre después de que un ciudadano cortado regulariza su deuda.

Flujo:

```txt
Corte EJECUTADO
        ↓
Ciudadano paga deuda
        ↓
Generar reconexión
        ↓
Reconexión queda PENDIENTE
        ↓
Técnico ejecuta reconexión
        ↓
Ciudadano vuelve a ACTIVO
```

Estados de reconexión:

```txt
PENDIENTE
EJECUTADA
CANCELADA
```

---

## 2.10. Dashboard Administrativo

El dashboard expone endpoints para visualizar indicadores del sistema.

Incluye:

```txt
Resumen general
Recaudación del día
Recaudación del mes
Deuda por distrito
Cortes por distrito
Clientes por estado
Consumo por periodo
Facturas por estado
Pagos por método
Actividad operativa reciente
```

Este módulo será útil para gráficos y KPI del frontend administrativo.

---

## 2.11. Portal Ciudadano

El portal ciudadano permite que un usuario con rol `CIUDADANO` consulte solo sus propios datos.

Endpoints principales:

```txt
Mis datos
Mis medidores
Mis lecturas
Mis facturas
Mi deuda
Mis pagos
Mis cortes
Mis reconexiones
Resumen personal
```

La seguridad está basada en el token JWT. El ciudadano no envía `usuarioId`; el backend obtiene su identidad desde el token.

Esto evita que un ciudadano consulte información de otro usuario.

---

## 2.12. Consulta Pública

También se creó un módulo público para consulta de deuda sin iniciar sesión.

Permite consultar por:

```txt
CI
Código de cliente
```

Endpoints:

```txt
/api/consulta-publica/cliente
/api/consulta-publica/deuda
/api/consulta-publica/facturas
/api/consulta-publica/estado-servicio
```

Este módulo no expone datos sensibles como contraseñas, tokens o información administrativa.

---

## 2.13. Auditoría

El sistema incluye una tabla y módulo de auditoría.

Permite registrar acciones importantes como:

```txt
Crear usuario
Registrar lectura
Generar factura
Registrar pago
Ejecutar corte
Ejecutar reconexión
Anular registros
Actualizar estados
```

Cada auditoría registra:

```txt
usuario que hizo la acción
acción
entidad afectada
ID de la entidad
descripción
IP
fecha
```

Esto mejora la trazabilidad y seguridad del sistema.

---

# 3. Buenas prácticas aplicadas

## 3.1. Arquitectura modular

El backend se separó en módulos independientes:

```txt
auth
usuarios
roles
ciudadanos
medidores
lecturas
tarifas
facturas
pagos
cortes
reconexiones
dashboard
portal-ciudadano
consulta-publica
auditorias
```

Esto permite mantener el código ordenado, escalable y fácil de probar.

---

## 3.2. Separación de responsabilidades

Cada módulo tiene:

```txt
Controller → recibe la petición HTTP
Service    → contiene la lógica de negocio
DTO        → valida los datos de entrada
Module     → agrupa dependencias
```

Ejemplo:

```txt
lecturas.controller.ts
lecturas.service.ts
dto/create-lectura.dto.ts
lecturas.module.ts
```

Esta separación evita que la lógica quede mezclada en los controladores.

---

## 3.3. Uso de DTOs y validación

Se usaron DTOs con:

```txt
class-validator
class-transformer
```

Esto permite validar datos como:

```txt
campos obligatorios
tipos de datos
números
fechas
enums
strings
emails
```

Ejemplo:

```ts
@IsString()
@IsNotEmpty()
ci!: string;
```

---

## 3.4. Autenticación con JWT

El login genera un token JWT.

El token contiene datos mínimos:

```txt
sub
ci
rol
```

Luego el backend usa ese token para identificar al usuario autenticado.

---

## 3.5. Autorización por roles

Se implementó:

```txt
@Roles()
RolesGuard
JwtAuthGuard
```

Ejemplo:

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERVISOR')
@Get()
findAll() {}
```

Esto permite restringir endpoints según el rol del usuario.

---

## 3.6. Decorador `@Public()`

Se creó un decorador para rutas públicas:

```ts
@Public()
```

Esto permite tener endpoints abiertos como consulta pública de deuda sin afectar la seguridad de los demás módulos.

---

## 3.7. Prisma ORM

Se usó Prisma como ORM para:

```txt
modelar tablas
generar migraciones
consultar base de datos
hacer relaciones
ejecutar transacciones
```

Prisma ayuda a tener consultas más seguras y tipadas.

---

## 3.8. Transacciones

Se usaron transacciones en operaciones críticas.

Ejemplos:

```txt
Crear usuario + ciudadano
Generar factura + detalle
Registrar pago + actualizar factura
Ejecutar corte + actualizar estado del ciudadano
Ejecutar reconexión + actualizar estado del ciudadano
```

Esto evita inconsistencias en la base de datos.

---

## 3.9. Reglas de negocio en backend

Las reglas importantes no dependen del frontend.

Ejemplos:

```txt
No pagar dos veces una factura.
No generar factura desde lectura no confirmada.
No registrar lectura duplicada por periodo.
No ejecutar corte sin deuda.
No reconectar si todavía hay deuda.
```

El frontend puede ayudar visualmente, pero la validación fuerte está en el backend.

---

## 3.10. Swagger para documentación

Se integró Swagger para probar y documentar la API.

Ruta local:

```txt
http://localhost:3000/api/docs
```

Ruta en producción:

```txt
https://TU-API.onrender.com/api/docs
```

---

## 3.11. Deploy automático

Se desplegó el backend en Render, conectado al repositorio GitHub.

Flujo:

```txt
git push origin main
        ↓
Render detecta cambios
        ↓
Instala dependencias
        ↓
Genera Prisma Client
        ↓
Aplica migraciones
        ↓
Compila NestJS
        ↓
Levanta la API
```

---

# Código listo para `README.md`

Puedes copiar esto directamente en tu archivo `README.md`:

````md
# Sistema de Gestión de Recaudaciones y Cortes - ELAPAS Sucre

Backend API REST desarrollado con **NestJS**, **TypeScript**, **Prisma ORM** y **PostgreSQL/Neon** para la gestión de recaudaciones, lecturas, facturación, pagos, cortes y reconexiones del servicio de agua potable de ELAPAS Sucre.

---

## 1. Descripción del proyecto

Este backend forma parte del sistema **"Sucre-Agua Digital"**, orientado a digitalizar el ciclo operativo y administrativo del servicio de agua potable.

El sistema permite gestionar:

- Usuarios y roles.
- Ciudadanos y catastro.
- Medidores.
- Lecturas de consumo.
- Tarifas.
- Facturación.
- Pagos y recaudaciones.
- Cortes de servicio.
- Reconexiones.
- Dashboard administrativo.
- Portal ciudadano.
- Consulta pública de deuda.
- Auditoría del sistema.

---

## 2. Tecnologías utilizadas

- **NestJS** - Framework backend para Node.js.
- **TypeScript** - Lenguaje principal del backend.
- **Prisma ORM** - ORM para modelado y acceso a base de datos.
- **PostgreSQL** - Base de datos relacional.
- **Neon** - Base de datos PostgreSQL en la nube.
- **JWT** - Autenticación mediante tokens.
- **Passport JWT** - Estrategia de autenticación.
- **bcrypt** - Hash de contraseñas.
- **Swagger/OpenAPI** - Documentación y prueba de endpoints.
- **Render** - Despliegue del backend.
- **pnpm** - Gestor de paquetes.

---

## 3. Arquitectura del sistema

El backend sigue una arquitectura modular basada en NestJS.

Cada módulo se organiza con:

```txt
controller  → recibe peticiones HTTP
service     → contiene lógica de negocio
dto         → valida datos de entrada
module      → agrupa dependencias
````

Módulos principales:

```txt
src/
├── auth/
├── roles/
├── usuarios/
├── ciudadanos/
├── medidores/
├── lecturas/
├── tarifas/
├── facturas/
├── pagos/
├── cortes/
├── reconexiones/
├── dashboard/
├── portal-ciudadano/
├── consulta-publica/
├── auditorias/
├── prisma/
└── common/
```

---

## 4. Flujo principal del sistema

El ciclo principal del sistema es:

```txt
Ciudadano
   ↓
Medidor
   ↓
Lectura
   ↓
Factura
   ↓
Pago
   ↓
Corte
   ↓
Reconexión
```

### 4.1. Ciudadano y catastro

Un usuario con rol `CIUDADANO` puede tener datos catastrales asociados:

* Código de cliente.
* Categoría tarifaria.
* Distrito.
* Dirección.
* Estado del servicio.

Un ciudadano puede tener uno o más medidores.

### 4.2. Medidores

Cada medidor pertenece a un ciudadano y puede estar en estado:

```txt
ACTIVO
DANADO
RETIRADO
REEMPLAZADO
```

### 4.3. Lecturas

Las lecturas son registradas por técnicos, administradores o supervisores.

Reglas principales:

* No se puede duplicar lectura por medidor y periodo.
* La lectura actual no puede ser menor a la lectura anterior.
* El consumo se calcula automáticamente.

```txt
consumoM3 = lecturaActual - lecturaAnterior
```

Estados de lectura:

```txt
REGISTRADA
CONFIRMADA
ANULADA
```

### 4.4. Facturación

Una factura se genera desde una lectura confirmada.

El sistema:

1. Valida que la lectura esté confirmada.
2. Busca la tarifa aplicable.
3. Calcula monto de agua.
4. Agrega cargo fijo.
5. Crea la factura y su detalle.
6. Cambia el estado del ciudadano a `CON_DEUDA`.

Estados de factura:

```txt
PENDIENTE
PAGADA
VENCIDA
ANULADA
```

### 4.5. Pagos y recaudaciones

Al registrar un pago confirmado:

1. Se valida que la factura no esté pagada ni anulada.
2. Se registra el pago.
3. La factura pasa a estado `PAGADA`.
4. Si el ciudadano ya no tiene deuda, vuelve a estado `ACTIVO`.

Estados de pago:

```txt
PENDIENTE
CONFIRMADO
ANULADO
```

### 4.6. Cortes de servicio

Un corte se puede generar cuando un ciudadano tiene deuda pendiente o vencida.

Flujo:

```txt
Ciudadano con deuda
   ↓
Corte pendiente
   ↓
Técnico ejecuta corte
   ↓
Ciudadano pasa a CORTADO
```

Estados de corte:

```txt
PENDIENTE
EJECUTADO
CANCELADO
```

### 4.7. Reconexiones

Una reconexión se genera cuando:

* El ciudadano está cortado.
* La deuda fue pagada.
* Existe un corte ejecutado.

Flujo:

```txt
Corte ejecutado
   ↓
Deuda pagada
   ↓
Reconexión pendiente
   ↓
Técnico ejecuta reconexión
   ↓
Ciudadano vuelve a ACTIVO
```

Estados de reconexión:

```txt
PENDIENTE
EJECUTADA
CANCELADA
```

---

## 5. Buenas prácticas aplicadas

### 5.1. Arquitectura modular

El sistema fue separado en módulos independientes para mantener el código organizado, escalable y mantenible.

### 5.2. Separación de responsabilidades

Los controladores solo reciben solicitudes HTTP y delegan la lógica a los servicios.

Los servicios contienen las reglas de negocio.

Los DTOs validan la entrada de datos.

### 5.3. Validación de datos

Se utiliza `class-validator` y `class-transformer` para validar los datos recibidos.

Ejemplos:

```ts
@IsString()
@IsNotEmpty()
ci!: string;
```

```ts
@IsEnum(EstadoFactura)
estado!: EstadoFactura;
```

### 5.4. Autenticación con JWT

El sistema usa JWT para proteger rutas privadas.

El login se realiza con:

```txt
CI + contraseña
```

y devuelve un token JWT.

### 5.5. Autorización por roles

Se implementó control de acceso por roles mediante:

```txt
@Roles()
RolesGuard
JwtAuthGuard
```

Ejemplo:

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERVISOR')
@Get()
findAll() {}
```

### 5.6. Rutas públicas controladas

Se implementó el decorador:

```ts
@Public()
```

para permitir endpoints públicos como la consulta de deuda sin requerir token.

### 5.7. Uso de Prisma ORM

Prisma se utiliza para:

* Modelar la base de datos.
* Crear migraciones.
* Generar cliente tipado.
* Consultar relaciones.
* Ejecutar transacciones.

### 5.8. Transacciones

Se aplican transacciones en operaciones críticas como:

* Crear usuario y ciudadano.
* Generar factura y detalle.
* Registrar pago y actualizar factura.
* Ejecutar corte y actualizar estado del ciudadano.
* Ejecutar reconexión y actualizar estado del ciudadano.

### 5.9. Reglas de negocio en backend

Las reglas importantes se validan en backend, no solo en frontend.

Ejemplos:

* No pagar una factura anulada.
* No pagar dos veces una factura.
* No generar factura desde lectura no confirmada.
* No registrar lectura duplicada por periodo.
* No generar corte sin deuda.
* No reconectar si todavía existe deuda.

### 5.10. Documentación con Swagger

La API está documentada con Swagger/OpenAPI.

Ruta local:

```txt
http://localhost:3000/api/docs
```

Ruta en producción:

```txt
https://TU_API_RENDER.onrender.com/api/docs
```

---

## 6. Principales endpoints

### Auth

```txt
POST /api/auth/login
GET  /api/auth/profile
```

### Roles

```txt
GET    /api/roles
GET    /api/roles/:id
POST   /api/roles
PATCH  /api/roles/:id
DELETE /api/roles/:id
```

### Usuarios

```txt
GET    /api/usuarios
GET    /api/usuarios/:id
POST   /api/usuarios
PATCH  /api/usuarios/:id
PATCH  /api/usuarios/:id/estado
DELETE /api/usuarios/:id
```

### Ciudadanos

```txt
GET    /api/ciudadanos
GET    /api/ciudadanos/resumen
GET    /api/ciudadanos/disponibles-para-catastro
GET    /api/ciudadanos/codigo/:codigoCliente
GET    /api/ciudadanos/:usuarioId
POST   /api/ciudadanos/desde-usuario
POST   /api/ciudadanos/con-usuario
PATCH  /api/ciudadanos/:usuarioId
PATCH  /api/ciudadanos/:usuarioId/estado-servicio
DELETE /api/ciudadanos/:usuarioId
GET    /api/ciudadanos/:usuarioId/medidores
POST   /api/ciudadanos/:usuarioId/medidores
```

### Medidores

```txt
GET    /api/medidores
GET    /api/medidores/resumen
GET    /api/medidores/:id
GET    /api/medidores/codigo/:codigoMedidor
GET    /api/medidores/serie/:numeroSerie
GET    /api/medidores/ciudadano/:usuarioId
POST   /api/medidores
PATCH  /api/medidores/:id
PATCH  /api/medidores/:id/estado
PATCH  /api/medidores/:id/reasignar/:usuarioId
DELETE /api/medidores/:id
```

### Lecturas

```txt
GET    /api/lecturas
GET    /api/lecturas/resumen
GET    /api/lecturas/:id
GET    /api/lecturas/medidor/:medidorId
GET    /api/lecturas/ciudadano/:usuarioId
GET    /api/lecturas/periodo/:periodo
POST   /api/lecturas
PATCH  /api/lecturas/:id
PATCH  /api/lecturas/:id/confirmar
PATCH  /api/lecturas/:id/anular
DELETE /api/lecturas/:id
```

### Tarifas

```txt
GET    /api/tarifas
GET    /api/tarifas/activas
GET    /api/tarifas/categoria/:categoriaId
GET    /api/tarifas/:id
POST   /api/tarifas
PATCH  /api/tarifas/:id
PATCH  /api/tarifas/:id/estado
DELETE /api/tarifas/:id
```

### Facturas

```txt
GET    /api/facturas
GET    /api/facturas/resumen
GET    /api/facturas/:id
GET    /api/facturas/numero/:numeroFactura
GET    /api/facturas/ciudadano/:usuarioId
GET    /api/facturas/ciudadano/:usuarioId/pendientes
GET    /api/facturas/ciudadano/:usuarioId/deuda
GET    /api/facturas/periodo/:periodo
POST   /api/facturas/generar-por-lectura/:lecturaId
PATCH  /api/facturas/:id/anular
PATCH  /api/facturas/:id/marcar-vencida
```

### Pagos

```txt
GET    /api/pagos
GET    /api/pagos/resumen
GET    /api/pagos/:id
GET    /api/pagos/codigo/:codigoPago
GET    /api/pagos/factura/:facturaId
GET    /api/pagos/ciudadano/:usuarioId
GET    /api/pagos/recaudacion/dia
GET    /api/pagos/recaudacion/rango
POST   /api/pagos
PATCH  /api/pagos/:id/anular
```

### Cortes

```txt
GET    /api/cortes
GET    /api/cortes/resumen
GET    /api/cortes/pendientes
GET    /api/cortes/:id
GET    /api/cortes/ciudadano/:usuarioId
POST   /api/cortes
POST   /api/cortes/generar-por-deuda/:usuarioId
PATCH  /api/cortes/:id
PATCH  /api/cortes/:id/ejecutar
PATCH  /api/cortes/:id/cancelar
DELETE /api/cortes/:id
```

### Reconexiones

```txt
GET    /api/reconexiones
GET    /api/reconexiones/resumen
GET    /api/reconexiones/pendientes
GET    /api/reconexiones/:id
GET    /api/reconexiones/ciudadano/:usuarioId
POST   /api/reconexiones
POST   /api/reconexiones/generar-por-corte/:corteId
PATCH  /api/reconexiones/:id
PATCH  /api/reconexiones/:id/ejecutar
PATCH  /api/reconexiones/:id/cancelar
DELETE /api/reconexiones/:id
```

### Dashboard

```txt
GET /api/dashboard/resumen
GET /api/dashboard/recaudacion-dia
GET /api/dashboard/recaudacion-mes
GET /api/dashboard/deuda-por-distrito
GET /api/dashboard/cortes-por-distrito
GET /api/dashboard/clientes-por-estado
GET /api/dashboard/consumo-por-periodo
GET /api/dashboard/facturas-por-estado
GET /api/dashboard/pagos-por-metodo
GET /api/dashboard/actividad-operativa
```

### Portal Ciudadano

```txt
GET /api/portal-ciudadano/mis-datos
GET /api/portal-ciudadano/mis-medidores
GET /api/portal-ciudadano/mis-lecturas
GET /api/portal-ciudadano/mis-facturas
GET /api/portal-ciudadano/mis-facturas/pendientes
GET /api/portal-ciudadano/mi-deuda
GET /api/portal-ciudadano/mis-pagos
GET /api/portal-ciudadano/mis-cortes
GET /api/portal-ciudadano/mis-reconexiones
GET /api/portal-ciudadano/resumen
```

### Consulta Pública

```txt
GET /api/consulta-publica/cliente
GET /api/consulta-publica/deuda
GET /api/consulta-publica/facturas
GET /api/consulta-publica/estado-servicio
```

### Auditorías

```txt
GET /api/auditorias
GET /api/auditorias/resumen
GET /api/auditorias/:id
GET /api/auditorias/usuario/:usuarioId
GET /api/auditorias/entidad/:entidad
```

---

## 7. Variables de entorno

Crear archivo `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require&channel_binding=require"
JWT_SECRET="clave_secreta_segura"
JWT_EXPIRES_IN="8h"
PORT=3000
NODE_ENV="development"
```

---

## 8. Instalación local

```bash
pnpm install
```

Generar cliente Prisma:

```bash
npx prisma generate
```

Ejecutar migraciones:

```bash
npx prisma migrate dev
```

Ejecutar seed:

```bash
npx prisma db seed
```

Levantar servidor:

```bash
pnpm run start:dev
```

---

## 9. Swagger

Documentación local:

```txt
http://localhost:3000/api/docs
```

Documentación en producción:

```txt
https://TU_API_RENDER.onrender.com/api/docs
```

---

## 10. Credenciales de prueba

### Administrador

```txt
CI: 1234567
Password: admin123
Rol: ADMIN
```

### Técnico

```txt
CI: 3344556
Password: tec123
Rol: TECNICO
```

### Cajero

```txt
CI: 4455667
Password: cajero123
Rol: CAJERO
```

### Ciudadano

```txt
CI: 7458392
Password: user123
Rol: CIUDADANO
```

---

## 11. Despliegue

El backend fue desplegado en Render y conectado al repositorio GitHub.

Cada push a la rama `main` puede activar un despliegue automático.

Flujo:

```txt
git push origin main
        ↓
Render detecta cambios
        ↓
Instala dependencias
        ↓
Ejecuta prisma generate
        ↓
Ejecuta prisma migrate deploy
        ↓
Compila NestJS
        ↓
Levanta API en producción
```

---

## 12. Comandos útiles

Generar Prisma Client:

```bash
npx prisma generate
```

Aplicar migraciones en desarrollo:

```bash
npx prisma migrate dev
```

Aplicar migraciones en producción:

```bash
npx prisma migrate deploy
```

Ejecutar seed:

```bash
npx prisma db seed
```

Levantar en desarrollo:

```bash
pnpm run start:dev
```

Compilar:

```bash
pnpm run build
```

Levantar en producción:

```bash
pnpm run start:prod
```

---

## 13. Estado actual del backend

Actualmente el backend cuenta con:

* Autenticación JWT.
* Control de roles.
* CRUD de usuarios.
* CRUD de roles.
* CRUD de distritos.
* CRUD de categorías tarifarias.
* CRUD de métodos de pago.
* Gestión de ciudadanos.
* Gestión de medidores.
* Registro de lecturas.
* Gestión de tarifas.
* Generación de facturas.
* Registro de pagos.
* Gestión de cortes.
* Gestión de reconexiones.
* Dashboard administrativo.
* Portal ciudadano.
* Consulta pública de deuda.
* Auditoría del sistema.

---

## 14. Próximas mejoras sugeridas

* Paginación en listados grandes.
* Respuestas estandarizadas.
* Filtros avanzados.
* Auditoría en todos los módulos críticos.
* Subida real de fotografías a almacenamiento externo.
* Integración con pasarela QR real.
* Generación de factura electrónica en PDF.
* Notificaciones internas.
* Exportación de reportes.

