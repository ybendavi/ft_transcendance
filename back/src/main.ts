import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as cors from 'cors';
import * as passport from 'passport';
import * as session from 'express-session';
import { EnvService } from './config/config.service';
import { ConfigService } from '@nestjs/config';


async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);
	const envService = new EnvService(new ConfigService);
	app.use(session({
		secret: envService.getSecret(),
		resave: false,
		saveUninitialized: false,
		cookie: {
			maxAge: 60000
		}
	}));
	app.use(passport.initialize());
	app.use(passport.session());
	app.enableCors();
	await app.listen(8080);
}
bootstrap();
