// config.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '../.env', // Path to your environment file (optional)
      isGlobal: true, // Makes the configuration available globally
    }),
  ],
})
export class ConfigAppModule {}
