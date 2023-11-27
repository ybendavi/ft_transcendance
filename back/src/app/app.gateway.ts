import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

import { Socket, Server } from 'socket.io';
import { ChatService } from '../chat/chat.service';
import { Chat } from '../chat/chat.entity';
import { Channel } from '../chat/channel.entity';
import { ChannelService } from '../chat/channel.service';
import {AuthService} from '../auth/auth.service';


import Game from 'src/Entities/Game';
import { Injectable, UseGuards } from '@nestjs/common';

import { cli } from 'webpack';
import { send } from 'process';
import { Security } from 'src/secu/secu.app';
import { WsAuthGuard } from 'src/auth/guards/ft-Ws.guard';
import {Repository} from 'typeorm';

// import {Relationship} from '../Entities/Relationship';



@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private appService : ChatService, private channelService:ChannelService, private readonly authservice: AuthService, private security: Security) {}


  @WebSocketServer() server: Server;

getSocketById(socketId: string): Socket | null {
    const connectedSockets = this.server.sockets.sockets;

    for (const [_, socket] of connectedSockets) {
      if (socket.id === socketId) {
        return socket;
      }
    }
    return null;
  }
  
  getServerMessage(text: string, channel: string, id: string) {
	let message = new Chat;

	message.channel = channel;
	message.sender = 'Chatbot';
	message.text = text;
	message.userid = -1;
	this.server.to(id).emit('recMessage', message);
  }

  @SubscribeMessage('banKickMute')
  async banKickMute(client: Socket, payload: {toban: string, channel: string, user: number, res: number, time: number}) {
		let channel = await this.channelService.findByName(payload.channel);
		let toban = await this.authservice.returnUserByName(payload.toban);

		if (!toban) {
			this.getServerMessage(payload.toban + ' does not exists.', payload.channel, client.id);
		}
		else {
			if (channel && channel[0]){

				if (await this.channelService.isAdmin(payload.user, channel[0].id) === false) {
					this.getServerMessage('You are not admin.', payload.channel, client.id);
				}
				else {
					if (await this.channelService.isMember(toban.id, channel[0].id) === false) {
						this.getServerMessage(toban.username + ' is not a member of the channel' + payload.channel, payload.channel, client.id);
					}
					else {
						if (channel[0].owner === toban.id) {this.getServerMessage('You cannot ban the owner of the channel', payload.channel, client.id);}
						else {
							if (payload.res === 0) {
								if (toban.socket){
									this.getServerMessage('You have been banned', payload.channel, toban.socket);
									let bansocket = this.getSocketById(toban.socket);
									if (bansocket) {
										bansocket.leave(payload.channel);
									}
									this.getServerMessage(toban.username + ' has been banned from this channel', payload.channel, payload.channel);
								}
								this.channelService.addbanned(toban.id, channel[0].id);
								this.channelService.removeUser(toban.id, channel[0].id);
							} 
							if (payload.res === 1)
							{
								let kicksocket = this.getSocketById(toban.socket);
								this.getServerMessage('You have been kicked', payload.channel, toban.socket);
								kicksocket.leave(payload.channel);
								this.getServerMessage(toban.username + ' has been kicked from this channel', payload.channel, payload.channel);
								this.getSocketById(toban.socket).leave(payload.channel);
								this.channelService.removeUser(toban.id, channel[0].id);
							}
							if (payload.res === 2)
							{
								if (Number.isNaN(payload.time)){
									this.getServerMessage('Time was not in digits.', payload.channel, client.id)
								}
								else if (payload.time > 3600)
								{
									this.getServerMessage('One hour is maximum, if you want more, ban instead.', payload.channel, client.id);
								}
								else
								{
									if (toban.socket){
										this.getServerMessage('You have been muted for ' + payload.time + ' sec.', payload.channel, toban.socket);
									}
									this.getServerMessage(toban.username + 'has been muted for ' + payload.time + ' sec.', payload.channel, payload.channel);
									this.channelService.addMuted(toban.id, channel[0].id);
									setTimeout(() => {
										this.channelService.removeMuted(toban.id, channel[0].id);
									  }, payload.time * 1000);
								}
							}
						}
					}
				}
			}
		}

  }

  @SubscribeMessage('quitChannelAdminOrUser')
  async quitRandom(client: Socket, payload:{user: number, channelname: string}) {
		let channel = await this.channelService.findByName(payload.channelname);
		if (!channel || !channel[0]) {this.getServerMessage('Channel does not exist.', 'General', client.id);}
		else
		{
			if (await this.channelService.isMember(payload.user, channel[0].id) === false){
				this.getServerMessage('You are not member of the channel ' + payload.channelname + '.', 'General', client.id);
			}
			else
			{
				let exists = true;
				if (channel[0].users.length === 1) {
					this.channelService.removeChannel(channel[0].id);
					exists = false;
				}
				else {
					if (await this.channelService.isAdmin(payload.user, channel[0].id)) {
						await this.channelService.removeAdmin(payload.user, channel[0].id)
					}
					await this.channelService.removeUser(payload.user, channel[0].id);
				}

				let user = await this.authservice.findUser(payload.user);
				client.leave(payload.channelname);
				this.getServerMessage('You left the channel.', payload.channelname, client.id);
				if (user && exists) {
				this.getServerMessage(user.username + ' left the channel.', payload.channelname, payload.channelname);}
			}
		}
  }

  @SubscribeMessage('quitOwner')
  async quitOwner(client: Socket, payload: {newowner: string, channelname:string, user: number}) {
	let channel = await this.channelService.findByName(payload.channelname);
	let newowner = await this.authservice.returnUserByName(payload.newowner);
	if (!newowner && channel[0].users.length > 1) {this.getServerMessage(payload.newowner + ' does not exist.', payload.channelname, client.id);}
	else
	{
		if (!channel || !channel[0])
		{
			this.getServerMessage("Channel does not exist.", 'General', client.id);
		}
		else
		{
			if (payload.user !== channel[0].owner)
			{
				this.getServerMessage('You are not owner of that channel.', payload.channelname, client.id);
			}
			else
			{
				if (channel[0].users.length > 1 && await this.channelService.isMember(newowner.id, channel[0].id) === false)
				{
					this.getServerMessage(payload.newowner + ' is not member of the channel ' + payload.channelname + '.', payload.channelname, client.id);
				}
				else
				{
					if (channel[0].users.length > 1) {
						if (await this.channelService.isAdmin(newowner.id, channel[0].id) === false)
						{
							this.channelService.addAdmin(newowner.id, channel[0].id);
						}
						await this.channelService.updateOwner(newowner.id, channel[0].id);
						if (newowner.socket)
						{
							this.getServerMessage('You have been granted owner', payload.channelname, newowner.socket);
						} 
					}
					this.quitRandom(client, {user: payload.user, channelname: payload.channelname});
				}
			}
		}
	}
  }
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('registerSocket')
  async registerSocketId(client: Socket, payload: number) {
	let user = await this.authservice.findUser(payload);
	let general = await this.channelService.findByName('General');
	if (general && general[0] && !general[0].users.includes(payload)){
		await this.channelService.addUser(payload, general[0].id);
	}
	if (user)
	{
		
		await this.authservice.updateSocket(user.id, client.id);
		let updateduser = await this.authservice.findUser(payload);
		let channels = await this.channelService.findAllChannelByUserId(user.id);
		channels.forEach((channel) => {

			client.join(channel.name);
		})
		let messages = await this.appService.findMessagesByUserId(user.id);
		let messagestosend = await Promise.all( messages.map( async (message): Promise<{text: string, sender: string, channel:string, userid:number, avatar: Uint8Array}> => {
			let user = await this.authservice.findUser(message.userid)
			let id = null;
			if (user){id = user.avatarId;}
			let avatar: Uint8Array;
			avatar = null;
			if (id){
				let avatarstruct = await this.authservice.handleGetAvatar(user.id);
				if (avatarstruct) {avatar = avatarstruct.data};
			}
			let newmessage: {text: string, sender: string, channel:string, userid:number, avatar: Uint8Array} = {
			text : message.text,
			sender : user.username,
			channel : message.channel,
			userid : message.userid,
			avatar : avatar,
		}
			return newmessage;
		}))
		this.server.to(client.id).emit('initAll', {channels, messagestosend});
	}
  }

  @SubscribeMessage('privMsg') 
  async	handlePrivMsg(client: Socket, payload: {recipient: string, userid: number}) {
	let userrecipient = await this.authservice.returnUserByName(payload.recipient);
	let usersender = await this.authservice.findUser(payload.userid);

	if (!userrecipient || !usersender) {
		this.getServerMessage('User does not exists.', 'General', client.id);
	}
	else {
		if (await this.channelService.isExisting(usersender.username + ":" + userrecipient.username) === true)
		{
			this.getServerMessage('You already have a chatroom with that user', 'General', client.id )
		}
		else if (userrecipient.id === usersender.id) {
			this.getServerMessage('You can\'t send a privmsg to yourself voyons', 'General', client.id);
		}
		else {
			let privconv: Channel = new Channel();
			privconv.name = usersender.username + ":" + userrecipient.username;
			privconv.type = 'privmsg';
			privconv.owner = -1;
			privconv.users = [usersender.id, userrecipient.id];
			privconv.bans = [];
			privconv.admins = [];
			await this.channelService.createChannel(privconv);
			this.server.to(client.id).emit('resPrivMsg', privconv);
			client.join(privconv.name);
			if (userrecipient.socket) {
				let socketrecipient = this.getSocketById(userrecipient.socket);
				if (socketrecipient && privconv && privconv.name) {
				socketrecipient.join(privconv.name);
				this.server.to(userrecipient.socket).emit('resPrivMsg', privconv);
				}
			}	
		}
	}
  }

  @SubscribeMessage('invitationGame')
  	async inviteToGame(client: Socket, payload: {id: number, privconv: string, mode: boolean}) {
		let channel = await this.channelService.findByName(payload.privconv);
		if (!channel || !channel[0]) {
			this.getServerMessage('Cannot find private messages.', payload.privconv, client.id);
		}
		else { 
			if (channel[0].type !== 'privmsg') {
				this.getServerMessage('This is not a private conversation.', payload.privconv, client.id);
			}
			else {
				if (channel[0].users.includes(payload.id) === false) {
					this.getServerMessage('You are not in the conversation then you cannot invite to a game.', payload.privconv, client.id);
				}
				else {
					if (channel[0].users.length !== 2) {
						this.getServerMessage('Something is wrong with the number of users in the conversation.', payload.privconv, client.id);
					}
					else {
						let tosendid = (channel[0].users[0] === payload.id) ? channel[0].users[1] : channel[0].users[0];
						let tosend = await this.authservice.findUser(tosendid);
						if (!tosend) {
							this.getServerMessage('User not found', payload.privconv, client.id);
						}
						else {
							if (!tosend.socket) {
								this.getServerMessage(tosend.username + ' is not online', payload.privconv, client.id);
							}
							else {
								let sender = await this.authservice.findUser(payload.id);
								if (sender){
									let blocks = await this.authservice.isblocked(sender.id, tosend.id);
									if (blocks === true) {
										this.getServerMessage('You cannot play with someone you blocked.', payload.privconv, client.id);
									}
									else {
									let blocksby = await this.authservice.isblockedby(sender.id, tosend.id);
										if (blocksby === true){
											this.getServerMessage(tosend.username + ' is not online', payload.privconv, client.id);
										}
										else {
											this.server.to(tosend.socket).emit('inviteClientToGame', {id: payload.id, username: sender.username, mode: payload.mode});
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}

	@SubscribeMessage('invitationAcceptedGame')
	async acceptInviteGame(client: Socket, payload: {id0: number, id1:number, gameMode: boolean}) {
		let user = await this.authservice.findUser(payload.id0);
		if (user && user.socket){
			this.server.to(user.socket).emit('launchGame', payload);
		}
	}
  
  @SubscribeMessage('askChannelRights')
	async returnRights(client: Socket, payload: {chaname:string; userid:number}): Promise<void>  {
		let channel = await this.channelService.findByName(payload.chaname);
		if (channel && channel[0] && channel[0].owner === payload.userid){
			this.server.to(client.id).emit('resChannelRights', 'owner');
		}
		else if (channel && channel[0] && channel[0].admins.includes(payload.userid)) {
			this.server.to(client.id).emit('resChannelRights', 'admin');
		}
		else {
			this.server.to(client.id).emit('resChannelRights', 'random');
		}
	}

  @SubscribeMessage('newPassword')
	  async createPassword(client: Socket, payload: {chaname: string; userid:number, password: string}) {

		let channel = await this.channelService.findByName(payload.chaname);
		if (!channel || !channel[0])
		{
			this.getServerMessage('Channel does not exist.', payload.chaname, client.id);
		}
		else {
			if (channel[0].owner !== payload.userid) {
				this.getServerMessage('You have not enough rights to do that.', payload.chaname, client.id);
			}
			else {
				await this.channelService.updatePassword(this.security.hashing(payload.password), channel[0].id);
				let chan = await this.channelService.findByName(payload.chaname);

			}
		}
}

@SubscribeMessage('removePassword')
	async removePassword(client: Socket, payload: {chaname: string; userid:number}) {

		let channel = await this.channelService.findByName(payload.chaname);
		if (!channel || !channel[0])
		{
			this.getServerMessage('Channel does not exist.', payload.chaname, client.id);
		}
		else {
			if (channel[0].owner !== payload.userid) {
				this.getServerMessage('You have not enough rights to do that.', payload.chaname, client.id);
			}
			else {
				await this.channelService.updatePassword(null, channel[0].id);
				let chan = await this.channelService.findByName(payload.chaname);
			}
		}
}

  @SubscribeMessage('createChannel')
	async handleCreateChannel(client: Socket, payload: Channel): Promise<void>   {
		let channel = await this.channelService.findByName(payload.name);
		if (channel && channel[0]) {this.getServerMessage(payload.name + ' is already taken.', 'General', client.id);}
		else {
			await this.channelService.createChannel(payload);
			client.join(payload.name);
			this.server.to(client.id).emit('resJoinChannel', {channame: payload.name, type: payload.type, rescode: 0});
		}
	}

	@SubscribeMessage('channelInvitation')
	async sendInvitation(client: Socket, payload: { channelname: string, invited: string, sender: number})
	{
		let channel = await this.channelService.findByName(payload.channelname);
		if (!channel || !channel[0])
		{
			this.getServerMessage('Channel does not exist.', payload.channelname, client.id);
		}
		else {
			if (channel[0].owner !== payload.sender && !(channel[0].admins.includes(payload.sender))) {
				this.getServerMessage('You have not the rights to do that: Admin or Owner.', payload.channelname, client.id);
			}
			else {
				let invited = await this.authservice.returnUserByName(payload.invited);
				if (!invited){this.getServerMessage(invited.username + ' does not exists.', channel[0].name, client.id);}
				else {
					if (await this.channelService.isBan(invited.id, channel[0].id) === true) {
						this.getServerMessage(invited.username + ' has been banned from this channel.', channel[0].name, client.id);
					}
					else {
						let sender = await this.authservice.findUser(payload.sender);
						if (sender)
						{
							if (invited.socket) {
								this.server.to(invited.socket).emit('inviteClientToChannel', {channelname: payload.channelname, sender: sender.username});
							}
							else {
								this.getServerMessage(invited.username + ' is not online.', payload.channelname, client.id);
							}
						}
					}				
				}
			}
		}
	}

	@SubscribeMessage('invitationAccepted')
	async acceptionHandler(client: Socket, payload: {channelname: string, sender:string, user: number}) { 
		let channel = await this.channelService.findByName(payload.channelname);
		if (channel && channel[0] && !channel[0].password) {
			await this.channelService.addUser(payload.user, channel[0].id);
			this.server.to(client.id).emit('addedByInvitation', {channelname: channel[0].name, channelprivacy: channel[0].type});
			client.join(payload.channelname);
		}
		else if (channel[0].password) {this.server.to(client.id).emit('resJoinChannel', {channame: payload.channelname, rescode: 3});}
	}

  @SubscribeMessage('joinChannel')
  async joinChannelRequest(client: Socket, payload: { name: string, user: number }) {
	let channel = await this.channelService.findByName(payload.name);
	if (channel && channel[0]) {
		if (await this.channelService.isBan(payload.user, channel[0].id)) {this.getServerMessage('You have been banned.', payload.name, client.id);}
		else if (await this.channelService.isMember(payload.user, channel[0].id)) {this.getServerMessage('You are already a member of that channel.', payload.name, client.id);}
		else if (channel[0].type === 'private') {
			this.server.to(client.id).emit('resJoinChannel', {channame: payload.name, rescode: 1});
			this.getServerMessage('You cannot join a private channel.', 'General', client.id);
		}
		else if (channel[0].password) {this.server.to(client.id).emit('resJoinChannel', {channame: payload.name, rescode: 3, type: channel[0].type});}
		else {
			await this.channelService.addUser(payload.user, channel[0].id);
			client.join(payload.name);
			let chan = await this.channelService.findByName(payload.name);
			this.server.to(client.id).emit('resJoinChannel', {channame: chan[0].name, rescode: 0, type: channel[0].type});
		}
	}
	else {
 		this.server.to(client.id).emit('resJoinChannel', {channame: payload.name, rescode: 1, type: undefined});
		 this.getServerMessage('Channel does not exist.', 'General', client.id);
	}
}

	@SubscribeMessage('joinWithPassword')
	async joinChannelRequestWithPassword(client: Socket, payload: { name: string, password: string, user: number}) {
		let channel = await this.channelService.findByName(payload.name);
		if (channel && channel[0]) {
			if (await this.channelService.isBan(payload.user, channel[0].id)) {this.getServerMessage('You have been banned', payload.name, client.id);}
			else if (await this.channelService.isMember(payload.user, channel[0].id)) {this.getServerMessage('You are already a member of that channel.', payload.name, client.id);}
			else {
				if (this.security.trypassword(payload.password, channel[0].salt, channel[0].password)) {
					await this.channelService.addUser(payload.user, channel[0].id);
					client.join(payload.name);
					this.server.to(client.id).emit('resJoinChannel', {channame: payload.name, rescode: 0, type: channel[0].type});
				}
				else {
					this.server.to(client.id).emit('resJoinChannel', {channame: payload.name, rescode: 3});
					this.getServerMessage('Wrong Password.', 'General', client.id);
				}
			}
		}
	}

	@SubscribeMessage('newAdmin')
	async grantAdmin(client: Socket, payload: { togrand: string, channel: string, user: number})
	{
		let channel = await this.channelService.findByName(payload.channel);
		if (channel && channel[0] && channel[0].owner === payload.user) {
				let togrant = await this.authservice.returnUserByName(payload.togrand);
				if (togrant && this.channelService.isMember(togrant.id, channel[0].id))
				{
					this.channelService.addAdmin(togrant.id, channel[0].id);
					if (togrant.socket){
						this.server.to(togrant.socket).emit('grantedAdmin', payload.channel);
					}
				}
		}
	}

  @SubscribeMessage('sendMessage')
  async handleSendMessage(client: Socket, payload: Chat)    {
	let user = await this.authservice.findUserBySocket(client.id);
	let channel = await this.channelService.findByName(payload.channel);
	if (user && channel && channel[0] && !(await this.channelService.isMuted(user.id, channel[0].id))) {
		if (payload.channel) {
			if (channel && channel[0]) {
				payload.users = [...channel[0].users];
				if (user.blocked) {
					user.blocked.forEach((user) => {
						const index = payload.users.indexOf(user);
						if (index > -1) {
							payload.users.splice(index, 1);
						}
					})
				}
				if (user.blockedby){
					user.blockedby.forEach((user) => {
						const index = payload.users.indexOf(user);
						if (index > -1) {
							payload.users.splice(index, 1);
						}
					})
				}
			}
		}
    	await this.appService.createMessage(payload);

    	if (payload.channel) {
			let sockets = this.server.sockets.adapter.rooms.get(payload.channel);
			if (sockets && sockets.has(client.id)) {
				let avatar = null;
				let newavatar;
				if (user.avatarId) {
					newavatar = (await this.authservice.handleGetAvatar(user.id));}
				if (newavatar && newavatar.data)
					avatar = newavatar.data;
				let message = {text: payload.text, sender: payload.sender, channel: payload.channel, userid: payload.userid, avatar:avatar};
				let invisiblesocketsblock = undefined;
				let invisiblesocketsblockby = undefined;
				if (user.blocked) {
					invisiblesocketsblock = await Promise.all( user.blocked.map( async (block): Promise<string> => {
						return (await this.authservice.findUser(block)).socket;
					}));
					invisiblesocketsblock.forEach((socket) => {
						this.getSocketById(socket).join('invisible');
					});
				}
				if (user.blockedby) {
					invisiblesocketsblockby = await Promise.all( user.blockedby.map( async (block): Promise<string> => {
					return (await this.authservice.findUser(block)).socket;
					}))
					invisiblesocketsblockby.forEach((socket) => {
						this.getSocketById(socket).join('invisible');
					})
				}
				this.server.to(payload.channel).except('invisible').emit('recMessage', message);
				if (invisiblesocketsblock) {
					invisiblesocketsblock.forEach((socket) => {
						this.getSocketById(socket).leave('invisible');
					});
				}
				if (invisiblesocketsblockby) {
					invisiblesocketsblockby.forEach((socket) => {
						this.getSocketById(socket).leave('invisible');
					});
				}
			}
		}
	}
  }

  @SubscribeMessage('blockUser')
  async blockUser(client: Socket, payload:{id: number, toblock:string, res:boolean}){
	let ustoblock = await this.authservice.returnUserByName(payload.toblock);
	if (ustoblock && ustoblock.id === payload.id){this.getServerMessage('You cannot block yourself.', 'General', client.id);}
	else {
		if (ustoblock && payload.res === true){
			await this.authservice.addblocked(payload.id, ustoblock.id);
			await this.authservice.addblockedby(ustoblock.id, payload.id);
			this.getServerMessage(ustoblock.username + ' is blocked.', 'General', client.id);
		}
		if (ustoblock && payload.res === false) {
			await this.authservice.removeblocked(payload.id, ustoblock.id);
			await this.authservice.removeblockedby(ustoblock.id, payload.id);
			this.getServerMessage(ustoblock.username + ' is unblocked.', 'General', client.id);
		}
	}
  }

  

  

  @SubscribeMessage('askUserInfo')
  async sendUserInfo(client: Socket, payload: number) {
	let user = await this.authservice.findUser(payload);
	let otheruser = await this.authservice.findUserBySocket(client.id);
	if (user){
		let avatar = null;
		let status = (user.socket) ? true : false; 
		if (otheruser && user && await this.authservice.isblocked(user.id, otheruser.id)) {status = false;}
		let block = await this.authservice.isblocked(otheruser.id, user.id);
		if (user.avatarId) {
			avatar = (await this.authservice.handleGetAvatar(user.avatarId)).data};
		
		let victorymatch0 =	await this.appService.getVictoryMatchByUserId(user.id);

		let newvictoriesmatch = await Promise.all( victorymatch0.map( async (victorymatch): Promise<{id: number, scoreTrue: number, PlayerTrueName: string, scoreFalse: number, PlayerFalseName: string, powerUp: boolean,  victoryName: string}> => {
		let PlayerTrue = await this.authservice.findUser(victorymatch.PlayerTrueId);
		let PlayerFalse = await this.authservice.findUser(victorymatch.PlayerFalseId);
		let PlayerVictory = await this.authservice.findUser(victorymatch.victoryId);
		let newvictorymatch = {
			id:victorymatch.id,
			scoreTrue: victorymatch.scoreTrue,
			PlayerTrueName: PlayerTrue.username,
			scoreFalse: victorymatch.scoreFalse,
			PlayerFalseName: PlayerFalse.username,
			powerUp: victorymatch.powerUp, 
			victoryName: PlayerVictory.username
		};
		return (newvictorymatch);
		}));

		let defeatmatch0 = await this.appService.getDefeatMatchByUserId(user.id);
		let newdefeatsmatch = await Promise.all( defeatmatch0.map(async (defeatmatch): Promise<{id: number, scoreTrue: number, PlayerTrueName: string, scoreFalse: number, PlayerFalseName: string, powerUp: boolean,  victoryName: string}> => {
		let Player2True = await this.authservice.findUser(defeatmatch.PlayerTrueId);
		let Player2False = await this.authservice.findUser(defeatmatch.PlayerFalseId);
		let Player2Victory = await this.authservice.findUser(defeatmatch.victoryId);
		let newdefeatmatch = {
			id:defeatmatch.id,
			scoreTrue: defeatmatch.scoreTrue, 		
			PlayerTrueName: Player2True.username, 
			scoreFalse: defeatmatch.scoreFalse, 
			PlayerFalseName: Player2False.username, 
			powerUp: defeatmatch.powerUp,  
			victoryName: Player2Victory.username
		};
		return (newdefeatmatch);
		}));

		this.server.to(client.id).emit('sendUserInfo', {username: user.username, email:user.email, status: status, avatar: avatar, blocked: block, level: user.level, defeatmatch: newdefeatsmatch, victorymatch: newvictoriesmatch});
	}
  }
  async afterInit(server: Server) {
	let channel = await this.channelService.findByName('General');
	if (!channel || !channel[0])
	{
		let general: Channel = new Channel;
		let name = 'General';
		general.name = name;
		general.admins = [];
		general.bans = [];
		general.owner = -1;
		general.password = null;
		general.users = [];
		general.type = 'public';
		this.channelService.createChannel(general);
	}
	this.channelService.removeAllMuted();
  }

 async handleDisconnect(client: Socket) {
	let user = await this.authservice.findUserBySocket(client.id);
	if (user && user.socket) {
		await this.authservice.updateSocket(user.id, null);
	}
  }

  handleConnection(client: Socket, ...args: any[]) {
	this.server.emit('init');
	client.join('General');

  }

  async sendFriendRequestToReceiver(idReceiver: number, idSender: number) {
	const receiver = await this.authservice.findUser(idReceiver);
	const sender = await this.authservice.findUser(idSender);
	if (receiver.socket) {
		this.server.to(receiver.socket).emit('FriendRequestToReceiver', {message: sender});
	}
  }
}
