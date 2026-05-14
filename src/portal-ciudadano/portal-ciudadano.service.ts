import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    EstadoFactura,
    EstadoPago,
} from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PortalCiudadanoService {
    constructor(private readonly prisma: PrismaService) { }

    private async validarCiudadano(usuarioId: number) {
        const ciudadano = await this.prisma.ciudadano.findUnique({
            where: {
                usuarioId,
            },
            include: {
                usuario: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        ci: true,
                        email: true,
                        telefono: true,
                        activo: true,
                        rol: {
                            select: {
                                id: true,
                                nombre: true,
                            },
                        },
                    },
                },
                categoria: true,
                distrito: true,
            },
        });

        if (!ciudadano) {
            throw new NotFoundException(
                'El usuario autenticado no tiene datos de ciudadano registrados',
            );
        }

        if (!ciudadano.usuario.activo) {
            throw new BadRequestException('El usuario ciudadano está inactivo');
        }

        return ciudadano;
    }

    async misDatos(usuarioId: number) {
        return this.validarCiudadano(usuarioId);
    }

    async misMedidores(usuarioId: number) {
        await this.validarCiudadano(usuarioId);

        return this.prisma.medidor.findMany({
            where: {
                ciudadanoId: usuarioId,
            },
            include: {
                lecturas: {
                    orderBy: {
                        fechaLectura: 'desc',
                    },
                    take: 5,
                },
                _count: {
                    select: {
                        lecturas: true,
                    },
                },
            },
            orderBy: {
                id: 'asc',
            },
        });
    }

    async misLecturas(usuarioId: number) {
        await this.validarCiudadano(usuarioId);

        return this.prisma.lectura.findMany({
            where: {
                medidor: {
                    ciudadanoId: usuarioId,
                },
            },
            include: {
                medidor: true,
                tecnico: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        ci: true,
                    },
                },
                factura: {
                    select: {
                        id: true,
                        numeroFactura: true,
                        estado: true,
                        montoTotal: true,
                    },
                },
            },
            orderBy: {
                fechaLectura: 'desc',
            },
        });
    }

    async misFacturas(usuarioId: number) {
        await this.validarCiudadano(usuarioId);

        return this.prisma.factura.findMany({
            where: {
                ciudadanoId: usuarioId,
            },
            include: {
                detalles: true,
                lectura: {
                    include: {
                        medidor: true,
                    },
                },
                pago: {
                    include: {
                        metodo: true,
                    },
                },
            },
            orderBy: {
                fechaEmision: 'desc',
            },
        });
    }

    async misFacturasPendientes(usuarioId: number) {
        await this.validarCiudadano(usuarioId);

        return this.prisma.factura.findMany({
            where: {
                ciudadanoId: usuarioId,
                estado: {
                    in: [EstadoFactura.PENDIENTE, EstadoFactura.VENCIDA],
                },
            },
            include: {
                detalles: true,
                lectura: {
                    include: {
                        medidor: true,
                    },
                },
            },
            orderBy: {
                fechaVencimiento: 'asc',
            },
        });
    }

    async miDeuda(usuarioId: number) {
        const ciudadano = await this.validarCiudadano(usuarioId);

        const facturasPendientes = await this.prisma.factura.findMany({
            where: {
                ciudadanoId: usuarioId,
                estado: {
                    in: [EstadoFactura.PENDIENTE, EstadoFactura.VENCIDA],
                },
            },
            include: {
                detalles: true,
                lectura: {
                    include: {
                        medidor: true,
                    },
                },
            },
            orderBy: {
                fechaVencimiento: 'asc',
            },
        });

        const totalDeuda = facturasPendientes.reduce((acc, factura) => {
            return acc + Number(factura.montoTotal);
        }, 0);

        return {
            ciudadano,
            totalDeuda,
            cantidadFacturas: facturasPendientes.length,
            facturas: facturasPendientes,
        };
    }

    async misPagos(usuarioId: number) {
        await this.validarCiudadano(usuarioId);

        return this.prisma.pago.findMany({
            where: {
                factura: {
                    ciudadanoId: usuarioId,
                },
            },
            include: {
                metodo: true,
                factura: {
                    select: {
                        id: true,
                        numeroFactura: true,
                        periodo: true,
                        montoTotal: true,
                        estado: true,
                        fechaEmision: true,
                        fechaVencimiento: true,
                    },
                },
            },
            orderBy: {
                fechaPago: 'desc',
            },
        });
    }

    async misCortes(usuarioId: number) {
        await this.validarCiudadano(usuarioId);

        return this.prisma.corte.findMany({
            where: {
                ciudadanoId: usuarioId,
            },
            include: {
                tecnico: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        ci: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async misReconexiones(usuarioId: number) {
        await this.validarCiudadano(usuarioId);

        return this.prisma.reconexion.findMany({
            where: {
                ciudadanoId: usuarioId,
            },
            include: {
                corte: true,
                tecnico: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        ci: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async resumen(usuarioId: number) {
        const ciudadano = await this.validarCiudadano(usuarioId);

        const [
            totalMedidores,
            totalLecturas,
            totalFacturas,
            facturasPendientes,
            facturasPagadas,
            totalPagos,
            montoPagado,
            deuda,
            cortes,
            reconexiones,
        ] = await Promise.all([
            this.prisma.medidor.count({
                where: {
                    ciudadanoId: usuarioId,
                },
            }),

            this.prisma.lectura.count({
                where: {
                    medidor: {
                        ciudadanoId: usuarioId,
                    },
                },
            }),

            this.prisma.factura.count({
                where: {
                    ciudadanoId: usuarioId,
                },
            }),

            this.prisma.factura.count({
                where: {
                    ciudadanoId: usuarioId,
                    estado: {
                        in: [EstadoFactura.PENDIENTE, EstadoFactura.VENCIDA],
                    },
                },
            }),

            this.prisma.factura.count({
                where: {
                    ciudadanoId: usuarioId,
                    estado: EstadoFactura.PAGADA,
                },
            }),

            this.prisma.pago.count({
                where: {
                    factura: {
                        ciudadanoId: usuarioId,
                    },
                },
            }),

            this.prisma.pago.aggregate({
                where: {
                    estado: EstadoPago.CONFIRMADO,
                    factura: {
                        ciudadanoId: usuarioId,
                    },
                },
                _sum: {
                    montoPagado: true,
                },
            }),

            this.prisma.factura.aggregate({
                where: {
                    ciudadanoId: usuarioId,
                    estado: {
                        in: [EstadoFactura.PENDIENTE, EstadoFactura.VENCIDA],
                    },
                },
                _sum: {
                    montoTotal: true,
                },
            }),

            this.prisma.corte.count({
                where: {
                    ciudadanoId: usuarioId,
                },
            }),

            this.prisma.reconexion.count({
                where: {
                    ciudadanoId: usuarioId,
                },
            }),
        ]);

        return {
            ciudadano,
            medidores: {
                total: totalMedidores,
            },
            lecturas: {
                total: totalLecturas,
            },
            facturas: {
                total: totalFacturas,
                pendientes: facturasPendientes,
                pagadas: facturasPagadas,
            },
            pagos: {
                total: totalPagos,
                montoPagado: Number(montoPagado._sum.montoPagado ?? 0),
            },
            deuda: {
                total: Number(deuda._sum.montoTotal ?? 0),
            },
            operaciones: {
                cortes,
                reconexiones,
            },
        };
    }

    //news endpoints specifics
    async detalleMiMedidor(usuarioId: number, medidorId: number) {
        await this.validarCiudadano(usuarioId);

        const medidor = await this.prisma.medidor.findFirst({
            where: {
                id: medidorId,
                ciudadanoId: usuarioId,
            },
            include: {
                lecturas: {
                    orderBy: {
                        fechaLectura: 'desc',
                    },
                },
                ciudadano: {
                    include: {
                        usuario: {
                            select: {
                                id: true,
                                nombre: true,
                                apellido: true,
                                ci: true,
                            },
                        },
                        categoria: true,
                        distrito: true,
                    },
                },
            },
        });

        if (!medidor) {
            throw new NotFoundException(
                'Medidor no encontrado o no pertenece al ciudadano autenticado',
            );
        }

        return medidor;
    }

    async lecturasDeMiMedidor(usuarioId: number, medidorId: number) {
        await this.validarCiudadano(usuarioId);

        const medidor = await this.prisma.medidor.findFirst({
            where: {
                id: medidorId,
                ciudadanoId: usuarioId,
            },
        });

        if (!medidor) {
            throw new NotFoundException(
                'Medidor no encontrado o no pertenece al ciudadano autenticado',
            );
        }

        return this.prisma.lectura.findMany({
            where: {
                medidorId,
            },
            include: {
                medidor: {
                    select: {
                        id: true,
                        codigoMedidor: true,
                        numeroSerie: true,
                        marca: true,
                        modelo: true,
                        estado: true,
                    },
                },
                factura: {
                    select: {
                        id: true,
                        numeroFactura: true,
                        periodo: true,
                        montoTotal: true,
                        estado: true,
                        fechaEmision: true,
                        fechaVencimiento: true,
                    },
                },
            },
            orderBy: {
                fechaLectura: 'desc',
            },
        });
    }

    async detalleMiFactura(usuarioId: number, facturaId: number) {
        await this.validarCiudadano(usuarioId);

        const factura = await this.prisma.factura.findFirst({
            where: {
                id: facturaId,
                ciudadanoId: usuarioId,
            },
            include: {
                detalles: true,
                lectura: {
                    include: {
                        medidor: true,
                    },
                },
                pago: {
                    include: {
                        metodo: true,
                    },
                },
            },
        });

        if (!factura) {
            throw new NotFoundException(
                'Factura no encontrada o no pertenece al ciudadano autenticado',
            );
        }

        return factura;
    }

    async detalleMiPago(usuarioId: number, pagoId: number) {
        await this.validarCiudadano(usuarioId);

        const pago = await this.prisma.pago.findFirst({
            where: {
                id: pagoId,
                factura: {
                    ciudadanoId: usuarioId,
                },
            },
            include: {
                metodo: true,
                factura: {
                    include: {
                        detalles: true,
                        lectura: {
                            include: {
                                medidor: true,
                            },
                        },
                    },
                },
            },
        });

        if (!pago) {
            throw new NotFoundException(
                'Pago no encontrado o no pertenece al ciudadano autenticado',
            );
        }

        return pago;
    }
}