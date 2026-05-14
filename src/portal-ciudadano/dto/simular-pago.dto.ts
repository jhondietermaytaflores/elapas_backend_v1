import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SimularPagoDto {
    @ApiPropertyOptional({
        example: 1,
        description:
            'ID del método de pago. Si no se envía, se intentará usar QR_SIMPLE o EFECTIVO.',
    })
    @IsInt()
    @IsOptional()
    metodoId?: number;

    @ApiPropertyOptional({
        example: 45.3,
        description:
            'Monto pagado. Si no se envía, se usará el monto total de la factura.',
    })
    @IsNumber()
    @Min(0)
    @IsOptional()
    montoPagado?: number;

    @ApiPropertyOptional({
        example: 'SIM-QR-0001',
        description: 'Referencia simulada de transacción.',
    })
    @IsString()
    @IsOptional()
    referenciaTransaccion?: string;

    @ApiPropertyOptional({
        example: 'QR-SIMULADO-0001',
        description: 'Referencia QR simulada.',
    })
    @IsString()
    @IsOptional()
    qrReferencia?: string;

    @ApiPropertyOptional({
        example: 'Pago simulado desde portal ciudadano.',
        description: 'Observación del pago.',
    })
    @IsString()
    @IsOptional()
    observacion?: string;
}