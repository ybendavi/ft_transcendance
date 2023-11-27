import { gameProperties as gP } from './variables';
import { Pos, HitBox } from './ball';
export default class powerUpClass {
	size: number;
	pos: Pos;
	symbol: string;
	effect: number;

	constructor(posX: number, posY: number) {
		this.size = gP.powerUpSize;
		this.pos = {posX:  Math.round(posX), posY: Math.round(posY)};
		
		const effect = Math.floor(Math.random() * 4);
	//	const effect = 3;
		switch (effect) {
			case 0 :
				this.symbol = '🔥';
				this.effect = 0;
				break ;
			case 1 :
				this.symbol = '🔄';
				this.effect = 1;
				break ;
			case 2 :
				this.symbol = '🐇';
				this.effect = 2;
				break ;
			case 3 :
				this.symbol = '🐌';
				this.effect = 3;
	/*	case 2 :
				this.symbol = '🎆';
				this.effect = 2;
				break;
	*/	}
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

