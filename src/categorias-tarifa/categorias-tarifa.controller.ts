import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CategoriasTarifaService } from './categorias-tarifa.service';
import { CreateCategoriaTarifaDto } from './dto/create-categoria-tarifa.dto';
import { UpdateCategoriaTarifaDto } from './dto/update-categoria-tarifa.dto';

@ApiTags('Categorías Tarifarias')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categorias-tarifa')
export class CategoriasTarifaController {
    constructor(
        private readonly categoriasTarifaService: CategoriasTarifaService,
    ) { }

    @Roles('ADMIN', 'SUPERVISOR')
    @Post()
    @ApiOperation({ summary: 'Crear categoría tarifaria' })
    create(@Body() createDto: CreateCategoriaTarifaDto) {
        return this.categoriasTarifaService.create(createDto);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO', 'TECNICO')
    @Get()
    @ApiOperation({ summary: 'Listar categorías tarifarias' })
    findAll() {
        return this.categoriasTarifaService.findAll();
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO', 'TECNICO')
    @Get('activas')
    @ApiOperation({ summary: 'Listar categorías tarifarias activas' })
    findActivas() {
        return this.categoriasTarifaService.findActivas();
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO', 'TECNICO')
    @Get(':id')
    @ApiOperation({ summary: 'Obtener categoría tarifaria por ID' })
    @ApiParam({ name: 'id', example: 1 })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.categoriasTarifaService.findOne(id);
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar categoría tarifaria' })
    @ApiParam({ name: 'id', example: 1 })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateCategoriaTarifaDto,
    ) {
        return this.categoriasTarifaService.update(id, updateDto);
    }

    @Roles('ADMIN')
    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar categoría tarifaria sin relaciones' })
    @ApiParam({ name: 'id', example: 1 })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.categoriasTarifaService.remove(id);
    }
}