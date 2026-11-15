import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { LogsModule } from '../../logs/logs.module'
import { JwtGuard } from '../../auth/jwt.guard'

async function bootstrap() {
  const app = await NestFactory.create(LogsModule)
  app.useGlobalPipes(new ValidationPipe({ transform: true }))
  app.useGlobalGuards(new JwtGuard())
  app.enableCors({ origin: 'http://localhost:5173' })
  await app.listen(process.env.PORT || 3004)
}
bootstrap()
