import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsEmail,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';

export class CreateUsuarioDto {
    @ApiProperty({
        example: 'Luis Fernando',
        description: 'Nombre del usuario',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    nombre!: string;

    @ApiPropertyOptional({
        example: 'Rojas Pérez',
        description: 'Apellido del usuario',
    })
    @IsString()
    @IsOptional()
    @MaxLength(150)
    apellido?: string;

    @ApiProperty({
        example: '9876543',
        description: 'Carnet de identidad único del usuario',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(30)
    ci!: string;

    @ApiPropertyOptional({
        example: 'usuario@elapas.test',
        description: 'Correo electrónico único del usuario',
    })
    @IsEmail()
    @IsOptional()
    @MaxLength(150)
    email?: string;

    @ApiProperty({
        example: 'usuario123',
        description: 'Contraseña del usuario',
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password!: string;

    @ApiPropertyOptional({
        example: '70123456',
        description: 'Número de teléfono del usuario',
    })
    @IsString()
    @IsOptional()
    @MaxLength(30)
    telefono?: string;

    @ApiProperty({
        example: 3,
        description: 'ID del rol asignado al usuario',
    })
    @IsInt()
    rolId!: number;

    @ApiPropertyOptional({
        example: true,
        description: 'Estado activo/inactivo del usuario',
    })
    @IsBoolean()
    @IsOptional()
    activo?: boolean;
}