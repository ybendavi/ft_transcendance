import { Inject, Injectable } from "@nestjs/common";
import { PassportSerializer } from "@nestjs/passport";
import { AuthService } from "../auth.service";
import { User } from "../../Entities/User";

@Injectable()
export class SessionSerializer extends PassportSerializer {
    constructor(
        @Inject('AUTH_SERVICE') private readonly appService: AuthService
    ) {
        super();
    }
    serializeUser(user: User, done: Function) {
        done(null, user);
    }
    async deserializeUser(payload: User, done: Function) {
        const user = await this.appService.findUser(payload.id);
        return user ? done(null, user) : done(null, null);
    }
}