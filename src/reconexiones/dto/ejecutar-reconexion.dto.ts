import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class EjecutarReconexionDto {
    @ApiPropertyOptional({
        example: -19.047,
        description: 'Latitud GPS donde se ejecutó la reconexión',
    })
    @IsNumber()
    @IsOptional()
    latitud?: number;

    @ApiPropertyOptional({
        example: -65.259,
        description: 'Longitud GPS donde se ejecutó la reconexión',
    })
    @IsNumber()
    @IsOptional()
    longitud?: number;

    @ApiPropertyOptional({
        example: 'foto-reconexion-1.jpg',
        description: 'URL o nombre de fotografía de evidencia',
    })
    @IsString()
    @IsOptional()
    fotoEvidenciaUrl?: string;

    @ApiPropertyOptional({
        example: 'Reconexión ejecutada correctamente.',
        description: 'Observación del técnico',
    })
    @IsString()
    @IsOptional()
    observacion?: string;
}