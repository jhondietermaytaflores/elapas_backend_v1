import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    EstadoFactura,
    EstadoPago,
    EstadoServicio,
} from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { FilterPagosDto } from './dto/filter-pagos.dto';
import { RecaudacionRangoDto } from './dto/recaudacion-rango.dto';
import { AuditoriasService } from '../auditorias/auditorias.service';
import { AuditoriasModule } from '../auditorias/auditorias.module';

@Injectable()
export class PagosService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditoriasService: AuditoriasService, // se agrego esto al constructor Para Auditoria
    ) { }

    private pagoInclude() {
        return {
            metodo: true,
            usuario: {
                select: {
                    id: true,
                    nombre: true,
                    apellido: true,
                    ci: true,
                    rol: {
                        select: {
                            id: true,
                            nombre: true,
                        },
                    },
                },
            },
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
                                    email: true,
                                    telefono: true,
                                },
                            },
                            categoria: true,
                            distrito: true,
                        },
                    },
                    lectura: {
                        include: {
                            medidor: true,
                        },
                    },
                },
            },
        };
    }

    private async generarCodigoPago() {
        const year = new Date().getFullYear();

        const total = await this.prisma.pago.count({
            where: {
                codigoPago: {
                    startsWith: `PAG-${year}-`,
                },
            },
        });

        return `PAG-${year}-${String(total + 1).padStart(6, '0')}`;
    }

    private normalizarFechaInicio(fecha: string) {
        const date = new Date(fecha);
        date.setHours(0, 0, 0, 0);
        return date;
    }

    private normalizarFechaFin(fecha: string) {
        const date = new Date(fecha);
        date.setHours(23, 59, 59, 999);
        return date;
    }

    private async validarUsuarioRegistro(usuarioId: number) {
        const usuario = await this.prisma.usuario.findUnique({
            where: { id: usuarioId },
            include: { rol: true },
        });

        if (!usuario) {
            throw new NotFoundException('Usuario que registra el pago no encontrado');
        }

        if (!usuario.activo) {
            throw new BadRequestException('El usuario que registra el pago está inactivo');
        }

        const rolesPermitidos = ['ADMIN', 'SUPERVISOR', 'CAJERO'];

        if (!rolesPermitidos.includes(usuario.rol.nombre)) {
            throw new BadRequestException(
                'El usuario autenticado no tiene permiso para registrar pagos',
            );
        }

        return usuario;
    }

    private async validarMetodoPago(metodoId: number) {
        const metodo = await this.prisma.metodoPago.findUnique({
            where: { id: metodoId },
        });

        if (!metodo) {
            throw new NotFoundException('Método de pago no encontrado');
        }

        if (!metodo.activo) {
            throw new BadRequestException('El método de pago está inactivo');
        }

        return metodo;
    }

    private async actualizarEstadoServicioSiNoTieneDeuda(ciudadanoId: number) {
        const deudasPendientes = await this.prisma.factura.count({
            where: {
                ciudadanoId,
                estado: {
                    in: [EstadoFactura.PENDIENTE, EstadoFactura.VENCIDA],
                },
            },
        });

        if (deudasPendientes === 0) {
            await this.prisma.ciudadano.update({
                where: { usuarioId: ciudadanoId },
                data: {
                    estadoServicio: EstadoServicio.ACTIVO,
                },
            });
        }
    }

    async create(dto: CreatePagoDto, usuarioId: number) {
        await this.validarUsuarioRegistro(usuarioId);
        await this.validarMetodoPago(dto.metodoId);

        const factura = await this.prisma.factura.findUnique({
            where: {
                id: dto.facturaId,
            },
            include: {
                pago: true,
                ciudadano: true,
            },
        });

        if (!factura) {
            throw new NotFoundException('Factura no encontrada');
        }

        if (factura.estado === EstadoFactura.ANULADA) {
            throw new BadRequestException('No se puede pagar una factura anulada');
        }

        if (factura.estado === EstadoFactura.PAGADA) {
            throw new BadRequestException('La factura ya está pagada');
        }

        if (factura.pago) {
            throw new BadRequestException('Esta factura ya tiene un pago registrado');
        }

        const montoFactura = Number(factura.montoTotal);

        if (dto.montoPagado < montoFactura) {
            throw new BadRequestException(
                `El monto pagado no puede ser menor al monto total de la factura: ${montoFactura}`,
            );
        }

        const codigoPago =
            dto.codigoPago?.trim().toUpperCase() || (await this.generarCodigoPago());

        const existeCodigoPago = await this.prisma.pago.findUnique({
            where: {
                codigoPago,
            },
        });

        if (existeCodigoPago) {
            throw new BadRequestException('Ya existe un pago con ese código');
        }

        const estadoPago = dto.estado ?? EstadoPago.CONFIRMADO;
        /*    esto era antes del modulo Auditoria
                return this.prisma.$transaction(async (tx) => {
                    const pago = await tx.pago.create({
                        data: {
                            facturaId: dto.facturaId,
                            usuarioId,
                            metodoId: dto.metodoId,
                            codigoPago,
                            montoPagado: dto.montoPagado,
                            estado: estadoPago,
                            referenciaTransaccion: dto.referenciaTransaccion?.trim(),
                            qrReferencia: dto.qrReferencia?.trim(),
                            observacion: dto.observacion?.trim(),
                        },
                        include: this.pagoInclude(),
                    });
        
                    if (estadoPago === EstadoPago.CONFIRMADO) {
                        await tx.factura.update({
                            where: {
                                id: dto.facturaId,
                            },
                            data: {
                                estado: EstadoFactura.PAGADA,
                            },
                        });
        
                        const deudasPendientes = await tx.factura.count({
                            where: {
                                ciudadanoId: factura.ciudadanoId,
                                estado: {
                                    in: [EstadoFactura.PENDIENTE, EstadoFactura.VENCIDA],
                                },
                            },
                        });
        
                        if (deudasPendientes === 0) {
                            await tx.ciudadano.update({
                                where: {
                                    usuarioId: factura.ciudadanoId,
                                },
                                data: {
                                    estadoServicio: EstadoServicio.ACTIVO,
                                },
                            });
                        }
                    }
        
                    return pago;
                }); */


        const pagoCreado = await this.prisma.$transaction(async (tx) => {
            const pago = await tx.pago.create({
                data: {
                    facturaId: dto.facturaId,
                    usuarioId,
                    metodoId: dto.metodoId,
                    codigoPago,
                    montoPagado: dto.montoPagado,
                    estado: estadoPago,
                    referenciaTransaccion: dto.referenciaTransaccion?.trim(),
                    qrReferencia: dto.qrReferencia?.trim(),
                    observacion: dto.observacion?.trim(),
                },
                include: this.pagoInclude(),
            });

            if (estadoPago === EstadoPago.CONFIRMADO) {
                await tx.factura.update({
                    where: {
                        id: dto.facturaId,
                    },
                    data: {
                        estado: EstadoFactura.PAGADA,
                    },
                });

                const deudasPendientes = await tx.factura.count({
                    where: {
                        ciudadanoId: factura.ciudadanoId,
                        estado: {
                            in: [EstadoFactura.PENDIENTE, EstadoFactura.VENCIDA],
                        },
                    },
                });

                if (deudasPendientes === 0) {
                    await tx.ciudadano.update({
                        where: {
                            usuarioId: factura.ciudadanoId,
                        },
                        data: {
                            estadoServicio: EstadoServicio.ACTIVO,
                        },
                    });
                }
            }

            return pago;
        });

        await this.auditoriasService.registrarLog({
            usuarioId,
            accion: 'CREAR',
            entidad: 'Pago',
            entidadId: pagoCreado.id,
            descripcion: `Pago ${pagoCreado.codigoPago} registrado para la factura ${pagoCreado.factura.numeroFactura}`,
        });

        return pagoCreado;
    }

    async findAll(filtros: FilterPagosDto) {
        const where: any = {};

        if (filtros.facturaId) {
            where.facturaId = filtros.facturaId;
        }

        if (filtros.usuarioId) {
            where.usuarioId = filtros.usuarioId;
        }

        if (filtros.metodoId) {
            where.metodoId = filtros.metodoId;
        }

        if (filtros.estado) {
            where.estado = filtros.estado;
        }

        if (filtros.ciudadanoId) {
            where.factura = {
                ciudadanoId: filtros.ciudadanoId,
            };
        }

        if (filtros.fechaDesde || filtros.fechaHasta) {
            where.fechaPago = {};

            if (filtros.fechaDesde) {
                where.fechaPago.gte = this.normalizarFechaInicio(filtros.fechaDesde);
            }

            if (filtros.fechaHasta) {
                where.fechaPago.lte = this.normalizarFechaFin(filtros.fechaHasta);
            }
        }

        if (filtros.buscar) {
            const buscar = filtros.buscar.trim();

            where.OR = [
                {
                    codigoPago: {
                        contains: buscar,
                        mode: 'insensitive',
                    },
                },
                {
                    referenciaTransaccion: {
                        contains: buscar,
                        mode: 'insensitive',
                    },
                },
                {
                    factura: {
                        numeroFactura: {
                            contains: buscar,
                            mode: 'insensitive',
                        },
                    },
                },
                {
                    factura: {
                        ciudadano: {
                            codigoCliente: {
                                contains: buscar,
                                mode: 'insensitive',
                            },
                        },
                    },
                },
                {
                    factura: {
                        ciudadano: {
                            usuario: {
                                ci: {
                                    contains: buscar,
                                    mode: 'insensitive',
                                },
                            },
                        },
                    },
                },
                {
                    factura: {
                        ciudadano: {
                            usuario: {
                                nombre: {
                                    contains: buscar,
                                    mode: 'insensitive',
                                },
                            },
                        },
                    },
                },
                {
                    factura: {
                        ciudadano: {
                            usuario: {
                                apellido: {
                                    contains: buscar,
                                    mode: 'insensitive',
                                },
                            },
                        },
                    },
                },
            ];
        }

        return this.prisma.pago.findMany({
            where,
            include: this.pagoInclude(),
            orderBy: {
                fechaPago: 'desc',
            },
        });
    }

    async resumen() {
        const [total, confirmados, pendientes, anulados, montoConfirmado] =
            await Promise.all([
                this.prisma.pago.count(),
                this.prisma.pago.count({
                    where: {
                        estado: EstadoPago.CONFIRMADO,
                    },
                }),
                this.prisma.pago.count({
                    where: {
                        estado: EstadoPago.PENDIENTE,
                    },
                }),
                this.prisma.pago.count({
                    where: {
                        estado: EstadoPago.ANULADO,
                    },
                }),
                this.prisma.pago.aggregate({
                    where: {
                        estado: EstadoPago.CONFIRMADO,
                    },
                    _sum: {
                        montoPagado: true,
                    },
                }),
            ]);

        return {
            total,
            estados: {
                confirmados,
                pendientes,
                anulados,
            },
            montoConfirmado: Number(montoConfirmado._sum.montoPagado ?? 0),
        };
    }

    async findOne(id: number) {
        const pago = await this.prisma.pago.findUnique({
            where: { id },
            include: this.pagoInclude(),
        });

        if (!pago) {
            throw new NotFoundException('Pago no encontrado');
        }

        return pago;
    }

    async findByCodigo(codigoPago: string) {
        const pago = await this.prisma.pago.findUnique({
            where: {
                codigoPago: codigoPago.trim().toUpperCase(),
            },
            include: this.pagoInclude(),
        });

        if (!pago) {
            throw new NotFoundException('Pago no encontrado');
        }

        return pago;
    }

    async findByFactura(facturaId: number) {
        const pago = await this.prisma.pago.findUnique({
            where: {
                facturaId,
            },
            include: this.pagoInclude(),
        });

        if (!pago) {
            throw new NotFoundException('No existe pago registrado para esta factura');
        }

        return pago;
    }

    async findByCiudadano(usuarioId: number) {
        const ciudadano = await this.prisma.ciudadano.findUnique({
            where: { usuarioId },
        });

        if (!ciudadano) {
            throw new NotFoundException('Ciudadano no encontrado');
        }

        return this.prisma.pago.findMany({
            where: {
                factura: {
                    ciudadanoId: usuarioId,
                },
            },
            include: this.pagoInclude(),
            orderBy: {
                fechaPago: 'desc',
            },
        });
    }

    async recaudacionDia() {
        const hoy = new Date();

        const fechaDesde = new Date(hoy);
        fechaDesde.setHours(0, 0, 0, 0);

        const fechaHasta = new Date(hoy);
        fechaHasta.setHours(23, 59, 59, 999);

        return this.recaudacionPorFechas(fechaDesde, fechaHasta);
    }

    async recaudacionRango(dto: RecaudacionRangoDto) {
        const fechaDesde = this.normalizarFechaInicio(dto.fechaDesde);
        const fechaHasta = this.normalizarFechaFin(dto.fechaHasta);

        if (fechaHasta < fechaDesde) {
            throw new BadRequestException('fechaHasta no puede ser menor que fechaDesde');
        }

        return this.recaudacionPorFechas(fechaDesde, fechaHasta);
    }

    private async recaudacionPorFechas(fechaDesde: Date, fechaHasta: Date) {
        const [pagos, agregado, porMetodo] = await Promise.all([
            this.prisma.pago.findMany({
                where: {
                    estado: EstadoPago.CONFIRMADO,
                    fechaPago: {
                        gte: fechaDesde,
                        lte: fechaHasta,
                    },
                },
                include: this.pagoInclude(),
                orderBy: {
                    fechaPago: 'desc',
                },
            }),
            this.prisma.pago.aggregate({
                where: {
                    estado: EstadoPago.CONFIRMADO,
                    fechaPago: {
                        gte: fechaDesde,
                        lte: fechaHasta,
                    },
                },
                _sum: {
                    montoPagado: true,
                },
                _count: {
                    id: true,
                },
            }),
            this.prisma.pago.groupBy({
                by: ['metodoId'],
                where: {
                    estado: EstadoPago.CONFIRMADO,
                    fechaPago: {
                        gte: fechaDesde,
                        lte: fechaHasta,
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

        const metodos = await this.prisma.metodoPago.findMany();

        const recaudacionPorMetodo = porMetodo.map((item) => {
            const metodo = metodos.find((m) => m.id === item.metodoId);

            return {
                metodoId: item.metodoId,
                metodo: metodo?.nombre ?? 'DESCONOCIDO',
                cantidadPagos: item._count.id,
                montoTotal: Number(item._sum.montoPagado ?? 0),
            };
        });

        return {
            fechaDesde,
            fechaHasta,
            totalPagos: agregado._count.id,
            montoTotal: Number(agregado._sum.montoPagado ?? 0),
            recaudacionPorMetodo,
            pagos,
        };
    }

    async anular(id: number) {
        const pago = await this.prisma.pago.findUnique({
            where: { id },
            include: {
                factura: true,
            },
        });

        if (!pago) {
            throw new NotFoundException('Pago no encontrado');
        }

        if (pago.estado === EstadoPago.ANULADO) {
            throw new BadRequestException('El pago ya está anulado');
        }

        return this.prisma.$transaction(async (tx) => {
            const pagoAnulado = await tx.pago.update({
                where: {
                    id,
                },
                data: {
                    estado: EstadoPago.ANULADO,
                },
                include: this.pagoInclude(),
            });

            await tx.factura.update({
                where: {
                    id: pago.facturaId,
                },
                data: {
                    estado: EstadoFactura.PENDIENTE,
                },
            });

            await tx.ciudadano.update({
                where: {
                    usuarioId: pago.factura.ciudadanoId,
                },
                data: {
                    estadoServicio: EstadoServicio.CON_DEUDA,
                },
            });

            return pagoAnulado;
        });
    }
}