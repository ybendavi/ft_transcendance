const extMarginX = 10;
const extMarginWidth = 5;
const canvasHeight = 350;
const canvasWidth = 500;

export const gameProperties = {

	canvasWidth : canvasWidth,
	canvasHeight : canvasHeight,

	/*positions where upper left corner of the white border starts*/

	extMarginX : extMarginX, 
	extMarginY : 10,
	extMarginColor : "#fff",
	extMarginWidth : extMarginWidth,

	/*middle lane properties*/

	innerLineColor : "#fff",
	innerLineDist : 10,
	innerLineWidth : 15,
	innerLineHeight : 20,

	/* paddle properties*/

	WidthPaddle : 15,
	distPaddle : 3,

/*game properties*/

	GameSpeed : 10,
	ScoreSize: 25,

/* ball properties*/
	BallSize : 10,
	BallSpeed : 10,


/* paddles limits*/
	TopLimit : extMarginX + extMarginWidth + 2,
	BotLimit : canvasHeight - (extMarginX + extMarginWidth) - 2,

	/* respGame*/

	canvasWidthBack: canvasWidth,
	canvasHeightBack: canvasHeight,

	/* power-up properties*/

	powerUpSize: 30,
	

};
