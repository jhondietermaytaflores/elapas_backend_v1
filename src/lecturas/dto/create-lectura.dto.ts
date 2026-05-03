import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsDateString,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreateLecturaDto {
    @ApiProperty({
        example: 1,
        description: 'ID del medidor',
    })
    @IsInt()
    medidorId!: number;

    @ApiProperty({
        example: '2026-05',
        description: 'Periodo de lectura en formato YYYY-MM',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(7)
    periodo!: string;

    @ApiPropertyOptional({
        example: 120.5,
        description:
            'Lectura anterior. Si no se envía, el sistema intentará calcularla automáticamente.',
    })
    @IsNumber()
    @IsOptional()
    lecturaAnterior?: number;

    @ApiProperty({
        example: 135.8,
        description: 'Lectura actual registrada por el técnico',
    })
    @IsNumber()
    lecturaActual!: number;

    @ApiPropertyOptional({
        example: '2026-05-03T10:30:00.000Z',
        description: 'Fecha de lectura. Si no se envía, se usa la fecha actual.',
    })
    @IsDateString()
    @IsOptional()
    fechaLectura?: string;

    @ApiPropertyOptional({
        example: -19.047,
        description: 'Latitud GPS del registro de lectura',
    })
    @IsNumber()
    @IsOptional()
    latitud?: number;

    @ApiPropertyOptional({
        example: -65.259,
        description: 'Longitud GPS del registro de lectura',
    })
    @IsNumber()
    @IsOptional()
    longitud?: number;

    @ApiPropertyOptional({
        example: 'https://storage.app/foto-lectura-1.jpg',
        description: 'URL de la fotografía de evidencia',
    })
    @IsString()
    @IsOptional()
    fotoEvidenciaUrl?: string;

    @ApiPropertyOptional({
        example: 'Lectura registrada sin observaciones.',
        description: 'Observación del técnico',
    })
    @IsString()
    @IsOptional()
    observacion?: string;
}