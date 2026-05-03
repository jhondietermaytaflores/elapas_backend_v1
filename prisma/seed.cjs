const { PrismaClient } = require('../src/generated/prisma/client');
const { EstadoServicio, EstadoMedidor } = require('../src/generated/prisma/enums');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');
require('dotenv/config');

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
    adapter,
});

async function main() {
    console.log('Iniciando seed de ELAPAS...');

    const roles = ['ADMIN', 'CIUDADANO', 'TECNICO', 'CAJERO', 'SUPERVISOR'];

    for (const nombre of roles) {
        await prisma.rol.upsert({
            where: { nombre },
            update: {},
            create: { nombre },
        });
    }

    console.log('Roles creados correctamente.');

    const distritos = [
        {
            nombre: 'Distrito 1',
            descripcion: 'Zona central y áreas cercanas al centro histórico de Sucre.',
        },
        {
            nombre: 'Distrito 2',
            descripcion: 'Zona urbana residencial de Sucre.',
        },
        {
            nombre: 'Distrito 3',
            descripcion: 'Zona de expansión urbana y barrios residenciales.',
        },
        {
            nombre: 'Distrito 4',
            descripcion: 'Zona periurbana con crecimiento habitacional.',
        },
        {
            nombre: 'Distrito 5',
            descripcion: 'Zona periférica y áreas alejadas del centro urbano.',
        },
    ];

    for (const distrito of distritos) {
        await prisma.distrito.upsert({
            where: { nombre: distrito.nombre },
            update: { descripcion: distrito.descripcion },
            create: distrito,
        });
    }

    console.log('Distritos creados correctamente.');

    const categorias = [
        {
            nombre: 'DOMESTICO',
            descripcion: 'Servicio de agua potable para viviendas familiares.',
        },
        {
            nombre: 'COMERCIAL',
            descripcion: 'Servicio de agua potable para negocios y comercios.',
        },
        {
            nombre: 'SOCIAL',
            descripcion: 'Categoría especial con tarifa preferencial.',
        },
        {
            nombre: 'ADMINISTRATIVO',
            descripcion: 'Categoría para instituciones, oficinas o dependencias administrativas.',
        },
    ];

    for (const categoria of categorias) {
        await prisma.categoriaTarifa.upsert({
            where: { nombre: categoria.nombre },
            update: { descripcion: categoria.descripcion },
            create: categoria,
        });
    }

    console.log('Categorías tarifarias creadas correctamente.');

    const metodosPago = [
        {
            nombre: 'EFECTIVO',
            descripcion: 'Pago realizado en caja de forma presencial.',
        },
        {
            nombre: 'QR_SIMPLE',
            descripcion: 'Pago mediante QR simple.',
        },
        {
            nombre: 'TRANSFERENCIA',
            descripcion: 'Pago mediante transferencia bancaria.',
        },
        {
            nombre: 'TARJETA',
            descripcion: 'Pago mediante tarjeta de débito o crédito.',
        },
    ];

    for (const metodo of metodosPago) {
        await prisma.metodoPago.upsert({
            where: { nombre: metodo.nombre },
            update: { descripcion: metodo.descripcion },
            create: metodo,
        });
    }

    console.log('Métodos de pago creados correctamente.');

    const categoriaDomestico = await prisma.categoriaTarifa.findUniqueOrThrow({
        where: { nombre: 'DOMESTICO' },
    });

    const categoriaComercial = await prisma.categoriaTarifa.findUniqueOrThrow({
        where: { nombre: 'COMERCIAL' },
    });

    const categoriaSocial = await prisma.categoriaTarifa.findUniqueOrThrow({
        where: { nombre: 'SOCIAL' },
    });

    const categoriaAdministrativo = await prisma.categoriaTarifa.findUniqueOrThrow({
        where: { nombre: 'ADMINISTRATIVO' },
    });

    await prisma.tarifa.deleteMany();

    await prisma.tarifa.createMany({
        data: [
            {
                categoriaId: categoriaDomestico.id,
                rangoDesde: 0,
                rangoHasta: 10,
                precioM3: 2.5,
                cargoFijo: 10,
            },
            {
                categoriaId: categoriaDomestico.id,
                rangoDesde: 10.01,
                rangoHasta: 20,
                precioM3: 3.2,
                cargoFijo: 10,
            },
            {
                categoriaId: categoriaDomestico.id,
                rangoDesde: 20.01,
                rangoHasta: null,
                precioM3: 4.0,
                cargoFijo: 10,
            },
            {
                categoriaId: categoriaComercial.id,
                rangoDesde: 0,
                rangoHasta: 20,
                precioM3: 5.0,
                cargoFijo: 20,
            },
            {
                categoriaId: categoriaComercial.id,
                rangoDesde: 20.01,
                rangoHasta: null,
                precioM3: 6.5,
                cargoFijo: 20,
            },
            {
                categoriaId: categoriaSocial.id,
                rangoDesde: 0,
                rangoHasta: 15,
                precioM3: 1.5,
                cargoFijo: 5,
            },
            {
                categoriaId: categoriaSocial.id,
                rangoDesde: 15.01,
                rangoHasta: null,
                precioM3: 2.0,
                cargoFijo: 5,
            },
            {
                categoriaId: categoriaAdministrativo.id,
                rangoDesde: 0,
                rangoHasta: null,
                precioM3: 4.5,
                cargoFijo: 15,
            },
        ],
    });

    console.log('Tarifas base creadas correctamente.');

        // =========================
    // USUARIO ADMINISTRADOR
    // =========================

    const rolAdmin = await prisma.rol.findUniqueOrThrow({
        where: { nombre: 'ADMIN' },
    });

    const adminPassword = await bcrypt.hash('admin123', 10);

    await prisma.usuario.upsert({
        where: { ci: '13872593' },
        update: {
            nombre: 'Jhon',
            apellido: 'Mayta Flores',
            email: 'jhonmaytaflores@gmail.com',
            telefono: '69696805',
            rolId: rolAdmin.id,
            activo: true,
        },
        create: {
            nombre: 'Jhon',
            apellido: 'Mayta flores',
            ci: '13872593',
            email: 'jhonmaytaflores@gmail.com',
            password: adminPassword,
            telefono: '69696805',
            rolId: rolAdmin.id,
            activo: true,
        },
    });

    console.log('Usuario administrador creado correctamente.');

    const rolTecnico = await prisma.rol.findUniqueOrThrow({
        where: { nombre: 'TECNICO' },
    });

    const tecnicoPassword = await bcrypt.hash('tec123', 10);

    await prisma.usuario.upsert({
        where: { ci: '3344556' },
        update: {
            nombre: 'Pedro Luis',
            apellido: 'Vargas',
            email: 'tecnico@elapas.test',
            telefono: '70345678',
            rolId: rolTecnico.id,
            activo: true,
        },
        create: {
            nombre: 'Pedro Luis',
            apellido: 'Vargas',
            ci: '3344556',
            email: 'tecnico@elapas.test',
            password: tecnicoPassword,
            telefono: '70345678',
            rolId: rolTecnico.id,
            activo: true,
        },
    });

    console.log('Usuario técnico creado correctamente.');

    const rolCajero = await prisma.rol.findUniqueOrThrow({
        where: { nombre: 'CAJERO' },
    });

    const cajeroPassword = await bcrypt.hash('cajero123', 10);

    await prisma.usuario.upsert({
        where: { ci: '4455667' },
        update: {
            nombre: 'Ana Gabriela',
            apellido: 'Fernández Vargas',
            email: 'cajero@elapas.test',
            telefono: '70445678',
            rolId: rolCajero.id,
            activo: true,
        },
        create: {
            nombre: 'Ana Gabriela',
            apellido: 'Fernández Vargas',
            ci: '4455667',
            email: 'cajero@elapas.test',
            password: cajeroPassword,
            telefono: '70445678',
            rolId: rolCajero.id,
            activo: true,
        },
    });

    console.log('Usuario cajero creado correctamente.');

    const rolCiudadano = await prisma.rol.findUniqueOrThrow({
        where: { nombre: 'CIUDADANO' },
    });

    const distrito2 = await prisma.distrito.findUniqueOrThrow({
        where: { nombre: 'Distrito 2' },
    });

    const distrito3 = await prisma.distrito.findUniqueOrThrow({
        where: { nombre: 'Distrito 3' },
    });

    const passwordCiudadano = await bcrypt.hash('user123', 10);

    const ciudadano1 = await prisma.usuario.upsert({
        where: { ci: '7458392' },
        update: {
            nombre: 'María Luisa',
            apellido: 'Quispe Mamani',
            email: 'maria@elapas.test',
            telefono: '70000002',
            rolId: rolCiudadano.id,
            activo: true,
        },
        create: {
            nombre: 'María Luisa',
            apellido: 'Quispe Mamani',
            ci: '7458392',
            email: 'maria@elapas.test',
            password: passwordCiudadano,
            telefono: '70000002',
            rolId: rolCiudadano.id,
            activo: true,
        },
    });

    await prisma.ciudadano.upsert({
        where: { usuarioId: ciudadano1.id },
        update: {
            codigoCliente: 'CLI-0001',
            categoriaId: categoriaDomestico.id,
            distritoId: distrito2.id,
            direccion: 'Zona Villa Armonía Calle 5',
            referencia: 'Cerca de la plaza principal de la zona',
            estadoServicio: EstadoServicio.ACTIVO,
        },
        create: {
            usuarioId: ciudadano1.id,
            codigoCliente: 'CLI-0001',
            categoriaId: categoriaDomestico.id,
            distritoId: distrito2.id,
            direccion: 'Zona Villa Armonía Calle 5',
            referencia: 'Cerca de la plaza principal de la zona',
            estadoServicio: EstadoServicio.ACTIVO,
        },
    });

    const ciudadano2 = await prisma.usuario.upsert({
        where: { ci: '6892345' },
        update: {
            nombre: 'Juan Pablo',
            apellido: 'Choque Condori',
            email: 'juan@elapas.test',
            telefono: '70000003',
            rolId: rolCiudadano.id,
            activo: true,
        },
        create: {
            nombre: 'Juan Pablo',
            apellido: 'Choque Condori',
            ci: '6892345',
            email: 'juan@elapas.test',
            password: passwordCiudadano,
            telefono: '70000003',
            rolId: rolCiudadano.id,
            activo: true,
        },
    });

    await prisma.ciudadano.upsert({
        where: { usuarioId: ciudadano2.id },
        update: {
            codigoCliente: 'CLI-0002',
            categoriaId: categoriaDomestico.id,
            distritoId: distrito3.id,
            direccion: 'Barrio Petrolero Av. 6 de Agosto',
            referencia: 'Frente a tienda de barrio',
            estadoServicio: EstadoServicio.ACTIVO,
        },
        create: {
            usuarioId: ciudadano2.id,
            codigoCliente: 'CLI-0002',
            categoriaId: categoriaDomestico.id,
            distritoId: distrito3.id,
            direccion: 'Barrio Petrolero Av. 6 de Agosto',
            referencia: 'Frente a tienda de barrio',
            estadoServicio: EstadoServicio.ACTIVO,
        },
    });

    console.log('Ciudadanos de prueba creados correctamente.');

    await prisma.medidor.upsert({
        where: { codigoMedidor: 'MED-0001' },
        update: {
            numeroSerie: '00012345',
            ciudadanoId: ciudadano1.id,
            marca: 'ELSTER',
            modelo: 'A100',
            lecturaInicial: 0,
            estado: EstadoMedidor.ACTIVO,
        },
        create: {
            codigoMedidor: 'MED-0001',
            numeroSerie: '00012345',
            ciudadanoId: ciudadano1.id,
            marca: 'ELSTER',
            modelo: 'A100',
            fechaInstalacion: new Date('2025-01-10'),
            lecturaInicial: 0,
            estado: EstadoMedidor.ACTIVO,
        },
    });

    await prisma.medidor.upsert({
        where: { codigoMedidor: 'MED-0002' },
        update: {
            numeroSerie: '00012346',
            ciudadanoId: ciudadano2.id,
            marca: 'ZENNER',
            modelo: 'MNK',
            lecturaInicial: 0,
            estado: EstadoMedidor.ACTIVO,
        },
        create: {
            codigoMedidor: 'MED-0002',
            numeroSerie: '00012346',
            ciudadanoId: ciudadano2.id,
            marca: 'ZENNER',
            modelo: 'MNK',
            fechaInstalacion: new Date('2025-02-12'),
            lecturaInicial: 0,
            estado: EstadoMedidor.ACTIVO,
        },
    });

    console.log('Medidores de prueba creados correctamente.');
    console.log('Seed finalizado correctamente.');
}

main()
    .catch((error) => {
        console.error('Error ejecutando seed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });