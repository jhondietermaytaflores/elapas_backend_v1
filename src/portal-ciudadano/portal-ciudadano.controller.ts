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
}