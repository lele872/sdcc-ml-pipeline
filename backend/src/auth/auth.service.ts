import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import * as jwt from 'jsonwebtoken'
import type { LoginRequestDto } from '../common/schemas'
import { Config } from '../config'

@Injectable()
export class AuthService {
  private cognito = new CognitoIdentityProviderClient({
    region: Config.AWS_REGION,
    endpoint: Config.FLOCI_URL,
    credentials: Config.AWS_CREDS,
  })

  async login(dto: LoginRequestDto): Promise<string> {
    if (Config.AUTH_MODE === 'cognito') return this.loginCognito(dto)
    return this.loginStatic(dto)
  }

  private async loginCognito(dto: LoginRequestDto): Promise<string> {
    try {
      const result = await this.cognito.send(
        new InitiateAuthCommand({
          AuthFlow: 'USER_PASSWORD_AUTH',
          AuthParameters: {
            USERNAME: dto.username,
            PASSWORD: dto.password,
          },
          ClientId: Config.COGNITO_CLIENT_ID,
        }),
      )
      const token = result.AuthenticationResult?.IdToken
      if (!token) throw new UnauthorizedException('credenziali non valide')
      return token
    } catch (exc) {
      if (exc instanceof UnauthorizedException) throw exc
      throw new UnauthorizedException('credenziali non valide')
    }
  }

  private loginStatic(dto: LoginRequestDto): string {
    if (dto.username !== Config.ADMIN_USER || dto.password !== Config.ADMIN_PASSWORD) {
      throw new UnauthorizedException('credenziali non valide')
    }
    return jwt.sign({}, Config.BFF_JWT_SECRET, {
      subject: dto.username,
      expiresIn: '8h',
    })
  }
}
