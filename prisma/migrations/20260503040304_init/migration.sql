-- CreateEnum
CREATE TYPE "EstadoServicio" AS ENUM ('ACTIVO', 'CON_DEUDA', 'CORTADO', 'SUSPENDIDO');

-- CreateEnum
CREATE TYPE "EstadoMedidor" AS ENUM ('ACTIVO', 'DANADO', 'RETIRADO', 'REEMPLAZADO');

-- CreateEnum
CREATE TYPE "EstadoLectura" AS ENUM ('REGISTRADA', 'CONFIRMADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "EstadoFactura" AS ENUM ('PENDIENTE', 'PAGADA', 'VENCIDA', 'ANULADA');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'CONFIRMADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "EstadoCorte" AS ENUM ('PENDIENTE', 'EJECUTADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoReconexion" AS ENUM ('PENDIENTE', 'EJECUTADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "Rol" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "apellido" VARCHAR(150),
    "ci" VARCHAR(30) NOT NULL,
    "email" VARCHAR(150),
    "password" TEXT NOT NULL,
    "telefono" VARCHAR(30),
    "rolId" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Distrito" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Distrito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaTarifa" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoriaTarifa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ciudadano" (
    "usuarioId" INTEGER NOT NULL,
    "codigoCliente" VARCHAR(50) NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "distritoId" INTEGER NOT NULL,
    "direccion" TEXT NOT NULL,
    "referencia" TEXT,
    "estadoServicio" "EstadoServicio" NOT NULL DEFAULT 'ACTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ciudadano_pkey" PRIMARY KEY ("usuarioId")
);

-- CreateTable
CREATE TABLE "Tarifa" (
    "id" SERIAL NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "rangoDesde" DECIMAL(10,2) NOT NULL,
    "rangoHasta" DECIMAL(10,2),
    "precioM3" DECIMAL(10,2) NOT NULL,
    "cargoFijo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tarifa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medidor" (
    "id" SERIAL NOT NULL,
    "codigoMedidor" VARCHAR(80) NOT NULL,
    "numeroSerie" VARCHAR(100) NOT NULL,
    "ciudadanoId" INTEGER NOT NULL,
    "marca" VARCHAR(100),
    "modelo" VARCHAR(100),
    "fechaInstalacion" TIMESTAMP(3),
    "lecturaInicial" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "estado" "EstadoMedidor" NOT NULL DEFAULT 'ACTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medidor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lectura" (
    "id" SERIAL NOT NULL,
    "medidorId" INTEGER NOT NULL,
    "tecnicoId" INTEGER NOT NULL,
    "periodo" VARCHAR(7) NOT NULL,
    "lecturaAnterior" DECIMAL(10,2) NOT NULL,
    "lecturaActual" DECIMAL(10,2) NOT NULL,
    "consumoM3" DECIMAL(10,2) NOT NULL,
    "fechaLectura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "fotoEvidenciaUrl" TEXT,
    "observacion" TEXT,
    "estado" "EstadoLectura" NOT NULL DEFAULT 'REGISTRADA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lectura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Factura" (
    "id" SERIAL NOT NULL,
    "numeroFactura" VARCHAR(80) NOT NULL,
    "ciudadanoId" INTEGER NOT NULL,
    "lecturaId" INTEGER NOT NULL,
    "periodo" VARCHAR(7) NOT NULL,
    "consumoM3" DECIMAL(10,2) NOT NULL,
    "montoAgua" DECIMAL(10,2) NOT NULL,
    "cargoFijo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "multa" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "montoTotal" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoFactura" NOT NULL DEFAULT 'PENDIENTE',
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleFactura" (
    "id" SERIAL NOT NULL,
    "facturaId" INTEGER NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "precioUnitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DetalleFactura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetodoPago" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetodoPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" SERIAL NOT NULL,
    "facturaId" INTEGER NOT NULL,
    "usuarioId" INTEGER,
    "metodoId" INTEGER NOT NULL,
    "codigoPago" VARCHAR(100) NOT NULL,
    "montoPagado" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoPago" NOT NULL DEFAULT 'CONFIRMADO',
    "referenciaTransaccion" VARCHAR(150),
    "qrReferencia" TEXT,
    "observacion" TEXT,
    "fechaPago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Corte" (
    "id" SERIAL NOT NULL,
    "ciudadanoId" INTEGER NOT NULL,
    "tecnicoId" INTEGER,
    "motivo" TEXT NOT NULL,
    "deudaTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "facturasVencidas" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoCorte" NOT NULL DEFAULT 'PENDIENTE',
    "fechaProgramada" TIMESTAMP(3),
    "fechaEjecucion" TIMESTAMP(3),
    "fotoEvidenciaUrl" TEXT,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Corte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reconexion" (
    "id" SERIAL NOT NULL,
    "ciudadanoId" INTEGER NOT NULL,
    "corteId" INTEGER,
    "tecnicoId" INTEGER,
    "costoReconexion" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "estado" "EstadoReconexion" NOT NULL DEFAULT 'PENDIENTE',
    "fechaProgramada" TIMESTAMP(3),
    "fechaEjecucion" TIMESTAMP(3),
    "fotoEvidenciaUrl" TEXT,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reconexion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auditoria" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER,
    "accion" VARCHAR(100) NOT NULL,
    "entidad" VARCHAR(100) NOT NULL,
    "entidadId" INTEGER,
    "descripcion" TEXT,
    "ip" VARCHAR(80),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rol_nombre_key" ON "Rol"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_ci_key" ON "Usuario"("ci");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_rolId_idx" ON "Usuario"("rolId");

-- CreateIndex
CREATE INDEX "Usuario_ci_idx" ON "Usuario"("ci");

-- CreateIndex
CREATE UNIQUE INDEX "Distrito_nombre_key" ON "Distrito"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaTarifa_nombre_key" ON "CategoriaTarifa"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Ciudadano_codigoCliente_key" ON "Ciudadano"("codigoCliente");

-- CreateIndex
CREATE INDEX "Ciudadano_categoriaId_idx" ON "Ciudadano"("categoriaId");

-- CreateIndex
CREATE INDEX "Ciudadano_distritoId_idx" ON "Ciudadano"("distritoId");

-- CreateIndex
CREATE INDEX "Ciudadano_estadoServicio_idx" ON "Ciudadano"("estadoServicio");

-- CreateIndex
CREATE INDEX "Tarifa_categoriaId_idx" ON "Tarifa"("categoriaId");

-- CreateIndex
CREATE INDEX "Tarifa_activo_idx" ON "Tarifa"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "Medidor_codigoMedidor_key" ON "Medidor"("codigoMedidor");

-- CreateIndex
CREATE UNIQUE INDEX "Medidor_numeroSerie_key" ON "Medidor"("numeroSerie");

-- CreateIndex
CREATE INDEX "Medidor_ciudadanoId_idx" ON "Medidor"("ciudadanoId");

-- CreateIndex
CREATE INDEX "Medidor_estado_idx" ON "Medidor"("estado");

-- CreateIndex
CREATE INDEX "Lectura_medidorId_idx" ON "Lectura"("medidorId");

-- CreateIndex
CREATE INDEX "Lectura_tecnicoId_idx" ON "Lectura"("tecnicoId");

-- CreateIndex
CREATE INDEX "Lectura_periodo_idx" ON "Lectura"("periodo");

-- CreateIndex
CREATE INDEX "Lectura_estado_idx" ON "Lectura"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Lectura_medidorId_periodo_key" ON "Lectura"("medidorId", "periodo");

-- CreateIndex
CREATE UNIQUE INDEX "Factura_numeroFactura_key" ON "Factura"("numeroFactura");

-- CreateIndex
CREATE UNIQUE INDEX "Factura_lecturaId_key" ON "Factura"("lecturaId");

-- CreateIndex
CREATE INDEX "Factura_ciudadanoId_idx" ON "Factura"("ciudadanoId");

-- CreateIndex
CREATE INDEX "Factura_periodo_idx" ON "Factura"("periodo");

-- CreateIndex
CREATE INDEX "Factura_estado_idx" ON "Factura"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Factura_ciudadanoId_periodo_key" ON "Factura"("ciudadanoId", "periodo");

-- CreateIndex
CREATE INDEX "DetalleFactura_facturaId_idx" ON "DetalleFactura"("facturaId");

-- CreateIndex
CREATE UNIQUE INDEX "MetodoPago_nombre_key" ON "MetodoPago"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_facturaId_key" ON "Pago"("facturaId");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_codigoPago_key" ON "Pago"("codigoPago");

-- CreateIndex
CREATE INDEX "Pago_usuarioId_idx" ON "Pago"("usuarioId");

-- CreateIndex
CREATE INDEX "Pago_metodoId_idx" ON "Pago"("metodoId");

-- CreateIndex
CREATE INDEX "Pago_fechaPago_idx" ON "Pago"("fechaPago");

-- CreateIndex
CREATE INDEX "Pago_estado_idx" ON "Pago"("estado");

-- CreateIndex
CREATE INDEX "Corte_ciudadanoId_idx" ON "Corte"("ciudadanoId");

-- CreateIndex
CREATE INDEX "Corte_tecnicoId_idx" ON "Corte"("tecnicoId");

-- CreateIndex
CREATE INDEX "Corte_estado_idx" ON "Corte"("estado");

-- CreateIndex
CREATE INDEX "Corte_fechaProgramada_idx" ON "Corte"("fechaProgramada");

-- CreateIndex
CREATE INDEX "Reconexion_ciudadanoId_idx" ON "Reconexion"("ciudadanoId");

-- CreateIndex
CREATE INDEX "Reconexion_corteId_idx" ON "Reconexion"("corteId");

-- CreateIndex
CREATE INDEX "Reconexion_tecnicoId_idx" ON "Reconexion"("tecnicoId");

-- CreateIndex
CREATE INDEX "Reconexion_estado_idx" ON "Reconexion"("estado");

-- CreateIndex
CREATE INDEX "Auditoria_usuarioId_idx" ON "Auditoria"("usuarioId");

-- CreateIndex
CREATE INDEX "Auditoria_entidad_idx" ON "Auditoria"("entidad");

-- CreateIndex
CREATE INDEX "Auditoria_createdAt_idx" ON "Auditoria"("createdAt");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ciudadano" ADD CONSTRAINT "Ciudadano_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ciudadano" ADD CONSTRAINT "Ciudadano_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaTarifa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ciudadano" ADD CONSTRAINT "Ciudadano_distritoId_fkey" FOREIGN KEY ("distritoId") REFERENCES "Distrito"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarifa" ADD CONSTRAINT "Tarifa_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaTarifa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medidor" ADD CONSTRAINT "Medidor_ciudadanoId_fkey" FOREIGN KEY ("ciudadanoId") REFERENCES "Ciudadano"("usuarioId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lectura" ADD CONSTRAINT "Lectura_medidorId_fkey" FOREIGN KEY ("medidorId") REFERENCES "Medidor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lectura" ADD CONSTRAINT "Lectura_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_ciudadanoId_fkey" FOREIGN KEY ("ciudadanoId") REFERENCES "Ciudadano"("usuarioId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_lecturaId_fkey" FOREIGN KEY ("lecturaId") REFERENCES "Lectura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleFactura" ADD CONSTRAINT "DetalleFactura_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "Factura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_metodoId_fkey" FOREIGN KEY ("metodoId") REFERENCES "MetodoPago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Corte" ADD CONSTRAINT "Corte_ciudadanoId_fkey" FOREIGN KEY ("ciudadanoId") REFERENCES "Ciudadano"("usuarioId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Corte" ADD CONSTRAINT "Corte_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reconexion" ADD CONSTRAINT "Reconexion_ciudadanoId_fkey" FOREIGN KEY ("ciudadanoId") REFERENCES "Ciudadano"("usuarioId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reconexion" ADD CONSTRAINT "Reconexion_corteId_fkey" FOREIGN KEY ("corteId") REFERENCES "Corte"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reconexion" ADD CONSTRAINT "Reconexion_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
