import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMetodoPagoDto } from './dto/create-metodo-pago.dto';
import { UpdateMetodoPagoDto } from './dto/update-metodo-pago.dto';

@Injectable()
export class MetodosPagoService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createDto: CreateMetodoPagoDto) {
        const nombre = createDto.nombre.trim().toUpperCase();

        const existeMetodo = await this.prisma.metodoPago.findUnique({
            where: { nombre },
        });

        if (existeMetodo) {
            throw new BadRequestException('Ya existe un método de pago con ese nombre');
        }

        return this.prisma.metodoPago.create({
            data: {
                nombre,
                descripcion: createDto.descripcion?.trim(),
                activo: createDto.activo ?? true,
            },
        });
    }

    async findAll() {
        return this.prisma.metodoPago.findMany({
            orderBy: {
                id: 'asc',
            },
            include: {
                _count: {
                    select: {
                        pagos: true,
                    },
                },
            },
        });
    }

    async findActivos() {
        return this.prisma.metodoPago.findMany({
            where: {
                activo: true,
            },
            orderBy: {
                nombre: 'asc',
            },
        });
    }

    async findOne(id: number) {
        const metodo = await this.prisma.metodoPago.findUnique({
            where: { id },
            include: {
                pagos: {
                    select: {
                        id: true,
                        codigoPago: true,
                        montoPagado: true,
                        estado: true,
                        fechaPago: true,
                    },
                    orderBy: {
                        fechaPago: 'desc',
                    },
                    take: 20,
                },
                _count: {
                    select: {
                        pagos: true,
                    },
                },
            },
        });

        if (!metodo) {
            throw new NotFoundException('Método de pago no encontrado');
        }

        return metodo;
    }

    async update(id: number, updateDto: UpdateMetodoPagoDto) {
        await this.findOne(id);

        const data: Record<string, unknown> = {};

        if (updateDto.nombre !== undefined) {
            const nombre = updateDto.nombre.trim().toUpperCase();

            const existeMetodo = await this.prisma.metodoPago.findUnique({
                where: { nombre },
            });

            if (existeMetodo && existeMetodo.id !== id) {
                throw new BadRequestException(
                    'Ya existe otro método de pago con ese nombre',
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

        return this.prisma.metodoPago.update({
            where: { id },
            data,
        });
    }

    async remove(id: number) {
        const metodo = await this.prisma.metodoPago.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        pagos: true,
                    },
                },
            },
        });

        if (!metodo) {
            throw new NotFoundException('Método de pago no encontrado');
        }

        if (metodo._count.pagos > 0) {
            throw new BadRequestException(
                'No se puede eliminar el método de pago porque tiene pagos asociados. Puede desactivarlo en su lugar.',
            );
        }

        await this.prisma.metodoPago.delete({
            where: { id },
        });

        return {
            message: 'Método de pago eliminado correctamente',
        };
    }
}