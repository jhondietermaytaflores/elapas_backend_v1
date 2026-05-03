import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    EstadoFactura,
    EstadoLectura,
    EstadoServicio,
} from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { FilterFacturasDto } from './dto/filter-facturas.dto';

@Injectable()
export class FacturasService {
    constructor(private readonly prisma: PrismaService) { }

    private facturaInclude() {
        return {
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
            detalles: true,
            pago: {
                include: {
                    metodo: true,
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
        };
    }

    private validarPeriodo(periodo: string) {
        const regex = /^\d{4}-\d{2}$/;

        if (!regex.test(periodo)) {
            throw new BadRequestException('El periodo debe tener formato YYYY-MM');
        }
    }

    private async generarNumeroFactura() {
        const year = new Date().getFullYear();

        const total = await this.prisma.factura.count({
            where: {
                numeroFactura: {
                    startsWith: `FAC-${year}-`,
                },
            },
        });

        return `FAC-${year}-${String(total + 1).padStart(6, '0')}`;
    }

    private async obtenerTarifaAplicable(categoriaId: number, consumoM3: number) {
        const tarifa = await this.prisma.tarifa.findFirst({
            where: {
                categoriaId,
                activo: true,
                rangoDesde: {
                    lte: consumoM3,
                },
                OR: [
                    {
                        rangoHasta: null,
                    },
                    {
                        rangoHasta: {
                            gte: consumoM3,
                        },
                    },
                ],
            },
            orderBy: {
                rangoDesde: 'desc',
            },
            include: {
                categoria: true,
            },
        });

        if (!tarifa) {
            throw new BadRequestException(
                'No existe una tarifa activa aplicable para esta categoría y consumo',
            );
        }

        return tarifa;
    }

    private calcularFechaVencimiento() {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + 15);
        return fecha;
    }

    async generarPorLectura(lecturaId: number) {
        const lectura = await this.prisma.lectura.findUnique({
            where: {
                id: lecturaId,
            },
            include: {
                factura: true,
                medidor: {
                    include: {
                        ciudadano: {
                            include: {
                                categoria: true,
                                usuario: true,
                            },
                        },
                    },
                },
            },
        });

        if (!lectura) {
            throw new NotFoundException('Lectura no encontrada');
        }

        if (lectura.estado !== EstadoLectura.CONFIRMADA) {
            throw new BadRequestException(
                'Solo se puede generar factura desde una lectura CONFIRMADA',
            );
        }

        if (lectura.factura) {
            throw new BadRequestException('Esta lectura ya tiene una factura generada');
        }

        const ciudadano = lectura.medidor.ciudadano;
        const consumoM3 = Number(lectura.consumoM3);

        const tarifa = await this.obtenerTarifaAplicable(
            ciudadano.categoriaId,
            consumoM3,
        );

        const precioM3 = Number(tarifa.precioM3);
        const cargoFijo = Number(tarifa.cargoFijo);
        const montoAgua = consumoM3 * precioM3;
        const multa = 0;
        const montoTotal = montoAgua + cargoFijo + multa;
        const numeroFactura = await this.generarNumeroFactura();

        return this.prisma.$transaction(async (tx) => {
            const factura = await tx.factura.create({
                data: {
                    numeroFactura,
                    ciudadanoId: ciudadano.usuarioId,
                    lecturaId: lectura.id,
                    periodo: lectura.periodo,
                    consumoM3,
                    montoAgua,
                    cargoFijo,
                    multa,
                    montoTotal,
                    estado: EstadoFactura.PENDIENTE,
                    fechaVencimiento: this.calcularFechaVencimiento(),
                    detalles: {
                        create: [
                            {
                                descripcion: `Consumo de agua potable periodo ${lectura.periodo}`,
                                cantidad: consumoM3,
                                precioUnitario: precioM3,
                                subtotal: montoAgua,
                            },
                            {
                                descripcion: 'Cargo fijo del servicio',
                                cantidad: 1,
                                precioUnitario: cargoFijo,
                                subtotal: cargoFijo,
                            },
                        ],
                    },
                },
                include: this.facturaInclude(),
            });

            await tx.ciudadano.update({
                where: {
                    usuarioId: ciudadano.usuarioId,
                },
                data: {
                    estadoServicio: EstadoServicio.CON_DEUDA,
                },
            });

            return factura;
        });
    }

    async findAll(filtros: FilterFacturasDto) {
        const where: any = {};

        if (filtros.ciudadanoId) {
            where.ciudadanoId = filtros.ciudadanoId;
        }

        if (filtros.periodo) {
            this.validarPeriodo(filtros.periodo);
            where.periodo = filtros.periodo;
        }

        if (filtros.estado) {
            where.estado = filtros.estado;
        }

        if (filtros.buscar) {
            const buscar = filtros.buscar.trim();

            where.OR = [
                {
                    numeroFactura: {
                        contains: buscar,
                        mode: 'insensitive',
                    },
                },
                {
                    ciudadano: {
                        codigoCliente: {
                            contains: buscar,
                            mode: 'insensitive',
                        },
                    },
                },
                {
                    ciudadano: {
                        usuario: {
                            ci: {
                                contains: buscar,
                                mode: 'insensitive',
                            },
                        },
                    },
                },
                {
                    ciudadano: {
                        usuario: {
                            nombre: {
                                contains: buscar,
                                mode: 'insensitive',
                            },
                        },
                    },
                },
                {
                    ciudadano: {
                        usuario: {
                            apellido: {
                                contains: buscar,
                                mode: 'insensitive',
                            },
                        },
                    },
                },
            ];
        }

        return this.prisma.factura.findMany({
            where,
            include: this.facturaInclude(),
            orderBy: {
                fechaEmision: 'desc',
            },
        });
    }

    async resumen() {
        const [
            total,
            pendientes,
            pagadas,
            vencidas,
            anuladas,
            montoPendiente,
            montoPagado,
        ] = await Promise.all([
            this.prisma.factura.count(),
            this.prisma.factura.count({
                where: {
                    estado: EstadoFactura.PENDIENTE,
                },
            }),
            this.prisma.factura.count({
                where: {
                    estado: EstadoFactura.PAGADA,
                },
            }),
            this.prisma.factura.count({
                where: {
                    estado: EstadoFactura.VENCIDA,
                },
            }),
            this.prisma.factura.count({
                where: {
                    estado: EstadoFactura.ANULADA,
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
            this.prisma.factura.aggregate({
                where: {
                    estado: EstadoFactura.PAGADA,
                },
                _sum: {
                    montoTotal: true,
                },
            }),
        ]);

        return {
            total,
            estados: {
                pendientes,
                pagadas,
                vencidas,
                anuladas,
            },
            montos: {
                pendiente: Number(montoPendiente._sum.montoTotal ?? 0),
                pagado: Number(montoPagado._sum.montoTotal ?? 0),
            },
        };
    }

    async findOne(id: number) {
        const factura = await this.prisma.factura.findUnique({
            where: { id },
            include: this.facturaInclude(),
        });

        if (!factura) {
            throw new NotFoundException('Factura no encontrada');
        }

        return factura;
    }

    async findByNumero(numeroFactura: string) {
        const factura = await this.prisma.factura.findUnique({
            where: {
                numeroFactura: numeroFactura.trim().toUpperCase(),
            },
            include: this.facturaInclude(),
        });

        if (!factura) {
            throw new NotFoundException('Factura no encontrada');
        }

        return factura;
    }

    async findByCiudadano(usuarioId: number) {
        return this.prisma.factura.findMany({
            where: {
                ciudadanoId: usuarioId,
            },
            include: this.facturaInclude(),
            orderBy: {
                fechaEmision: 'desc',
            },
        });
    }

    async pendientesByCiudadano(usuarioId: number) {
        return this.prisma.factura.findMany({
            where: {
                ciudadanoId: usuarioId,
                estado: {
                    in: [EstadoFactura.PENDIENTE, EstadoFactura.VENCIDA],
                },
            },
            include: this.facturaInclude(),
            orderBy: {
                fechaVencimiento: 'asc',
            },
        });
    }

    async deudaByCiudadano(usuarioId: number) {
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
                    },
                },
            },
        });

        if (!ciudadano) {
            throw new NotFoundException('Ciudadano no encontrado');
        }

        const facturas = await this.pendientesByCiudadano(usuarioId);

        const totalDeuda = facturas.reduce((acc, factura) => {
            return acc + Number(factura.montoTotal);
        }, 0);

        return {
            ciudadano,
            totalDeuda,
            cantidadFacturas: facturas.length,
            facturas,
        };
    }

    async findByPeriodo(periodo: string) {
        this.validarPeriodo(periodo);

        return this.prisma.factura.findMany({
            where: {
                periodo,
            },
            include: this.facturaInclude(),
            orderBy: {
                fechaEmision: 'desc',
            },
        });
    }

    async anular(id: number) {
        const factura = await this.prisma.factura.findUnique({
            where: { id },
            include: {
                pago: true,
            },
        });

        if (!factura) {
            throw new NotFoundException('Factura no encontrada');
        }

        if (factura.estado === EstadoFactura.PAGADA || factura.pago) {
            throw new BadRequestException('No se puede anular una factura pagada');
        }

        return this.prisma.factura.update({
            where: { id },
            data: {
                estado: EstadoFactura.ANULADA,
            },
            include: this.facturaInclude(),
        });
    }

    async marcarVencida(id: number) {
        const factura = await this.prisma.factura.findUnique({
            where: { id },
        });

        if (!factura) {
            throw new NotFoundException('Factura no encontrada');
        }

        if (factura.estado !== EstadoFactura.PENDIENTE) {
            throw new BadRequestException(
                'Solo se pueden marcar como vencidas las facturas pendientes',
            );
        }

        return this.prisma.factura.update({
            where: { id },
            data: {
                estado: EstadoFactura.VENCIDA,
            },
            include: this.facturaInclude(),
        });
    }
}