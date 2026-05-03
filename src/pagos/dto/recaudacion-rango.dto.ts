import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class RecaudacionRangoDto {
    @ApiProperty({
        example: '2026-05-01',
        description: 'Fecha inicial',
    })
    @IsDateString()
    fechaDesde!: string;

    @ApiProperty({
        example: '2026-05-31',
        description: 'Fecha final',
    })
    @IsDateString()
    fechaHasta!: string;
}