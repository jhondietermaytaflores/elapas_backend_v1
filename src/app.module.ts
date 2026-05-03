import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { MetodosPagoModule } from './metodos-pago/metodos-pago.module';
import { CategoriasTarifaModule } from './categorias-tarifa/categorias-tarifa.module';
import { DistritosModule } from './distritos/distritos.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { RolesModule } from './roles/roles.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    RolesModule,
    UsuariosModule,
    DistritosModule,
    CategoriasTarifaModule,
    MetodosPagoModule,
  ],
})
export class AppModule {}

/* import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {} */
