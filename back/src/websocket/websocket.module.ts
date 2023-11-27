import { Module } from '@nestjs/common';
import { GameGateway } from './websocket.gateway';
import { UserService } from 'src/user/user.service';
import { UserModule } from 'src/user/user.module';

@Module({
	imports:[UserModule],
	providers: [GameGateway],
		})
export class WebsocketModule {}
