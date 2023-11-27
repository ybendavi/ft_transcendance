import { payddler, gameProp, ball } from "./types/types";



export function initPaddles(gP: gameProp, leftY: any, rightY: any, leftS: any, rightS: any): payddler[] {
	const payddlers: payddler[] =
		[{
		elem: {
			width: gP.WidthPaddle,
			height:leftS,
			x: gP.extMarginX + gP.distPaddle + gP.extMarginWidth / 2,
			y: leftY,
			xVel: 0,
			yVel: 0 },
			name: "name1",
	} , {
		elem: {
				width: gP.WidthPaddle,
				height: rightS,
				x: gP.canvasWidth - (gP.extMarginX + gP.distPaddle + gP.WidthPaddle) - gP.extMarginWidth / 2,
				y: rightY,
				xVel: 0,
				yVel: 0 },
			name: "name1",
	}]	
	return (payddlers);
}

export function initBall(gP: gameProp, pos: any): ball {
	const ball: ball = {
		width: gP.BallSize,
		height: gP.BallSize,
		pos: pos,
		xVel: 0,
		yVel: 0
	}
	return (ball);
}
