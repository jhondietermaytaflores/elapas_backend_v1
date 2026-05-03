import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoriaTarifaDto } from './dto/create-categoria-tarifa.dto';
import { UpdateCategoriaTarifaDto } from './dto/update-categoria-tarifa.dto';

@Injectable()
export class CategoriasTarifaService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createDto: CreateCategoriaTarifaDto) {
        const nombre = createDto.nombre.trim().toUpperCase();

        const existeCategoria = await this.prisma.categoriaTarifa.findUnique({
            where: { nombre },
        });

        if (existeCategoria) {
            throw new BadRequestException(
                'Ya existe una categoría tarifaria con ese nombre',
            );
        }

        return this.prisma.categoriaTarifa.create({
            data: {
                nombre,
                descripcion: createDto.descripcion?.trim(),
                activo: createDto.activo ?? true,
            },
        });
    }

    async findAll() {
        return this.prisma.categoriaTarifa.findMany({
            orderBy: {
                id: 'asc',
            },
            include: {
                _count: {
                    select: {
                        ciudadanos: true,
                        tarifas: true,
                    },
                },
            },
        });
    }

    async findActivas() {
        return this.prisma.categoriaTarifa.findMany({
            where: {
                activo: true,
            },
            orderBy: {
                nombre: 'asc',
            },
        });
    }

    async findOne(id: number) {
        const categoria = await this.prisma.categoriaTarifa.findUnique({
            where: { id },
            include: {
                tarifas: {
                    orderBy: {
                        rangoDesde: 'asc',
                    },
                },
                _count: {
                    select: {
                        ciudadanos: true,
                    },
                },
            },
        });

        if (!categoria) {
            throw new NotFoundException('Categoría tarifaria no encontrada');
        }

        return categoria;
    }

    async update(id: number, updateDto: UpdateCategoriaTarifaDto) {
        await this.findOne(id);

        const data: Record<string, unknown> = {};

        if (updateDto.nombre !== undefined) {
            const nombre = updateDto.nombre.trim().toUpperCase();

            const existeCategoria = await this.prisma.categoriaTarifa.findUnique({
                where: { nombre },
            });

            if (existeCategoria && existeCategoria.id !== id) {
                throw new BadRequestException(
                    'Ya existe otra categoría tarifaria con ese nombre',
                );
            }

            data.nombre = nombre;
        }

        if (updateDto.descripcion !== undefined) {
            data.descripcion = updateDto.descripcion?.trim() || null;
        }

        if (updateDto.activo !== undefined) {
            data.activo = updateDto.activo;
        }

        if (Object.keys(data).length === 0) {
            throw new BadRequestException('Debe enviar al menos un campo para actualizar');
        }

        return this.prisma.categoriaTarifa.update({
            where: { id },
            data,
        });
    }

    async remove(id: number) {
        const categoria = await this.prisma.categoriaTarifa.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        ciudadanos: true,
                        tarifas: true,
                    },
                },
            },
        });

        if (!categoria) {
            throw new NotFoundException('Categoría tarifaria no encontrada');
        }

        if (categoria._count.ciudadanos > 0 || categoria._count.tarifas > 0) {
            throw new BadRequestException(
                'No se puede eliminar la categoría porque tiene ciudadanos o tarifas asociadas. Puede desactivarla en su lugar.',
            );
        }

        await this.prisma.categoriaTarifa.delete({
            where: { id },
        });

        return {
            message: 'Categoría tarifaria eliminada correctamente',
        };
    }
}