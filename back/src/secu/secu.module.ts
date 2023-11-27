import { Module } from '@nestjs/common';
import { Security } from './secu.app';

@Module({
	providers: [Security],
	exports: [Security],
})
export class SecuModule {}
