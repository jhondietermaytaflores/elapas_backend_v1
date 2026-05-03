import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { EstadoMedidor } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedidorDto } from './dto/create-medidor.dto';
import { FilterMedidoresDto } from './dto/filter-medidores.dto';
import { UpdateEstadoMedidorDto } from './dto/update-estado-medidor.dto';
import { UpdateMedidorDto } from './dto/update-medidor.dto';

@Injectable()
export class MedidoresService {
    constructor(private readonly prisma: PrismaService) { }

    private medidorInclude() {
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
            lecturas: {
                orderBy: {
                    fechaLectura: 'desc' as const,
                },
                take: 10,
            },
            _count: {
                select: {
                    lecturas: true,
                },
            },
        };
    }

    private async validarCiudadano(ciudadanoId: number) {
        const ciudadano = await this.prisma.ciudadano.findUnique({
            where: {
                usuarioId: ciudadanoId,
            },
            include: {
                usuario: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        ci: true,
                        activo: true,
                    },
                },
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

    async create(dto: CreateMedidorDto) {
        await this.validarCiudadano(dto.ciudadanoId);

        const codigoMedidor = dto.codigoMedidor.trim().toUpperCase();
        const numeroSerie = dto.numeroSerie.trim();

        const existeCodigo = await this.prisma.medidor.findUnique({
            where: {
                codigoMedidor,
            },
        });

        if (existeCodigo) {
            throw new BadRequestException('Ya existe un medidor con ese código');
        }

        const existeSerie = await this.prisma.medidor.findUnique({
            where: {
                numeroSerie,
            },
        });

        if (existeSerie) {
            throw new BadRequestException('Ya existe un medidor con ese número de serie');
        }

        return this.prisma.medidor.create({
            data: {
                codigoMedidor,
                numeroSerie,
                ciudadanoId: dto.ciudadanoId,
                marca: dto.marca?.trim(),
                modelo: dto.modelo?.trim(),
                fechaInstalacion: dto.fechaInstalacion
                    ? new Date(dto.fechaInstalacion)
                    : undefined,
                lecturaInicial: dto.lecturaInicial ?? 0,
                estado: dto.estado ?? EstadoMedidor.ACTIVO,
            },
            include: this.medidorInclude(),
        });
    }

    async findAll(filtros: FilterMedidoresDto) {
        const where: Record<string, unknown> = {};

        if (filtros.estado) {
            where.estado = filtros.estado;
        }

        if (filtros.ciudadanoId) {
            where.ciudadanoId = filtros.ciudadanoId;
        }

        if (filtros.distritoId) {
            where.ciudadano = {
                distritoId: filtros.distritoId,
            };
        }

        if (filtros.buscar) {
            const buscar = filtros.buscar.trim();

            where.OR = [
                {
                    codigoMedidor: {
                        contains: buscar,
                        mode: 'insensitive',
                    },
                },
                {
                    numeroSerie: {
                        contains: buscar,
                        mode: 'insensitive',
                    },
                },
                {
                    marca: {
                        contains: buscar,
                        mode: 'insensitive',
                    },
                },
                {
                    modelo: {
                        contains: buscar,
                        mode: 'insensitive',
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
                        codigoCliente: {
                            contains: buscar,
                            mode: 'insensitive',
                        },
                    },
                },
            ];
        }

        return this.prisma.medidor.findMany({
            where,
            include: {
                ciudadano: {
                    include: {
                        usuario: {
                            select: {
                                id: true,
                                nombre: true,
                                apellido: true,
                                ci: true,
                                telefono: true,
                                activo: true,
                            },
                        },
                        distrito: true,
                        categoria: true,
                    },
                },
                _count: {
                    select: {
                        lecturas: true,
                    },
                },
            },
            orderBy: {
                id: 'desc',
            },
        });
    }

    async resumen() {
        const [
            total,
            activos,
            danados,
            retirados,
            reemplazados,
            conLecturas,
            sinLecturas,
        ] = await Promise.all([
            this.prisma.medidor.count(),
            this.prisma.medidor.count({
                where: {
                    estado: EstadoMedidor.ACTIVO,
                },
            }),
            this.prisma.medidor.count({
                where: {
                    estado: EstadoMedidor.DANADO,
                },
            }),
            this.prisma.medidor.count({
                where: {
                    estado: EstadoMedidor.RETIRADO,
                },
            }),
            this.prisma.medidor.count({
                where: {
                    estado: EstadoMedidor.REEMPLAZADO,
                },
            }),
            this.prisma.medidor.count({
                where: {
                    lecturas: {
                        some: {},
                    },
                },
            }),
            this.prisma.medidor.count({
                where: {
                    lecturas: {
                        none: {},
                    },
                },
            }),
        ]);

        return {
            total,
            estados: {
                activos,
                danados,
                retirados,
                reemplazados,
            },
            lecturas: {
                conLecturas,
                sinLecturas,
            },
        };
    }

    async findOne(id: number) {
        const medidor = await this.prisma.medidor.findUnique({
            where: {
                id,
            },
            include: this.medidorInclude(),
        });

        if (!medidor) {
            throw new NotFoundException('Medidor no encontrado');
        }

        return medidor;
    }

    async findByCodigo(codigoMedidor: string) {
        const medidor = await this.prisma.medidor.findUnique({
            where: {
                codigoMedidor: codigoMedidor.trim().toUpperCase(),
            },
            include: this.medidorInclude(),
        });

        if (!medidor) {
            throw new NotFoundException('Medidor no encontrado');
        }

        return medidor;
    }

    async findBySerie(numeroSerie: string) {
        const medidor = await this.prisma.medidor.findUnique({
            where: {
                numeroSerie: numeroSerie.trim(),
            },
            include: this.medidorInclude(),
        });

        if (!medidor) {
            throw new NotFoundException('Medidor no encontrado');
        }

        return medidor;
    }

    async findByCiudadano(usuarioId: number) {
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

    async update(id: number, dto: UpdateMedidorDto) {
        await this.findOne(id);

        const data: Record<string, unknown> = {};

        if (dto.ciudadanoId !== undefined) {
            await this.validarCiudadano(dto.ciudadanoId);
            data.ciudadanoId = dto.ciudadanoId;
        }

        if (dto.codigoMedidor !== undefined) {
            const codigoMedidor = dto.codigoMedidor.trim().toUpperCase();

            const existeCodigo = await this.prisma.medidor.findUnique({
                where: {
                    codigoMedidor,
                },
            });

            if (existeCodigo && existeCodigo.id !== id) {
                throw new BadRequestException('Ya existe otro medidor con ese código');
            }

            data.codigoMedidor = codigoMedidor;
        }

        if (dto.numeroSerie !== undefined) {
            const numeroSerie = dto.numeroSerie.trim();

            const existeSerie = await this.prisma.medidor.findUnique({
                where: {
                    numeroSerie,
                },
            });

            if (existeSerie && existeSerie.id !== id) {
                throw new BadRequestException(
                    'Ya existe otro medidor con ese número de serie',
                );
            }

            data.numeroSerie = numeroSerie;
        }

        if (dto.marca !== undefined) {
            data.marca = dto.marca?.trim() || null;
        }

        if (dto.modelo !== undefined) {
            data.modelo = dto.modelo?.trim() || null;
        }

        if (dto.fechaInstalacion !== undefined) {
            data.fechaInstalacion = dto.fechaInstalacion
                ? new Date(dto.fechaInstalacion)
                : null;
        }

        if (dto.lecturaInicial !== undefined) {
            data.lecturaInicial = dto.lecturaInicial;
        }

        if (dto.estado !== undefined) {
            data.estado = dto.estado;
        }

        if (Object.keys(data).length === 0) {
            throw new BadRequestException('Debe enviar al menos un campo para actualizar');
        }

        return this.prisma.medidor.update({
            where: {
                id,
            },
            data,
            include: this.medidorInclude(),
        });
    }

    async updateEstado(id: number, dto: UpdateEstadoMedidorDto) {
        await this.findOne(id);

        return this.prisma.medidor.update({
            where: {
                id,
            },
            data: {
                estado: dto.estado,
            },
            include: this.medidorInclude(),
        });
    }

    async reasignar(id: number, usuarioId: number) {
        await this.findOne(id);
        await this.validarCiudadano(usuarioId);

        return this.prisma.medidor.update({
            where: {
                id,
            },
            data: {
                ciudadanoId: usuarioId,
            },
            include: this.medidorInclude(),
        });
    }

    async remove(id: number) {
        const medidor = await this.prisma.medidor.findUnique({
            where: {
                id,
            },
            include: {
                _count: {
                    select: {
                        lecturas: true,
                    },
                },
            },
        });

        if (!medidor) {
            throw new NotFoundException('Medidor no encontrado');
        }

        if (medidor._count.lecturas > 0) {
            throw new BadRequestException(
                'No se puede eliminar el medidor porque tiene lecturas registradas. Puede cambiar su estado a RETIRADO o REEMPLAZADO.',
            );
        }

        await this.prisma.medidor.delete({
            where: {
                id,
            },
        });

        return {
            message: 'Medidor eliminado correctamente',
        };
    }
}