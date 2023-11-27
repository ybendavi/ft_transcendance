import { gameProperties as gP } from './variables';

type Pos = {
	posX: number;
	posY: number;
}

type HitBox = {
	posTop: Pos;
	posBot: Pos;
}

export { Pos, HitBox };

export default class Ball {
	size: number;
	speed: number;
	pos: Pos;
	dirX: number;
	dirY: number;
	velX: number;
	velY: number;
	service: boolean;

	constructor() {
		this.size = gP.BallSize;
		if (Math.round(Math.random()) === 1) {
			this.service = true;
		} else { 
			this.service = false;
		}
		this.dirY = Math.random();
		this.velX = 0;
		this.velY = 0;
		this.speed = gP.BallSpeed;

		this.functionMatch();
	}

	functionMatch() {
	
		if (this.service === true)
			this.dirX = Math.random() + 0.2;
		else if (this.service === false)
			this.dirX = -(Math.random() + 0.2);
		
		this.service = !this.service;

		this.pos = { posY: gP.canvasHeight / 2 - this.size / 2, posX: gP.canvasWidth / 2 - this.size / 2};
	
		this.speed = gP.BallSpeed;
		const tmp = this.dirX;
		this.dirX = Math.round(this.dirX / Math.sqrt(this.dirX * this.dirX +  this.dirY * this.dirY) * 100) / 100;
		this.dirY = Math.round(this.dirY / Math.sqrt(tmp * tmp +  this.dirY * this.dirY) * 100) / 100;

	}

	LeftHB(): HitBox {
		const ret: HitBox = { 
			posTop: {posX: this.pos.posX, posY: this.pos.posY},
			posBot: {posX : this.pos.posX, posY:this.pos.posY + this.size}
	}
		return (ret);
	}
	RightHB(): HitBox {
		const ret: HitBox = { 
			posTop: {posX: this.pos.posX + this.size, posY: this.pos.posY},
			posBot: {posX : this.pos.posX + this.size, posY:this.pos.posY + this.size}
	}
		return (ret);
	}

}
