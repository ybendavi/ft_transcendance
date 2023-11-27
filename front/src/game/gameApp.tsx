import { useState, useEffect, useRef } from 'react';
import drawPlayground, {reDraw } from './drawPlayground';
import { drawb, drawp } from './drawPlayground';
import { io, Socket } from "socket.io-client";
import { initPaddles, initBall } from './player';
import { gameProp, payddler, Pos, ball, powerUp} from './types/types';

/*************************************/

export default function GameApp({launchGameFromChat, setLaunchGameFromChat, isConnected, setIsConnected, user}: any): any {
	
	const [playButton, setplayButton] = useState(true);
	const [here, setHere] = useState(true);
	
	const url = import.meta.env.VITE_URL;

const socket = useRef<Socket>(io('ws://' + url + ':8080/game',  {autoConnect: false, query: {		token: `${user.access_token}`,
	  }}));
	
/*******************/

	const [gameFound, setGameFound] = useState<boolean>(false);
	const [paddles, setPaddles] = useState<payddler[]>();
	const [side, setSide] = useState<boolean>();
	const [ball, setBall] = useState<ball>();
	const [gM, setGM] = useState<boolean>(true);
	const normalEnd = useRef<boolean>(false);
	const gameMode = useRef<boolean>();
	const ref = useRef<HTMLCanvasElement>(null);
	const leftY = useRef<number>(0);
	const rightY = useRef<number>(0);
	const pos = useRef<Pos>({posX: 0, posY: 0});
	const scoreLeft = useRef<number>(0);
	const scoreRight = useRef<number>(0);
	const level = useRef<number>(0);
	const widthScreen = useRef<number>(window.innerWidth);
	const heightScreen = useRef<number>(window.innerHeight);
	const gameProperties = useRef<gameProp>();
	const canvasRatio = useRef<number>(1);
	const powerUp = useRef<powerUp>();
	const isInviter = useRef<boolean>(false);
	const requestedGameProps = useRef<{id0: number, id1: number, gameMode: boolean, inviter: boolean}>();

	useEffect(() => {
		if (launchGameFromChat) {
			setGM(false);
			setplayButton(false);
			gameMode.current = launchGameFromChat.gameMode; 
			if (launchGameFromChat.inviter)
				isInviter.current = true;
			requestedGameProps.current = launchGameFromChat; 
		}
		return () => {	
			setLaunchGameFromChat(undefined);
		};
	}, [launchGameFromChat]);

  function handleClick() {
		setplayButton(false);
  }


	/*on connect or disconnect*/
	useEffect(() => {
		socket.current.on('connect', onConnect);
		socket.current.on('disconnect', onDisconnect);
		socket.current.on('gameLaunchedTwice', gameLaunchedTwice);


		function onConnect(): void {
			setIsConnected(true);
			if (!requestedGameProps.current && user) {
				socket.current.emit('givePlayerInfos', user.id , level.current, gameMode.current);
			}	else if (requestedGameProps.current && user) {
				const props = requestedGameProps.current;
				if (isInviter.current) {
					socket.current.emit('launchedFromChat',
					props.id0,
					level.current,
					props.gameMode,
					props.id1);
				} else {
					socket.current.emit('launchedFromChat',
					props.id1,
					level.current,
					props.gameMode,
					props.id0);
				}
				requestedGameProps.current = undefined; 
			}
		}

		function onDisconnect():void {
			if (!normalEnd.current)
				alert("Server is encountering unexpected problems : the game will not be saved");
			setIsConnected(false);
			setHere(true);
			setplayButton(true);
			setGM(true);
			setScores(0, 0);
			setGameFound(false);
			isInviter.current = false;
			gameProperties.current = undefined;
			setSide(undefined);
			leftY.current = 0;
			rightY.current = 0;
			level.current = 0;
			powerUp.current = undefined;
			normalEnd.current = false;
		}

		function gameLaunchedTwice(): void {
			alert("You are already playing!");
		}

		return () => {
			socket.current.off('connect', onConnect);
			socket.current.off('gameLaunchedTwice', gameLaunchedTwice);
			socket.current.off('disconnect', onDisconnect);
		};
	}, [user]);

	function giveUp() {
		normalEnd.current = true;
		if (isConnected)
			socket.current.emit('onGiveUp');
		if (!gameProperties.current) {
			setGameFound(false);
			setplayButton(true);
			setHere(true);
			setGM(true);
		}
	}

/**********************************/

//	once isConnected; on Init should be launched
	useEffect(() => {
		socket.current.on('init', onInit); 
		socket.current.on('giveScore', setScores);
		socket.current.on('gameFound', setterGameFound); 

	function setterGameFound() {
		setGameFound(true);
	}

	function onInit(gameProperty: gameProp, side: boolean, startLeft: number, startRight: number, ballPos: Pos, leftS: number, rightS: number): void {
			if (!isConnected)
		//		throw new Error("!isConnected");
				return ;
			if (!gameProperty)

		//		throw new Error("!gameProp");
				socket.current.disconnect();


			setSide(side);
			gameProperties.current = gameProperty;
			const canvas = ref.current;
			if (!canvas)
			throw new Error("!canvasi");
		//		return ;
			canvas.width = gameProperties.current.canvasWidth;
			canvas.height = gameProperties.current.canvasHeight;
			const context = canvas.getContext('2d');
			if (!context)
			throw new Error("!canvasy");
	//			return ;

			leftY.current = startLeft;
			rightY.current = startRight;

			const paddles: payddler[] = initPaddles(gameProperties.current, leftY, rightY, leftS, rightS);
			setPaddles(paddles);

			pos.current = ballPos;
			const ball = initBall(gameProperties.current, pos);
			setBall(ball);

			drawPlayground(context, gameProperties.current, canvasRatio.current);

			drawb(context, ball, canvasRatio.current);
			drawp(context, paddles[0].elem, canvasRatio.current);
			drawp(context, paddles[1].elem, canvasRatio.current);
			calculateCanvasSize();
		}
		return () => {
			socket.current.off('init', onInit);
			socket.current.off('giveScore', setScores);
			socket.current.off('gameFound', setterGameFound); 
		};
	}, [isConnected]);

/****Animating canvas****/

	useEffect(() => {
		socket.current.on('gameOnHold', gameOnHold);
		socket.current.on('finalScore', endGame);
		socket.current.on('ballPos', updateBall);
		socket.current.on('upScores', updateScores);

		function gameOnHold(): void {
			const canvas = ref.current;
			if (!canvas)
				return ;
			const context = canvas.getContext('2d');
			if (!context || ! gameProperties.current || ! canvasRatio.current)
				return ;
			context.fillStyle = '#A9A9A9';
			context.font = gameProperties.current.ScoreSize * canvasRatio.current + "px sans-serif";
			context.fillText("Your opponent is encountering", (gameProperties.current.canvasWidth / 8) , (gameProperties.current.canvasHeight / 4) );
			context.fillText("connections issues", (gameProperties.current.canvasWidth / 8) + (gameProperties.current.ScoreSize * canvasRatio.current * 3) , (gameProperties.current.canvasHeight / 4) + gameProperties.current.ScoreSize * canvasRatio.current);
		}

		window.addEventListener('keydown', keyPress);
		function keyPress(event: KeyboardEvent) {
			if (event.key === 'ArrowUp') {
				if (paddles && gameProperties.current && paddles[Number(side)].elem.y.current > gameProperties.current.TopLimit){
					socket.current.emit("onUp");
				} else {
					return ;
				}
			} else if (event.key === 'ArrowDown') {
				if (paddles && gameProperties.current && paddles[Number(side)].elem.y.current + level.current < gameProperties.current.BotLimit) {
					socket.current.emit("onDown");
				} else {
					return ;
				}
			}
		}

		window.addEventListener('keyup', keyRelease);
		function keyRelease(event: KeyboardEvent) {
			if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { 
				socket.current.emit("endMove");
			}
		}

		function updateScores(side: boolean) {
			if (side === false)
				++scoreLeft.current;
			else if (side === true)
				++scoreRight.current;
			requestAnimationFrame(requestAnim);
		}

		function endGame(display: string, leftScore: number, rightScore: number): void {
			normalEnd.current = true;
			socket.current.disconnect();
			alert(String(leftScore) + " to " + String(rightScore) + "\n" + display);
		}

	function requestAnim() {
		const canvas = ref.current;
			if (!canvas)
				return ;
			const context = canvas.getContext('2d');
			if (!context)
				return ;

			if (!ball || ! paddles || !gameProperties.current)
				return ;
			if (!powerUp.current)
				reDraw(context, ball, paddles, gameProperties.current, scoreLeft.current, scoreRight.current, canvasRatio.current, null);
			else
				reDraw(context, ball, paddles, gameProperties.current, scoreLeft.current, scoreRight.current, canvasRatio.current, powerUp.current);
	}

	function updateBall(posNew: Pos, posF: number, posT:number, PowerUp: powerUp) {
		pos.current = posNew;
		leftY.current = posF;
		rightY.current = posT;
		if (powerUp)
			powerUp.current = PowerUp;
		requestAnimationFrame(requestAnim);
	}

		return () => {	
			window.removeEventListener('keydown', keyPress);
			window.removeEventListener('keyup', keyRelease);
			socket.current.off('ballPos', updateBall);
			socket.current.off('finalScore', endGame);
			socket.current.off('upScores', updateScores);
			socket.current.off('gameOnHold', gameOnHold);
};


	},[leftY, rightY, paddles, pos, ball, scoreLeft, scoreRight, gameFound, side]);
	function setScores(scoreL: number, scoreR: number): void {
		scoreLeft.current = scoreL;
		scoreRight.current = scoreR;
	}


	/********************************************************/

	/*handle responsiveGame here */
		useEffect(() => {
	window.addEventListener('resize', responsiveGame);
	function responsiveGame(): void {
		widthScreen.current = window.innerWidth;
		heightScreen.current = window.innerWidth;
		calculateCanvasSize();
		}

		return () => {	
			window.removeEventListener('resize', responsiveGame);
		};
	}, [widthScreen]);	


	function calculateCanvasSize() {
		if (!gameProperties.current || !ref.current)
			return ;
			
		const canvas = ref.current;
		
		let temp = widthScreen.current / 3;
		temp = widthScreen.current - temp;
		gameProperties.current.canvasWidth = temp;
		canvas.width = temp;
	
		temp = (gameProperties.current.canvasWidth * gameProperties.current.canvasHeightBack)
		/ gameProperties.current.canvasWidthBack;
		canvas.height = temp;
		gameProperties.current.canvasHeight = temp; 
		
		canvasRatio.current = gameProperties.current.canvasWidth / gameProperties.current.canvasWidthBack;
	}

	/********************************************************/

	function difficultLevel(px: number): void {
		level.current = px;
		setHere(false);
		socket.current.connect();
	}

	function chooseMode(mode: boolean): void {
		setGM(false);
		gameMode.current = mode;
	}


	return(
		<>
		{here && playButton && gM && user &&
			<button id="default" onClick={handleClick}> PLAY </button>
			}
			{ !playButton && gM &&
				<>
					<div>
						<button id='default' onClick={() => chooseMode(false)}>Classic</button>
					</div>
					<div>
						<button id='default' onClick={() => chooseMode(true)}>Power-Up</button>
					</div>
				</>
			}			
		{here && !gM &&
				<>
					<div>
						<button id='default' onClick={() => difficultLevel(100)}>EasyPeasy</button>
					</div>
					<div>
						<button id='default' onClick={() => difficultLevel(80)}>Easy</button>
					</div>
					<div>
						<button id='default' onClick={() => difficultLevel(60)}>Regular</button>
					</div>
					<div>
						<button id='default' onClick={() => difficultLevel(40)}>Hard</button>
					</div>
					<div>
						<button id='default' onClick={() => difficultLevel(20)}>HardCore</button>
					</div>
				</>
			}
			{!here && !gM && !gameFound && (
				<>
					<div id='waitLine'>
						Waiting for a player...
					</div>
					<button id="default" onClick={() => giveUp()}> Give Up </button>
				</>
			)}
			{!here && !gM && gameFound && (
				<>
					<canvas
						id= 'playground'
						ref = {ref}
					/>
					<button id="default" onClick={() => giveUp()}> Give Up </button>
			
				</>
			)}
		</>
	);
}
