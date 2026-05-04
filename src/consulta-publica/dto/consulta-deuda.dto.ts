import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ConsultaDeudaDto {
    @ApiPropertyOptional({
        example: '7458392',
        description: 'Carnet de identidad del ciudadano',
    })
    @IsString()
    @IsOptional()
    @MaxLength(30)
    ci?: string;

    @ApiPropertyOptional({
        example: 'CLI-0001',
        description: 'Código de cliente del ciudadano',
    })
    @IsString()
    @IsOptional()
    @MaxLength(50)
    codigoCliente?: string;
}