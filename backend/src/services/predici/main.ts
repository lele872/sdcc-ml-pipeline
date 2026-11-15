import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { PrediciModule } from '../../predici/predici.module'
import { JwtGuard } from '../../auth/jwt.guard'

async function bootstrap() {
  const app = await NestFactory.create(PrediciModule)
  app.useGlobalPipes(new ValidationPipe({ transform: true }))
  app.useGlobalGuards(new JwtGuard())
  app.enableCors({ origin: 'http://localhost:5173' })
  await app.listen(process.env.PORT || 3002)
}
bootstrap()
