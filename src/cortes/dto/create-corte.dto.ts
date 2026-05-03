import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsDateString,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export class CreateCorteDto {
    @ApiProperty({
        example: 2,
        description: 'usuarioId del ciudadano',
    })
    @IsInt()
    ciudadanoId!: number;

    @ApiPropertyOptional({
        example: 3,
        description:
            'ID del técnico asignado. Si no se envía, se puede asignar al ejecutar.',
    })
    @IsInt()
    @IsOptional()
    tecnicoId?: number;

    @ApiProperty({
        example: 'Corte programado por deuda vencida.',
        description: 'Motivo del corte',
    })
    @IsString()
    @IsNotEmpty()
    motivo!: string;

    @ApiPropertyOptional({
        example: 120.5,
        description:
            'Deuda total. Si no se envía, se calcula con facturas pendientes/vencidas.',
    })
    @IsNumber()
    @Min(0)
    @IsOptional()
    deudaTotal?: number;

    @ApiPropertyOptional({
        example: 2,
        description:
            'Cantidad de facturas vencidas/pendientes. Si no se envía, se calcula automáticamente.',
    })
    @IsInt()
    @IsOptional()
    facturasVencidas?: number;

    @ApiPropertyOptional({
        example: '2026-05-10T08:00:00.000Z',
        description: 'Fecha programada para el corte',
    })
    @IsDateString()
    @IsOptional()
    fechaProgramada?: string;

    @ApiPropertyOptional({
        example: 'Observación inicial del corte.',
        description: 'Observación',
    })
    @IsString()
    @IsOptional()
    observacion?: string;
}