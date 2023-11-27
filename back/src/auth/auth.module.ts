import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FtStrategy } from './utils/ft.strategy';
import { Passport } from 'passport';
import { SessionSerializer } from './utils/Serializer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/Entities/User';
import { DatabaseFileService } from './databaseFiles.service';
import DatabaseFile from 'src/Entities/Avatar';
import { ConfigAppModule } from 'src/config/config.module';
import { EnvService } from 'src/config/config.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './utils/constants';
import { JwtStrategy } from './utils/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([DatabaseFile]),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '6000s' },
    }),
  ],
  controllers: [AuthController],
  providers: [FtStrategy, JwtStrategy, SessionSerializer, EnvService, AuthService, DatabaseFileService,
    {
      provide: 'AUTH_SERVICE',
      useClass: AuthService
    },
    ],
  exports: [AuthService, DatabaseFileService]
})
export class AuthModule {}
