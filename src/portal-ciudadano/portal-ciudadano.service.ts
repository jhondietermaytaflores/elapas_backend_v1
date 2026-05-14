import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    EstadoFactura,
    EstadoPago,
    EstadoCorte,
    EstadoReconexion,
    EstadoServicio,
} from '../generated/prisma/enums';
import { SimularPagoDto } from './dto/simular-pago.dto';
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

    //news- simular pago
    private async generarCodigoPagoSimulado() {
        const year = new Date().getFullYear();

        const total = await this.prisma.pago.count({
            where: {
                codigoPago: {
                    startsWith: `PAG-WEB-${year}-`,
                },
            },
        });

        return `PAG-WEB-${year}-${String(total + 1).padStart(6, '0')}`;
    }

    private async obtenerMetodoPagoSimulado(metodoId?: number) {
        if (metodoId) {
            const metodo = await this.prisma.metodoPago.findUnique({
                where: {
                    id: metodoId,
                },
            });

            if (!metodo) {
                throw new NotFoundException('Método de pago no encontrado');
            }

            if (!metodo.activo) {
                throw new BadRequestException('El método de pago está inactivo');
            }

            return metodo;
        }

        const metodo =
            (await this.prisma.metodoPago.findFirst({
                where: {
                    nombre: 'QR_SIMPLE',
                    activo: true,
                },
            })) ||
            (await this.prisma.metodoPago.findFirst({
                where: {
                    nombre: 'EFECTIVO',
                    activo: true,
                },
            }));

        if (!metodo) {
            throw new NotFoundException(
                'No existe un método de pago activo para simular el pago',
            );
        }

        return metodo;
    }

    private async buscarUltimoCorteEjecutado(ciudadanoId: number) {
        return this.prisma.corte.findFirst({
            where: {
                ciudadanoId,
                estado: EstadoCorte.EJECUTADO,
            },
            orderBy: {
                fechaEjecucion: 'desc',
            },
        });
    }

    private async tieneReconexionPendiente(ciudadanoId: number) {
        const reconexion = await this.prisma.reconexion.findFirst({
            where: {
                ciudadanoId,
                estado: EstadoReconexion.PENDIENTE,
            },
        });

        return Boolean(reconexion);
    }

    async simularPagoFactura(
        usuarioId: number,
        facturaId: number,
        dto: SimularPagoDto,
    ) {
        const ciudadano = await this.validarCiudadano(usuarioId);

        const factura = await this.prisma.factura.findFirst({
            where: {
                id: facturaId,
                ciudadanoId: usuarioId,
            },
            include: {
                pago: true,
                lectura: {
                    include: {
                        medidor: true,
                    },
                },
            },
        });

        if (!factura) {
            throw new NotFoundException(
                'Factura no encontrada o no pertenece al ciudadano autenticado',
            );
        }

        if (factura.estado === EstadoFactura.ANULADA) {
            throw new BadRequestException('No se puede pagar una factura anulada');
        }

        if (factura.estado === EstadoFactura.PAGADA) {
            throw new BadRequestException('La factura ya está pagada');
        }

        if (factura.pago) {
            throw new BadRequestException('La factura ya tiene un pago registrado');
        }

        const metodo = await this.obtenerMetodoPagoSimulado(dto.metodoId);

        const montoFactura = Number(factura.montoTotal);
        const montoPagado = dto.montoPagado ?? montoFactura;

        if (montoPagado < montoFactura) {
            throw new BadRequestException(
                `El monto pagado no puede ser menor al total de la factura: ${montoFactura}`,
            );
        }

        const codigoPago = await this.generarCodigoPagoSimulado();

        const resultado = await this.prisma.$transaction(async (tx) => {
            const pago = await tx.pago.create({
                data: {
                    facturaId: factura.id,
                    usuarioId,
                    metodoId: metodo.id,
                    codigoPago,
                    montoPagado,
                    estado: EstadoPago.CONFIRMADO,
                    referenciaTransaccion:
                        dto.referenciaTransaccion?.trim() ||
                        `SIM-${codigoPago}`,
                    qrReferencia: dto.qrReferencia?.trim() || null,
                    observacion:
                        dto.observacion?.trim() ||
                        'Pago simulado desde portal ciudadano.',
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

            const facturaPagada = await tx.factura.update({
                where: {
                    id: factura.id,
                },
                data: {
                    estado: EstadoFactura.PAGADA,
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

            const deudasPendientes = await tx.factura.count({
                where: {
                    ciudadanoId: usuarioId,
                    estado: {
                        in: [EstadoFactura.PENDIENTE, EstadoFactura.VENCIDA],
                    },
                },
            });

            // cambiado a any=null
            let reconexionGenerada: any = null;

            if (deudasPendientes === 0) {
                if (ciudadano.estadoServicio === EstadoServicio.CORTADO) {
                    const corteEjecutado = await tx.corte.findFirst({
                        where: {
                            ciudadanoId: usuarioId,
                            estado: EstadoCorte.EJECUTADO,
                        },
                        orderBy: {
                            fechaEjecucion: 'desc',
                        },
                    });

                    const reconexionPendiente = await tx.reconexion.findFirst({
                        where: {
                            ciudadanoId: usuarioId,
                            estado: EstadoReconexion.PENDIENTE,
                        },
                    });

                    if (corteEjecutado && !reconexionPendiente) {
                        reconexionGenerada = await tx.reconexion.create({
                            data: {
                                ciudadanoId: usuarioId,
                                corteId: corteEjecutado.id,
                                costoReconexion: 30,  // era 0 pero para probar se pone 30
                                estado: EstadoReconexion.PENDIENTE,
                                observacion:
                                    'Reconexión generada automáticamente tras pago total de deuda desde portal ciudadano.',
                            },
                        });
                    }
                } else {
                    await tx.ciudadano.update({
                        where: {
                            usuarioId,
                        },
                        data: {
                            estadoServicio: EstadoServicio.ACTIVO,
                        },
                    });
                }
            } else {
                if (ciudadano.estadoServicio !== EstadoServicio.CORTADO) {
                    await tx.ciudadano.update({
                        where: {
                            usuarioId,
                        },
                        data: {
                            estadoServicio: EstadoServicio.CON_DEUDA,
                        },
                    });
                }
            }

            return {
                pago,
                factura: facturaPagada,
                deudasPendientes,
                reconexionGenerada,
            };
        });

        const ciudadanoActualizado = await this.prisma.ciudadano.findUnique({
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
                    },
                },
                categoria: true,
                distrito: true,
            },
        });

        return {
            message: resultado.reconexionGenerada
                ? 'Pago registrado correctamente. La deuda fue regularizada y se generó una reconexión pendiente.'
                : resultado.deudasPendientes === 0
                    ? 'Pago registrado correctamente. El ciudadano ya no tiene deuda pendiente.'
                    : 'Pago registrado correctamente. Aún existen facturas pendientes o vencidas.',
            pago: resultado.pago,
            factura: resultado.factura,
            deudasPendientes: resultado.deudasPendientes,
            reconexionGenerada: resultado.reconexionGenerada,
            ciudadano: ciudadanoActualizado,
        };
    }

    
    async simularPagoDeudaTotal(usuarioId: number, dto: SimularPagoDto) {
        const ciudadano = await this.validarCiudadano(usuarioId);

        const facturasPendientes = await this.prisma.factura.findMany({
            where: {
                ciudadanoId: usuarioId,
                estado: {
                    in: [EstadoFactura.PENDIENTE, EstadoFactura.VENCIDA],
                },
                pago: null,
            },
            orderBy: {
                fechaVencimiento: 'asc',
            },
        });

        if (facturasPendientes.length === 0) {
            throw new BadRequestException('El ciudadano no tiene deuda pendiente');
        }

        const metodo = await this.obtenerMetodoPagoSimulado(dto.metodoId);

        const year = new Date().getFullYear();
        const baseCount = await this.prisma.pago.count({
            where: {
                codigoPago: {
                    startsWith: `PAG-WEB-${year}-`,
                },
            },
        });

        const resultado = await this.prisma.$transaction(async (tx) => {
            //const pagos = [];

            const pagos: any[] = [];

            for (let index = 0; index < facturasPendientes.length; index++) {
                const factura = facturasPendientes[index];
                const codigoPago = `PAG-WEB-${year}-${String(
                    baseCount + index + 1,
                ).padStart(6, '0')}`;

                const pago = await tx.pago.create({
                    data: {
                        facturaId: factura.id,
                        usuarioId,
                        metodoId: metodo.id,
                        codigoPago,
                        montoPagado: Number(factura.montoTotal),
                        estado: EstadoPago.CONFIRMADO,
                        referenciaTransaccion:
                            dto.referenciaTransaccion?.trim() ||
                            `SIM-${codigoPago}`,
                        qrReferencia: dto.qrReferencia?.trim() || null,
                        observacion:
                            dto.observacion?.trim() ||
                            'Pago simulado de deuda total desde portal ciudadano.',
                    },
                    include: {
                        metodo: true,
                        factura: true,
                    },
                });

                await tx.factura.update({
                    where: {
                        id: factura.id,
                    },
                    data: {
                        estado: EstadoFactura.PAGADA,
                    },
                });

                pagos.push(pago);
            }

            let reconexionGenerada: any = null;

            if (ciudadano.estadoServicio === EstadoServicio.CORTADO) {
                const corteEjecutado = await tx.corte.findFirst({
                    where: {
                        ciudadanoId: usuarioId,
                        estado: EstadoCorte.EJECUTADO,
                    },
                    orderBy: {
                        fechaEjecucion: 'desc',
                    },
                });

                const reconexionPendiente = await tx.reconexion.findFirst({
                    where: {
                        ciudadanoId: usuarioId,
                        estado: EstadoReconexion.PENDIENTE,
                    },
                });

                if (corteEjecutado && !reconexionPendiente) {
                    reconexionGenerada = await tx.reconexion.create({
                        data: {
                            ciudadanoId: usuarioId,
                            corteId: corteEjecutado.id,
                            costoReconexion: 0,
                            estado: EstadoReconexion.PENDIENTE,
                            observacion:
                                'Reconexión generada automáticamente tras pago total de deuda desde portal ciudadano.',
                        },
                    });
                }
            } else {
                await tx.ciudadano.update({
                    where: {
                        usuarioId,
                    },
                    data: {
                        estadoServicio: EstadoServicio.ACTIVO,
                    },
                });
            }

            return {
                pagos,
                reconexionGenerada,
            };
        });

        const totalPagado = resultado.pagos.reduce((acc, pago) => {
            return acc + Number(pago.montoPagado);
        }, 0);

        const ciudadanoActualizado = await this.prisma.ciudadano.findUnique({
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
                    },
                },
                categoria: true,
                distrito: true,
            },
        });

        return {
            message: resultado.reconexionGenerada
                ? 'Deuda total pagada correctamente. Se generó una reconexión pendiente.'
                : 'Deuda total pagada correctamente.',
            totalPagado,
            cantidadFacturasPagadas: resultado.pagos.length,
            pagos: resultado.pagos,
            reconexionGenerada: resultado.reconexionGenerada,
            ciudadano: ciudadanoActualizado,
        };
    }

}







//code actualizado dentro de la llave anterior
/* async simularPagoDeudaTotal(usuarioId: number, dto: SimularPagoDto) {
        const ciudadano = await this.validarCiudadano(usuarioId);

        const facturasPendientes = await this.prisma.factura.findMany({
            where: {
                ciudadanoId: usuarioId,
                estado: {
                    in: [EstadoFactura.PENDIENTE, EstadoFactura.VENCIDA],
                },
                pago: null,
            },
            orderBy: {
                fechaVencimiento: 'asc',
            },
        });

        if (facturasPendientes.length === 0) {
            throw new BadRequestException('El ciudadano no tiene deuda pendiente');
        }

        const metodo = await this.obtenerMetodoPagoSimulado(dto.metodoId);

        const resultado = await this.prisma.$transaction(async (tx) => {
            const pagos = [];

            for (const factura of facturasPendientes) {
                const codigoPago = await this.generarCodigoPagoSimulado();

                const pago = await tx.pago.create({
                    data: {
                        facturaId: factura.id,
                        usuarioId,
                        metodoId: metodo.id,
                        codigoPago,
                        montoPagado: Number(factura.montoTotal),
                        estado: EstadoPago.CONFIRMADO,
                        referenciaTransaccion:
                            dto.referenciaTransaccion?.trim() ||
                            `SIM-${codigoPago}`,
                        qrReferencia: dto.qrReferencia?.trim() || null,
                        observacion:
                            dto.observacion?.trim() ||
                            'Pago simulado de deuda total desde portal ciudadano.',
                    },
                    include: {
                        metodo: true,
                        factura: true,
                    },
                });

                await tx.factura.update({
                    where: {
                        id: factura.id,
                    },
                    data: {
                        estado: EstadoFactura.PAGADA,
                    },
                });

                pagos.push(pago);
            }

            let reconexionGenerada = null;

            if (ciudadano.estadoServicio === EstadoServicio.CORTADO) {
                const corteEjecutado = await tx.corte.findFirst({
                    where: {
                        ciudadanoId: usuarioId,
                        estado: EstadoCorte.EJECUTADO,
                    },
                    orderBy: {
                        fechaEjecucion: 'desc',
                    },
                });

                const reconexionPendiente = await tx.reconexion.findFirst({
                    where: {
                        ciudadanoId: usuarioId,
                        estado: EstadoReconexion.PENDIENTE,
                    },
                });

                if (corteEjecutado && !reconexionPendiente) {
                    reconexionGenerada = await tx.reconexion.create({
                        data: {
                            ciudadanoId: usuarioId,
                            corteId: corteEjecutado.id,
                            costoReconexion: 0,
                            estado: EstadoReconexion.PENDIENTE,
                            observacion:
                                'Reconexión generada automáticamente tras pago total de deuda desde portal ciudadano.',
                        },
                    });
                }
            } else {
                await tx.ciudadano.update({
                    where: {
                        usuarioId,
                    },
                    data: {
                        estadoServicio: EstadoServicio.ACTIVO,
                    },
                });
            }

            return {
                pagos,
                reconexionGenerada,
            };
        });

        const totalPagado = resultado.pagos.reduce((acc, pago) => {
            return acc + Number(pago.montoPagado);
        }, 0);

        const ciudadanoActualizado = await this.prisma.ciudadano.findUnique({
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
                    },
                },
                categoria: true,
                distrito: true,
            },
        });

        return {
            message: resultado.reconexionGenerada
                ? 'Deuda total pagada correctamente. Se generó una reconexión pendiente.'
                : 'Deuda total pagada correctamente.',
            totalPagado,
            cantidadFacturasPagadas: resultado.pagos.length,
            pagos: resultado.pagos,
            reconexionGenerada: resultado.reconexionGenerada,
            ciudadano: ciudadanoActualizado,
        };
    } */
