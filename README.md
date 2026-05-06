<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ pnpm install
```

## Compilar y Correr este proyec

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```
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
```
## Módulos principales:

```bash
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
