import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { jwtConstants } from '../utils/constants';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class WsAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const client = context.switchToWs().getClient();
    const token = client.handshake.query.token;
    
    try {
      const decoded = jwt.verify(token, jwtConstants.secret);
      

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
