import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelarReconexionDto {
    @ApiPropertyOptional({
        example: 'Reconexión cancelada por solicitud del usuario.',
        description: 'Motivo de cancelación',
    })
    @IsString()
    @IsOptional()
    observacion?: string;
}