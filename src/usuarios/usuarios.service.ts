import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateEstadoUsuarioDto } from './dto/update-estado-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuariosService {
    constructor(private readonly prisma: PrismaService) { }

    private usuarioSelect() {
        return {
            id: true,
            nombre: true,
            apellido: true,
            ci: true,
            email: true,
            telefono: true,
            activo: true,
            ultimoLogin: true,
            createdAt: true,
            updatedAt: true,
            rol: {
                select: {
                    id: true,
                    nombre: true,
                },
            },
            ciudadano: true,
        };
    }

    async create(createUsuarioDto: CreateUsuarioDto) {
        const ci = createUsuarioDto.ci.trim();
        const email = createUsuarioDto.email?.trim().toLowerCase();

        const existeCi = await this.prisma.usuario.findUnique({
            where: { ci },
        });

        if (existeCi) {
            throw new BadRequestException('Ya existe un usuario con ese CI');
        }

        if (email) {
            const existeEmail = await this.prisma.usuario.findUnique({
                where: { email },
            });

            if (existeEmail) {
                throw new BadRequestException('Ya existe un usuario con ese email');
            }
        }

        const rol = await this.prisma.rol.findUnique({
            where: { id: createUsuarioDto.rolId },
        });

        if (!rol) {
            throw new NotFoundException('Rol no encontrado');
        }

        const passwordHasheado = await bcrypt.hash(createUsuarioDto.password, 10);

        return this.prisma.usuario.create({
            data: {
                nombre: createUsuarioDto.nombre.trim(),
                apellido: createUsuarioDto.apellido?.trim(),
                ci,
                email,
                password: passwordHasheado,
                telefono: createUsuarioDto.telefono?.trim(),
                rolId: createUsuarioDto.rolId,
                activo: createUsuarioDto.activo ?? true,
            },
            select: this.usuarioSelect(),
        });
    }

    async findAll() {
        return this.prisma.usuario.findMany({
            orderBy: {
                id: 'asc',
            },
            select: this.usuarioSelect(),
        });
    }

    async findOne(id: number) {
        const usuario = await this.prisma.usuario.findUnique({
            where: { id },
            select: this.usuarioSelect(),
        });

        if (!usuario) {
            throw new NotFoundException('Usuario no encontrado');
        }

        return usuario;
    }

    async update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
        await this.findOne(id);

        if (updateUsuarioDto.rolId) {
            const rol = await this.prisma.rol.findUnique({
                where: { id: updateUsuarioDto.rolId },
            });

            if (!rol) {
                throw new NotFoundException('Rol no encontrado');
            }
        }

        const data: Record<string, unknown> = {};

        if (updateUsuarioDto.nombre !== undefined) {
            data.nombre = updateUsuarioDto.nombre.trim();
        }

        if (updateUsuarioDto.apellido !== undefined) {
            data.apellido = updateUsuarioDto.apellido?.trim() || null;
        }

        if (updateUsuarioDto.ci !== undefined) {
            const ci = updateUsuarioDto.ci.trim();

            const existeCi = await this.prisma.usuario.findUnique({
                where: { ci },
            });

            if (existeCi && existeCi.id !== id) {
                throw new BadRequestException('Ya existe otro usuario con ese CI');
            }

            data.ci = ci;
        }

        if (updateUsuarioDto.email !== undefined) {
            const email = updateUsuarioDto.email?.trim().toLowerCase() || null;

            if (email) {
                const existeEmail = await this.prisma.usuario.findUnique({
                    where: { email },
                });

                if (existeEmail && existeEmail.id !== id) {
                    throw new BadRequestException('Ya existe otro usuario con ese email');
                }
            }

            data.email = email;
        }

        if (updateUsuarioDto.password !== undefined) {
            data.password = await bcrypt.hash(updateUsuarioDto.password, 10);
        }

        if (updateUsuarioDto.telefono !== undefined) {
            data.telefono = updateUsuarioDto.telefono?.trim() || null;
        }

        if (updateUsuarioDto.rolId !== undefined) {
            data.rolId = updateUsuarioDto.rolId;
        }

        if (updateUsuarioDto.activo !== undefined) {
            data.activo = updateUsuarioDto.activo;
        }

        if (Object.keys(data).length === 0) {
            throw new BadRequestException('Debe enviar al menos un campo para actualizar');
        }

        return this.prisma.usuario.update({
            where: { id },
            data,
            select: this.usuarioSelect(),
        });
    }

    async updateEstado(id: number, updateEstadoDto: UpdateEstadoUsuarioDto) {
        await this.findOne(id);

        return this.prisma.usuario.update({
            where: { id },
            data: {
                activo: updateEstadoDto.activo,
            },
            select: this.usuarioSelect(),
        });
    }

    async remove(id: number) {
        const usuario = await this.prisma.usuario.findUnique({
            where: { id },
            include: {
                ciudadano: true,
                lecturasRegistradas: true,
                pagosRegistrados: true,
                cortesEjecutados: true,
                reconexionesEjecutadas: true,
            },
        });

        if (!usuario) {
            throw new NotFoundException('Usuario no encontrado');
        }

        const tieneRelaciones =
            usuario.ciudadano ||
            usuario.lecturasRegistradas.length > 0 ||
            usuario.pagosRegistrados.length > 0 ||
            usuario.cortesEjecutados.length > 0 ||
            usuario.reconexionesEjecutadas.length > 0;

        if (tieneRelaciones) {
            throw new BadRequestException(
                'No se puede eliminar el usuario porque tiene registros relacionados. Puede desactivarlo en su lugar.',
            );
        }

        await this.prisma.usuario.delete({
            where: { id },
        });

        return {
            message: 'Usuario eliminado correctamente',
        };
    }
}