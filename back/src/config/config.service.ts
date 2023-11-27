import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvService {
  constructor(private configService: ConfigService) {}

  getClientID(): string {
    return this.configService.get<string>('CLIENT_ID');
  }

  getClientSecret(): string {
    return this.configService.get<string>('CLIENT_SECRET');
  }

  getCallbackURL(): string {
    return this.configService.get<string>('CALLBACK_URL');
  }
  getSecret(): string {
    return this.configService.get<string>('SECRET');
  }

  getUrl(): string {
    return this.configService.get<string>('URL');
  }
}
