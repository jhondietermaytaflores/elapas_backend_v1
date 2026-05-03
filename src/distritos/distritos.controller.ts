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
import { CreateDistritoDto } from './dto/create-distrito.dto';
import { UpdateDistritoDto } from './dto/update-distrito.dto';
import { DistritosService } from './distritos.service';

@ApiTags('Distritos')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('distritos')
export class DistritosController {
    constructor(private readonly distritosService: DistritosService) { }

    @Roles('ADMIN', 'SUPERVISOR')
    @Post()
    @ApiOperation({ summary: 'Crear distrito' })
    create(@Body() createDistritoDto: CreateDistritoDto) {
        return this.distritosService.create(createDistritoDto);
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO', 'TECNICO')
    @Get()
    @ApiOperation({ summary: 'Listar todos los distritos' })
    findAll() {
        return this.distritosService.findAll();
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO', 'TECNICO')
    @Get('activos')
    @ApiOperation({ summary: 'Listar distritos activos' })
    findActivos() {
        return this.distritosService.findActivos();
    }

    @Roles('ADMIN', 'SUPERVISOR', 'CAJERO', 'TECNICO')
    @Get(':id')
    @ApiOperation({ summary: 'Obtener distrito por ID' })
    @ApiParam({ name: 'id', example: 1 })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.distritosService.findOne(id);
    }

    @Roles('ADMIN', 'SUPERVISOR')
    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar distrito' })
    @ApiParam({ name: 'id', example: 1 })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDistritoDto: UpdateDistritoDto,
    ) {
        return this.distritosService.update(id, updateDistritoDto);
    }

    @Roles('ADMIN')
    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar distrito sin relaciones' })
    @ApiParam({ name: 'id', example: 1 })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.distritosService.remove(id);
    }
}