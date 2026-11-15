import { CloudWatchLogsClient, FilterLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs'
import { BadRequestException, Controller, Get, Query } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { LogsResponse } from '../common/schemas'
import { Config } from '../config'

export interface LogEvent {
  timestamp: number
  message: string
  stream: string
}

@ApiTags('logs')
@Controller('api')
export class LogsController {
  private client = new CloudWatchLogsClient({
    region: Config.AWS_REGION,
    endpoint: Config.FLOCI_URL,
    credentials: Config.AWS_CREDS,
  })

  @Get('logs')
  @ApiOkResponse({ description: 'Eventi di log del gruppo richiesto' })
  async logs(
    @Query('group') group = '/aws/lambda/sdcc-scan',
    @Query('limit') limit = 100,
  ): Promise<{ events: LogEvent[] }> {
    if (!/^\/aws\/lambda\/sdcc-[a-z]+$/.test(group)) {
      throw new BadRequestException('gruppo di log non valido')
    }
    const limite = Math.min(Math.max(Number(limit) || 100, 1), 1000)
    try {
      const result = await this.client.send(
        new FilterLogEventsCommand({
          logGroupName: group,
          limit: limite,
        }),
      )
      return LogsResponse.parse({
        events: (result.events || []).map((e) => ({
          timestamp: e.timestamp ?? 0,
          message: e.message ?? '',
          stream: e.logStreamName ?? '',
        })),
      })
    } catch {
      return LogsResponse.parse({ events: [] })
    }
  }
}
