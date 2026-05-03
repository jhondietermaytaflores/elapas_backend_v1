import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class EjecutarCorteDto {
    @ApiPropertyOptional({
        example: -19.047,
        description: 'Latitud GPS donde se ejecutó el corte',
    })
    @IsNumber()
    @IsOptional()
    latitud?: number;

    @ApiPropertyOptional({
        example: -65.259,
        description: 'Longitud GPS donde se ejecutó el corte',
    })
    @IsNumber()
    @IsOptional()
    longitud?: number;

    @ApiPropertyOptional({
        example: 'https://storage.app/corte-1.jpg',
        description: 'URL de fotografía de evidencia del corte',
    })
    @IsString()
    @IsOptional()
    fotoEvidenciaUrl?: string;

    @ApiPropertyOptional({
        example: 'Corte ejecutado correctamente en domicilio.',
        description: 'Observación del técnico',
    })
    @IsString()
    @IsOptional()
    observacion?: string;
}