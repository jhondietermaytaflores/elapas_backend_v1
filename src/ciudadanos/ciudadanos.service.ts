import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { EstadoMedidor, EstadoServicio } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCiudadanoConUsuarioDto } from './dto/create-ciudadano-con-usuario.dto';
import { CreateCiudadanoDesdeUsuarioDto } from './dto/create-ciudadano-desde-usuario.dto';
import { CreateMedidorCiudadanoDto } from './dto/create-medidor-ciudadano.dto';
import { FilterCiudadanosDto } from './dto/filter-ciudadanos.dto';
import { UpdateCiudadanoDto } from './dto/update-ciudadano.dto';
import { UpdateEstadoServicioDto } from './dto/update-estado-servicio.dto';

@Injectable()
export class CiudadanosService {
    constructor(private readonly prisma: PrismaService) { }

    private ciudadanoInclude() {
        return {
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
            medidores: {
                orderBy: {
                    id: 'asc' as const,
                },
            },
            facturas: {
                select: {
                    id: true,
                    numeroFactura: true,
                    periodo: true,
                    montoTotal: true,
                    estado: true,
                    fechaEmision: true,
                    fechaVencimiento: true,
                },
                orderBy: {
                    fechaEmision: 'desc' as const,
                },
                take: 10,
            },
            cortes: {
                select: {
                    id: true,
                    estado: true,
                    motivo: true,
                    deudaTotal: true,
                    facturasVencidas: true,
                    fechaProgramada: true,
                    fechaEjecucion: true,
                },
                orderBy: {
                    createdAt: 'desc' as const,
                },
                take: 10,
            },
            reconexiones: {
                select: {
                    id: true,
                    estado: true,
                    costoReconexion: true,
                    fechaProgramada: true,
                    fechaEjecucion: true,
                },
                orderBy: {
                    createdAt: 'desc' as const,
                },
                take: 10,
            },
        };
    }

    private async generarCodigoCliente() {
        const ultimo = await this.prisma.ciudadano.findFirst({
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                codigoCliente: true,
            },
        });

        if (!ultimo?.codigoCliente) {
            return 'CLI-0001';
        }

        const numeroActual = Number(ultimo.codigoCliente.replace('CLI-', ''));

        if (Number.isNaN(numeroActual)) {
            return `CLI-${Date.now()}`;
        }

        const siguiente = numeroActual + 1;

        return `CLI-${String(siguiente).padStart(4, '0')}`;
    }

    private async validarCategoriaDistrito(categoriaId: number, distritoId: number) {
        const categoria = await this.prisma.categoriaTarifa.findUnique({
            where: {
                id: categoriaId,
            },
        });

        if (!categoria) {
            throw new NotFoundException('Categoría tarifaria no encontrada');
        }

        if (!categoria.activo) {
            throw new BadRequestException('La categoría tarifaria está inactiva');
        }

        const distrito = await this.prisma.distrito.findUnique({
            where: {
                id: distritoId,
            },
        });

        if (!distrito) {
            throw new NotFoundException('Distrito no encontrado');
        }

        if (!distrito.activo) {
            throw new BadRequestException('El distrito está inactivo');
        }
    }

    async createDesdeUsuario(dto: CreateCiudadanoDesdeUsuarioDto) {
        const usuario = await this.prisma.usuario.findUnique({
            where: {
                id: dto.usuarioId,
            },
            include: {
                rol: true,
                ciudadano: true,
            },
        });

        if (!usuario) {
            throw new NotFoundException('Usuario no encontrado');
        }

        if (usuario.rol.nombre !== 'CIUDADANO') {
            throw new BadRequestException(
                'El usuario debe tener rol CIUDADANO para registrarse en catastro',
            );
        }

        if (usuario.ciudadano) {
            throw new BadRequestException('Este usuario ya tiene datos de ciudadano');
        }

        await this.validarCategoriaDistrito(dto.categoriaId, dto.distritoId);

        const codigoCliente =
            dto.codigoCliente?.trim().toUpperCase() || (await this.generarCodigoCliente());

        const existeCodigo = await this.prisma.ciudadano.findUnique({
            where: {
                codigoCliente,
            },
        });

        if (existeCodigo) {
            throw new BadRequestException('Ya existe un ciudadano con ese código cliente');
        }

        return this.prisma.ciudadano.create({
            data: {
                usuarioId: dto.usuarioId,
                codigoCliente,
                categoriaId: dto.categoriaId,
                distritoId: dto.distritoId,
                direccion: dto.direccion.trim(),
                referencia: dto.referencia?.trim(),
                estadoServicio: dto.estadoServicio ?? EstadoServicio.ACTIVO,
            },
            include: this.ciudadanoInclude(),
        });
    }

    async createConUsuario(dto: CreateCiudadanoConUsuarioDto) {
        const ci = dto.ci.trim();
        const email = dto.email?.trim().toLowerCase();

        const existeCi = await this.prisma.usuario.findUnique({
            where: {
                ci,
            },
        });

        if (existeCi) {
            throw new BadRequestException('Ya existe un usuario con ese CI');
        }

        if (email) {
            const existeEmail = await this.prisma.usuario.findUnique({
                where: {
                    email,
                },
            });

            if (existeEmail) {
                throw new BadRequestException('Ya existe un usuario con ese email');
            }
        }

        await this.validarCategoriaDistrito(dto.categoriaId, dto.distritoId);

        const rolCiudadano = await this.prisma.rol.findUnique({
            where: {
                nombre: 'CIUDADANO',
            },
        });

        if (!rolCiudadano) {
            throw new NotFoundException('Rol CIUDADANO no encontrado');
        }

        const codigoCliente =
            dto.codigoCliente?.trim().toUpperCase() || (await this.generarCodigoCliente());

        const existeCodigo = await this.prisma.ciudadano.findUnique({
            where: {
                codigoCliente,
            },
        });

        if (existeCodigo) {
            throw new BadRequestException('Ya existe un ciudadano con ese código cliente');
        }

        const passwordHasheado = await bcrypt.hash(dto.password, 10);

        return this.prisma.$transaction(async (tx) => {
            const usuario = await tx.usuario.create({
                data: {
                    nombre: dto.nombre.trim(),
                    apellido: dto.apellido?.trim(),
                    ci,
                    email,
                    password: passwordHasheado,
                    telefono: dto.telefono?.trim(),
                    rolId: rolCiudadano.id,
                    activo: true,
                },
            });

            return tx.ciudadano.create({
                data: {
                    usuarioId: usuario.id,
                    codigoCliente,
                    categoriaId: dto.categoriaId,
                    distritoId: dto.distritoId,
                    direccion: dto.direccion.trim(),
                    referencia: dto.referencia?.trim(),
                    estadoServicio: dto.estadoServicio ?? EstadoServicio.ACTIVO,
                },
                include: this.ciudadanoInclude(),
            });
        });
    }

    async findAll(filtros: FilterCiudadanosDto) {
        const where: Record<string, unknown> = {};

        if (filtros.distritoId) {
            where.distritoId = filtros.distritoId;
        }

        if (filtros.categoriaId) {
            where.categoriaId = filtros.categoriaId;
        }

        if (filtros.estadoServicio) {
            where.estadoServicio = filtros.estadoServicio;
        }

        if (filtros.buscar) {
            const buscar = filtros.buscar.trim();

            where.OR = [
                {
                    codigoCliente: {
                        contains: buscar,
                        mode: 'insensitive',
                    },
                },
                {
                    direccion: {
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

        return this.prisma.ciudadano.findMany({
            where,
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
                medidores: {
                    select: {
                        id: true,
                        codigoMedidor: true,
                        numeroSerie: true,
                        estado: true,
                        lecturaInicial: true,
                        fechaInstalacion: true,
                    },
                    orderBy: {
                        id: 'asc',
                    },
                },
                _count: {
                    select: {
                        medidores: true,
                        facturas: true,
                        cortes: true,
                        reconexiones: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async resumen() {
        const [
            totalCiudadanos,
            activos,
            conDeuda,
            cortados,
            suspendidos,
            totalMedidores,
            medidoresActivos,
        ] = await Promise.all([
            this.prisma.ciudadano.count(),
            this.prisma.ciudadano.count({
                where: {
                    estadoServicio: EstadoServicio.ACTIVO,
                },
            }),
            this.prisma.ciudadano.count({
                where: {
                    estadoServicio: EstadoServicio.CON_DEUDA,
                },
            }),
            this.prisma.ciudadano.count({
                where: {
                    estadoServicio: EstadoServicio.CORTADO,
                },
            }),
            this.prisma.ciudadano.count({
                where: {
                    estadoServicio: EstadoServicio.SUSPENDIDO,
                },
            }),
            this.prisma.medidor.count(),
            this.prisma.medidor.count({
                where: {
                    estado: EstadoMedidor.ACTIVO,
                },
            }),
        ]);

        return {
            totalCiudadanos,
            estadosServicio: {
                activos,
                conDeuda,
                cortados,
                suspendidos,
            },
            medidores: {
                total: totalMedidores,
                activos: medidoresActivos,
            },
        };
    }

    async disponiblesParaCatastro() {
        return this.prisma.usuario.findMany({
            where: {
                rol: {
                    nombre: 'CIUDADANO',
                },
                ciudadano: null,
                activo: true,
            },
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
            orderBy: {
                id: 'asc',
            },
        });
    }

    async findOne(usuarioId: number) {
        const ciudadano = await this.prisma.ciudadano.findUnique({
            where: {
                usuarioId,
            },
            include: this.ciudadanoInclude(),
        });

        if (!ciudadano) {
            throw new NotFoundException('Ciudadano no encontrado');
        }

        return ciudadano;
    }

    async findByCodigo(codigoCliente: string) {
        const ciudadano = await this.prisma.ciudadano.findUnique({
            where: {
                codigoCliente: codigoCliente.trim().toUpperCase(),
            },
            include: this.ciudadanoInclude(),
        });

        if (!ciudadano) {
            throw new NotFoundException('Ciudadano no encontrado');
        }

        return ciudadano;
    }

    async update(usuarioId: number, dto: UpdateCiudadanoDto) {
        await this.findOne(usuarioId);

        const data: Record<string, unknown> = {};

        if (dto.codigoCliente !== undefined) {
            const codigoCliente = dto.codigoCliente?.trim().toUpperCase();

            if (codigoCliente) {
                const existeCodigo = await this.prisma.ciudadano.findUnique({
                    where: {
                        codigoCliente,
                    },
                });

                if (existeCodigo && existeCodigo.usuarioId !== usuarioId) {
                    throw new BadRequestException(
                        'Ya existe otro ciudadano con ese código cliente',
                    );
                }

                data.codigoCliente = codigoCliente;
            }
        }

        if (dto.categoriaId !== undefined || dto.distritoId !== undefined) {
            const ciudadanoActual = await this.prisma.ciudadano.findUniqueOrThrow({
                where: {
                    usuarioId,
                },
            });

            await this.validarCategoriaDistrito(
                dto.categoriaId ?? ciudadanoActual.categoriaId,
                dto.distritoId ?? ciudadanoActual.distritoId,
            );
        }

        if (dto.categoriaId !== undefined) {
            data.categoriaId = dto.categoriaId;
        }

        if (dto.distritoId !== undefined) {
            data.distritoId = dto.distritoId;
        }

        if (dto.direccion !== undefined) {
            data.direccion = dto.direccion.trim();
        }

        if (dto.referencia !== undefined) {
            data.referencia = dto.referencia?.trim() || null;
        }

        if (dto.estadoServicio !== undefined) {
            data.estadoServicio = dto.estadoServicio;
        }

        if (Object.keys(data).length === 0) {
            throw new BadRequestException('Debe enviar al menos un campo para actualizar');
        }

        return this.prisma.ciudadano.update({
            where: {
                usuarioId,
            },
            data,
            include: this.ciudadanoInclude(),
        });
    }

    async updateEstadoServicio(
        usuarioId: number,
        dto: UpdateEstadoServicioDto,
    ) {
        await this.findOne(usuarioId);

        return this.prisma.ciudadano.update({
            where: {
                usuarioId,
            },
            data: {
                estadoServicio: dto.estadoServicio,
            },
            include: this.ciudadanoInclude(),
        });
    }

    async remove(usuarioId: number) {
        const ciudadano = await this.prisma.ciudadano.findUnique({
            where: {
                usuarioId,
            },
            include: {
                _count: {
                    select: {
                        medidores: true,
                        facturas: true,
                        cortes: true,
                        reconexiones: true,
                    },
                },
            },
        });

        if (!ciudadano) {
            throw new NotFoundException('Ciudadano no encontrado');
        }

        const tieneRelaciones =
            ciudadano._count.medidores > 0 ||
            ciudadano._count.facturas > 0 ||
            ciudadano._count.cortes > 0 ||
            ciudadano._count.reconexiones > 0;

        if (tieneRelaciones) {
            throw new BadRequestException(
                'No se puede eliminar el ciudadano porque tiene medidores, facturas, cortes o reconexiones asociadas.',
            );
        }

        await this.prisma.ciudadano.delete({
            where: {
                usuarioId,
            },
        });

        return {
            message: 'Ciudadano eliminado correctamente',
        };
    }

    async findMedidores(usuarioId: number) {
        await this.findOne(usuarioId);

        return this.prisma.medidor.findMany({
            where: {
                ciudadanoId: usuarioId,
            },
            orderBy: {
                id: 'asc',
            },
            include: {
                lecturas: {
                    orderBy: {
                        fechaLectura: 'desc',
                    },
                    take: 5,
                },
            },
        });
    }

    async createMedidor(
        usuarioId: number,
        dto: CreateMedidorCiudadanoDto,
    ) {
        await this.findOne(usuarioId);

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
                ciudadanoId: usuarioId,
                marca: dto.marca?.trim(),
                modelo: dto.modelo?.trim(),
                fechaInstalacion: dto.fechaInstalacion
                    ? new Date(dto.fechaInstalacion)
                    : undefined,
                lecturaInicial: dto.lecturaInicial ?? 0,
                estado: dto.estado ?? EstadoMedidor.ACTIVO,
            },
        });
    }
}