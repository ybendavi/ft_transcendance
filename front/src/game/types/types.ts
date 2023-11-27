
export type element = {
    width: number;
    height: number;
    x: number;
    y: any;
    xVel: number;
    yVel: number;
}

export type ball = {
    width: number;
    height: number;
    pos: any;
	xVel: number;
    yVel: number;
}

export type Pos = {
	posX: number;
	posY: number;
}

export type payddler = {
	
	elem: element;
	name: string;

}

export type powerUp = {
	size: number;
	pos: Pos;
	symbol: string;
	effect: number;
}

export type  gameProp = {

	 canvasWidth:number;
	 canvasHeight:number;

/*positions where upper left corner of the white border starts*/

	extMarginX: number; 
	extMarginY: number;
	extMarginColor: string;
	extMarginWidth: number;

/*middle lane properties*/

	 innerLineColor: string;
	 innerLineDist: number;
	 innerLineWidth: number;
	 innerLineHeight: number;

/* paddle properties*/

	WidthPaddle: number;
	distPaddle: number;

/*game properties*/

	GameSpeed: number;
	ScoreSize: number;


/* ball properties*/

	BallSize : number;
	BallSpeed : number;

/* paddleLim*/
	TopLimit: number;
	BotLimit: number;

/* respGame*/

	canvasWidthBack:number;
	canvasHeightBack:number;

	/* power-up properties*/

	powerUpSize: number,
}

