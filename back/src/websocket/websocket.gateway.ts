import { WebSocketGateway, ConnectedSocket, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { gameProperties } from './variables';
import { Player } from './player';
import  Game from './app.game';
import { UserService } from 'src/user/user.service';
import { userInfo } from 'os';
import { UseGuards } from '@nestjs/common';
import { WsAuthGuard } from 'src/auth/guards/ft-Ws.guard';

@WebSocketGateway( {
  cors: {
    origin: '*',
  },
	namespace: 'game' ,
})
export class GameGateway {

/*INIT PART*/

	@WebSocketServer()
	server: Server;

	playerList = new Map<string, Player>();
	waitList = new Array();
	powerUpWaitList = new Array();
	fromChatWaitList = new Array();
	idList = new Array();
	games = new Array();
	nbConnections = 0;
	onHold = 0;

	constructor(private readonly userService: UserService) {}

		findPreviousGame(client: Socket, payload:any): boolean {
			for (let i = 0; i < this.games.length ; i++)
			{
				if (this.games[i].missingPlayer !== undefined && payload[0] === this.games[i].missingPlayer)
				{
					this.server.to(client.id).emit('giveScore',
								this.games[i].scoreFalse, this.games[i].scoreTrue);
					if (this.games[i].PlayerTrue.name === payload[0]) {
					this.games[i].PlayerTrue.socket = client;
					this.setPlayer(this.games[i], this.games[i].PlayerTrue, true);
					} else {
					this.games[i].PlayerFalse.socket = client;
					this.setPlayer(this.games[i], this.games[i].PlayerFalse, false);
				}
				--this.onHold;
				this.games[i].missingPlayer = undefined;
				this.games[i].launch();
				return (true);
			}
		}
		return (false);
	}

	afterInit(server: Server) {
		this.UpdateBall();
	}

/*CONNECTION PART*/

	deleteGame(game: Game) {
		game.PlayerFalse.socket.leave(game.gameRoom);
		game.PlayerTrue.socket.leave(game.gameRoom);
		this.games.splice(this.games.indexOf(game), 1);
		
		game.PlayerFalse.socket.disconnect();
		game.PlayerTrue.socket.disconnect();
		this.playerList.delete(game.PlayerFalse.socket.id);
		this.playerList.delete(game.PlayerTrue.socket.id);
		this.nbConnections -= 2;
	}

	@SubscribeMessage('onGiveUp')
	async clientGiveUp(client: Socket): Promise<void> {
		const current = this.playerList.get(client.id);
		if (current && current.onGame === false) {
			if (this.waitList.includes(current))
				this.waitList.splice(this.waitList.indexOf(current));
			if (this.powerUpWaitList.includes(current))
				this.powerUpWaitList.splice(this.powerUpWaitList.indexOf(current));
				if (this.fromChatWaitList.includes(current))
				this.fromChatWaitList.splice(this.fromChatWaitList.indexOf(current));
			} else if (current && current.onGame) {
			await current.game.Stop(current.id);
			let displayName = current.game.displayName;
			this.server.in(current.game.gameRoom).emit('finalScore',
									"Player " + displayName + " has give up",
									current.game.scoreFalse,
									current.game.scoreTrue);
			this.deleteGame(current.game);
		}
		client.disconnect();
	}

	handleConnection(@ConnectedSocket() client: Socket) {
		++this.nbConnections;
	}


	handleDisconnect(@ConnectedSocket() client: Socket) {

		let player = this.playerList.get(client.id);

		if (!player)
			return ;
		if (player.onGame === false) {
			if (this.waitList.includes(player))
				this.waitList.splice(this.waitList.indexOf(player));
			if (this.powerUpWaitList.includes(player))
				this.powerUpWaitList.splice(this.powerUpWaitList.indexOf(player));
			if (this.fromChatWaitList.includes(player))
				this.fromChatWaitList.splice(this.fromChatWaitList.indexOf(player));
		} else if (player.game.gameLoop === true) {
			player.game.gameLoop = false;
			++this.onHold;
			player.game.missingPlayer = player.id;
			this.server.to(player.game.gameRoom).emit('gameOnHold');

		} else if (player.game.gameLoop === false && player.game.missingPlayer) {
			player.game.Stop(player.game.missingPlayer);
			this.deleteGame(player.game);
			--this.onHold;
		}
		this.idList.splice(this.idList.indexOf(player.id));
		--this.nbConnections;
		this.userService.updateSocket(player.id, null);
	}


/*PLAYER INIT*/

	setPlayer(game: Game, player: Player, side: boolean): void {
		player.socket.join(game.gameRoom);
		player.onGame = true;
		player.side = side;
		player.game = game;
		this.userService.updateSocket(player.id, player.socket.id);
		this.playerList.set(player.socket.id, player);
		this.server.to(player.socket.id).emit('gameFound');
		this.server.to(player.socket.id).emit('init',
				gameProperties,
				side,
				player.game.PlayerFalse.paddleY,
				player.game.PlayerTrue.paddleY,
				player.game.ball.pos,
				player.game.PlayerFalse.paddleLength,
				player.game.PlayerTrue.paddleLength
		);
}

	addToPowerUpWaitList(player: Player): void {
		this.powerUpWaitList.push(player);
		if (this.powerUpWaitList.length > 1)
		{
			const index = this.games.length;
			const newGame = new Game(index, this.powerUpWaitList[0], this.powerUpWaitList[1], true, this.userService);
			this.games.push(newGame);
			this.powerUpWaitList.pop();
			this.powerUpWaitList.pop();
			this.setPlayer(newGame, newGame.PlayerFalse, false);
			this.setPlayer(newGame, newGame.PlayerTrue, true);
			newGame.launch();	
		}
	}

	addToWaitList(player: Player): void {
		this.waitList.push(player);
		if (this.waitList.length > 1)
		{
			const index = this.games.length;
			const newGame = new Game(index, this.waitList[0], this.waitList[1], false, this.userService);
			this.games.push(newGame);
			this.waitList.pop();
			this.waitList.pop();
			this.setPlayer(newGame, newGame.PlayerFalse, false);
			this.setPlayer(newGame, newGame.PlayerTrue, true);
			newGame.launch();
		}
	}

	addToFromChatWaitList(player: Player): void {
		this.fromChatWaitList.push(player);
		if (this.fromChatWaitList.length > 1)
		{
			for (let i = 0; i < this.fromChatWaitList.length ; i++) {
				for (let y = 0; i < this.fromChatWaitList.length ; y++) {
				if (this.fromChatWaitList[i].mate === this.fromChatWaitList[y].id)
					{
						const index = this.games.length;
						const newGame = new Game(index, this.fromChatWaitList[i], this.fromChatWaitList[y], this.fromChatWaitList[i].gM, this.userService);
						this.games.push(newGame);
						this.fromChatWaitList.splice(y);
						this.fromChatWaitList.splice(i);
						this.setPlayer(newGame, newGame.PlayerFalse, false);
						this.setPlayer(newGame, newGame.PlayerTrue, true);
						newGame.launch();
					}
				}
			}
		}
	}


	@UseGuards(WsAuthGuard)
	@SubscribeMessage('launchedFromChat')
	LaunchedFromChat(client:Socket, payload: any): void {
		if (this.idList.includes(payload[0])) {
			this.server.to(client.id).emit('gameLaunchedTwice');
			client.disconnect();
			return ;
		}

		this.idList.push(payload[0]);
		if (this.onHold && this.findPreviousGame(client, payload) === true)
			return ;
    
		this.playerList.set(client.id, {
			id: payload[0],
			socket: client,
			onGame: false,
			paddleLength: payload[1],
			paddleY: gameProperties.canvasHeight / 2 - payload[1] / 2,
			gM: payload[2],
			mate: payload[3]
		});
		this.addToFromChatWaitList(this.playerList.get(client.id));
	}

	@UseGuards(WsAuthGuard)
	@SubscribeMessage('givePlayerInfos')
	PlayerHasJoin(client: Socket, payload:any): void {
		if (this.idList.includes(payload[0])) {
			this.server.to(client.id).emit('gameLaunchedTwice');
			client.disconnect();
			return ;
		}
		this.idList.push(payload[0]);
		if (this.onHold && this.findPreviousGame(client, payload) === true)
			return ;
		this.playerList.set(client.id, {
			id: payload[0],
			socket: client,
			onGame: false,
			paddleLength: payload[1],
			paddleY: gameProperties.canvasHeight / 2 - payload[1] / 2
		});
		if (payload[2] === true)
			this.addToPowerUpWaitList(this.playerList.get(client.id));
		else
			this.addToWaitList(this.playerList.get(client.id));	
	}

/*EVENTS*/
/*solution ok qui tourne bien*/


	UpdateBall() {
		const inter = setInterval(() => {
			for (let i = 0 ; i < this.games.length ; i++)
			{
				if (this.games[i].gameLoop)
					{
						const game = this.games[i];
						this.server.in(game.gameRoom).emit('ballPos', game.calculate(), game.PlayerFalse.paddleY, game.PlayerTrue.paddleY, game.powerOnPlayground);
						if (game.newScore !== undefined) {
							this.server.in(game.gameRoom).emit('upScores', game.newScore);
							game.newScore = undefined;
						}
					}
				else if (this.games[i].victoryId !== undefined) {
						const game = this.games[i];
						//remplacer l'id par un find user by id
					this.server.in(game.gameRoom).emit('finalScore',
										"Player " + game.displayName + " for the win!",
										game.scoreFalse,
										game.scoreTrue);
						this.deleteGame(game);	
				}
			}
		}, 60);
	}

	@SubscribeMessage('onUp')
	onUpEvent(client:Socket) {
		const current = this.playerList.get(client.id);
		if (current && current === current.game.PlayerTrue)
			current.game.isMovingT = false;
		else
			current.game.isMovingF = false;
	}

	@SubscribeMessage('endMove')
	endEvent(client:Socket) {
		const current = this.playerList.get(client.id);

		if (current && current === current.game.PlayerTrue)
			current.game.isMovingT = undefined;
		else
			current.game.isMovingF = undefined;
	}

		@SubscribeMessage('onDown')
	onDownEvent(client:Socket) {
		const current = this.playerList.get(client.id);
		if (current && current === current.game.PlayerTrue)
			current.game.isMovingT = true;
		else
			current.game.isMovingF = true;
	}
}
