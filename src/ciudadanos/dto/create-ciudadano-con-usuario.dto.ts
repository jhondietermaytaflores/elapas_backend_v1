import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';
import { EstadoServicio } from '../../generated/prisma/enums';

export class CreateCiudadanoConUsuarioDto {
    @ApiProperty({
        example: 'Rodrigo',
        description: 'Nombre del ciudadano',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    nombre!: string;

    @ApiPropertyOptional({
        example: 'Yañez Mamani',
        description: 'Apellido del ciudadano',
    })
    @IsString()
    @IsOptional()
    @MaxLength(150)
    apellido?: string;

    @ApiProperty({
        example: '5678123',
        description: 'Carnet de identidad único',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(30)
    ci!: string;

    @ApiPropertyOptional({
        example: 'rodrigo@elapas.test',
        description: 'Correo electrónico',
    })
    @IsEmail()
    @IsOptional()
    @MaxLength(150)
    email?: string;

    @ApiProperty({
        example: 'user123',
        description: 'Contraseña del ciudadano',
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password!: string;

    @ApiPropertyOptional({
        example: '70000004',
        description: 'Teléfono del ciudadano',
    })
    @IsString()
    @IsOptional()
    @MaxLength(30)
    telefono?: string;

    @ApiPropertyOptional({
        example: 'CLI-0003',
        description:
            'Código único de cliente. Si no se envía, se genera automáticamente.',
    })
    @IsString()
    @IsOptional()
    @MaxLength(50)
    codigoCliente?: string;

    @ApiProperty({
        example: 1,
        description: 'ID de la categoría tarifaria',
    })
    @IsInt()
    categoriaId!: number;

    @ApiProperty({
        example: 2,
        description: 'ID del distrito',
    })
    @IsInt()
    distritoId!: number;

    @ApiProperty({
        example: 'Barrio Lajastambo Sector B',
        description: 'Dirección del ciudadano',
    })
    @IsString()
    @IsNotEmpty()
    direccion!: string;

    @ApiPropertyOptional({
        example: 'Casa con portón azul',
        description: 'Referencia de ubicación',
    })
    @IsString()
    @IsOptional()
    referencia?: string;

    @ApiPropertyOptional({
        example: EstadoServicio.ACTIVO,
        enum: EstadoServicio,
        description: 'Estado del servicio',
    })
    @IsEnum(EstadoServicio)
    @IsOptional()
    estadoServicio?: EstadoServicio;
}