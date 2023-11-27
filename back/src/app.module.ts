import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './Entities/User';
import { WebsocketModule } from './websocket/websocket.module';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from './auth/auth.module';
import DatabaseFile from './Entities/Avatar';

import { Chat } from './chat/chat.entity';
import { Channel } from './chat/channel.entity';
import { ChatModule } from './chat/chat.module';
import {ChannelModule} from './chat/channel.module'

import { AppGateway } from './app/app.gateway';
import { EnvService } from './config/config.service';
import { ConfigAppModule } from './config/config.module';
import { UserModule } from './user/user.module';
import { Relationship } from './Entities/Relationship';
import Game from './Entities/Game';
import { SecuModule } from './secu/secu.module';


@Module({
	imports: [TypeOrmModule.forRoot({
		type: 'postgres',
		host: process.env.POSTGRES_HOSTNAME,
		port: parseInt(process.env.POSTGRES_PORT),
		username: process.env.POSTGRES_USER,
		password: process.env.POSTGRES_PASSWORD,
		database: process.env.POSTGRES_DB,
		entities: [User, Chat, Channel, DatabaseFile, Relationship, Game],
		synchronize: true
	}),
  PassportModule.register({session: true}),
  AuthModule,
  ChatModule,
  WebsocketModule,
  ConfigAppModule,
  UserModule,
  SecuModule,
  ChannelModule,
  ],
  providers: [EnvService],
  exports: [EnvService],
})
export class AppModule {}
