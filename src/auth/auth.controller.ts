import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @ApiOperation({
        summary: 'Iniciar sesión',
        description: 'Permite iniciar sesión usando CI y contraseña.',
    })
    @ApiBody({ type: LoginDto })
    @ApiResponse({
        status: 201,
        description: 'Login exitoso. Retorna token JWT y datos del usuario.',
    })
    @ApiResponse({
        status: 401,
        description: 'Credenciales incorrectas o usuario desactivado.',
    })
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Obtener perfil del usuario autenticado',
        description: 'Retorna los datos del usuario según el token JWT enviado.',
    })
    @ApiResponse({
        status: 200,
        description: 'Perfil del usuario autenticado.',
    })
    @ApiResponse({
        status: 401,
        description: 'Token inválido, expirado o no enviado.',
    })
    profile(@GetUser() user: any) {
        return this.authService.profile(user.id);
    }
}


/* @Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    profile(@GetUser() user: any) {
        return this.authService.profile(user.id);
    }
} */