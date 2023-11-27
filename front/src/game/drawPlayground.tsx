import "./gameApp";
import { payddler, element, gameProp, ball, powerUp } from "./types/types"

export function reDraw(context:CanvasRenderingContext2D, ball: ball, paddles: payddler[], gP: gameProp, scoreLeft: number, scoreRight: number, ratio: number, powerUp: powerUp | null): void {
	context.clearRect(0, 0, gP.canvasWidth, gP.canvasHeight);
	context.fillStyle = "#fff";
	context.font = gP.ScoreSize * ratio + "px sans-serif";
	drawPlayground(context, gP, ratio);
	draws(context, scoreLeft, scoreRight, gP, ratio);
	drawp(context, paddles[0].elem, ratio);
	drawp(context, paddles[1].elem, ratio);
	drawb(context, ball, ratio);
	if (powerUp)
		drawpu(context, gP, powerUp, ratio);
}

export function drawpu(context: CanvasRenderingContext2D, gP:gameProp, powerUp: powerUp, ratio: number){
	context.font = gP.powerUpSize * ratio + "px sans-serif";
	context.fillText(powerUp.symbol, powerUp.pos.posX * ratio, (powerUp.pos.posY * ratio) + gP.powerUpSize);
}
export function erase(context: CanvasRenderingContext2D, elem: element){
	context.clearRect(elem.x - 1, elem.y -1, elem.width + 2, elem.height + 2);
}

export function drawp(context: CanvasRenderingContext2D, elem: element, ratio: number){
	context.fillRect(elem.x * ratio, elem.y.current * ratio, elem.width * ratio, elem.height * ratio);
}

export function drawb(context: CanvasRenderingContext2D, elem: ball, ratio: number){
	context.fillRect(elem.pos.current.posX * ratio, elem.pos.current.posY * ratio, elem.width * ratio, elem.height * ratio);
}

export function draws(context: CanvasRenderingContext2D, scoreLeft: number, scoreRight: number, gP: gameProp, ratio: number){
	context.fillText(scoreLeft + "",
					 gP.canvasWidth / 2 - gP.ScoreSize * ratio - gP.extMarginY * 3 * ratio,
					 gP.extMarginY * 3 * ratio + gP.extMarginWidth * 2 * ratio);
	context.fillText(scoreRight + "",
					 gP.canvasWidth / 2 + (gP.innerLineWidth / 2) * ratio + gP.extMarginY * 3 * ratio,
					 gP.extMarginY * 3 * ratio + gP.extMarginWidth * 2 * ratio);
}

/* Works but pas ouf
export function drawEnd(context:CanvasRenderingContext2D, str: string, scoreLeft: number, scoreRight: number, gP: gameProp): void {
	context.clearRect(0, 0, gP.canvasWidth, gP.canvasHeight);
	context.fillStyle = "#fff";
	context.font = gP.ScoreSize * 2 + "px sans-serif";
	context.fillText(String(scoreLeft),
					 gP.canvasWidth / 2 - gP.ScoreSize - gP.extMarginY * 3,
					 gP.extMarginY * 3 + gP.extMarginWidth * 2);
	context.fillText(String(scoreRight),
					 gP.canvasWidth / 2 + (gP.innerLineWidth / 2) + gP.extMarginY * 3,
					 gP.extMarginY * 3 + gP.extMarginWidth * 2);
	

	context.font = gP.ScoreSize + "px sans-serif";
	context.fillText(str, gP.canvasWidth / 4,
					 gP.canvasHeight / 2);
}
 */
export default function drawPlayground(context: CanvasRenderingContext2D, gP: gameProp, ratio: number): void {

	/*outline*/
	context.strokeStyle = gP.extMarginColor;
	context.lineWidth = gP.extMarginWidth * ratio;

	context.strokeRect(gP.extMarginX * ratio, gP.extMarginY * ratio, gP.canvasWidth - (gP.extMarginX * 2 * ratio), gP.canvasHeight - (gP.extMarginY * 2 * ratio));

	/*middle line*/
	context.fillStyle = gP.innerLineColor;
	for (let i = gP.extMarginY * ratio + gP.extMarginWidth * ratio;
			i + (gP.extMarginY * ratio + gP.extMarginWidth * ratio) < gP.canvasHeight;
			i += (gP.innerLineHeight * ratio + gP.innerLineDist * ratio))
	{
		/*to make a perfect fit no matter canvas size*/
		if (i + gP.innerLineHeight * ratio > gP.canvasHeight - gP.extMarginY * ratio) {
			let temp: number = 
				gP.innerLineHeight * ratio - (i + gP.innerLineHeight * ratio
				- (gP.canvasHeight - gP.extMarginY * ratio - gP.extMarginWidth * ratio));
			context.fillRect(
				(gP.canvasWidth / 2) - ((gP.innerLineWidth / 2) * ratio),
				i,
				gP.innerLineWidth * ratio,
				temp);


		} else {
			context.fillRect(
				(gP.canvasWidth / 2) - ((gP.innerLineWidth / 2) * ratio),
				i,
				gP.innerLineWidth * ratio,
				gP.innerLineHeight * ratio);
		}
	}
}
