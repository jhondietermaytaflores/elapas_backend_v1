import { Controller, Get, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { PortalCiudadanoService } from './portal-ciudadano.service';
import { Param, ParseIntPipe, } from '@nestjs/common';
import { Body, Post } from '@nestjs/common';
import { SimularPagoDto } from './dto/simular-pago.dto';

@ApiTags('Portal Ciudadano')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CIUDADANO')
@Controller('portal-ciudadano')
export class PortalCiudadanoController {
    constructor(
        private readonly portalCiudadanoService: PortalCiudadanoService,
    ) { }

    @Get('mis-datos')
    @ApiOperation({
        summary: 'Obtener datos del ciudadano autenticado',
    })
    misDatos(@GetUser() user: any) {
        return this.portalCiudadanoService.misDatos(user.id);
    }

    @Get('mis-medidores')
    @ApiOperation({
        summary: 'Obtener medidores del ciudadano autenticado',
    })
    misMedidores(@GetUser() user: any) {
        return this.portalCiudadanoService.misMedidores(user.id);
    }

    @Get('mis-lecturas')
    @ApiOperation({
        summary: 'Obtener lecturas del ciudadano autenticado',
    })
    misLecturas(@GetUser() user: any) {
        return this.portalCiudadanoService.misLecturas(user.id);
    }

    @Get('mis-facturas')
    @ApiOperation({
        summary: 'Obtener facturas del ciudadano autenticado',
    })
    misFacturas(@GetUser() user: any) {
        return this.portalCiudadanoService.misFacturas(user.id);
    }

    @Get('mis-facturas/pendientes')
    @ApiOperation({
        summary: 'Obtener facturas pendientes o vencidas',
    })
    misFacturasPendientes(@GetUser() user: any) {
        return this.portalCiudadanoService.misFacturasPendientes(user.id);
    }

    @Get('mi-deuda')
    @ApiOperation({
        summary: 'Consultar deuda del ciudadano autenticado',
    })
    miDeuda(@GetUser() user: any) {
        return this.portalCiudadanoService.miDeuda(user.id);
    }

    @Get('mis-pagos')
    @ApiOperation({
        summary: 'Obtener pagos del ciudadano autenticado',
    })
    misPagos(@GetUser() user: any) {
        return this.portalCiudadanoService.misPagos(user.id);
    }

    @Get('mis-cortes')
    @ApiOperation({
        summary: 'Obtener cortes del ciudadano autenticado',
    })
    misCortes(@GetUser() user: any) {
        return this.portalCiudadanoService.misCortes(user.id);
    }

    @Get('mis-reconexiones')
    @ApiOperation({
        summary: 'Obtener reconexiones del ciudadano autenticado',
    })
    misReconexiones(@GetUser() user: any) {
        return this.portalCiudadanoService.misReconexiones(user.id);
    }

    @Get('resumen')
    @ApiOperation({
        summary: 'Resumen del portal ciudadano',
    })
    resumen(@GetUser() user: any) {
        return this.portalCiudadanoService.resumen(user.id);
    }

    //update: news end's

    @Get('mis-medidores/:medidorId')
    @ApiOperation({
        summary: 'Obtener detalle de un medidor del ciudadano autenticado',
    })
    detalleMiMedidor(
        @GetUser() user: any,
        @Param('medidorId', ParseIntPipe) medidorId: number,
    ) {
        return this.portalCiudadanoService.detalleMiMedidor(user.id, medidorId);
    }

    @Get('mis-medidores/:medidorId/lecturas')
    @ApiOperation({
        summary: 'Obtener lecturas de un medidor del ciudadano autenticado',
    })
    lecturasDeMiMedidor(
        @GetUser() user: any,
        @Param('medidorId', ParseIntPipe) medidorId: number,
    ) {
        return this.portalCiudadanoService.lecturasDeMiMedidor(user.id, medidorId);
    }

    @Get('mis-facturas/:facturaId')
    @ApiOperation({
        summary: 'Obtener detalle de una factura del ciudadano autenticado',
    })
    detalleMiFactura(
        @GetUser() user: any,
        @Param('facturaId', ParseIntPipe) facturaId: number,
    ) {
        return this.portalCiudadanoService.detalleMiFactura(user.id, facturaId);
    }

    @Get('mis-pagos/:pagoId')
    @ApiOperation({
        summary: 'Obtener detalle de un pago del ciudadano autenticado',
    })
    detalleMiPago(
        @GetUser() user: any,
        @Param('pagoId', ParseIntPipe) pagoId: number,
    ) {
        return this.portalCiudadanoService.detalleMiPago(user.id, pagoId);
    }

    // news -pagos 
    @Post('mis-facturas/:facturaId/simular-pago')
    @ApiOperation({
        summary: 'Simular pago de una factura del ciudadano autenticado',
        description:
            'Registra un pago simulado, cambia la factura a PAGADA y actualiza estados relacionados. Si el ciudadano estaba CORTADO y ya no tiene deuda, genera una reconexión pendiente.',
    })
    simularPagoFactura(
        @GetUser() user: any,
        @Param('facturaId', ParseIntPipe) facturaId: number,
        @Body() dto: SimularPagoDto,
    ) {
        return this.portalCiudadanoService.simularPagoFactura(
            user.id,
            facturaId,
            dto,
        );
    }

    @Post('mi-deuda/simular-pago-total')
    @ApiOperation({
        summary: 'Simular pago total de la deuda del ciudadano autenticado',
        description:
            'Paga todas las facturas pendientes/vencidas del ciudadano. Si estaba CORTADO, genera una reconexión pendiente.',
    })
    simularPagoDeudaTotal(
        @GetUser() user: any,
        @Body() dto: SimularPagoDto,
    ) {
        return this.portalCiudadanoService.simularPagoDeudaTotal(user.id, dto);
    }
}