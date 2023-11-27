import { gameProperties as gP } from './variables';
import { Player } from './player';
import Ball, { Pos } from './ball';
import powerUpClass from './powerUp';
import { UserService } from 'src/user/user.service';

export default class Game {
	gameRoom: string;
	gameNb: number;

	PlayerFalse: Player;
	XboxFalse: number;
	isMovingF: boolean;

	PlayerTrue: Player;
	XboxTrue: number;
	isMovingT: boolean;

	missingPlayer?: number;
	ball: Ball;
	victoryId: number;
	displayName: string;
	gameLoop: boolean;
	bounce: boolean;

	TopLimit: number;
	BotLimit: number;
	LeftLimit: number;
	RightLimit: number;

	scoreFalse:number;
	scoreTrue: number;
	newScore: boolean;

	powerUp: boolean;
	powerOnPlayground: powerUpClass;
	startPowerY: number;
	endPowerY: number;
	rangePU: number;
	rangePUX: number;
	interval: any;
	smashEffect: boolean;
	paddleInversed: boolean;
	fasterPaddle: boolean;
	slowerPaddle: boolean;


	constructor(gameNb: number, PlayerFalse: Player, PlayerTrue: Player, powerUp: boolean, private readonly userService: UserService) {
		this.gameRoom = "game" + PlayerFalse.id + PlayerTrue.id;
		this.gameLoop = false;
		this.gameNb = gameNb;

		this.PlayerFalse = PlayerFalse;
		this.XboxFalse = gP.extMarginX + gP.distPaddle + gP.extMarginWidth / 2 + gP.WidthPaddle;
		this.PlayerFalse.paddleY = gP.canvasHeight / 2 - PlayerFalse.paddleLength / 2;

		this.PlayerTrue = PlayerTrue;
		this.XboxTrue = gP.canvasWidth - gP.extMarginX - gP.distPaddle - gP.extMarginWidth / 2 - gP.WidthPaddle;
		this.PlayerTrue.paddleY = gP.canvasHeight / 2 - PlayerTrue.paddleLength / 2;


		this.TopLimit = gP.TopLimit;
		this.BotLimit = gP.BotLimit;
		this.LeftLimit = gP.extMarginX + gP.extMarginWidth + gP.WidthPaddle / 2;
		this.RightLimit = gP.canvasWidth - (gP.extMarginX + gP.extMarginWidth + gP.WidthPaddle / 2 + gP.BallSize);

		this.victoryId = undefined;
		this.scoreFalse = 0;
		this.scoreTrue = 0;
		this.newScore = undefined;
		this.bounce = undefined;
		this.smashEffect = false;
		this.missingPlayer = undefined;
		this.powerUp = powerUp;
		if (this.powerUp === undefined || this.powerUp === null)
			this.powerUp = false;
		this.powerOnPlayground = undefined;
		if (powerUp) {
			this.startPowerY = this.LeftLimit + gP.powerUpSize * 3;
			this.endPowerY = this.RightLimit - gP.powerUpSize;
			this.rangePU = this.endPowerY - this.startPowerY;
			this.rangePUX = this.BotLimit - (this.TopLimit + gP.powerUpSize * 2);
			this.powerOnPlayground = undefined;
			this.paddleInversed = undefined;
			this.fasterPaddle = undefined;
			this.slowerPaddle = undefined;
		}
		this.ball = new Ball();

		/*pop powerUp?*/
		if (this.powerUp) {
			this.interval = setInterval(() => {
				if (this.powerOnPlayground)
					return ;
	//			if (Math.random() > 0.5)
	//			{
					const temp = (this.rangePU * (Math.random() + 0.0001)) + this.startPowerY;
					const temp2 = (this.rangePUX * (Math.random() + 0.0001)) + this.TopLimit;
					this.powerOnPlayground = new powerUpClass(temp, temp2);
	//			}
			}, 5000);
		}
	}


	//false = up, true = down
	movePaddle(player: Player, direction: boolean) {
		if (direction === false && player.paddleY > this.TopLimit )  {
			if (this.powerUp && this.paddleInversed !== undefined && this.paddleInversed === player.side) {
				if (player.paddleY + gP.GameSpeed >= this.BotLimit - player.paddleLength)
					return ;
				player.paddleY += gP.GameSpeed;
			} else if (this.powerUp && this.fasterPaddle !== undefined && this.fasterPaddle === player.side && player.paddleY - gP.GameSpeed * 2 > this.TopLimit)
				player.paddleY -= (gP.GameSpeed * 2);
			else if (this.powerUp && this.slowerPaddle !== undefined && this.slowerPaddle === player.side)
				player.paddleY -= (gP.GameSpeed / 2);

			else
				player.paddleY -= gP.GameSpeed;

		} else if (direction === true && player.paddleY < this.BotLimit - player.paddleLength) {
			if (this.powerUp && this.paddleInversed !== undefined && this.paddleInversed === player.side) {
				if (player.paddleY - gP.GameSpeed <= this.TopLimit)
					return ;
				player.paddleY -= gP.GameSpeed;
			} else if (this.powerUp && this.fasterPaddle !== undefined && this.fasterPaddle === player.side && player.paddleY + gP.GameSpeed * 2 < this.BotLimit - player.paddleLength)
				player.paddleY += (gP.GameSpeed * 2);
			else if (this.powerUp && this.slowerPaddle !== undefined && this.slowerPaddle === player.side)
				player.paddleY += (gP.GameSpeed / 2);
			 else
				player.paddleY += gP.GameSpeed;
		}
	}

	launch() {
		this.gameLoop = true;
	}

	ballMovement(): void {
	let ball = this.ball;

		if (this.isMovingF !== undefined)
			this.movePaddle(this.PlayerFalse, this.isMovingF);
		if (this.isMovingT !== undefined)
			this.movePaddle(this.PlayerTrue, this.isMovingT);
		if (this.smashEffect) {
			ball.pos.posX += ball.dirX * (ball.speed * 3);
			ball.pos.posY += ball.dirY * (ball.speed * 3);
		} else {
			ball.pos.posX += ball.dirX * ball.speed;
			ball.pos.posY += ball.dirY * ball.speed;
		}


	}

	ballOnLeftSide () {
		let ball = this.ball;
		const HitBox = ball.LeftHB();

		/* is the ball rebouncing */
		if ( (HitBox.posTop.posY >= this.PlayerFalse.paddleY &&
			  HitBox.posTop.posY <= this.PlayerFalse.paddleY + this.PlayerFalse.paddleLength)
			||(HitBox.posBot.posY >= this.PlayerFalse.paddleY &&
			   HitBox.posBot.posY <= this.PlayerFalse.paddleY + this.PlayerFalse.paddleLength) )
		{
			this.bounce = false;
			this.resetPowerUpOnBounce();
			ball.speed += 0.5;
			const distance = HitBox.posTop.posY - this.PlayerFalse.paddleY ;
			const angle = (Math.PI / 4) * (-2 * distance - ball.size + this.PlayerFalse.paddleLength) / (ball.size + this.PlayerFalse.paddleLength);
			ball.dirY = - (Math.sin(angle));
			ball.dirX = Math.cos(angle);
		}
			/* is there a goal */
			else if (ball.pos.posX < this.LeftLimit) {
				++this.scoreTrue;
				this.newScore = true;
				this.bounce = undefined;
				this.resetPowerUpOnMatch();
				ball.functionMatch();

		}
	}

	ballOnRightSide() {
		let ball = this.ball;
		const HitBox = ball.RightHB();
	/* is the ball rebouncing */
		if ( (HitBox.posTop.posY >= this.PlayerTrue.paddleY &&
			  HitBox.posTop.posY <= this.PlayerTrue.paddleY + this.PlayerTrue.paddleLength)
			||(HitBox.posBot.posY >= this.PlayerTrue.paddleY &&
			   HitBox.posBot.posY <= this.PlayerTrue.paddleY + this.PlayerTrue.paddleLength) )
		{
			this.bounce = true;
			this.resetPowerUpOnBounce();
			ball.speed += 0.5;
			const distance = ball.pos.posY - this.PlayerTrue.paddleY ;
			const angle = (Math.PI / 4) * (-2 * distance - ball.size + this.PlayerTrue.paddleLength) / (ball.size + this.PlayerTrue.paddleLength);
			ball.dirY = -(Math.sin(angle));
			ball.dirX = -(Math.cos(angle));
		}

		/* is there a goal */
		else if (ball.pos.posX > this.RightLimit) {
			++this.scoreFalse;
			this.newScore = false;
			this.bounce = undefined;
			this.resetPowerUpOnMatch();
			ball.functionMatch();
		}
	}

	calculate(): Pos {

		let ball = this.ball;

		this.ballMovement();

		/* if its on left side */
		if  (ball.pos.posX <= this.XboxFalse && this.bounce !== false)
			this.ballOnLeftSide();

		/* if its on right side */
		else if (ball.pos.posX + ball.size >= this.XboxTrue && this.bounce !== true)
			this.ballOnRightSide();

		/*is it a top or bottom limit */
		if (ball.pos.posY > (this.BotLimit - ball.size) || ball.pos.posY < this.TopLimit)
			ball.dirY *= -1;


		/*handle powerup collision*/
		if (this.powerOnPlayground &&
			( (this.checkCollision(this.ball.RightHB().posTop, this.powerOnPlayground.pos , gP.powerUpSize) ||
			 this.checkCollision(this.ball.RightHB().posBot, this.powerOnPlayground.pos , gP.powerUpSize) ) ||
			( (this.checkCollision(this.ball.LeftHB().posTop, this.powerOnPlayground.pos , gP.powerUpSize) ||
			 this.checkCollision(this.ball.LeftHB().posBot, this.powerOnPlayground.pos , gP.powerUpSize)) )
			) )
		{
			switch (this.powerOnPlayground.effect) {
			case 0 :
				this.smashEffect = true;
				break ;
			case 1 :
				if (this.bounce === true)
					this.paddleInversed = false;
				else if (this.bounce === false)
					this.paddleInversed = true;
				break;
			case 2 :
				if (this.bounce === true) {
					if (this.slowerPaddle === true)
						this.slowerPaddle = undefined;
					else
						this.fasterPaddle = true;
				}
				else if (this.bounce === false) {
					if (this.slowerPaddle === false)
						this.slowerPaddle = undefined;
					else
						this.fasterPaddle = false;
				}
				break;
			case 3 :
				if (this.bounce === true)
				{
					if (this.fasterPaddle === false)
						this.fasterPaddle = undefined;
					else
					this.slowerPaddle = false;
				}
				else if (this.bounce === false)
				{
					if (this.fasterPaddle === true)
						this.fasterPaddle = undefined;
					else
					this.slowerPaddle = true;
				}
					break;

		/*	case 2 :
				if (this.bounce === true)
					this. = false;
				else if (this.bounce === false)
					this.paddleInversed = true;
*/
			}
			this.powerOnPlayground = undefined;
		}

		if ((this.scoreTrue >= 11 || this.scoreFalse >= 11) && Math.abs(this.scoreTrue - this.scoreFalse) >= 2)
			this.Stop(undefined);
		return (ball.pos);

	}

	resetPowerUpOnBounce() {
		if (this.smashEffect)
			this.smashEffect = false;

	}

	resetPowerUpOnMatch() {
		this.resetPowerUpOnBounce();
		if (this.paddleInversed)
			this.paddleInversed = undefined;
		if (this.fasterPaddle)
			this.fasterPaddle = undefined;
		if (this.slowerPaddle)
			this.slowerPaddle = undefined;
		if (this.powerOnPlayground)
			this.powerOnPlayground = undefined;
	}

	checkCollision(point: Pos, upperLeft: Pos, sizeRange: number): boolean {
		const x2 = upperLeft.posX + sizeRange;
		const y2 = upperLeft.posY + sizeRange;

		if ((point.posX >= upperLeft.posX && point.posX <= x2) &&
			(point.posY >= upperLeft.posY && point.posY <= y2))
			{
				return (true);
			}
				return (false);
		}


	async Stop(hasGiveUp: number | undefined): Promise<void> {
		if (this.gameLoop === false)
			return ;
		if (hasGiveUp && this.missingPlayer) {
			if (hasGiveUp === this.PlayerTrue.id &&
			  this.scoreTrue > this.scoreFalse) {
				this.victoryId = this.PlayerTrue.id;
			}
			else if (hasGiveUp === this.PlayerTrue.id)  {
				this.victoryId = this.PlayerFalse.id;
			}
			else if (hasGiveUp === this.PlayerFalse.id &&
			  this.scoreTrue < this.scoreFalse) {
				this.victoryId = this.PlayerFalse.id;
			}
			else if (hasGiveUp === this.PlayerFalse.id)  {
				this.victoryId = this.PlayerTrue.id;
			}
		}
		else if (hasGiveUp && !this.missingPlayer) {
			if(hasGiveUp === this.PlayerTrue.id) {
				this.victoryId = this.PlayerFalse.id;
			}
			else {
				this.victoryId = this.PlayerTrue.id;
			}
		}
		else {
			if (this.scoreTrue > this.scoreFalse)
				this.victoryId = this.PlayerTrue.id;
			else
				this.victoryId = this.PlayerFalse.id;
		}
		if (this.powerUp)
			clearInterval(this.interval);
		let temp; 
		if (hasGiveUp)
			temp = await this.userService.findUserById(hasGiveUp);
		else
			temp = await this.userService.findUserById(this.victoryId);
		if (temp)
			this.displayName = temp.username;
		this.gameLoop = false;
		this.userService.sendScore(this.scoreTrue, this.scoreFalse, this.PlayerTrue.id, this.PlayerFalse.id, this.powerUp, this.victoryId);
	}

}
