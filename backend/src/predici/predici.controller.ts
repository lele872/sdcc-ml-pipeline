import { Body, Controller, HttpCode, HttpException, HttpStatus, Post } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { PrediciRequest, type PrediciRequestDto, PrediciResponse } from '../common/schemas'
import { ZodValidationPipe } from '../common/zod-validation.pipe'
import { Config } from '../config'

@ApiTags('predici')
@Controller('api')
export class PrediciController {
  @HttpCode(200)
  @Post('predici')
  @ApiOkResponse({ description: 'Predizione numero persone' })
  async predici(
    @Body(new ZodValidationPipe(PrediciRequest)) dto: PrediciRequestDto,
  ): Promise<unknown> {
    let body: unknown
    try {
      const response = await fetch(Config.API_PREDICI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      })
      body = await response.json()
    } catch {
      throw new HttpException('lambda non raggiungibile', HttpStatus.BAD_GATEWAY)
    }
    return PrediciResponse.parse(body)
  }
}
