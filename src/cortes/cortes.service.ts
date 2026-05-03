import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    EstadoCorte,
    EstadoFactura,
    EstadoServicio,
} from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CancelarCorteDto } from './dto/cancelar-corte.dto';
import { CreateCorteDto } from './dto/create-corte.dto';
import { EjecutarCorteDto } from './dto/ejecutar-corte.dto';
import { FilterCortesDto } from './dto/filter-cortes.dto';
import { UpdateCorteDto } from './dto/update-corte.dto';

@Injectable()
export class CortesService {
    constructor(private readonly prisma: PrismaService) { }

    private corteInclude() {
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
                            activo: true,
                        },
                    },
                    categoria: true,
                    distrito: true,
                },
            },
            tecnico: {
                select: {
                    id: true,
                    nombre: true,
                    apellido: true,
                    ci: true,
                    email: true,
                    telefono: true,
                    rol: {
                        select: {
                            id: true,
                            nombre: true,
                        },
                    },
                },
            },
            reconexiones: {
                orderBy: {
                    createdAt: 'desc' as const,
                },
            },
        };
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

    private async validarCiudadano(ciudadanoId: number) {
        const ciudadano = await this.prisma.ciudadano.findUnique({
            where: {
                usuarioId: ciudadanoId,
            },
            include: {
                usuario: true,
            },
        });

        if (!ciudadano) {
            throw new NotFoundException('Ciudadano no encontrado');
        }

        if (!ciudadano.usuario.activo) {
            throw new BadRequestException('El usuario ciudadano está inactivo');
        }

        return ciudadano;
    }

    private async validarTecnico(tecnicoId: number) {
        const tecnico = await this.prisma.usuario.findUnique({
            where: {
                id: tecnicoId,
            },
            include: {
                rol: true,
            },
        });

        if (!tecnico) {
            throw new NotFoundException('Técnico no encontrado');
        }

        if (!tecnico.activo) {
            throw new BadRequestException('El técnico está inactivo');
        }

        const rolesPermitidos = ['TECNICO', 'ADMIN', 'SUPERVISOR'];

        if (!rolesPermitidos.includes(tecnico.rol.nombre)) {
            throw new BadRequestException(
                'El usuario asignado no tiene rol permitido para ejecutar cortes',
            );
        }

        return tecnico;
    }

    private async obtenerDeudaCiudadano(ciudadanoId: number) {
        const facturas = await this.prisma.factura.findMany({
            where: {
                ciudadanoId,
                estado: {
                    in: [EstadoFactura.PENDIENTE, EstadoFactura.VENCIDA],
                },
            },
            select: {
                id: true,
                numeroFactura: true,
                montoTotal: true,
                estado: true,
                fechaVencimiento: true,
            },
        });

        const deudaTotal = facturas.reduce((acc, factura) => {
            return acc + Number(factura.montoTotal);
        }, 0);

        return {
            facturas,
            deudaTotal,
            cantidadFacturas: facturas.length,
        };
    }

    private async validarSinCortePendiente(ciudadanoId: number) {
        const cortePendiente = await this.prisma.corte.findFirst({
            where: {
                ciudadanoId,
                estado: EstadoCorte.PENDIENTE,
            },
        });

        if (cortePendiente) {
            throw new BadRequestException(
                'El ciudadano ya tiene un corte pendiente programado',
            );
        }
    }

    async create(dto: CreateCorteDto) {
        await this.validarCiudadano(dto.ciudadanoId);
        await this.validarSinCortePendiente(dto.ciudadanoId);

        if (dto.tecnicoId !== undefined) {
            await this.validarTecnico(dto.tecnicoId);
        }

        const deuda = await this.obtenerDeudaCiudadano(dto.ciudadanoId);

        const deudaTotal = dto.deudaTotal ?? deuda.deudaTotal;
        const facturasVencidas = dto.facturasVencidas ?? deuda.cantidadFacturas;

        if (deudaTotal <= 0 || facturasVencidas <= 0) {
            throw new BadRequestException(
                'No se puede crear un corte si el ciudadano no tiene deuda pendiente o vencida',
            );
        }

        return this.prisma.corte.create({
            data: {
                ciudadanoId: dto.ciudadanoId,
                tecnicoId: dto.tecnicoId,
                motivo: dto.motivo.trim(),
                deudaTotal,
                facturasVencidas,
                estado: EstadoCorte.PENDIENTE,
                fechaProgramada: dto.fechaProgramada
                    ? new Date(dto.fechaProgramada)
                    : undefined,
                observacion: dto.observacion?.trim(),
            },
            include: this.corteInclude(),
        });
    }

    async generarPorDeuda(usuarioId: number) {
        await this.validarCiudadano(usuarioId);
        await this.validarSinCortePendiente(usuarioId);

        const deuda = await this.obtenerDeudaCiudadano(usuarioId);

        if (deuda.deudaTotal <= 0 || deuda.cantidadFacturas <= 0) {
            throw new BadRequestException(
                'El ciudadano no tiene deuda pendiente o vencida para generar corte',
            );
        }

        return this.prisma.corte.create({
            data: {
                ciudadanoId: usuarioId,
                motivo: 'Corte generado automáticamente por deuda pendiente o vencida.',
                deudaTotal: deuda.deudaTotal,
                facturasVencidas: deuda.cantidadFacturas,
                estado: EstadoCorte.PENDIENTE,
            },
            include: this.corteInclude(),
        });
    }

    async findAll(filtros: FilterCortesDto) {
        const where: any = {};

        if (filtros.ciudadanoId) {
            where.ciudadanoId = filtros.ciudadanoId;
        }

        if (filtros.tecnicoId) {
            where.tecnicoId = filtros.tecnicoId;
        }

        if (filtros.estado) {
            where.estado = filtros.estado;
        }

        if (filtros.fechaDesde || filtros.fechaHasta) {
            where.fechaProgramada = {};

            if (filtros.fechaDesde) {
                where.fechaProgramada.gte = this.normalizarFechaInicio(filtros.fechaDesde);
            }

            if (filtros.fechaHasta) {
                where.fechaProgramada.lte = this.normalizarFechaFin(filtros.fechaHasta);
            }
        }

        if (filtros.buscar) {
            const buscar = filtros.buscar.trim();

            where.OR = [
                {
                    motivo: {
                        contains: buscar,
                        mode: 'insensitive',
                    },
                },
                {
                    observacion: {
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

        return this.prisma.corte.findMany({
            where,
            include: this.corteInclude(),
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async resumen() {
        const [total, pendientes, ejecutados, cancelados, deudaProgramada] =
            await Promise.all([
                this.prisma.corte.count(),
                this.prisma.corte.count({
                    where: {
                        estado: EstadoCorte.PENDIENTE,
                    },
                }),
                this.prisma.corte.count({
                    where: {
                        estado: EstadoCorte.EJECUTADO,
                    },
                }),
                this.prisma.corte.count({
                    where: {
                        estado: EstadoCorte.CANCELADO,
                    },
                }),
                this.prisma.corte.aggregate({
                    where: {
                        estado: EstadoCorte.PENDIENTE,
                    },
                    _sum: {
                        deudaTotal: true,
                    },
                }),
            ]);

        return {
            total,
            estados: {
                pendientes,
                ejecutados,
                cancelados,
            },
            deudaProgramada: Number(deudaProgramada._sum.deudaTotal ?? 0),
        };
    }

    async pendientes() {
        return this.prisma.corte.findMany({
            where: {
                estado: EstadoCorte.PENDIENTE,
            },
            include: this.corteInclude(),
            orderBy: [
                {
                    fechaProgramada: 'asc',
                },
                {
                    createdAt: 'asc',
                },
            ],
        });
    }

    async findOne(id: number) {
        const corte = await this.prisma.corte.findUnique({
            where: {
                id,
            },
            include: this.corteInclude(),
        });

        if (!corte) {
            throw new NotFoundException('Corte no encontrado');
        }

        return corte;
    }

    async findByCiudadano(usuarioId: number) {
        await this.validarCiudadano(usuarioId);

        return this.prisma.corte.findMany({
            where: {
                ciudadanoId: usuarioId,
            },
            include: this.corteInclude(),
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async update(id: number, dto: UpdateCorteDto) {
        const corte = await this.prisma.corte.findUnique({
            where: { id },
        });

        if (!corte) {
            throw new NotFoundException('Corte no encontrado');
        }

        if (corte.estado !== EstadoCorte.PENDIENTE) {
            throw new BadRequestException(
                'Solo se pueden editar cortes en estado PENDIENTE',
            );
        }

        const data: any = {};

        if (dto.ciudadanoId !== undefined) {
            await this.validarCiudadano(dto.ciudadanoId);
            await this.validarSinCortePendiente(dto.ciudadanoId);
            data.ciudadanoId = dto.ciudadanoId;
        }

        if (dto.tecnicoId !== undefined) {
            await this.validarTecnico(dto.tecnicoId);
            data.tecnicoId = dto.tecnicoId;
        }

        if (dto.motivo !== undefined) {
            data.motivo = dto.motivo.trim();
        }

        if (dto.deudaTotal !== undefined) {
            data.deudaTotal = dto.deudaTotal;
        }

        if (dto.facturasVencidas !== undefined) {
            data.facturasVencidas = dto.facturasVencidas;
        }

        if (dto.fechaProgramada !== undefined) {
            data.fechaProgramada = dto.fechaProgramada
                ? new Date(dto.fechaProgramada)
                : null;
        }

        if (dto.observacion !== undefined) {
            data.observacion = dto.observacion?.trim() || null;
        }

        if (Object.keys(data).length === 0) {
            throw new BadRequestException('Debe enviar al menos un campo para actualizar');
        }

        return this.prisma.corte.update({
            where: { id },
            data,
            include: this.corteInclude(),
        });
    }

    async ejecutar(id: number, dto: EjecutarCorteDto, tecnicoId: number) {
        const corte = await this.prisma.corte.findUnique({
            where: { id },
        });

        if (!corte) {
            throw new NotFoundException('Corte no encontrado');
        }

        if (corte.estado !== EstadoCorte.PENDIENTE) {
            throw new BadRequestException(
                'Solo se pueden ejecutar cortes en estado PENDIENTE',
            );
        }

        await this.validarTecnico(tecnicoId);

        return this.prisma.$transaction(async (tx) => {
            const corteEjecutado = await tx.corte.update({
                where: { id },
                data: {
                    tecnicoId,
                    estado: EstadoCorte.EJECUTADO,
                    fechaEjecucion: new Date(),
                    latitud: dto.latitud,
                    longitud: dto.longitud,
                    fotoEvidenciaUrl: dto.fotoEvidenciaUrl?.trim(),
                    observacion: dto.observacion?.trim() || corte.observacion,
                },
                include: this.corteInclude(),
            });

            await tx.ciudadano.update({
                where: {
                    usuarioId: corte.ciudadanoId,
                },
                data: {
                    estadoServicio: EstadoServicio.CORTADO,
                },
            });

            return corteEjecutado;
        });
    }

    async cancelar(id: number, dto: CancelarCorteDto) {
        const corte = await this.prisma.corte.findUnique({
            where: { id },
        });

        if (!corte) {
            throw new NotFoundException('Corte no encontrado');
        }

        if (corte.estado !== EstadoCorte.PENDIENTE) {
            throw new BadRequestException(
                'Solo se pueden cancelar cortes en estado PENDIENTE',
            );
        }

        return this.prisma.corte.update({
            where: { id },
            data: {
                estado: EstadoCorte.CANCELADO,
                observacion: dto.observacion?.trim() || corte.observacion,
            },
            include: this.corteInclude(),
        });
    }

    async remove(id: number) {
        const corte = await this.prisma.corte.findUnique({
            where: { id },
            include: {
                reconexiones: true,
            },
        });

        if (!corte) {
            throw new NotFoundException('Corte no encontrado');
        }

        if (corte.estado === EstadoCorte.EJECUTADO) {
            throw new BadRequestException(
                'No se puede eliminar un corte ejecutado',
            );
        }

        if (corte.reconexiones.length > 0) {
            throw new BadRequestException(
                'No se puede eliminar el corte porque tiene reconexiones asociadas',
            );
        }

        await this.prisma.corte.delete({
            where: { id },
        });

        return {
            message: 'Corte eliminado correctamente',
        };
    }
}