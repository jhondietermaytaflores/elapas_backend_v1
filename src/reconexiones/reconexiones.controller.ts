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
import { CancelarReconexionDto } from './dto/cancelar-reconexion.dto';
import { CreateReconexionDto } from './dto/create-reconexion.dto';
import { EjecutarReconexionDto } from './dto/ejecutar-reconexion.dto';
import { FilterReconexionesDto } from './dto/filter-reconexiones.dto';
import { UpdateReconexionDto } from './dto/update-reconexion.dto';
import { ReconexionesService } from './reconexiones.service';

@ApiTags('Reconexiones')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reconexiones')
export class ReconexionesController {
    constructor(private readonly reconexionesService: ReconexionesService) { }

    @Roles('ADMIN', 'SUPERVISOR')
    @Post()
    @ApiOperation({ summary: 'Crear reconexión manualmente' })
    create(@Body() dto: CreateReconexionDto) {
        return this.reconexionesService.create(dto);
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Post('generar-por-corte/:corteId')
    @ApiOperation({ summary: 'Generar reconexión desde un corte ejecutado' })
    @ApiParam({ name: 'corteId', example: 1 })
    generarPorCorte(@Param('corteId', ParseIntPipe) corteId: number) {
        return this.reconexionesService.generarPorCorte(corteId);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'TECNICO', 'CAJERO')
    @Get()
    @ApiOperation({ summary: 'Listar reconexiones con filtros' })
    @ApiQuery({ name: 'ciudadanoId', required: false, example: 2 })
    @ApiQuery({ name: 'corteId', required: false, example: 1 })
    @ApiQuery({ name: 'tecnicoId', required: false, example: 3 })
    @ApiQuery({ name: 'estado', required: false, example: 'PENDIENTE' })
    @ApiQuery({ name: 'fechaDesde', required: false, example: '2026-05-01' })
    @ApiQuery({ name: 'fechaHasta', required: false, example: '2026-05-31' })
    @ApiQuery({ name: 'buscar', required: false, example: 'CLI-0001' })
    findAll(@Query() filtros: FilterReconexionesDto) {
        return this.reconexionesService.findAll(filtros);
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Get('resumen')
    @ApiOperation({ summary: 'Resumen general de reconexiones' })
    resumen() {
        return this.reconexionesService.resumen();
    }

    @Roles('ADMIN', 'SUPERVISOR', 'TECNICO')
    @Get('pendientes')
    @ApiOperation({ summary: 'Listar reconexiones pendientes' })
    pendientes() {
        return this.reconexionesService.pendientes();
    }

    @Roles('ADMIN', 'SUPERVISOR', 'TECNICO', 'CAJERO')
    @Get('ciudadano/:usuarioId')
    @ApiOperation({ summary: 'Listar reconexiones de un ciudadano' })
    @ApiParam({ name: 'usuarioId', example: 2 })
    findByCiudadano(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
        return this.reconexionesService.findByCiudadano(usuarioId);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'TECNICO', 'CAJERO')
    @Get(':id')
    @ApiOperation({ summary: 'Obtener reconexión por ID' })
    @ApiParam({ name: 'id', example: 1 })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.reconexionesService.findOne(id);
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar reconexión pendiente' })
    @ApiParam({ name: 'id', example: 1 })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateReconexionDto,
    ) {
        return this.reconexionesService.update(id, dto);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'TECNICO')
    @Patch(':id/ejecutar')
    @ApiOperation({ summary: 'Ejecutar reconexión' })
    @ApiParam({ name: 'id', example: 1 })
    ejecutar(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: EjecutarReconexionDto,
        @GetUser() user: any,
    ) {
        return this.reconexionesService.ejecutar(id, dto, user.id);
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Patch(':id/cancelar')
    @ApiOperation({ summary: 'Cancelar reconexión pendiente' })
    @ApiParam({ name: 'id', example: 1 })
    cancelar(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: CancelarReconexionDto,
    ) {
        return this.reconexionesService.cancelar(id, dto);
    }

    @Roles('ADMIN')
    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar reconexión no ejecutada' })
    @ApiParam({ name: 'id', example: 1 })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.reconexionesService.remove(id);
    }
}