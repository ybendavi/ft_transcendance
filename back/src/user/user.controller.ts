import { Body, Controller, Post, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ChannelService } from 'src/chat/channel.service';
import { User } from 'src/Entities/User';
import { JwtAuthGuard } from 'src/auth/guards/ft-jwt.guard';
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService,
		private readonly channelService: ChannelService
		) {
    }

    @Post('searchValue')
    async searchUser(@Body() body) {
        const {id, value} = body;
        const tabUsers = await this.userService.foundUsersTab(id, value);
        const tabChannels = await this.channelService.foundChannelTab(value);
        return {tabUsers, tabChannels};
    }

    // sending a friend request
    @Post('sendFriendRequest')
    @UseGuards(JwtAuthGuard)
    async sendFriendRequest(@Body() {idSender, idReceiver}){
        try {
            await this.userService.sendFriendRequest(idSender, idReceiver);
        }
        catch(error) {
            throw new HttpException('Friend Request already sent', HttpStatus.CONFLICT);
        }
        return({message: "friend Request sent !"});  
    }
    @Post('allFriendRequests')
    @UseGuards(JwtAuthGuard)
    async getAllFriendRequests(@Body() {id}) {
        const friendRequests: User[] = await this.userService.handleAllFriendRequests(id);
        const friendsList: User[] = await this.userService.handleAllFriendList(id);
        return {friendRequests, friendsList};
    }

    // receiving a friend request
    @Post('receiveFriendRequest')
    @UseGuards(JwtAuthGuard)
    async receiveFriendRequest(@Body() {idSender, idReceiver}){
        const ret = await this.userService.receiveFriendRequest(idSender, idReceiver);
    }

    @Post('acceptFriendRequest')
    @UseGuards(JwtAuthGuard)
    async acceptFriendRequest(@Body() {idSender, idReceiver}){
        await this.userService.acceptFriendRequest(idSender, idReceiver);
        
    }

    @Post('refuseFriendRequest')
    @UseGuards(JwtAuthGuard)
    async refuseFriendRequest(@Body() {idSender, idReceiver}){
        const ret = await this.userService.refuseFriendRequest(idSender, idReceiver);
    }

    @Post('deleteFriend')
    @UseGuards(JwtAuthGuard)
    async deleteFriendRequest(@Body() {idSender, idReceiver}) {
        
        if (!(await this.userService.deleteFriendRequest(idSender, idReceiver)))
        {
            throw new HttpException('Friend Request already sent', HttpStatus.CONFLICT);
        }
    }



    // creating a user for dev purpose
    @Post('addUser')
    async addUser(@Body() {username, email}) {
        const ret = await this.userService.addUser(username, email);
    }


}
