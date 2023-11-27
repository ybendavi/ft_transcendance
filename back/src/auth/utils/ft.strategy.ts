import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy} from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-42';
import { AuthService } from '../auth.service';
import { EnvService } from 'src/config/config.service';





@Injectable()
export class FtStrategy extends PassportStrategy(Strategy, '42') {
    constructor(@Inject('AUTH_SERVICE') private readonly appService: AuthService, envService: EnvService) {
        super({

            clientID: envService.getClientID(),
            clientSecret:envService.getClientSecret() ,
            callbackURL: envService.getCallbackURL(),

            passReqToCallBack: true,
        });
    }
    async validate(
        request: { session: { accessToken: string } },
        accessToken: string,
        refreshToken: Profile,
        profile: Profile,
        cb: VerifyCallback,
    ): Promise<any> {
        const user = await this.appService.validateUser({ email: refreshToken._json.email, username: refreshToken._json.login })
        return user || null;
    }
}
