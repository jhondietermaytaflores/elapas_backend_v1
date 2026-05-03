import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTarifaDto } from './dto/create-tarifa.dto';
import { FilterTarifasDto } from './dto/filter-tarifas.dto';
import { UpdateEstadoTarifaDto } from './dto/update-estado-tarifa.dto';
import { UpdateTarifaDto } from './dto/update-tarifa.dto';

@Injectable()
export class TarifasService {
    constructor(private readonly prisma: PrismaService) { }

    private tarifaInclude() {
        return {
            categoria: true,
        };
    }

    private async validarCategoria(categoriaId: number) {
        const categoria = await this.prisma.categoriaTarifa.findUnique({
            where: { id: categoriaId },
        });

        if (!categoria) {
            throw new NotFoundException('Categoría tarifaria no encontrada');
        }

        if (!categoria.activo) {
            throw new BadRequestException('La categoría tarifaria está inactiva');
        }

        return categoria;
    }

    private validarRangos(rangoDesde: number, rangoHasta?: number | null) {
        if (rangoHasta !== undefined && rangoHasta !== null) {
            if (rangoHasta <= rangoDesde) {
                throw new BadRequestException(
                    'El rangoHasta debe ser mayor que rangoDesde',
                );
            }
        }
    }

    async create(dto: CreateTarifaDto) {
        await this.validarCategoria(dto.categoriaId);
        this.validarRangos(dto.rangoDesde, dto.rangoHasta);

        return this.prisma.tarifa.create({
            data: {
                categoriaId: dto.categoriaId,
                rangoDesde: dto.rangoDesde,
                rangoHasta: dto.rangoHasta ?? null,
                precioM3: dto.precioM3,
                cargoFijo: dto.cargoFijo ?? 0,
                activo: dto.activo ?? true,
            },
            include: this.tarifaInclude(),
        });
    }

    async findAll(filtros: FilterTarifasDto) {
        const where: any = {};

        if (filtros.categoriaId) {
            where.categoriaId = filtros.categoriaId;
        }

        if (filtros.activo !== undefined) {
            where.activo = filtros.activo;
        }

        return this.prisma.tarifa.findMany({
            where,
            include: this.tarifaInclude(),
            orderBy: [
                {
                    categoriaId: 'asc',
                },
                {
                    rangoDesde: 'asc',
                },
            ],
        });
    }

    async findActivas() {
        return this.prisma.tarifa.findMany({
            where: {
                activo: true,
                categoria: {
                    activo: true,
                },
            },
            include: this.tarifaInclude(),
            orderBy: [
                {
                    categoriaId: 'asc',
                },
                {
                    rangoDesde: 'asc',
                },
            ],
        });
    }

    async findByCategoria(categoriaId: number) {
        await this.validarCategoria(categoriaId);

        return this.prisma.tarifa.findMany({
            where: {
                categoriaId,
            },
            include: this.tarifaInclude(),
            orderBy: {
                rangoDesde: 'asc',
            },
        });
    }

    async findOne(id: number) {
        const tarifa = await this.prisma.tarifa.findUnique({
            where: { id },
            include: this.tarifaInclude(),
        });

        if (!tarifa) {
            throw new NotFoundException('Tarifa no encontrada');
        }

        return tarifa;
    }

    async update(id: number, dto: UpdateTarifaDto) {
        await this.findOne(id);

        if (dto.categoriaId !== undefined) {
            await this.validarCategoria(dto.categoriaId);
        }

        const data: any = {};

        if (dto.categoriaId !== undefined) {
            data.categoriaId = dto.categoriaId;
        }

        if (dto.rangoDesde !== undefined) {
            data.rangoDesde = dto.rangoDesde;
        }

        if (dto.rangoHasta !== undefined) {
            data.rangoHasta = dto.rangoHasta ?? null;
        }

        if (dto.precioM3 !== undefined) {
            data.precioM3 = dto.precioM3;
        }

        if (dto.cargoFijo !== undefined) {
            data.cargoFijo = dto.cargoFijo;
        }

        if (dto.activo !== undefined) {
            data.activo = dto.activo;
        }

        if (Object.keys(data).length === 0) {
            throw new BadRequestException('Debe enviar al menos un campo para actualizar');
        }

        const tarifaActual = await this.prisma.tarifa.findUniqueOrThrow({
            where: { id },
        });

        const rangoDesde = dto.rangoDesde ?? Number(tarifaActual.rangoDesde);
        const rangoHasta =
            dto.rangoHasta !== undefined
                ? dto.rangoHasta
                : tarifaActual.rangoHasta !== null
                    ? Number(tarifaActual.rangoHasta)
                    : null;

        this.validarRangos(rangoDesde, rangoHasta);

        return this.prisma.tarifa.update({
            where: { id },
            data,
            include: this.tarifaInclude(),
        });
    }

    async updateEstado(id: number, dto: UpdateEstadoTarifaDto) {
        await this.findOne(id);

        return this.prisma.tarifa.update({
            where: { id },
            data: {
                activo: dto.activo,
            },
            include: this.tarifaInclude(),
        });
    }

    async remove(id: number) {
        await this.findOne(id);

        await this.prisma.tarifa.delete({
            where: { id },
        });

        return {
            message: 'Tarifa eliminada correctamente',
        };
    }
}