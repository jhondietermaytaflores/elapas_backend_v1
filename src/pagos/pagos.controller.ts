import {
    Body,
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
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreatePagoDto } from './dto/create-pago.dto';
import { FilterPagosDto } from './dto/filter-pagos.dto';
import { RecaudacionRangoDto } from './dto/recaudacion-rango.dto';
import { PagosService } from './pagos.service';

@ApiTags('Pagos / Recaudaciones')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pagos')
export class PagosController {
    constructor(private readonly pagosService: PagosService) { }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Post()
    @ApiOperation({ summary: 'Registrar pago de una factura' })
    create(@Body() dto: CreatePagoDto, @GetUser() user: any) {
        return this.pagosService.create(dto, user.id);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get()
    @ApiOperation({ summary: 'Listar pagos con filtros' })
    @ApiQuery({ name: 'facturaId', required: false, example: 1 })
    @ApiQuery({ name: 'ciudadanoId', required: false, example: 2 })
    @ApiQuery({ name: 'usuarioId', required: false, example: 3 })
    @ApiQuery({ name: 'metodoId', required: false, example: 1 })
    @ApiQuery({ name: 'estado', required: false, example: 'CONFIRMADO' })
    @ApiQuery({ name: 'fechaDesde', required: false, example: '2026-05-01' })
    @ApiQuery({ name: 'fechaHasta', required: false, example: '2026-05-31' })
    @ApiQuery({ name: 'buscar', required: false, example: 'ELAPAS' })
    findAll(@Query() filtros: FilterPagosDto) {
        return this.pagosService.findAll(filtros);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get('resumen')
    @ApiOperation({ summary: 'Resumen general de pagos' })
    resumen() {
        return this.pagosService.resumen();
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get('recaudacion/dia')
    @ApiOperation({ summary: 'Obtener recaudación del día actual' })
    recaudacionDia() {
        return this.pagosService.recaudacionDia();
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get('recaudacion/rango')
    @ApiOperation({ summary: 'Obtener recaudación por rango de fechas' })
    @ApiQuery({ name: 'fechaDesde', required: true, example: '2026-05-01' })
    @ApiQuery({ name: 'fechaHasta', required: true, example: '2026-05-31' })
    recaudacionRango(@Query() dto: RecaudacionRangoDto) {
        return this.pagosService.recaudacionRango(dto);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get('codigo/:codigoPago')
    @ApiOperation({ summary: 'Buscar pago por código' })
    @ApiParam({ name: 'codigoPago', example: 'PAG-2026-000001' })
    findByCodigo(@Param('codigoPago') codigoPago: string) {
        return this.pagosService.findByCodigo(codigoPago);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get('factura/:facturaId')
    @ApiOperation({ summary: 'Buscar pago por factura' })
    @ApiParam({ name: 'facturaId', example: 1 })
    findByFactura(@Param('facturaId', ParseIntPipe) facturaId: number) {
        return this.pagosService.findByFactura(facturaId);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get('ciudadano/:usuarioId')
    @ApiOperation({ summary: 'Listar pagos de un ciudadano' })
    @ApiParam({ name: 'usuarioId', example: 2 })
    findByCiudadano(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
        return this.pagosService.findByCiudadano(usuarioId);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get(':id')
    @ApiOperation({ summary: 'Obtener pago por ID' })
    @ApiParam({ name: 'id', example: 1 })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.pagosService.findOne(id);
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Patch(':id/anular')
    @ApiOperation({ summary: 'Anular pago y devolver factura a PENDIENTE' })
    @ApiParam({ name: 'id', example: 1 })
    anular(@Param('id', ParseIntPipe) id: number) {
        return this.pagosService.anular(id);
    }
}