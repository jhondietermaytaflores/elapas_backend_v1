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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateTarifaDto } from './dto/create-tarifa.dto';
import { FilterTarifasDto } from './dto/filter-tarifas.dto';
import { UpdateEstadoTarifaDto } from './dto/update-estado-tarifa.dto';
import { UpdateTarifaDto } from './dto/update-tarifa.dto';
import { TarifasService } from './tarifas.service';

@ApiTags('Tarifas')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tarifas')
export class TarifasController {
    constructor(private readonly tarifasService: TarifasService) { }

    @Roles('ADMIN', 'SUPERVISOR')
    @Post()
    @ApiOperation({ summary: 'Crear tarifa' })
    create(@Body() dto: CreateTarifaDto) {
        return this.tarifasService.create(dto);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get()
    @ApiOperation({ summary: 'Listar tarifas con filtros' })
    @ApiQuery({ name: 'categoriaId', required: false, example: 1 })
    @ApiQuery({ name: 'activo', required: false, example: true })
    findAll(@Query() filtros: FilterTarifasDto) {
        return this.tarifasService.findAll(filtros);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get('activas')
    @ApiOperation({ summary: 'Listar tarifas activas' })
    findActivas() {
        return this.tarifasService.findActivas();
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get('categoria/:categoriaId')
    @ApiOperation({ summary: 'Listar tarifas por categoría' })
    @ApiParam({ name: 'categoriaId', example: 1 })
    findByCategoria(@Param('categoriaId', ParseIntPipe) categoriaId: number) {
        return this.tarifasService.findByCategoria(categoriaId);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO')
    @Get(':id')
    @ApiOperation({ summary: 'Obtener tarifa por ID' })
    @ApiParam({ name: 'id', example: 1 })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.tarifasService.findOne(id);
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar tarifa' })
    @ApiParam({ name: 'id', example: 1 })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTarifaDto) {
        return this.tarifasService.update(id, dto);
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Patch(':id/estado')
    @ApiOperation({ summary: 'Activar o desactivar tarifa' })
    @ApiParam({ name: 'id', example: 1 })
    updateEstado(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateEstadoTarifaDto,
    ) {
        return this.tarifasService.updateEstado(id, dto);
    }

    @Roles('ADMIN')
    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar tarifa' })
    @ApiParam({ name: 'id', example: 1 })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.tarifasService.remove(id);
    }
}