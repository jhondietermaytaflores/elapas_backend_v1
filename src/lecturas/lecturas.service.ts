import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { EstadoLectura, EstadoMedidor } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLecturaDto } from './dto/create-lectura.dto';
import { FilterLecturasDto } from './dto/filter-lecturas.dto';
import { UpdateLecturaDto } from './dto/update-lectura.dto';

@Injectable()
export class LecturasService {
    constructor(private readonly prisma: PrismaService) { }

    private lecturaInclude() {
        return {
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
                                    email: true,
                                    telefono: true,
                                    activo: true,
                                },
                            },
                            categoria: true,
                            distrito: true,
                        },
                    },
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
        };
    }

    private validarPeriodo(periodo: string) {
        const regex = /^\d{4}-\d{2}$/;

        if (!regex.test(periodo)) {
            throw new BadRequestException('El periodo debe tener formato YYYY-MM');
        }

        const [anio, mes] = periodo.split('-').map(Number);

        if (mes < 1 || mes > 12) {
            throw new BadRequestException('El mes del periodo debe estar entre 01 y 12');
        }

        if (anio < 2000 || anio > 2100) {
            throw new BadRequestException('El año del periodo no es válido');
        }
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
                'El usuario asignado no tiene rol permitido para registrar lecturas',
            );
        }

        return tecnico;
    }

    private async validarMedidor(medidorId: number) {
        const medidor = await this.prisma.medidor.findUnique({
            where: {
                id: medidorId,
            },
            include: {
                ciudadano: {
                    include: {
                        usuario: true,
                    },
                },
            },
        });

        if (!medidor) {
            throw new NotFoundException('Medidor no encontrado');
        }

        if (medidor.estado !== EstadoMedidor.ACTIVO) {
            throw new BadRequestException(
                'Solo se pueden registrar lecturas de medidores activos',
            );
        }

        if (!medidor.ciudadano.usuario.activo) {
            throw new BadRequestException('El ciudadano asociado está inactivo');
        }

        return medidor;
    }

    private async obtenerLecturaAnterior(
        medidorId: number,
        lecturaAnteriorEnviada?: number,
    ) {
        if (lecturaAnteriorEnviada !== undefined) {
            return lecturaAnteriorEnviada;
        }

        const ultimaLectura = await this.prisma.lectura.findFirst({
            where: {
                medidorId,
                estado: {
                    not: EstadoLectura.ANULADA,
                },
            },
            orderBy: {
                fechaLectura: 'desc',
            },
        });

        if (ultimaLectura) {
            return Number(ultimaLectura.lecturaActual);
        }

        const medidor = await this.prisma.medidor.findUniqueOrThrow({
            where: {
                id: medidorId,
            },
            select: {
                lecturaInicial: true,
            },
        });

        return Number(medidor.lecturaInicial);
    }

    async create(dto: CreateLecturaDto, tecnicoId: number) {
        this.validarPeriodo(dto.periodo);

        await this.validarTecnico(tecnicoId);
        await this.validarMedidor(dto.medidorId);

        const existeLecturaPeriodo = await this.prisma.lectura.findUnique({
            where: {
                medidorId_periodo: {
                    medidorId: dto.medidorId,
                    periodo: dto.periodo,
                },
            },
        });

        if (existeLecturaPeriodo) {
            throw new BadRequestException(
                'Ya existe una lectura registrada para este medidor en el periodo indicado',
            );
        }

        const lecturaAnterior = await this.obtenerLecturaAnterior(
            dto.medidorId,
            dto.lecturaAnterior,
        );

        const lecturaActual = dto.lecturaActual;
        const consumoM3 = lecturaActual - lecturaAnterior;

        if (lecturaActual < lecturaAnterior) {
            throw new BadRequestException(
                'La lectura actual no puede ser menor que la lectura anterior',
            );
        }

        return this.prisma.lectura.create({
            data: {
                medidorId: dto.medidorId,
                tecnicoId,
                periodo: dto.periodo,
                lecturaAnterior,
                lecturaActual,
                consumoM3,
                fechaLectura: dto.fechaLectura ? new Date(dto.fechaLectura) : new Date(),
                latitud: dto.latitud,
                longitud: dto.longitud,
                fotoEvidenciaUrl: dto.fotoEvidenciaUrl?.trim(),
                observacion: dto.observacion?.trim(),
                estado: EstadoLectura.REGISTRADA,
            },
            include: this.lecturaInclude(),
        });
    }

    async findAll(filtros: FilterLecturasDto) {
        const where: Record<string, unknown> = {};  // si no funca usar: const where: any = {};


        if (filtros.medidorId) {
            where.medidorId = filtros.medidorId;
        }

        if (filtros.tecnicoId) {
            where.tecnicoId = filtros.tecnicoId;
        }

        if (filtros.periodo) {
            where.periodo = filtros.periodo;
        }

        if (filtros.estado) {
            where.estado = filtros.estado;
        }

        if (filtros.ciudadanoId) {
            where.medidor = {
                ciudadanoId: filtros.ciudadanoId,
            };
        }

        if (filtros.buscar) {
            const buscar = filtros.buscar.trim();

            where.OR = [
                {
                    periodo: {
                        contains: buscar,
                        mode: 'insensitive',
                    },
                },
                {
                    medidor: {
                        codigoMedidor: {
                            contains: buscar,
                            mode: 'insensitive',
                        },
                    },
                },
                {
                    medidor: {
                        numeroSerie: {
                            contains: buscar,
                            mode: 'insensitive',
                        },
                    },
                },
                {
                    medidor: {
                        ciudadano: {
                            codigoCliente: {
                                contains: buscar,
                                mode: 'insensitive',
                            },
                        },
                    },
                },
                {
                    medidor: {
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
                    medidor: {
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
                    medidor: {
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

        return this.prisma.lectura.findMany({
            where,
            include: this.lecturaInclude(),
            orderBy: {
                fechaLectura: 'desc',
            },
        });
    }

    async resumen() {
        const [
            total,
            registradas,
            confirmadas,
            anuladas,
            consumoTotal,
        ] = await Promise.all([
            this.prisma.lectura.count(),
            this.prisma.lectura.count({
                where: {
                    estado: EstadoLectura.REGISTRADA,
                },
            }),
            this.prisma.lectura.count({
                where: {
                    estado: EstadoLectura.CONFIRMADA,
                },
            }),
            this.prisma.lectura.count({
                where: {
                    estado: EstadoLectura.ANULADA,
                },
            }),
            this.prisma.lectura.aggregate({
                where: {
                    estado: {
                        not: EstadoLectura.ANULADA,
                    },
                },
                _sum: {
                    consumoM3: true,
                },
            }),
        ]);

        return {
            total,
            estados: {
                registradas,
                confirmadas,
                anuladas,
            },
            consumoTotalM3: Number(consumoTotal._sum.consumoM3 ?? 0),
        };
    }

    async findOne(id: number) {
        const lectura = await this.prisma.lectura.findUnique({
            where: {
                id,
            },
            include: this.lecturaInclude(),
        });

        if (!lectura) {
            throw new NotFoundException('Lectura no encontrada');
        }

        return lectura;
    }

    async findByMedidor(medidorId: number) {
        await this.validarMedidorExistente(medidorId);

        return this.prisma.lectura.findMany({
            where: {
                medidorId,
            },
            include: this.lecturaInclude(),
            orderBy: {
                fechaLectura: 'desc',
            },
        });
    }

    async findByCiudadano(usuarioId: number) {
        const ciudadano = await this.prisma.ciudadano.findUnique({
            where: {
                usuarioId,
            },
        });

        if (!ciudadano) {
            throw new NotFoundException('Ciudadano no encontrado');
        }

        return this.prisma.lectura.findMany({
            where: {
                medidor: {
                    ciudadanoId: usuarioId,
                },
            },
            include: this.lecturaInclude(),
            orderBy: {
                fechaLectura: 'desc',
            },
        });
    }

    async findByPeriodo(periodo: string) {
        this.validarPeriodo(periodo);

        return this.prisma.lectura.findMany({
            where: {
                periodo,
            },
            include: this.lecturaInclude(),
            orderBy: {
                fechaLectura: 'desc',
            },
        });
    }

    private async validarMedidorExistente(medidorId: number) {
        const medidor = await this.prisma.medidor.findUnique({
            where: {
                id: medidorId,
            },
        });

        if (!medidor) {
            throw new NotFoundException('Medidor no encontrado');
        }

        return medidor;
    }

    async update(id: number, dto: UpdateLecturaDto) {
        const lecturaActualDb = await this.prisma.lectura.findUnique({
            where: {
                id,
            },
        });

        if (!lecturaActualDb) {
            throw new NotFoundException('Lectura no encontrada');
        }

        if (lecturaActualDb.estado !== EstadoLectura.REGISTRADA) {
            throw new BadRequestException(
                'Solo se pueden editar lecturas en estado REGISTRADA',
            );
        }

        const data: Record<string, unknown> = {};

        const nuevoMedidorId = dto.medidorId ?? lecturaActualDb.medidorId;
        const nuevoPeriodo = dto.periodo ?? lecturaActualDb.periodo;

        if (dto.periodo !== undefined) {
            this.validarPeriodo(dto.periodo);
            data.periodo = dto.periodo;
        }

        if (dto.medidorId !== undefined) {
            await this.validarMedidor(dto.medidorId);
            data.medidorId = dto.medidorId;
        }

        if (dto.medidorId !== undefined || dto.periodo !== undefined) {
            const existe = await this.prisma.lectura.findUnique({
                where: {
                    medidorId_periodo: {
                        medidorId: nuevoMedidorId,
                        periodo: nuevoPeriodo,
                    },
                },
            });

            if (existe && existe.id !== id) {
                throw new BadRequestException(
                    'Ya existe otra lectura para ese medidor y periodo',
                );
            }
        }

        const lecturaAnterior =
            dto.lecturaAnterior !== undefined
                ? dto.lecturaAnterior
                : Number(lecturaActualDb.lecturaAnterior);

        const lecturaActual =
            dto.lecturaActual !== undefined
                ? dto.lecturaActual
                : Number(lecturaActualDb.lecturaActual);

        if (dto.lecturaAnterior !== undefined || dto.lecturaActual !== undefined) {
            if (lecturaActual < lecturaAnterior) {
                throw new BadRequestException(
                    'La lectura actual no puede ser menor que la lectura anterior',
                );
            }

            data.lecturaAnterior = lecturaAnterior;
            data.lecturaActual = lecturaActual;
            data.consumoM3 = lecturaActual - lecturaAnterior;
        }

        if (dto.fechaLectura !== undefined) {
            data.fechaLectura = dto.fechaLectura ? new Date(dto.fechaLectura) : new Date();
        }

        if (dto.latitud !== undefined) {
            data.latitud = dto.latitud;
        }

        if (dto.longitud !== undefined) {
            data.longitud = dto.longitud;
        }

        if (dto.fotoEvidenciaUrl !== undefined) {
            data.fotoEvidenciaUrl = dto.fotoEvidenciaUrl?.trim() || null;
        }

        if (dto.observacion !== undefined) {
            data.observacion = dto.observacion?.trim() || null;
        }

        if (Object.keys(data).length === 0) {
            throw new BadRequestException('Debe enviar al menos un campo para actualizar');
        }

        return this.prisma.lectura.update({
            where: {
                id,
            },
            data,
            include: this.lecturaInclude(),
        });
    }

    async confirmar(id: number) {
        const lectura = await this.prisma.lectura.findUnique({
            where: {
                id,
            },
            include: {
                factura: true,
            },
        });

        if (!lectura) {
            throw new NotFoundException('Lectura no encontrada');
        }

        if (lectura.estado === EstadoLectura.ANULADA) {
            throw new BadRequestException('No se puede confirmar una lectura anulada');
        }

        if (lectura.factura) {
            throw new BadRequestException(
                'La lectura ya tiene una factura asociada y no puede modificarse',
            );
        }

        return this.prisma.lectura.update({
            where: {
                id,
            },
            data: {
                estado: EstadoLectura.CONFIRMADA,
            },
            include: this.lecturaInclude(),
        });
    }

    async anular(id: number) {
        const lectura = await this.prisma.lectura.findUnique({
            where: {
                id,
            },
            include: {
                factura: true,
            },
        });

        if (!lectura) {
            throw new NotFoundException('Lectura no encontrada');
        }

        if (lectura.factura) {
            throw new BadRequestException(
                'No se puede anular una lectura que ya tiene factura asociada',
            );
        }

        return this.prisma.lectura.update({
            where: {
                id,
            },
            data: {
                estado: EstadoLectura.ANULADA,
            },
            include: this.lecturaInclude(),
        });
    }

    async remove(id: number) {
        const lectura = await this.prisma.lectura.findUnique({
            where: {
                id,
            },
            include: {
                factura: true,
            },
        });

        if (!lectura) {
            throw new NotFoundException('Lectura no encontrada');
        }

        if (lectura.factura) {
            throw new BadRequestException(
                'No se puede eliminar una lectura que ya tiene factura asociada',
            );
        }

        if (lectura.estado === EstadoLectura.CONFIRMADA) {
            throw new BadRequestException(
                'No se puede eliminar una lectura confirmada. Puede anularla si corresponde.',
            );
        }

        await this.prisma.lectura.delete({
            where: {
                id,
            },
        });

        return {
            message: 'Lectura eliminada correctamente',
        };
    }
}