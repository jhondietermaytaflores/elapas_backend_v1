import { Injectable } from '@nestjs/common';
import {
    EstadoCorte,
    EstadoFactura,
    EstadoLectura,
    EstadoPago,
    EstadoReconexion,
    EstadoServicio,
} from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private readonly prisma: PrismaService) { }

    private inicioDia(fecha = new Date()) {
        const date = new Date(fecha);
        date.setHours(0, 0, 0, 0);
        return date;
    }

    private finDia(fecha = new Date()) {
        const date = new Date(fecha);
        date.setHours(23, 59, 59, 999);
        return date;
    }

    private inicioMes(fecha = new Date()) {
        return new Date(fecha.getFullYear(), fecha.getMonth(), 1, 0, 0, 0, 0);
    }

    private finMes(fecha = new Date()) {
        return new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    async resumen() {
        const hoyInicio = this.inicioDia();
        const hoyFin = this.finDia();

        const [
            totalUsuarios,
            totalCiudadanos,
            clientesActivos,
            clientesConDeuda,
            clientesCortados,
            clientesSuspendidos,
            totalMedidores,
            medidoresActivos,
            lecturasRegistradas,
            lecturasConfirmadas,
            facturasPendientes,
            facturasVencidas,
            facturasPagadas,
            cortesPendientes,
            cortesEjecutados,
            reconexionesPendientes,
            pagosHoy,
            recaudacionHoy,
            deudaTotal,
        ] = await Promise.all([
            this.prisma.usuario.count(),
            this.prisma.ciudadano.count(),

            this.prisma.ciudadano.count({
                where: { estadoServicio: EstadoServicio.ACTIVO },
            }),

            this.prisma.ciudadano.count({
                where: { estadoServicio: EstadoServicio.CON_DEUDA },
            }),

            this.prisma.ciudadano.count({
                where: { estadoServicio: EstadoServicio.CORTADO },
            }),

            this.prisma.ciudadano.count({
                where: { estadoServicio: EstadoServicio.SUSPENDIDO },
            }),

            this.prisma.medidor.count(),

            this.prisma.medidor.count({
                where: { estado: 'ACTIVO' },
            }),

            this.prisma.lectura.count({
                where: { estado: EstadoLectura.REGISTRADA },
            }),

            this.prisma.lectura.count({
                where: { estado: EstadoLectura.CONFIRMADA },
            }),

            this.prisma.factura.count({
                where: { estado: EstadoFactura.PENDIENTE },
            }),

            this.prisma.factura.count({
                where: { estado: EstadoFactura.VENCIDA },
            }),

            this.prisma.factura.count({
                where: { estado: EstadoFactura.PAGADA },
            }),

            this.prisma.corte.count({
                where: { estado: EstadoCorte.PENDIENTE },
            }),

            this.prisma.corte.count({
                where: { estado: EstadoCorte.EJECUTADO },
            }),

            this.prisma.reconexion.count({
                where: { estado: EstadoReconexion.PENDIENTE },
            }),

            this.prisma.pago.count({
                where: {
                    estado: EstadoPago.CONFIRMADO,
                    fechaPago: {
                        gte: hoyInicio,
                        lte: hoyFin,
                    },
                },
            }),

            this.prisma.pago.aggregate({
                where: {
                    estado: EstadoPago.CONFIRMADO,
                    fechaPago: {
                        gte: hoyInicio,
                        lte: hoyFin,
                    },
                },
                _sum: {
                    montoPagado: true,
                },
            }),

            this.prisma.factura.aggregate({
                where: {
                    estado: {
                        in: [EstadoFactura.PENDIENTE, EstadoFactura.VENCIDA],
                    },
                },
                _sum: {
                    montoTotal: true,
                },
            }),
        ]);

        return {
            usuarios: {
                total: totalUsuarios,
                ciudadanos: totalCiudadanos,
            },
            clientes: {
                activos: clientesActivos,
                conDeuda: clientesConDeuda,
                cortados: clientesCortados,
                suspendidos: clientesSuspendidos,
            },
            medidores: {
                total: totalMedidores,
                activos: medidoresActivos,
            },
            lecturas: {
                registradas: lecturasRegistradas,
                confirmadas: lecturasConfirmadas,
            },
            facturacion: {
                pendientes: facturasPendientes,
                vencidas: facturasVencidas,
                pagadas: facturasPagadas,
                deudaTotal: Number(deudaTotal._sum.montoTotal ?? 0),
            },
            recaudacion: {
                pagosHoy,
                montoHoy: Number(recaudacionHoy._sum.montoPagado ?? 0),
            },
            operaciones: {
                cortesPendientes,
                cortesEjecutados,
                reconexionesPendientes,
            },
        };
    }

    async recaudacionDia() {
        const hoyInicio = this.inicioDia();
        const hoyFin = this.finDia();

        const [pagos, agregado] = await Promise.all([
            this.prisma.pago.findMany({
                where: {
                    estado: EstadoPago.CONFIRMADO,
                    fechaPago: {
                        gte: hoyInicio,
                        lte: hoyFin,
                    },
                },
                include: {
                    metodo: true,
                    factura: {
                        include: {
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
                                    distrito: true,
                                },
                            },
                        },
                    },
                    usuario: {
                        select: {
                            id: true,
                            nombre: true,
                            apellido: true,
                            ci: true,
                        },
                    },
                },
                orderBy: {
                    fechaPago: 'desc',
                },
            }),

            this.prisma.pago.aggregate({
                where: {
                    estado: EstadoPago.CONFIRMADO,
                    fechaPago: {
                        gte: hoyInicio,
                        lte: hoyFin,
                    },
                },
                _sum: {
                    montoPagado: true,
                },
                _count: {
                    id: true,
                },
            }),
        ]);

        return {
            fecha: new Date(),
            cantidadPagos: agregado._count.id,
            montoTotal: Number(agregado._sum.montoPagado ?? 0),
            pagos,
        };
    }

    async recaudacionMes() {
        const mesInicio = this.inicioMes();
        const mesFin = this.finMes();

        const pagos = await this.prisma.pago.findMany({
            where: {
                estado: EstadoPago.CONFIRMADO,
                fechaPago: {
                    gte: mesInicio,
                    lte: mesFin,
                },
            },
            include: {
                metodo: true,
            },
            orderBy: {
                fechaPago: 'asc',
            },
        });

        const acumuladoPorDia = new Map<string, number>();

        for (const pago of pagos) {
            const fecha = pago.fechaPago.toISOString().substring(0, 10);
            const montoActual = acumuladoPorDia.get(fecha) ?? 0;
            acumuladoPorDia.set(fecha, montoActual + Number(pago.montoPagado));
        }

        const serie = Array.from(acumuladoPorDia.entries()).map(([fecha, monto]) => ({
            fecha,
            monto,
        }));

        const montoTotal = pagos.reduce((acc, pago) => acc + Number(pago.montoPagado), 0);

        return {
            mes: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
            cantidadPagos: pagos.length,
            montoTotal,
            serie,
        };
    }

    async deudaPorDistrito() {
        const distritos = await this.prisma.distrito.findMany({
            include: {
                ciudadanos: {
                    include: {
                        facturas: {
                            where: {
                                estado: {
                                    in: [EstadoFactura.PENDIENTE, EstadoFactura.VENCIDA],
                                },
                            },
                            select: {
                                montoTotal: true,
                                estado: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                id: 'asc',
            },
        });

        return distritos.map((distrito) => {
            const facturas = distrito.ciudadanos.flatMap((c) => c.facturas);

            const deudaTotal = facturas.reduce(
                (acc, factura) => acc + Number(factura.montoTotal),
                0,
            );

            const facturasPendientes = facturas.filter(
                (f) => f.estado === EstadoFactura.PENDIENTE,
            ).length;

            const facturasVencidas = facturas.filter(
                (f) => f.estado === EstadoFactura.VENCIDA,
            ).length;

            return {
                distritoId: distrito.id,
                distrito: distrito.nombre,
                ciudadanos: distrito.ciudadanos.length,
                facturasPendientes,
                facturasVencidas,
                deudaTotal,
            };
        });
    }

    async cortesPorDistrito() {
        const distritos = await this.prisma.distrito.findMany({
            include: {
                ciudadanos: {
                    include: {
                        cortes: true,
                    },
                },
            },
            orderBy: {
                id: 'asc',
            },
        });

        return distritos.map((distrito) => {
            const cortes = distrito.ciudadanos.flatMap((c) => c.cortes);

            return {
                distritoId: distrito.id,
                distrito: distrito.nombre,
                total: cortes.length,
                pendientes: cortes.filter((c) => c.estado === EstadoCorte.PENDIENTE).length,
                ejecutados: cortes.filter((c) => c.estado === EstadoCorte.EJECUTADO).length,
                cancelados: cortes.filter((c) => c.estado === EstadoCorte.CANCELADO).length,
            };
        });
    }

    async clientesPorEstado() {
        const [activos, conDeuda, cortados, suspendidos] = await Promise.all([
            this.prisma.ciudadano.count({
                where: { estadoServicio: EstadoServicio.ACTIVO },
            }),
            this.prisma.ciudadano.count({
                where: { estadoServicio: EstadoServicio.CON_DEUDA },
            }),
            this.prisma.ciudadano.count({
                where: { estadoServicio: EstadoServicio.CORTADO },
            }),
            this.prisma.ciudadano.count({
                where: { estadoServicio: EstadoServicio.SUSPENDIDO },
            }),
        ]);

        return [
            {
                estado: EstadoServicio.ACTIVO,
                cantidad: activos,
            },
            {
                estado: EstadoServicio.CON_DEUDA,
                cantidad: conDeuda,
            },
            {
                estado: EstadoServicio.CORTADO,
                cantidad: cortados,
            },
            {
                estado: EstadoServicio.SUSPENDIDO,
                cantidad: suspendidos,
            },
        ];
    }

    async consumoPorPeriodo() {
        const lecturas = await this.prisma.lectura.groupBy({
            by: ['periodo'],
            where: {
                estado: {
                    not: EstadoLectura.ANULADA,
                },
            },
            _sum: {
                consumoM3: true,
            },
            _count: {
                id: true,
            },
            orderBy: {
                periodo: 'asc',
            },
        });

        return lecturas.map((item) => ({
            periodo: item.periodo,
            cantidadLecturas: item._count.id,
            consumoM3: Number(item._sum.consumoM3 ?? 0),
        }));
    }

    async facturasPorEstado() {
        const [pendientes, pagadas, vencidas, anuladas] = await Promise.all([
            this.prisma.factura.count({
                where: { estado: EstadoFactura.PENDIENTE },
            }),
            this.prisma.factura.count({
                where: { estado: EstadoFactura.PAGADA },
            }),
            this.prisma.factura.count({
                where: { estado: EstadoFactura.VENCIDA },
            }),
            this.prisma.factura.count({
                where: { estado: EstadoFactura.ANULADA },
            }),
        ]);

        return [
            {
                estado: EstadoFactura.PENDIENTE,
                cantidad: pendientes,
            },
            {
                estado: EstadoFactura.PAGADA,
                cantidad: pagadas,
            },
            {
                estado: EstadoFactura.VENCIDA,
                cantidad: vencidas,
            },
            {
                estado: EstadoFactura.ANULADA,
                cantidad: anuladas,
            },
        ];
    }

    async pagosPorMetodo() {
        const agrupado = await this.prisma.pago.groupBy({
            by: ['metodoId'],
            where: {
                estado: EstadoPago.CONFIRMADO,
            },
            _sum: {
                montoPagado: true,
            },
            _count: {
                id: true,
            },
        });

        const metodos = await this.prisma.metodoPago.findMany();

        return agrupado.map((item) => {
            const metodo = metodos.find((m) => m.id === item.metodoId);

            return {
                metodoId: item.metodoId,
                metodo: metodo?.nombre ?? 'DESCONOCIDO',
                cantidadPagos: item._count.id,
                montoTotal: Number(item._sum.montoPagado ?? 0),
            };
        });
    }

    async actividadOperativa() {
        const [
            ultimasLecturas,
            ultimosPagos,
            ultimosCortes,
            ultimasReconexiones,
        ] = await Promise.all([
            this.prisma.lectura.findMany({
                take: 5,
                orderBy: {
                    createdAt: 'desc',
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
                    medidor: {
                        include: {
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
                                },
                            },
                        },
                    },
                },
            }),

            this.prisma.pago.findMany({
                take: 5,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    metodo: true,
                    factura: {
                        include: {
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
                                },
                            },
                        },
                    },
                },
            }),

            this.prisma.corte.findMany({
                take: 5,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
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
                        },
                    },
                    tecnico: {
                        select: {
                            id: true,
                            nombre: true,
                            apellido: true,
                            ci: true,
                        },
                    },
                },
            }),

            this.prisma.reconexion.findMany({
                take: 5,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
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
                        },
                    },
                    tecnico: {
                        select: {
                            id: true,
                            nombre: true,
                            apellido: true,
                            ci: true,
                        },
                    },
                },
            }),
        ]);

        return {
            ultimasLecturas,
            ultimosPagos,
            ultimosCortes,
            ultimasReconexiones,
        };
    }
}