import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelarCorteDto {
    @ApiPropertyOptional({
        example: 'Corte cancelado por regularización de deuda.',
        description: 'Motivo u observación de cancelación',
    })
    @IsString()
    @IsOptional()
    observacion?: string;
}