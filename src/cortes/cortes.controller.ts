import {
    Body,
    Controller,
    Delete,
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
import { CancelarCorteDto } from './dto/cancelar-corte.dto';
import { CreateCorteDto } from './dto/create-corte.dto';
import { EjecutarCorteDto } from './dto/ejecutar-corte.dto';
import { FilterCortesDto } from './dto/filter-cortes.dto';
import { UpdateCorteDto } from './dto/update-corte.dto';
import { CortesService } from './cortes.service';

@ApiTags('Cortes de Servicio')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cortes')
export class CortesController {
    constructor(private readonly cortesService: CortesService) { }

    @Roles('ADMIN', 'SUPERVISOR')
    @Post()
    @ApiOperation({ summary: 'Crear corte manualmente' })
    create(@Body() dto: CreateCorteDto) {
        return this.cortesService.create(dto);
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Post('generar-por-deuda/:usuarioId')
    @ApiOperation({ summary: 'Generar corte automáticamente por deuda' })
    @ApiParam({ name: 'usuarioId', example: 2 })
    generarPorDeuda(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
        return this.cortesService.generarPorDeuda(usuarioId);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'TECNICO', 'CAJERO')
    @Get()
    @ApiOperation({ summary: 'Listar cortes con filtros' })
    @ApiQuery({ name: 'ciudadanoId', required: false, example: 2 })
    @ApiQuery({ name: 'tecnicoId', required: false, example: 3 })
    @ApiQuery({ name: 'estado', required: false, example: 'PENDIENTE' })
    @ApiQuery({ name: 'fechaDesde', required: false, example: '2026-05-01' })
    @ApiQuery({ name: 'fechaHasta', required: false, example: '2026-05-31' })
    @ApiQuery({ name: 'buscar', required: false, example: 'CLI-0001' })
    findAll(@Query() filtros: FilterCortesDto) {
        return this.cortesService.findAll(filtros);
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Get('resumen')
    @ApiOperation({ summary: 'Resumen general de cortes' })
    resumen() {
        return this.cortesService.resumen();
    }

    @Roles('ADMIN', 'SUPERVISOR', 'TECNICO')
    @Get('pendientes')
    @ApiOperation({ summary: 'Listar cortes pendientes' })
    pendientes() {
        return this.cortesService.pendientes();
    }

    @Roles('ADMIN', 'SUPERVISOR', 'TECNICO', 'CAJERO')
    @Get('ciudadano/:usuarioId')
    @ApiOperation({ summary: 'Listar cortes de un ciudadano' })
    @ApiParam({ name: 'usuarioId', example: 2 })
    findByCiudadano(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
        return this.cortesService.findByCiudadano(usuarioId);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'TECNICO', 'CAJERO')
    @Get(':id')
    @ApiOperation({ summary: 'Obtener corte por ID' })
    @ApiParam({ name: 'id', example: 1 })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.cortesService.findOne(id);
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar corte pendiente' })
    @ApiParam({ name: 'id', example: 1 })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCorteDto,
    ) {
        return this.cortesService.update(id, dto);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'TECNICO')
    @Patch(':id/ejecutar')
    @ApiOperation({ summary: 'Ejecutar corte de servicio' })
    @ApiParam({ name: 'id', example: 1 })
    ejecutar(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: EjecutarCorteDto,
        @GetUser() user: any,
    ) {
        return this.cortesService.ejecutar(id, dto, user.id);
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Patch(':id/cancelar')
    @ApiOperation({ summary: 'Cancelar corte pendiente' })
    @ApiParam({ name: 'id', example: 1 })
    cancelar(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: CancelarCorteDto,
    ) {
        return this.cortesService.cancelar(id, dto);
    }

    @Roles('ADMIN')
    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar corte no ejecutado' })
    @ApiParam({ name: 'id', example: 1 })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.cortesService.remove(id);
    }
}