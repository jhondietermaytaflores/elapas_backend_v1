import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    EstadoCorte,
    EstadoFactura,
    EstadoReconexion,
    EstadoServicio,
} from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CancelarReconexionDto } from './dto/cancelar-reconexion.dto';
import { CreateReconexionDto } from './dto/create-reconexion.dto';
import { EjecutarReconexionDto } from './dto/ejecutar-reconexion.dto';
import { FilterReconexionesDto } from './dto/filter-reconexiones.dto';
import { UpdateReconexionDto } from './dto/update-reconexion.dto';

@Injectable()
export class ReconexionesService {
    constructor(private readonly prisma: PrismaService) { }

    private reconexionInclude() {
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
            corte: true,
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
            where: { usuarioId: ciudadanoId },
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
            where: { id: tecnicoId },
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
                'El usuario asignado no tiene rol permitido para reconexiones',
            );
        }

        return tecnico;
    }

    private async validarSinDeuda(ciudadanoId: number) {
        const deudas = await this.prisma.factura.count({
            where: {
                ciudadanoId,
                estado: {
                    in: [EstadoFactura.PENDIENTE, EstadoFactura.VENCIDA],
                },
            },
        });

        if (deudas > 0) {
            throw new BadRequestException(
                'No se puede programar reconexión porque el ciudadano aún tiene deuda pendiente o vencida',
            );
        }
    }

    private async validarSinReconexionPendiente(ciudadanoId: number) {
        const reconexion = await this.prisma.reconexion.findFirst({
            where: {
                ciudadanoId,
                estado: EstadoReconexion.PENDIENTE,
            },
        });

        if (reconexion) {
            throw new BadRequestException(
                'El ciudadano ya tiene una reconexión pendiente',
            );
        }
    }

    private async validarCorte(corteId: number) {
        const corte = await this.prisma.corte.findUnique({
            where: {
                id: corteId,
            },
        });

        if (!corte) {
            throw new NotFoundException('Corte no encontrado');
        }

        if (corte.estado !== EstadoCorte.EJECUTADO) {
            throw new BadRequestException(
                'Solo se puede generar reconexión desde un corte EJECUTADO',
            );
        }

        return corte;
    }

    async create(dto: CreateReconexionDto) {
        const ciudadano = await this.validarCiudadano(dto.ciudadanoId);
        await this.validarSinDeuda(dto.ciudadanoId);
        await this.validarSinReconexionPendiente(dto.ciudadanoId);

        if (ciudadano.estadoServicio !== EstadoServicio.CORTADO) {
            throw new BadRequestException(
                'Solo se puede programar reconexión si el ciudadano está CORTADO',
            );
        }

        if (dto.tecnicoId !== undefined) {
            await this.validarTecnico(dto.tecnicoId);
        }

        if (dto.corteId !== undefined) {
            const corte = await this.validarCorte(dto.corteId);

            if (corte.ciudadanoId !== dto.ciudadanoId) {
                throw new BadRequestException(
                    'El corte no pertenece al ciudadano indicado',
                );
            }
        }

        return this.prisma.reconexion.create({
            data: {
                ciudadanoId: dto.ciudadanoId,
                corteId: dto.corteId,
                tecnicoId: dto.tecnicoId,
                costoReconexion: dto.costoReconexion ?? 0,
                estado: EstadoReconexion.PENDIENTE,
                fechaProgramada: dto.fechaProgramada
                    ? new Date(dto.fechaProgramada)
                    : undefined,
                observacion: dto.observacion?.trim(),
            },
            include: this.reconexionInclude(),
        });
    }

    async generarPorCorte(corteId: number) {
        const corte = await this.validarCorte(corteId);

        const ciudadano = await this.validarCiudadano(corte.ciudadanoId);

        if (ciudadano.estadoServicio !== EstadoServicio.CORTADO) {
            throw new BadRequestException(
                'El ciudadano debe estar CORTADO para generar reconexión',
            );
        }

        await this.validarSinDeuda(corte.ciudadanoId);
        await this.validarSinReconexionPendiente(corte.ciudadanoId);

        return this.prisma.reconexion.create({
            data: {
                ciudadanoId: corte.ciudadanoId,
                corteId: corte.id,
                costoReconexion: 0,
                estado: EstadoReconexion.PENDIENTE,
                observacion: 'Reconexión generada desde corte ejecutado.',
            },
            include: this.reconexionInclude(),
        });
    }

    async findAll(filtros: FilterReconexionesDto) {
        const where: any = {};

        if (filtros.ciudadanoId) {
            where.ciudadanoId = filtros.ciudadanoId;
        }

        if (filtros.corteId) {
            where.corteId = filtros.corteId;
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
                where.fechaProgramada.gte = this.normalizarFechaInicio(
                    filtros.fechaDesde,
                );
            }

            if (filtros.fechaHasta) {
                where.fechaProgramada.lte = this.normalizarFechaFin(filtros.fechaHasta);
            }
        }

        if (filtros.buscar) {
            const buscar = filtros.buscar.trim();

            where.OR = [
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

        return this.prisma.reconexion.findMany({
            where,
            include: this.reconexionInclude(),
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async resumen() {
        const [total, pendientes, ejecutadas, canceladas, costoPendiente] =
            await Promise.all([
                this.prisma.reconexion.count(),
                this.prisma.reconexion.count({
                    where: {
                        estado: EstadoReconexion.PENDIENTE,
                    },
                }),
                this.prisma.reconexion.count({
                    where: {
                        estado: EstadoReconexion.EJECUTADA,
                    },
                }),
                this.prisma.reconexion.count({
                    where: {
                        estado: EstadoReconexion.CANCELADA,
                    },
                }),
                this.prisma.reconexion.aggregate({
                    where: {
                        estado: EstadoReconexion.PENDIENTE,
                    },
                    _sum: {
                        costoReconexion: true,
                    },
                }),
            ]);

        return {
            total,
            estados: {
                pendientes,
                ejecutadas,
                canceladas,
            },
            costoPendiente: Number(costoPendiente._sum.costoReconexion ?? 0),
        };
    }

    async pendientes() {
        return this.prisma.reconexion.findMany({
            where: {
                estado: EstadoReconexion.PENDIENTE,
            },
            include: this.reconexionInclude(),
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
        const reconexion = await this.prisma.reconexion.findUnique({
            where: {
                id,
            },
            include: this.reconexionInclude(),
        });

        if (!reconexion) {
            throw new NotFoundException('Reconexión no encontrada');
        }

        return reconexion;
    }

    async findByCiudadano(usuarioId: number) {
        await this.validarCiudadano(usuarioId);

        return this.prisma.reconexion.findMany({
            where: {
                ciudadanoId: usuarioId,
            },
            include: this.reconexionInclude(),
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async update(id: number, dto: UpdateReconexionDto) {
        const reconexion = await this.prisma.reconexion.findUnique({
            where: { id },
        });

        if (!reconexion) {
            throw new NotFoundException('Reconexión no encontrada');
        }

        if (reconexion.estado !== EstadoReconexion.PENDIENTE) {
            throw new BadRequestException(
                'Solo se pueden editar reconexiones en estado PENDIENTE',
            );
        }

        const data: any = {};

        if (dto.ciudadanoId !== undefined) {
            await this.validarCiudadano(dto.ciudadanoId);
            await this.validarSinDeuda(dto.ciudadanoId);
            data.ciudadanoId = dto.ciudadanoId;
        }

        if (dto.corteId !== undefined) {
            const corte = await this.validarCorte(dto.corteId);

            const ciudadanoId = dto.ciudadanoId ?? reconexion.ciudadanoId;

            if (corte.ciudadanoId !== ciudadanoId) {
                throw new BadRequestException(
                    'El corte no pertenece al ciudadano indicado',
                );
            }

            data.corteId = dto.corteId;
        }

        if (dto.tecnicoId !== undefined) {
            await this.validarTecnico(dto.tecnicoId);
            data.tecnicoId = dto.tecnicoId;
        }

        if (dto.costoReconexion !== undefined) {
            data.costoReconexion = dto.costoReconexion;
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

        return this.prisma.reconexion.update({
            where: { id },
            data,
            include: this.reconexionInclude(),
        });
    }

    async ejecutar(id: number, dto: EjecutarReconexionDto, tecnicoId: number) {
        const reconexion = await this.prisma.reconexion.findUnique({
            where: { id },
        });

        if (!reconexion) {
            throw new NotFoundException('Reconexión no encontrada');
        }

        if (reconexion.estado !== EstadoReconexion.PENDIENTE) {
            throw new BadRequestException(
                'Solo se pueden ejecutar reconexiones en estado PENDIENTE',
            );
        }

        await this.validarTecnico(tecnicoId);
        await this.validarSinDeuda(reconexion.ciudadanoId);

        return this.prisma.$transaction(async (tx) => {
            const reconexionEjecutada = await tx.reconexion.update({
                where: { id },
                data: {
                    tecnicoId,
                    estado: EstadoReconexion.EJECUTADA,
                    fechaEjecucion: new Date(),
                    latitud: dto.latitud,
                    longitud: dto.longitud,
                    fotoEvidenciaUrl: dto.fotoEvidenciaUrl?.trim(),
                    observacion: dto.observacion?.trim() || reconexion.observacion,
                },
                include: this.reconexionInclude(),
            });

            await tx.ciudadano.update({
                where: {
                    usuarioId: reconexion.ciudadanoId,
                },
                data: {
                    estadoServicio: EstadoServicio.ACTIVO,
                },
            });

            return reconexionEjecutada;
        });
    }

    async cancelar(id: number, dto: CancelarReconexionDto) {
        const reconexion = await this.prisma.reconexion.findUnique({
            where: { id },
        });

        if (!reconexion) {
            throw new NotFoundException('Reconexión no encontrada');
        }

        if (reconexion.estado !== EstadoReconexion.PENDIENTE) {
            throw new BadRequestException(
                'Solo se pueden cancelar reconexiones en estado PENDIENTE',
            );
        }

        return this.prisma.reconexion.update({
            where: { id },
            data: {
                estado: EstadoReconexion.CANCELADA,
                observacion: dto.observacion?.trim() || reconexion.observacion,
            },
            include: this.reconexionInclude(),
        });
    }

    async remove(id: number) {
        const reconexion = await this.prisma.reconexion.findUnique({
            where: { id },
        });

        if (!reconexion) {
            throw new NotFoundException('Reconexión no encontrada');
        }

        if (reconexion.estado === EstadoReconexion.EJECUTADA) {
            throw new BadRequestException(
                'No se puede eliminar una reconexión ejecutada',
            );
        }

        await this.prisma.reconexion.delete({
            where: { id },
        });

        return {
            message: 'Reconexión eliminada correctamente',
        };
    }
}