import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsDateString,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';
import { EstadoMedidor } from '../../generated/prisma/enums';

export class CreateMedidorDto {
    @ApiProperty({
        example: 'MED-0005',
        description: 'Código único interno del medidor',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(80)
    codigoMedidor!: string;

    @ApiProperty({
        example: '00012349',
        description: 'Número de serie único del medidor',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    numeroSerie!: string;

    @ApiProperty({
        example: 2,
        description: 'usuarioId del ciudadano propietario del medidor',
    })
    @IsInt()
    ciudadanoId!: number;

    @ApiPropertyOptional({
        example: 'ELSTER',
        description: 'Marca del medidor',
    })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    marca?: string;

    @ApiPropertyOptional({
        example: 'A100',
        description: 'Modelo del medidor',
    })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    modelo?: string;

    @ApiPropertyOptional({
        example: '2026-05-03',
        description: 'Fecha de instalación del medidor',
    })
    @IsDateString()
    @IsOptional()
    fechaInstalacion?: string;

    @ApiPropertyOptional({
        example: 0,
        description: 'Lectura inicial del medidor',
    })
    @IsNumber()
    @IsOptional()
    lecturaInicial?: number;

    @ApiPropertyOptional({
        example: EstadoMedidor.ACTIVO,
        enum: EstadoMedidor,
        description: 'Estado del medidor',
    })
    @IsEnum(EstadoMedidor)
    @IsOptional()
    estado?: EstadoMedidor;
}