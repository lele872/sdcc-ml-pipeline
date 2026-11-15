import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'

@ApiTags('health')
@Controller()
export class HealthController {
  @Get('healthz')
  @ApiOkResponse({ description: 'Stato del servizio' })
  healthz(): { status: string } {
    return { status: 'ok' }
  }
}
