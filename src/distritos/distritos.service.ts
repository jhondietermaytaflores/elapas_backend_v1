import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDistritoDto } from './dto/create-distrito.dto';
import { UpdateDistritoDto } from './dto/update-distrito.dto';

@Injectable()
export class DistritosService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createDistritoDto: CreateDistritoDto) {
        const nombre = createDistritoDto.nombre.trim();

        const existeDistrito = await this.prisma.distrito.findUnique({
            where: { nombre },
        });

        if (existeDistrito) {
            throw new BadRequestException('Ya existe un distrito con ese nombre');
        }

        return this.prisma.distrito.create({
            data: {
                nombre,
                descripcion: createDistritoDto.descripcion?.trim(),
                activo: createDistritoDto.activo ?? true,
            },
        });
    }

    async findAll() {
        return this.prisma.distrito.findMany({
            orderBy: {
                id: 'asc',
            },
            include: {
                _count: {
                    select: {
                        ciudadanos: true,
                    },
                },
            },
        });
    }

    async findActivos() {
        return this.prisma.distrito.findMany({
            where: {
                activo: true,
            },
            orderBy: {
                nombre: 'asc',
            },
        });
    }

    async findOne(id: number) {
        const distrito = await this.prisma.distrito.findUnique({
            where: { id },
            include: {
                ciudadanos: {
                    select: {
                        usuarioId: true,
                        codigoCliente: true,
                        direccion: true,
                        estadoServicio: true,
                        usuario: {
                            select: {
                                id: true,
                                nombre: true,
                                apellido: true,
                                ci: true,
                                telefono: true,
                            },
                        },
                    },
                },
            },
        });

        if (!distrito) {
            throw new NotFoundException('Distrito no encontrado');
        }

        return distrito;
    }

    async update(id: number, updateDistritoDto: UpdateDistritoDto) {
        await this.findOne(id);

        const data: Record<string, unknown> = {};

        if (updateDistritoDto.nombre !== undefined) {
            const nombre = updateDistritoDto.nombre.trim();

            const existeDistrito = await this.prisma.distrito.findUnique({
                where: { nombre },
            });

            if (existeDistrito && existeDistrito.id !== id) {
                throw new BadRequestException('Ya existe otro distrito con ese nombre');
            }

            data.nombre = nombre;
        }

        if (updateDistritoDto.descripcion !== undefined) {
            data.descripcion = updateDistritoDto.descripcion?.trim() || null;
        }

        if (updateDistritoDto.activo !== undefined) {
            data.activo = updateDistritoDto.activo;
        }

        if (Object.keys(data).length === 0) {
            throw new BadRequestException('Debe enviar al menos un campo para actualizar');
        }

        return this.prisma.distrito.update({
            where: { id },
            data,
        });
    }

    async remove(id: number) {
        const distrito = await this.prisma.distrito.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        ciudadanos: true,
                    },
                },
            },
        });

        if (!distrito) {
            throw new NotFoundException('Distrito no encontrado');
        }

        if (distrito._count.ciudadanos > 0) {
            throw new BadRequestException(
                'No se puede eliminar el distrito porque tiene ciudadanos asociados. Puede desactivarlo en su lugar.',
            );
        }

        await this.prisma.distrito.delete({
            where: { id },
        });

        return {
            message: 'Distrito eliminado correctamente',
        };
    }
}