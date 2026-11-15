import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import type { Request } from 'express'
import * as jwt from 'jsonwebtoken'
import { JwksClient } from 'jwks-rsa'
import { Config } from '../config'

@Injectable()
export class JwtGuard implements CanActivate {
  private jwksClient =
    Config.AUTH_MODE === 'cognito'
      ? new JwksClient({
          jwksUri: `${Config.FLOCI_URL}/${Config.COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
        })
      : null

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    if (request.method === 'GET' && request.path === '/healthz') return true
    if (request.method === 'POST' && request.path === '/api/login') return true
    const header = request.headers.authorization
    if (!header?.startsWith('Bearer ')) this.reject()
    const token = header.slice('Bearer '.length)
    const payload =
      Config.AUTH_MODE === 'cognito' ? await this.verifyCognito(token) : this.verifyStatic(token)
    ;(request as { user?: unknown }).user = payload
    return true
  }

  private verifyStatic(token: string): jwt.JwtPayload {
    try {
      return jwt.verify(token, Config.BFF_JWT_SECRET, {
        algorithms: ['HS256'],
      }) as jwt.JwtPayload
    } catch {
      this.reject()
    }
  }

  private async verifyCognito(token: string): Promise<jwt.JwtPayload> {
    const client = this.jwksClient
    if (!client) this.reject()
    try {
      const decoded = jwt.decode(token, { complete: true })
      const kid = decoded?.header?.kid
      if (!kid) this.reject()
      const key = await client.getSigningKey(kid)
      return jwt.verify(token, key.getPublicKey(), {
        algorithms: ['RS256'],
        issuer: `${Config.FLOCI_URL}/${Config.COGNITO_USER_POOL_ID}`,
      }) as jwt.JwtPayload
    } catch {
      this.reject()
    }
  }

  private reject(): never {
    throw new UnauthorizedException({
      error: 'token mancante o scaduto',
    })
  }
}
