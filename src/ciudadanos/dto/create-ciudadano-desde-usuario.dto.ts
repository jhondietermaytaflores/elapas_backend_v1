import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';
import { EstadoServicio } from '../../generated/prisma/enums';

export class CreateCiudadanoDesdeUsuarioDto {
    @ApiProperty({
        example: 11,
        description: 'ID del usuario que será registrado como ciudadano',
    })
    @IsInt()
    usuarioId!: number;

    @ApiPropertyOptional({
        example: 'CLI-0003',
        description:
            'Código único del cliente. Si no se envía, el sistema puede generarlo.',
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
        example: 'Zona Villa Armonía Calle 5',
        description: 'Dirección del ciudadano',
    })
    @IsString()
    @IsNotEmpty()
    direccion!: string;

    @ApiPropertyOptional({
        example: 'Cerca de la plaza principal de la zona',
        description: 'Referencia adicional de ubicación',
    })
    @IsString()
    @IsOptional()
    referencia?: string;

    @ApiPropertyOptional({
        example: EstadoServicio.ACTIVO,
        enum: EstadoServicio,
        description: 'Estado del servicio del ciudadano',
    })
    @IsEnum(EstadoServicio)
    @IsOptional()
    estadoServicio?: EstadoServicio;
}