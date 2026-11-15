import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AuthModule } from '../../auth/auth.module'

async function bootstrap() {
  const app = await NestFactory.create(AuthModule)
  app.useGlobalPipes(new ValidationPipe({ transform: true }))
  const config = new DocumentBuilder().setTitle('SDCC Auth').setVersion('1.0').build()
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config))
  app.enableCors({ origin: 'http://localhost:5173' })
  await app.listen(process.env.PORT || 3001)
}
bootstrap()
