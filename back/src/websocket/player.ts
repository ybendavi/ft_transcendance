import { Socket } from "socket.io";
import  Game  from "./app.game"

type Player = {

	id: number;
	socket: Socket;
	onGame: boolean;
	side?: boolean;
	game?: Game;
	paddleY: number;
	paddleLength: number;
	gM?: boolean;
	mate?: number
}

export { Player };
