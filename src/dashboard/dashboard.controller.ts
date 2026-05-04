import { Controller, Get, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard Administrativo')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Roles('ADMIN', 'SUPERVISOR')
    @Get('resumen')
    @ApiOperation({
        summary: 'Resumen general del sistema',
    })
    resumen() {
        return this.dashboardService.resumen();
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get('recaudacion-dia')
    @ApiOperation({
        summary: 'Recaudación del día actual',
    })
    recaudacionDia() {
        return this.dashboardService.recaudacionDia();
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get('recaudacion-mes')
    @ApiOperation({
        summary: 'Recaudación agrupada del mes actual',
    })
    recaudacionMes() {
        return this.dashboardService.recaudacionMes();
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Get('deuda-por-distrito')
    @ApiOperation({
        summary: 'Deuda pendiente agrupada por distrito',
    })
    deudaPorDistrito() {
        return this.dashboardService.deudaPorDistrito();
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Get('cortes-por-distrito')
    @ApiOperation({
        summary: 'Cortes agrupados por distrito',
    })
    cortesPorDistrito() {
        return this.dashboardService.cortesPorDistrito();
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Get('clientes-por-estado')
    @ApiOperation({
        summary: 'Cantidad de clientes por estado de servicio',
    })
    clientesPorEstado() {
        return this.dashboardService.clientesPorEstado();
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Get('consumo-por-periodo')
    @ApiOperation({
        summary: 'Consumo total de agua agrupado por periodo',
    })
    consumoPorPeriodo() {
        return this.dashboardService.consumoPorPeriodo();
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get('facturas-por-estado')
    @ApiOperation({
        summary: 'Cantidad de facturas por estado',
    })
    facturasPorEstado() {
        return this.dashboardService.facturasPorEstado();
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get('pagos-por-metodo')
    @ApiOperation({
        summary: 'Pagos agrupados por método de pago',
    })
    pagosPorMetodo() {
        return this.dashboardService.pagosPorMetodo();
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Get('actividad-operativa')
    @ApiOperation({
        summary: 'Últimas actividades operativas del sistema',
    })
    actividadOperativa() {
        return this.dashboardService.actividadOperativa();
    }
}