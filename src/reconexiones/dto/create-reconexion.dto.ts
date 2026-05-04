import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsDateString,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export class CreateReconexionDto {
    @ApiProperty({
        example: 2,
        description: 'usuarioId del ciudadano',
    })
    @IsInt()
    ciudadanoId!: number;

    @ApiPropertyOptional({
        example: 1,
        description: 'ID del corte relacionado',
    })
    @IsInt()
    @IsOptional()
    corteId?: number;

    @ApiPropertyOptional({
        example: 3,
        description: 'ID del técnico asignado',
    })
    @IsInt()
    @IsOptional()
    tecnicoId?: number;

    @ApiPropertyOptional({
        example: 25,
        description: 'Costo de reconexión',
    })
    @IsNumber()
    @Min(0)
    @IsOptional()
    costoReconexion?: number;

    @ApiPropertyOptional({
        example: '2026-05-10T08:00:00.000Z',
        description: 'Fecha programada para la reconexión',
    })
    @IsDateString()
    @IsOptional()
    fechaProgramada?: string;

    @ApiPropertyOptional({
        example: 'Reconexión solicitada tras regularización de deuda.',
        description: 'Observación inicial',
    })
    @IsString()
    @IsOptional()
    observacion?: string;
}