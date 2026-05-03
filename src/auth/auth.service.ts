import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    async login(loginDto: LoginDto) {
        const { ci, password } = loginDto;

        const usuario = await this.prisma.usuario.findUnique({
            where: { ci },
            include: {
                rol: true,
                ciudadano: true,
            },
        });

        if (!usuario) {
            throw new UnauthorizedException('Credenciales incorrectas');
        }

        if (!usuario.activo) {
            throw new UnauthorizedException('El usuario está desactivado');
        }

        const passwordValido = await bcrypt.compare(password, usuario.password);

        if (!passwordValido) {
            throw new UnauthorizedException('Credenciales incorrectas');
        }

        await this.prisma.usuario.update({
            where: { id: usuario.id },
            data: {
                ultimoLogin: new Date(),
            },
        });

        const payload = {
            sub: usuario.id,
            ci: usuario.ci,
            rol: usuario.rol.nombre,
        };

        const accessToken = await this.jwtService.signAsync(payload);

        return {
            access_token: accessToken,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                ci: usuario.ci,
                email: usuario.email,
                telefono: usuario.telefono,
                rol: usuario.rol.nombre,
                ciudadano: usuario.ciudadano,
            },
        };
    }

    async profile(userId: number) {
        if (!userId) {
            throw new BadRequestException('ID de usuario no válido');
        }

        const usuario = await this.prisma.usuario.findUnique({
            where: { id: userId },
            include: {
                rol: true,
                ciudadano: {
                    include: {
                        categoria: true,
                        distrito: true,
                    },
                },
            },
        });

        if (!usuario) {
            throw new UnauthorizedException('Usuario no encontrado');
        }

        return {
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            ci: usuario.ci,
            email: usuario.email,
            telefono: usuario.telefono,
            activo: usuario.activo,
            ultimoLogin: usuario.ultimoLogin,
            rol: usuario.rol.nombre,
            ciudadano: usuario.ciudadano,
            createdAt: usuario.createdAt,
            updatedAt: usuario.updatedAt,
        };
    }
}