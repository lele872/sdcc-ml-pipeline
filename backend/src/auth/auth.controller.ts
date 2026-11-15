import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common'
import { ApiOkResponse, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import {
  LoginRequest,
  type LoginRequestDto,
  LoginResponse,
  type LoginResponseDto,
  MeResponse,
  type MeResponseDto,
} from '../common/schemas'
import { ZodValidationPipe } from '../common/zod-validation.pipe'
import { AuthService } from './auth.service'

@ApiTags('auth')
@Controller('api')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(200)
  @Post('login')
  @ApiOkResponse({ description: 'Token JWT emesso' })
  async login(
    @Body(new ZodValidationPipe(LoginRequest)) dto: LoginRequestDto,
  ): Promise<LoginResponseDto> {
    const token = await this.authService.login(dto)
    return LoginResponse.parse({ token })
  }

  @Get('me')
  @ApiOkResponse({ description: 'Info utente corrente' })
  me(@Req() req: Request): MeResponseDto {
    const payload = (req as unknown as { user: { sub: string; exp: number } }).user
    return MeResponse.parse({ username: payload.sub, exp: payload.exp })
  }
}
