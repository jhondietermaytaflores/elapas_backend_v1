import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

interface JwtPayload {
    sub: number;
    ci: string;
    rol: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly prisma: PrismaService,
        configService: ConfigService,
    ) {
        const secret = configService.get<string>('JWT_SECRET');

        if (!secret) {
            throw new Error('JWT_SECRET no está definido en el archivo .env');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
        });
    }

    async validate(payload: JwtPayload) {
        const usuario = await this.prisma.usuario.findUnique({
            where: {
                id: payload.sub,
            },
            include: {
                rol: true,
                ciudadano: true,
            },
        });

        if (!usuario || !usuario.activo) {
            throw new UnauthorizedException('Usuario no autorizado');
        }

        return {
            id: usuario.id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            ci: usuario.ci,
            email: usuario.email,
            telefono: usuario.telefono,
            rol: usuario.rol.nombre,
            ciudadano: usuario.ciudadano,
        };
    }
}