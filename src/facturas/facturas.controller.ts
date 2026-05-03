import {
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { FacturasService } from './facturas.service';
import { FilterFacturasDto } from './dto/filter-facturas.dto';

@ApiTags('Facturas')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('facturas')
export class FacturasController {
    constructor(private readonly facturasService: FacturasService) { }

    @Roles('ADMIN', 'SUPERVISOR')
    @Post('generar-por-lectura/:lecturaId')
    @ApiOperation({ summary: 'Generar factura desde una lectura confirmada' })
    @ApiParam({ name: 'lecturaId', example: 1 })
    generarPorLectura(@Param('lecturaId', ParseIntPipe) lecturaId: number) {
        return this.facturasService.generarPorLectura(lecturaId);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get()
    @ApiOperation({ summary: 'Listar facturas con filtros' })
    @ApiQuery({ name: 'ciudadanoId', required: false, example: 2 })
    @ApiQuery({ name: 'periodo', required: false, example: '2026-05' })
    @ApiQuery({ name: 'estado', required: false, example: 'PENDIENTE' })
    @ApiQuery({ name: 'buscar', required: false, example: 'CLI-0001' })
    findAll(@Query() filtros: FilterFacturasDto) {
        return this.facturasService.findAll(filtros);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get('resumen')
    @ApiOperation({ summary: 'Resumen general de facturación' })
    resumen() {
        return this.facturasService.resumen();
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get('numero/:numeroFactura')
    @ApiOperation({ summary: 'Buscar factura por número' })
    @ApiParam({ name: 'numeroFactura', example: 'FAC-2026-000001' })
    findByNumero(@Param('numeroFactura') numeroFactura: string) {
        return this.facturasService.findByNumero(numeroFactura);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get('ciudadano/:usuarioId')
    @ApiOperation({ summary: 'Listar facturas de un ciudadano' })
    @ApiParam({ name: 'usuarioId', example: 2 })
    findByCiudadano(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
        return this.facturasService.findByCiudadano(usuarioId);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get('ciudadano/:usuarioId/pendientes')
    @ApiOperation({ summary: 'Listar facturas pendientes o vencidas de un ciudadano' })
    @ApiParam({ name: 'usuarioId', example: 2 })
    pendientesByCiudadano(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
        return this.facturasService.pendientesByCiudadano(usuarioId);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get('ciudadano/:usuarioId/deuda')
    @ApiOperation({ summary: 'Consultar deuda total del ciudadano' })
    @ApiParam({ name: 'usuarioId', example: 2 })
    deudaByCiudadano(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
        return this.facturasService.deudaByCiudadano(usuarioId);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get('periodo/:periodo')
    @ApiOperation({ summary: 'Listar facturas por periodo' })
    @ApiParam({ name: 'periodo', example: '2026-05' })
    findByPeriodo(@Param('periodo') periodo: string) {
        return this.facturasService.findByPeriodo(periodo);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get(':id')
    @ApiOperation({ summary: 'Obtener factura por ID' })
    @ApiParam({ name: 'id', example: 1 })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.facturasService.findOne(id);
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Patch(':id/anular')
    @ApiOperation({ summary: 'Anular factura no pagada' })
    @ApiParam({ name: 'id', example: 1 })
    anular(@Param('id', ParseIntPipe) id: number) {
        return this.facturasService.anular(id);
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Patch(':id/marcar-vencida')
    @ApiOperation({ summary: 'Marcar factura pendiente como vencida' })
    @ApiParam({ name: 'id', example: 1 })
    marcarVencida(@Param('id', ParseIntPipe) id: number) {
        return this.facturasService.marcarVencida(id);
    }
}