import { Controller, Get, Post, Res, UseGuards, Redirect, Request, Body, HttpStatus, UseInterceptors, UploadedFile } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FtOauthGuard } from './guards/ft-oauth.guard';
import { JwtAuthGuard } from './guards/ft-jwt.guard'
import { HttpException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { EnvService } from 'src/config/config.service';



interface ChangePseudo {
  id: number;
  username: string;
}


@Controller('login')
export class AuthController {
  constructor(private readonly appService: AuthService, private envservice: EnvService) {
    const url = this.envservice.getUrl();
  }

  @Get('42')
  @UseGuards(FtOauthGuard)
  getTest(@Request() req) {
    return ;
  }

  @Get('42/return')
  @UseGuards(FtOauthGuard)
  async authCallBack (@Request() req, @Res({passthrough: true}) res) {
    const user = this.appService.logIn(req);
    
    res.cookie('user', JSON.stringify(user));
    const url = this.envservice.getUrl();
    const urltosend = 'http://' + url + ':3000';
	  res.redirect(urltosend);
  }

  @Get('logout')
  async logout (@Res() res) {
    res.cookie('user', null);
    const url = this.envservice.getUrl();
    const urltosend = 'http://' + url + ':3000';
    res.redirect(urltosend);
  }

  @Post('getUser')
   @UseGuards(JwtAuthGuard)
  async getUser(@Body() idObject) {
    const { id } = idObject;
    const user = await this.appService.findUser(id);
    return {user: user};
  }

  @Post('changePseudo')
  @UseGuards(JwtAuthGuard)
  async changePseudo (@Body() data: ChangePseudo) {
    const { id, username } = data;
    if (username.search(/^[a-zA-Z0-9]+$/) === -1) {
      throw new HttpException('Please use alphanumeric characters', 400);
    }
    const found: Boolean = await this.appService.findUserByName(username);
    if (found) {
      throw new HttpException('Username already taken', HttpStatus.CONFLICT);
    }
    const currentUser = await this.appService.changeUsername(id, username);
    const message = 'New pseudo received successfully';
    return { message };
  }

  @Post('changeAvatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async changeAvatar(@UploadedFile() file: Express.Multer.File, @Body('userId') userId: number) {
    const avatar = await this.appService.addAvatar(userId, file.buffer, file.originalname);
    return {avatarId: avatar.id};
  }

  @Post('getAvatar')
  @UseGuards(JwtAuthGuard)
  async getAvatar(@Body() idObject, @Res() res: Response) {
    const { id } = idObject;
    const avatar = await this.appService.handleGetAvatar(id);
    res.set('Content-type', 'image/jpeg');
    res.send(avatar.data);
  }

  @Post('2FA/generate')
  @UseGuards(JwtAuthGuard)
  async generateSecret(@Body() idObject) {
    const { id } = idObject;
    const secret = await this.appService.generateTwoFactorAuthSecret(id);
    return {secret};
  }

  @Post('2FA/disable')
  @UseGuards(JwtAuthGuard)
  async disable(@Body() idObject) {
    const { id } = idObject;
    await this.appService.disableSecret(id);
    return { msg: '2FA disabled' };
  }

  @Post('2FA/otpCheck')
  @UseGuards(JwtAuthGuard)
  async otpCheck(@Body() body) {
    const { id, otp } = body;
    const isValid = await this.appService.TwoFactorCheck(id, otp);
    if (!isValid) {
      throw new HttpException('Wrong OTP', HttpStatus.FORBIDDEN);
    }
    await this.appService.setUserValid(id);
    return { msg: '2FA succeded'};
  }
}
