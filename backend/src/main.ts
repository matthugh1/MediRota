import 'reflect-metadata';
import { config } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Load environment variables
config();

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.setGlobalPrefix('');

	// Enable CORS
	app.enableCors({
		origin: ['http://localhost:5173', 'http://localhost:3000'],
		credentials: true,
	});

	// Global validation pipe
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);

	const config = new DocumentBuilder()
		.setTitle('MediRota API')
		.setDescription('OpenAPI for MediRota backend')
		.setVersion('0.1.0')
		.addBearerAuth()
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('/docs', app, document);

	const port = process.env.PORT ? Number(process.env.PORT) : 8080;
	await app.listen(port, '0.0.0.0');
}

bootstrap();

