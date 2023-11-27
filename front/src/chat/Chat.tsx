import  { useEffect, useRef, useState } from 'react';
import { User } from '../types/User.interface';
import '../styles/Chat.css';
import defaultAvatar from '../Authentification/components/img/icon_user.png'
import chatbotAvatar from '../Authentification/components/img/chatbot.png'

import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
	MainContainer,
	ChatContainer,
	MessageList,
	Message,
	MessageInput,
	Sidebar,
	Search,
	ConversationList,
	Conversation,
	Button,
	Loader,
	Avatar,
	ArrowButton,
} from "@chatscope/chat-ui-kit-react";

import {
	MDBCardImage,
} from 'mdb-react-ui-kit';

//import { escape } from 'querystring';

type MessageStruct = {
	text: string;
	sender: string;
	direction: any;
	channel: string;
	avatar: string;
};

type MessageListStruct = {
	name: string;
	messages: MessageStruct[];
	type: string;
}

type Game = {
	id: number;
	scoreTrue: number;
	PlayerTrueName: string;
	scoreFalse: number;
	PlayerFalseName: string;
	powerUp: boolean;
	victoryName: string;
}


const Chat = ({socket, setLaunchGameFromChat, user, isConnected}: any ) => {
	
	const [reduce, setReduce] = useState(false);
	const [msgList, setMsgList] = useState<MessageListStruct[]>([{ name: 'General', messages: [], type: 'public' }]);
	const [banOrKickOrMute, setBanOrKickOrMute] = useState(0);
	const [invitationRec, setInvitationRec] = useState<{ text: string, channelname: string, sender: string }>();
	const [inviteGame, setInviteGame] = useState<{ text: string, user0: number, user1: number, mode: boolean }>();
	const [channelNumber, setChannelNumber] = useState(0);
	const [channelRight, setChannelRight] = useState('random');
	const [channelPrivacy, setChannelPrivacy] = useState('');
	const [componentToDisplayRightBar, setComponentToDisplayRightBar] = useState(0);
	const [chanToAskForPassword, setChanToAskForPassword] = useState('');
	const [mute, setMute] = useState<{ toban: string, channel: string, user: number, res: number }>();
	const [profile, setProfile] = useState<{ username: string, email: string, status: string, avatar: string, blocked: boolean, level: number, defeatmatch: Game[], victorymatch: Game[] }>();


	//Etienne
	const [userListToPrint, setUserListToPrint] = useState<User[]>([]);
	const [channelListToPrint, setChannelListToPrint] = useState<string[]>([]);
	const [userFound, setUserFound] = useState<User>();
	const [channelFound, setChannelFound] = useState("");
	const [isActiveMyChannels, setIsActiveMyChannels] = useState(true);
	const [searchValue, setSearchValue] = useState('');
	const searchFocus = useRef<HTMLInputElement>(null);
	
	useEffect(() => {
		if (searchFocus.current) {
		  searchFocus.current.focus();
		}
	  },[userListToPrint, channelListToPrint]);  
	//Initilazation cookie/socket

	const url = import.meta.env.VITE_URL;
	// Channel handler
	const privateMessage = () => {
		if (!userFound) {
			setComponentToDisplayRightBar(7);
		} else {
			askForPrivateChat(userFound.username);
			handleChangeSearch("");
		}
	}

	const switchChannel = (chanumber: number) => {
		setChannelNumber(chanumber);
		setUserFound(undefined);
		setIsActiveMyChannels(true);
		setChannelFound("");
		if (socket && user) {
			socket.emit('askChannelRights', { chaname: msgList[chanumber].name, userid: user.id });
		};

	};

	const showPassField = () => {
		setComponentToDisplayRightBar(3);
	}

	const showAdminField = () => {
		setComponentToDisplayRightBar(10);
	}

	const createChannel = () => {
		setComponentToDisplayRightBar(2);
	};

	const privacy = (priv: string) => {
		setChannelPrivacy(priv);
		setComponentToDisplayRightBar(1);
	}

	const joinChannel = () => {
		if (!channelFound) {
			setComponentToDisplayRightBar(4);
		}
		else {
			askJoinChannel(channelFound);
			handleChangeSearch("");
		}
	}

	const inviteToChannel = () => {
		setComponentToDisplayRightBar(8);
	}

	const sendFriendRequest = async (idReceiver: number) => {
		fetch('http://' + url + ':8080/user/sendFriendRequest', {			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${user.access_token}`,
			},
			body: JSON.stringify({ idSender: user?.id, idReceiver: idReceiver })
		})
			.then(async (response) => {
				if (response.ok) {
					const { message } = await response.json();
					alert(message);
				}
				else {
					if (response.status === 409) {
						alert('Relationship already exists');
					}
				}
			})
	}

	const isActiveOrNot = (i: number) => {

		return (i === channelNumber && isActiveMyChannels ? true : false);
	}

	const isActiveOrNotUser = (user: User) => {
		return (userFound === user);
	}

	const isActiveOrNotChannel = (channel: string) => {
		return channelFound === channel && channelFound !== '';
	}

	const newChannel = (messagetext: string) => {
		if (socket && user) {
			const channel = { name: messagetext, admins: [user.id], users: [user.id], bans: [], type: channelPrivacy, owner: user.id };
			socket.emit('createChannel', channel);
		}
	};

	const quitChannel = () => {
		if (socket && user) {
			if (channelRight !== 'owner') {
				socket.emit('quitChannelAdminOrUser', { user: user.id, channelname: msgList[channelNumber].name })
			}
			else {
				setComponentToDisplayRightBar(13);
			}
		}
	}

	const quitOwner = (newowner: string) => {
		if (socket && user) {
			socket.emit('quitOwner', { newowner: newowner, channelname: msgList[channelNumber].name, user: user.id });
		}
		setComponentToDisplayRightBar(0);
	}

	const setPrivMsg = (data: any) => {
		if (data !== 1) {
			setMsgList([...msgList, {
				name: data.name, messages: [], type: data.type
			} ]);
		}	
		setComponentToDisplayRightBar(0);
	}
	const setChannel = (data: any) => {
		if (data.rescode === 0) {
			setMsgList([...msgList, {
				name: data.channame, messages: [], type: data.type
			} ]);
			setComponentToDisplayRightBar(0);
		}
		else if (data.rescode === 3) {
			setChanToAskForPassword(data.channame);
			setComponentToDisplayRightBar(6);
		}
		else if (data.rescode === 1) { setComponentToDisplayRightBar(0); }
	}

	const askForGrantAdmin = (username: string) => {

		if (socket && user) {
			socket.emit('newAdmin', { togrant: username, channel: msgList[channelNumber].name, user: user.id })
		}
		setComponentToDisplayRightBar(0);
	}
	const setChannelInvite = (data: any) => {
		setMsgList([...msgList, {
			name: data.channelname, messages: [], type: data.channelprivacy
		} ]);
		setComponentToDisplayRightBar(0);
	}
	const askForPrivateChat = (username: string) => {
		if (socket && user) {
			const request = { recipient: username, userid: user.id }
			socket.emit('privMsg', request);
			setComponentToDisplayRightBar(5);
		}
	}

	const askForInvitation = (username: string) => {
		if (socket && user) {
			const request = { channelname: msgList[channelNumber].name, invited: username, sender: user.id }
			socket.emit('channelInvitation', request);
			setComponentToDisplayRightBar(0);
		}
	}
	const askJoinChannel = (channelname: string) => {
		if (socket && user) {
			const request = { name: channelname, user: [user.id] }
			socket.emit('joinChannel', request);
			setComponentToDisplayRightBar(5);
		}
	}

	const askJoinChannelPassword = (password: string) => {
		if (socket && user) {
			const request = { name: chanToAskForPassword, password: password, user: user.id };
			socket.emit('joinWithPassword', request);
			setChanToAskForPassword('');
			setComponentToDisplayRightBar(5);
		}
	}

	const muter = (time: string) => {
		let timeint = parseInt(time);
		if (socket && user && mute) {
			socket.emit('banKickMute', { toban: mute.toban, channel: mute.channel, user: user.id, res: 2, time: timeint });
		}
		setComponentToDisplayRightBar(0);
	}

	const banKickMute = (username: string) => {
		if (socket && user) {
			if (banOrKickOrMute !== 2) {
				socket.emit('banKickMute', { toban: username, channel: msgList[channelNumber].name, user: user.id, res: banOrKickOrMute, time: 0 });
				setComponentToDisplayRightBar(0);
			}
			else {
				setMute({ toban: username, channel: msgList[channelNumber].name, user: user.id, res: banOrKickOrMute });
				setComponentToDisplayRightBar(12);
			}
		}
	}

	const newPassword = (password: string) => {

		if (socket && user) {
			socket.emit('newPassword', { chaname: msgList[channelNumber].name, userid: user.id, password: password });
		}
		setComponentToDisplayRightBar(0);
	}

	const removePass = () => {
		if (socket && user) {
			socket.emit('removePassword', { chaname: msgList[channelNumber].name, userid: user.id });
		}
	}
	const setInvitation = (data: any) => {
		let invitation = { text: data.sender + ' invited you to channel ' + data.channelname, channelname: data.channelname, sender: data.sender };
		setInvitationRec(invitation);
		setComponentToDisplayRightBar(9);
	}

	const invitationAccepted = () => {
		if (socket && user && invitationRec) {
			socket.emit('invitationAccepted', { channelname: invitationRec.channelname, sender: invitationRec.sender, user: user.id });
		}
		setInvitationRec(undefined);
		setComponentToDisplayRightBar(5);
	}
	// Send messages to the server

	const handleMessage = (messagetext: string) => {
		if (socket && user) {
			const message = { text: messagetext, sender: user.username, channel: msgList[channelNumber].name, userid: user.id, users: [] };
			socket.emit('sendMessage', message);
		}
	};

	// Parse data received from the server

	const splitMessagesBetweenChannels = (messages: MessageStruct[]) => {
		let listmess = msgList.map((messl) => {

			let topush;
			topush = messages.filter(message => message.channel === messl.name);
			topush.forEach((message) => {
				messl.messages.push(message);
			})
			return messl;
		});
		setMsgList(listmess);

	};

	const loadData = (data: { text: string, sender: string, channel: string, userid: number, avatar: Uint8Array }[]) => {
		let messages = data.map((message) => {
			let dir;
			let avatar;

			dir = 'incoming';
			if (message.avatar === null) {
				avatar = defaultAvatar;
			}
			else if (message.sender === 'Chatbot')
			{
				avatar = chatbotAvatar;
			}
			else {
				const data = new Blob([message.avatar]);
				avatar = URL.createObjectURL(data);
			}
			if (user && message.sender === user.username) { dir = 'outgoing'; }
			return {
				text: message.text,
				sender: message.sender,
				direction: dir,
				channel: message.channel,
				avatar: avatar,

			};
		});
		splitMessagesBetweenChannels(messages);
		setComponentToDisplayRightBar(0);
	};

	const splitMessagesBetweenChannelsInit = (messages: MessageStruct[], msglistinit: MessageListStruct[]) => {
		let listmess = msglistinit.map((messl) => {

			let topush;
			topush = messages.filter(message => message.channel === messl.name);
			topush.forEach((message) => {
				messl.messages.push(message);
			})
			return messl;
		});
		setMsgList(listmess);

	};

	const loadDataInit = (data: { text: string, sender: string, channel: string, userid: number, avatar: Uint8Array }[], msglistinit: MessageListStruct[]) => {
		let messages = data.map((message) => {
			let dir;
			let avatar;

			dir = 'incoming';
			if (message.avatar === null) {
				avatar = defaultAvatar;
			}
			else {
				const data = new Blob([message.avatar]);
				avatar = URL.createObjectURL(data);
			}
			if (user && message.sender === user.username) { dir = 'outgoing'; }
			return {
				text: message.text,
				sender: message.sender,
				direction: dir,
				channel: message.channel,
				avatar: avatar,

			};
		});
		splitMessagesBetweenChannelsInit(messages, msglistinit);
	};

	const initAll = (data: { channels: any, messagestosend: { text: string, sender: string, channel: string, userid: number, avatar: Uint8Array }[] }) => {
		if (user) {
			if (data.channels) {
				let newmsglist: MessageListStruct[];
				newmsglist = data.channels.map((channel: any) => {
					let newlist: MessageListStruct;
					newlist = { name: channel.name, messages: [], type: channel.type };
					return newlist;
				});
				if (data.messagestosend) {
					loadDataInit(data.messagestosend, newmsglist);
				}
			}

		}
	}

	// Profile

const storeUserInfo = (prof: {username: string, email:string, status: boolean, avatar: Uint8Array, blocked: boolean, level: number, defeatmatch: Game[], victorymatch: Game[]}) => {
	let avatar;
	let status;

		status = (prof.status) ? 'online' : 'offline';
		if (prof.avatar) {
			const data = new Blob([prof.avatar]);
			avatar = URL.createObjectURL(data);
		}
	else {avatar = defaultAvatar;}
	let profiler = {username: prof.username, email:prof.email, status:status, avatar: avatar, blocked: prof.blocked, level: prof.level, defeatmatch: prof.defeatmatch, victorymatch: prof.victorymatch};
	setProfile(profiler);
}

	// Game

	const sendInvitationGame = (mode: boolean) => {
		if (socket && user) {
			socket.emit('invitationGame', { id: user.id, privconv: msgList[channelNumber].name, mode: mode });
			setComponentToDisplayRightBar(0);
		}
	}

	const invitationGame = (data: { id: number, username: string, mode: boolean }) => {
		if (user && socket) {
			let modes = (data.mode) ? 'Power up' : 'Classic';
			setInviteGame({ text: data.username + ' invited you to a game in mode ' + modes + '.', user0: data.id, user1: user.id, mode: data.mode });
			setComponentToDisplayRightBar(15);
		}
	}

	const acceptInvitationGame = (res: boolean) => {
		if (res && inviteGame && socket) {
			setLaunchGameFromChat({ id0: inviteGame.user0, id1: inviteGame.user1, gameMode: inviteGame.mode, inviter: false });
			socket.emit('invitationAcceptedGame', { id0: inviteGame.user0, id1: inviteGame.user1, gameMode: inviteGame.mode });
			setInviteGame(undefined);

		}
		setComponentToDisplayRightBar(0);
	}

	const launchGame = (message: { id0: number, id1: number, mode: boolean }) => {
		if (socket && user) {
			setLaunchGameFromChat({ id0: message.id0, id1: message.id1, gameMode: message.mode, inviter: true });
		}
	}

	// Catch data from the server
	useEffect(() => {

		if (socket && socket) {

			socket.on('initAll', (message: { channels: any, messagestosend: { text: string, sender: string, channel: string, userid: number, avatar: Uint8Array }[] }) => {
				initAll(message);
			});
		}
		return () => {
			if (socket && socket) {
				socket.off('iniAll');
			}
		};
	});

	window.addEventListener('keydown', escape);
	function escape(event: any) {
		if (event.key === 'Escape') {
			switchChannel(0);
			setComponentToDisplayRightBar(0);

		}
	}

const blockOrUnblock = (res: boolean) => {
	if (profile && user && socket) {
	let toblock = profile.username;
	socket.emit('blockUser', {id: user.id, toblock: toblock, res: res});
	}
}

  useEffect(() => {
    if (socket) {
      socket.on('recMessage', (message: {text: string, sender: string, channel:string, userid:number, avatar: Uint8Array}) => {
        loadData([message]);
      });
      socket.on('resChannelRights', (message: string) => {
	setChannelRight(message);
	});
      socket.on('resJoinChannel', (message: any) => {
	setChannel(message);
	});
	  socket.on('resPrivMsg', (message: any) => {
		setPrivMsg(message);
	  });
	  socket.on('inviteClientToChannel', (message: any) => {
		setInvitation(message);
	  });
	  socket.on('addedByInvitation', (message: any) => {
		setChannelInvite(message);
	  });
	  socket.on('grantedAdmin', (message: string) => {
		if (msgList[channelNumber].name === message) {
			setChannelRight('admin');
		}
	  });

	  socket.on('inviteClientToGame', (message: {id: number, username:string, mode: boolean}) => {
		if (!isConnected)
		  invitationGame(message);
	  });
	  socket.on('launchGame', (message: {id0: number, id1:number, mode: boolean}) => {
		launchGame(message);
	  });
	  socket.on('sendUserInfo', (message: {username: string, email:string, status: boolean, avatar: Uint8Array, blocked: boolean, level: number, defeatmatch: Game[], victorymatch: Game[]}) => {
		storeUserInfo(message);
	  });

	  socket.on('init', () => {

		//removeCookie('user', { path: '/api' + '/login/42'});
	  });


	  return () => {
		window.removeEventListener('keydown', escape);

	  if (socket) {
	  socket.off('init');
	  socket.off('inviteClientToGame');
	  socket.off('launchGame');
	  socket.off('inviteClientToChannel');
	  socket.off('addedByInvitation');
	  socket.off('recMessage');
	  socket.off('grantedAdmin');
	  socket.off('resChannelRights');
	  socket.off('resJoinChannel');
	  socket.off('resPrivMsg');
	  socket.off('initAll');

	  }
	  };
    }
  },);

// Display

  function PrivacyButtons () {
	return (
		<div className="choicebuttons">
			<Button border labelPosition="left" onClick={() => privacy('public')} >Public</Button>
			<Button border labelPosition="right" onClick={() => privacy('private')} >Private</Button>
		</div>
	);
  }

  function ProfilePage() {

	  function getPowerUpsGames(): number {
		if (!profile)
			return (0);
		let ret = 0;
		for (let i = 0; i < profile.victorymatch.length; i++)
		{
			if (profile.victorymatch[i].powerUp)
				++ret;
		}
		for (let i = 0; i < profile.defeatmatch.length; i++)
		{
			if (profile.defeatmatch[i].powerUp)
				++ret;
		}
		  return (ret);	
	}

	  function getClassicGames(): number {
		if (!profile)
			return (0);
		let ret = 0;
		for (let i = 0; i < profile.victorymatch.length; i++)
		{
			if (!profile.victorymatch[i].powerUp)
				++ret;
		}
		for (let i = 0; i < profile.defeatmatch.length; i++)
		{
			if (!profile.defeatmatch[i].powerUp)
				++ret;
		}
		  return (ret);	
	}

	function matchArray(): {winner: string, loser: string, score: string, mode: string}[] {
		let ret: {winner: string, loser: string, score: string, mode: string}[] = [];
		if (!profile || (!profile?.victorymatch && !profile?.defeatmatch))
			return (ret);
	

		let tab = new Array();
		tab = profile.victorymatch.concat(profile.defeatmatch);
		tab.sort((a, b)=> b.id - a.id);
		tab.forEach((match) => {
			let looser: string;
			let score: string;
			if (match.victoryName === match.PlayerTrueName) {
				looser = match.PlayerFalseName;
				score = match.scoreTrue + " - " + match.scoreFalse;
			} else { 
				looser = match.PlayerTrueName; //remplacer par username
				score = match.scoreFalse + " - " + match.scoreTrue;
			}
			if (match.powerUp === true)
				ret.push({winner: match.victoryName + '', loser: looser,
					score: score, mode: 'Power-up' });
			if (match.powerUp === false)
				ret.push({winner: match.victoryName + '', loser: looser,
					score: score, mode: 'Classic' });
		});
	 	return (ret);
}
	const matchList = matchArray();

	return ( (user && 
	<>
  	<div>
    <div id='upperprofile'>
      <div>
        <div id='uppertittleid'>{profile?.username}</div>
		  <div id='uppertextid'>
				{(profile && user.username === profile?.username) && ( 
			  <>
				  <div>{profile?.email}</div> 
				  <div>{'LVL ' + Math.round(profile?.level * 10) / 10 }</div>
				  <div>Victories: {profile?.victorymatch.length ? profile?.victorymatch.length : '0'}</div>
				  <div>Defeats: {profile?.defeatmatch.length ? profile?.defeatmatch.length : '0'}</div>
				  <div>Classics Games: {getClassicGames()}</div>
				  <div>Power-Ups Games: {getPowerUpsGames()}</div>
				  <div>Totals Games: {getPowerUpsGames() + getClassicGames()}</div>
				</>
		  		)}
				{(profile && user.username !== profile.username) && (
					<>
						<div>{profile?.email}</div> 
						<div>{'LVL ' + Math.round(profile?.level * 10) / 10 }</div>
						<div id='fixbutton'>	
							{profile?.blocked ?
								<Button border onClick={() => {blockOrUnblock(false)} }>Unblock</Button> :
								(<Button border onClick={() => {blockOrUnblock(true)} }>Block</Button>
								)}
						</div>
					</>
						)}
		  </div>


      </div>
    </div>
		<MDBCardImage
			src= {profile?.avatar}
			alt="avatar"
			id='circular--square'
			fluid />

		<div id = 'lowerprofile'>

			<div>
				<div id='lowertittleid'>Match History</div>
				<div>
					<table id='col'>
						<thead>
							<tr>
								<th>Winner</th>
								<th>Loser</th>
								<th>Scores</th>
								<th>Mode</th>
							</tr>
						</thead>
						<tbody>	
							{matchList?.map((matchList, index) => (<tr key={index}> 
								<th >{matchList.winner}</th>
   	 							<th >{matchList.loser}</th>
    							<th >{matchList.score}</th>
    							<th >{matchList.mode}</th>
							</tr> ))} 
						 
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</div>
	</>
		));
	}

	function ActionButtons() {
		return (
			<div className="joinCreateInvite">
				{!userFound && !channelFound && <Button border onClick={createChannel}>New Channel</Button>}
				{!channelFound && <Button border onClick={() => privateMessage()} >Private Message</Button>}
				{!userFound && <Button border onClick={joinChannel}>Join</Button>}
				{/* {channelNumber !== 0 && <Button border onClick={inviteToChannel} >Invite</Button>} */}
				{!userFound && !channelFound && msgList[channelNumber].type !== 'privmsg' && <Button border onClick={inviteToChannel} >Invite</Button>}
				{userFound && user && userFound.id !== user.id && <Button border onClick={() => sendFriendRequest(userFound.id)} >Add friend</Button>}
				{!userFound && !channelFound && channelRight === 'owner' && <Button border onClick={showPassField}>Add Password</Button>}
				{!userFound && !channelFound && channelRight === 'owner' && <Button border onClick={removePass}>Remove Password</Button>}
				{!userFound && !channelFound && channelRight === 'owner' && <Button border onClick={showAdminField}>Add Administrator</Button>}
				{!userFound && !channelFound && (channelRight === 'owner' || channelRight === 'admin') && <Button border onClick={() => { setBanOrKickOrMute(0); setComponentToDisplayRightBar(11); }}>Ban</Button>}
				{!userFound && !channelFound && (channelRight === 'owner' || channelRight === 'admin') && <Button border onClick={() => { setBanOrKickOrMute(1); setComponentToDisplayRightBar(11); }}>Kick</Button>}
				{!userFound && !channelFound && (channelRight === 'owner' || channelRight === 'admin') && <Button border onClick={() => { setBanOrKickOrMute(2); setComponentToDisplayRightBar(11); }}>Mute</Button>}
				{!userFound && !channelFound && msgList[channelNumber].type !== 'privmsg' && channelNumber !== 0 && <Button border onClick={quitChannel}>Quit</Button>}
				{!userFound && !channelFound && !isConnected &&  msgList[channelNumber].type === 'privmsg' && <Button border onClick={() => { setComponentToDisplayRightBar(14) }}>Invite to play</Button>}

			</div>
		);
	}

	function SideBarRight() {

		let component;
		switch (componentToDisplayRightBar) {
			case 0:
				component = <Sidebar position="right" scrollable={false}>
					<ActionButtons />
				</Sidebar>;
				break;
			case 1:
				component = <Sidebar position="right" scrollable={false}>
					<div className="chanName" >
						<MessageInput sendButton={false} attachButton={false} placeholder="Channel Name" onSend={newChannel} />
					</div>
				</Sidebar>;
				break;
			case 2:
				component = <Sidebar position="right" scrollable={false}>
					<PrivacyButtons />
				</Sidebar>;
				break;
			case 3:
				component = <Sidebar position="right" scrollable={false}>
					<div className="passwordField" >
						<MessageInput sendButton={false} attachButton={false} placeholder="New Password" onSend={newPassword} />
					</div>
				</Sidebar>;
				break;
			case 4:
				component =
					<Sidebar position="right" scrollable={false}>
						<div className="channelField">
							<MessageInput sendButton={false} attachButton={false} placeholder="Channel Name" onSend={askJoinChannel} />
						</div>
					</Sidebar>
				break;
			case 5:
				component = <Sidebar position="right" scrollable={false}>
					<Loader />
				</Sidebar>
				break;
			case 6:
				component = <Sidebar position="right" scrollable={false}>
					<MessageInput sendButton={false} attachButton={false} placeholder="Password" onSend={askJoinChannelPassword} />
				</Sidebar>
				break;
			case 7:
				component = <Sidebar position="right" scrollable={false}>
					<MessageInput sendButton={false} attachButton={false} placeholder="Username" onSend={askForPrivateChat} />
				</Sidebar>
				break;
			case 8:
				component = <Sidebar position="right" scrollable={false}>
					<MessageInput sendButton={false} attachButton={false} placeholder="Username" onSend={askForInvitation} />
				</Sidebar>
				break;
			case 9:
				component = <Sidebar position="right" scrollable={false}>
					<div className="invite">
						{invitationRec && <p>{invitationRec.text}</p>}
						<Button border onClick={invitationAccepted}>Accept</Button>
						<Button border  >Decline</Button>
					</div>
				</Sidebar>
				break;
			case 10:
				component = <Sidebar position="right" scrollable={false}>
					<MessageInput sendButton={false} attachButton={false} placeholder="Username" onSend={askForGrantAdmin} />
				</Sidebar>
				break;
			case 11: component = <Sidebar position="right" scrollable={false}>
				<MessageInput sendButton={false} attachButton={false} placeholder="Username" onSend={banKickMute} />
			</Sidebar>
				break;
			case 12: component = <Sidebar position="right" scrollable={false}>
				<MessageInput sendButton={false} attachButton={false} placeholder="Time in second" onSend={muter} />
			</Sidebar>
				break;
			case 13: component = <Sidebar position="right" scrollable={false}>
				<MessageInput sendButton={false} attachButton={false} placeholder="Username of the new Owner" onSend={quitOwner} />
			</Sidebar>
				break;
			case 14: component = <Sidebar position="right" scrollable={false}>
				<Button border onClick={() => { sendInvitationGame(true) }}>Power up</Button>
				<Button border onClick={() => { sendInvitationGame(false) }}>Classic</Button>
			</Sidebar>
				break;
			case 15: component = <Sidebar position="right" scrollable={false}>
				{inviteGame && <p>{inviteGame.text}</p>}
				<Button border onClick={() => { acceptInvitationGame(true) }}>Accept</Button>
				<Button border onClick={() => { acceptInvitationGame(false) }}>Decline</Button>
			</Sidebar>
				break;
			default:
				component = <Sidebar position="right" scrollable={false}>
				</Sidebar>;
		}
		return (component);
	}
	

	function MainComponent() {
		let component;
		if (reduce) {component = <div style={{ display:"flex", position: "fixed", height: "2em", width: "10em", bottom: "0", right: "0" }}><ArrowButton className="reduceButton" direction="up" onClick={ ()=>{setReduce(false)}}/></div> ;}
		else {
			component = <div style={{ display:"flex", flexDirection:"column", position: "fixed", height: "30em", width: "40em", bottom: "0", right: "0", overflow: "hidden" }}>
			<ArrowButton className="reduceButton" direction="down" onClick={ ()=>{setReduce(true)}}/>
			<MainContainer responsive>
				<Sidebar position="left" scrollable={false}>
					<Search id='researchbar' placeholder="Search..." ref={searchFocus} value={searchValue} onChange={handleChangeSearch} onClearClick={() => handleChangeSearch("")} />
					<ConversationList>
						
						{userListToPrint.length > 0 && <Conversation id='indexSearch'><Conversation.Content><div><p className='indexSearch'>Users</p></div></Conversation.Content></Conversation>}
						{userListToPrint.length > 0 && userListToPrint.map((userFound, i) => (
							<Conversation name={userFound.username} key={i} onClick={() => handleUserFound(userFound)} active={isActiveOrNotUser(userFound)}/*active={isActiveOrNot(i)}*/ /*lastSenderName={messagelist.messages[messagelist.messages.length - 1].sender}*/ >
							</Conversation>
						))}
						
						{channelListToPrint.length > 0 && <Conversation id='indexSearch'><div><p className='indexSearch'>Channels</p></div></Conversation>}
						{channelListToPrint.length > 0 && channelListToPrint.map((channelFound, i) => (
							<Conversation name={channelFound} key={i} onClick={() => handleChannelFound(channelFound)} active={isActiveOrNotChannel(channelFound)}/*active={isActiveOrNot(i)}*/ /*lastSenderName={messagelist.messages[messagelist.messages.length - 1].sender}*/ >
							</Conversation>
						))}
						<Conversation id='indexSearch' active>
						<Conversation.Content><p className='indexSearch'>Your Channels</p></Conversation.Content>
						</Conversation>
						{msgList.map((messagelist, i) => (
							<Conversation name={messagelist.name} key={i} onClick={() => switchChannel(i)} active={isActiveOrNot(i)} /*lastSenderName={messagelist.messages[messagelist.messages.length - 1].sender}*/ >
							</Conversation>
					))}
				</ConversationList>
			</Sidebar>
			{(userFound && profile) ? <ProfilePage /> :(
        		<ChatContainer>
				<MessageList>
					{msgList[channelNumber].messages.map((message, j) => (
						<Message key={j}
							model={{
								direction: message.direction,
								position: 'single',
                						message: message.text,
                						sender: message.sender,
							}}
						>
							<Avatar src={message.avatar} name={message.sender} />
							<Message.Footer sender= {message.sender} />
						</Message>
					))}
          			</MessageList>
          			<MessageInput placeholder="Type message here" onSend={handleMessage} />
			</ChatContainer>)}
			<SideBarRight/>
					</MainContainer>
	</div>
		;}
		return (component);
	}

	async function handleChangeSearch(value: string)
	{
		setSearchValue(value);
		if (!user) {
			return;
		}
		if (value==='') {
			setUserListToPrint([]);
			setChannelListToPrint([]);
			setUserFound(undefined);
			setChannelFound('');
			return ;
		}
		fetch('http://' + url + ':8080/user/searchValue', {

		    method: 'POST',
		    headers: {
		      'Content-Type': 'application/json',
			  'Authorization': `Bearer ${user.access_token}`,
		    },
		    body: JSON.stringify({ id: user.id, value: value }),
		  }).then(async (response) => {
		    if (response.ok) {
				const {tabUsers, tabChannels} = await response.json();
			setUserListToPrint(tabUsers);
			setChannelListToPrint(tabChannels);
		    } else {
				return ;

		    }
		  }).catch((error) => console.log('error in fetching in handleChange: ', error));
	}

	function handleUserFound(userFound: User) {
		if (socket) {
			socket.emit('askUserInfo', userFound.id);
		}
		setUserFound(userFound);
		setChannelNumber(0);
		setIsActiveMyChannels(false);
		setChannelFound('');
	}

	function handleChannelFound(channelFound: string) {
		setChannelFound(channelFound);
		setChannelNumber(0);
		setIsActiveMyChannels(false);
		setUserFound(undefined);
	}

	return (
		<MainComponent/>
  );
};

export default Chat;
