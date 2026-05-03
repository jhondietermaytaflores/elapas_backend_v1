import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';

@Injectable()
export class RolesService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createRolDto: CreateRolDto) {
        const nombre = createRolDto.nombre.trim().toUpperCase();

        const existeRol = await this.prisma.rol.findUnique({
            where: { nombre },
        });

        if (existeRol) {
            throw new BadRequestException('Ya existe un rol con ese nombre');
        }

        return this.prisma.rol.create({
            data: {
                nombre,
            },
        });
    }

    async findAll() {
        return this.prisma.rol.findMany({
            orderBy: {
                id: 'asc',
            },
            include: {
                _count: {
                    select: {
                        usuarios: true,
                    },
                },
            },
        });
    }

    async findOne(id: number) {
        const rol = await this.prisma.rol.findUnique({
            where: { id },
            include: {
                usuarios: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        ci: true,
                        email: true,
                        activo: true,
                    },
                },
            },
        });

        if (!rol) {
            throw new NotFoundException('Rol no encontrado');
        }

        return rol;
    }

    async update(id: number, updateRolDto: UpdateRolDto) {
        await this.findOne(id);

        if (!updateRolDto.nombre) {
            throw new BadRequestException('Debe enviar al menos un campo para actualizar');
        }

        const nombre = updateRolDto.nombre.trim().toUpperCase();

        const rolExistente = await this.prisma.rol.findUnique({
            where: { nombre },
        });

        if (rolExistente && rolExistente.id !== id) {
            throw new BadRequestException('Ya existe otro rol con ese nombre');
        }

        return this.prisma.rol.update({
            where: { id },
            data: {
                nombre,
            },
        });
    }

    async remove(id: number) {
        const rol = await this.prisma.rol.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        usuarios: true,
                    },
                },
            },
        });

        if (!rol) {
            throw new NotFoundException('Rol no encontrado');
        }

        if (rol._count.usuarios > 0) {
            throw new BadRequestException(
                'No se puede eliminar el rol porque tiene usuarios asignados',
            );
        }

        await this.prisma.rol.delete({
            where: { id },
        });

        return {
            message: 'Rol eliminado correctamente',
        };
    }
}