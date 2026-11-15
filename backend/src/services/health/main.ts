import { NestFactory } from '@nestjs/core'
import { HealthModule } from '../../health/health.module'

async function bootstrap() {
  const app = await NestFactory.create(HealthModule)
  app.enableCors({ origin: 'http://localhost:5173' })
  await app.listen(process.env.PORT || 3005)
}
bootstrap()
