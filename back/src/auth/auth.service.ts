import { Injectable } from '@nestjs/common';
import { UserDetails } from '../utils/types';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../Entities/User';
import { Repository, Not } from 'typeorm';
import { DatabaseFileService } from './databaseFiles.service';
import DatabaseFile from 'src/Entities/Avatar';
import  { JwtService } from '@nestjs/jwt';
import * as speakeasy from 'speakeasy';
@Injectable()
export class AuthService {
  constructor(@InjectRepository(User)
      private userRepository: Repository<User>,
      private readonly databaseFileService: DatabaseFileService,
      private readonly jwtService: JwtService
  ) {}

  async validateUser(details: UserDetails) {
    const user = await this.userRepository.findOneBy({email: details.email});
    if (user && !user.level) { user.level = 1;}
    if (user && user.secret) { 
      user.valid = false;
      await this.userRepository.save(user);
    }
    if (user) return user;
    let newUser = new User();
    newUser.username = details.username;
    newUser.email = details.email;
    while (await this.userRepository.findOneBy({username: newUser.username})) {
       newUser.username += '1';
    }
    newUser.level = 1;
    newUser.valid = true;
    return await this.userRepository.save(newUser);
  }


  async findUser(id: number) {
    const user = await this.userRepository.findOneBy({id});
    return user;
  }

  async findUserByName(username: string): Promise<Boolean> {
    const existingUser = await this.userRepository.findOne({ where: { username } });
    return !!existingUser;
  }

  async changeUsername(id: number, username: string) {
    const currentUser = await this.findUser(id);
    currentUser.username = username;
    await this.userRepository.save(currentUser);
    return currentUser;
  }

  async returnUserByName(username:string) {
    const user = await this.userRepository.findOne({ where: { username: username, } });
    return user;
  }
  async findUserBySocket(socket: string)
  {
    const User = await this.userRepository.findOne({ where: { socket: socket, } });
    return User;
  }

  async updateSocket(userid: number, socket: string) {
    return this.userRepository.update({
		  id: userid,
	  }, {socket : socket,});
  }



  async addAvatar(userId: number, imageBuffer: Buffer, filename: string) {
    const avatar = await this.databaseFileService.uploadDatabaseFile(imageBuffer, filename);
    await this.userRepository.update(userId, {
      avatarId: avatar.id
    });
    return avatar;
  }

  async handleGetAvatar(id: number): Promise<DatabaseFile> {
    const user = await this.findUser(id);
	let file = undefined;
	if (user && user.avatarId)
    	file = await this.databaseFileService.getFileById(user.avatarId);
    return file;
  }

  logIn(req) {
    if(!req.user) {
      return null;
    }
    else {
      const payload = { username: req.user.username, sub: req.user.id };
      const access_token = this.jwtService.sign(payload);
      
      return { user: req.user, access_token: access_token };
    }
  }

  async generateTwoFactorAuthSecret(id: number) {
    const user = await this.findUser(id);
    const secret = speakeasy.generateSecret();
    const secretKey = secret.base32;
    user.secret = secretKey;
    await this.userRepository.save(user);
    return secretKey;
  }

  async disableSecret(id:number) {
    const user = await this.findUser(id);
    user.secret = null;
    user.valid = true;
    await this.userRepository.save(user);
  }
  async setUserValid(id:number) {
    const user = await this.findUser(id);
    user.valid = true;
    await this.userRepository.save(user);
  }

  async TwoFactorCheck(id: number, otp: string) {
    const user = await this.findUser(id);
    const otpOption: speakeasy.TotpVerifyOptions = {
      secret: user.secret,
      encoding: 'base32',
      token: otp
    }
    const isValid = speakeasy.totp.verify(otpOption);
    return isValid;
  }

  async addblocked(user: number, toblock: number) {
    return this.userRepository.update(
      {
        id: user,
      },
      {
        blocked: () => `"blocked" || ARRAY[${toblock}]`,
      }
    );
  }

  async addblockedby(user: number, blocker: number) {
    return this.userRepository.update(
      {
        id: user,
      },
      {
        blockedby: () => `"blockedby" || ARRAY[${blocker}]`,
      }
    );
  }

  async removeblocked(user:number, tounblock: number) {
    return this.userRepository.update(
      {
        id: user,
      },
      {
        blocked: () => `array_remove("blocked", ${tounblock})`,
      }
    );
  }

  async removeblockedby(user:number, tounblockby: number) {
    return this.userRepository.update(
      {
        id: user,
      },
      {
        blockedby: () => `array_remove("blockedby", ${tounblockby})`,
      }
    );
  }

  async isblocked(user: number, usertofind: number): Promise<boolean> {

    let users = await this.userRepository.findOne(
      {
        where: {
          id: user,
        }
      }
    )
    if (users.blocked) {
      return users.blocked.some(blocked => blocked == usertofind);
    }
    else { return false;}
  }

  async isblockedby(user: number, usertofind: number): Promise<boolean> {
    let users = await this.userRepository.findOne(
      {
        where: {
          id: user,
        }
      }
    )
    if (users.blockedby){
    return users.blockedby.some(blockedby => blockedby == usertofind)}
    else {return false;}
  }


}
