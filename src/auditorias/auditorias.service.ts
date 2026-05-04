import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuditoriaLogDto } from './dto/create-auditoria-log.dto';
import { FilterAuditoriasDto } from './dto/filter-auditorias.dto';

@Injectable()
export class AuditoriasService {
    constructor(private readonly prisma: PrismaService) { }

    private auditoriaInclude() {
        return {
            usuario: {
                select: {
                    id: true,
                    nombre: true,
                    apellido: true,
                    ci: true,
                    email: true,
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

    async registrarLog(dto: CreateAuditoriaLogDto) {
        return this.prisma.auditoria.create({
            data: {
                usuarioId: dto.usuarioId ?? null,
                accion: dto.accion.trim().toUpperCase(),
                entidad: dto.entidad.trim(),
                entidadId: dto.entidadId ?? null,
                descripcion: dto.descripcion?.trim() ?? null,
                ip: dto.ip?.trim() ?? null,
            },
        });
    }

    async findAll(filtros: FilterAuditoriasDto) {
        const where: any = {};

        if (filtros.usuarioId) {
            where.usuarioId = filtros.usuarioId;
        }

        if (filtros.accion) {
            where.accion = {
                contains: filtros.accion.trim(),
                mode: 'insensitive',
            };
        }

        if (filtros.entidad) {
            where.entidad = {
                contains: filtros.entidad.trim(),
                mode: 'insensitive',
            };
        }

        if (filtros.entidadId) {
            where.entidadId = filtros.entidadId;
        }

        if (filtros.fechaDesde || filtros.fechaHasta) {
            where.createdAt = {};

            if (filtros.fechaDesde) {
                where.createdAt.gte = this.normalizarFechaInicio(filtros.fechaDesde);
            }

            if (filtros.fechaHasta) {
                where.createdAt.lte = this.normalizarFechaFin(filtros.fechaHasta);
            }
        }

        if (filtros.buscar) {
            const buscar = filtros.buscar.trim();

            where.OR = [
                {
                    accion: {
                        contains: buscar,
                        mode: 'insensitive',
                    },
                },
                {
                    entidad: {
                        contains: buscar,
                        mode: 'insensitive',
                    },
                },
                {
                    descripcion: {
                        contains: buscar,
                        mode: 'insensitive',
                    },
                },
                {
                    usuario: {
                        nombre: {
                            contains: buscar,
                            mode: 'insensitive',
                        },
                    },
                },
                {
                    usuario: {
                        apellido: {
                            contains: buscar,
                            mode: 'insensitive',
                        },
                    },
                },
                {
                    usuario: {
                        ci: {
                            contains: buscar,
                            mode: 'insensitive',
                        },
                    },
                },
            ];
        }

        return this.prisma.auditoria.findMany({
            where,
            include: this.auditoriaInclude(),
            orderBy: {
                createdAt: 'desc',
            },
            take: 300,
        });
    }

    async resumen() {
        const [total, porAccion, porEntidad, ultimas] = await Promise.all([
            this.prisma.auditoria.count(),

            this.prisma.auditoria.groupBy({
                by: ['accion'],
                _count: {
                    id: true,
                },
                orderBy: {
                    _count: {
                        id: 'desc',
                    },
                },
            }),

            this.prisma.auditoria.groupBy({
                by: ['entidad'],
                _count: {
                    id: true,
                },
                orderBy: {
                    _count: {
                        id: 'desc',
                    },
                },
            }),

            this.prisma.auditoria.findMany({
                take: 10,
                include: this.auditoriaInclude(),
                orderBy: {
                    createdAt: 'desc',
                },
            }),
        ]);

        return {
            total,
            porAccion: porAccion.map((item) => ({
                accion: item.accion,
                cantidad: item._count.id,
            })),
            porEntidad: porEntidad.map((item) => ({
                entidad: item.entidad,
                cantidad: item._count.id,
            })),
            ultimas,
        };
    }

    async findOne(id: number) {
        const auditoria = await this.prisma.auditoria.findUnique({
            where: { id },
            include: this.auditoriaInclude(),
        });

        if (!auditoria) {
            throw new NotFoundException('Registro de auditoría no encontrado');
        }

        return auditoria;
    }

    async findByUsuario(usuarioId: number) {
        return this.prisma.auditoria.findMany({
            where: {
                usuarioId,
            },
            include: this.auditoriaInclude(),
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async findByEntidad(entidad: string) {
        return this.prisma.auditoria.findMany({
            where: {
                entidad: {
                    contains: entidad.trim(),
                    mode: 'insensitive',
                },
            },
            include: this.auditoriaInclude(),
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
}