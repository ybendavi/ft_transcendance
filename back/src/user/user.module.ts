import { Module, forwardRef } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { Relationship } from 'src/Entities/Relationship';
import { User } from 'src/Entities/User';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from 'src/auth/auth.service';
import { AuthModule } from 'src/auth/auth.module';
import { ChannelModule } from 'src/chat/channel.module';
import  Game from 'src/Entities/Game'
import { SecuModule } from 'src/secu/secu.module';
import { Channel } from 'src/chat/channel.entity';
import { Chat } from 'src/chat/chat.entity';
import { ChatModule } from 'src/chat/chat.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Relationship]),
    TypeOrmModule.forFeature([Game]),
    TypeOrmModule.forFeature([Channel]),
    TypeOrmModule.forFeature([Chat]),
    SecuModule,
    ChannelModule,
    ChatModule
  ],
  controllers: [UserController],
  providers: [UserService, JwtService],
  exports: [UserService]
})
export class UserModule {}
