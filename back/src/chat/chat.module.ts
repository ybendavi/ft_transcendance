import { Module, forwardRef } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChannelService } from './channel.service';
import { Chat } from './chat.entity';
import { Channel } from './channel.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppGateway } from '../app/app.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { SecuModule } from 'src/secu/secu.module';
import Game from 'src/Entities/Game';


@Module({
  imports: [AuthModule, SecuModule, TypeOrmModule.forFeature([Chat]), TypeOrmModule.forFeature([Channel]), TypeOrmModule.forFeature([Game])],
  controllers: [ChatController],
  providers: [ChatService, ChannelService, AppGateway],
  exports: [ChatService, ChannelService, AppGateway]
})

export class ChatModule {}
