import Banner from "../Authentification/components/Banner";
import Chat from "../chat/Chat";
import GameApp from "../game/gameApp";
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { io, Socket } from 'socket.io-client';
import { User } from "../types/User.interface";
import defaultAvatar from '../Authentification/components/img/icon_user.png'

const HomePage = () => {
	const [launchGameFromChat, setLaunchGameFromChat] = useState<{id0: number, id1: number, gameMode: boolean, inviter: boolean}>();

  
  const [cookie,] = useCookies(['user']);
  const [id, setId] = useState(0);
  const [user, setUser] = useState<User>();
  const [socket, setSocket] = useState<Socket | undefined>();
  const [dep, setDep] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const url = import.meta.env.VITE_URL;
  useEffect(() => {
		if (cookie.user && cookie.user.user) {
      setId(cookie.user.user.id);
      
    }
	}, []);

  useEffect(() => {
    if (id && cookie.user) {
      const fetchFileGet = async () => {
        try {
          const response = await fetch('http://' + url + ':8080/login/getUser', {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${cookie.user.access_token}`,
                },
                body: JSON.stringify({id: id})
            });
            if (response.ok) {
                const {user} = await response.json();
                const userAdd: User = {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    level: user.email,
                    secret: user.secret,
                    avatarId: user.avatarId,
                    access_token: cookie.user.access_token,
                    valid: user.valid,
                  }
                setUser(userAdd);
                setDep(!dep);
            } else {
                console.log("failed to get user", response.status);
            }
        } catch (error) {
            console.log("User not connected", error);
        }
    }
    fetchFileGet();
}}, [id])

  

  useEffect(() => {
    if (user && user.avatarId) {
      const fetchFileGet = async () => {
          try {
            const response = await fetch('http://' + url + ':8080/login/getAvatar', {
                  method: "POST",
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${user.access_token}`,
                  },
                  body: JSON.stringify({id: user.id})
              });
              if (response.ok) {
                  const file = await response.blob();
                  const avatarUrl = URL.createObjectURL(file);
                  
                  setUser(prevUser => ({
                    ...prevUser!,
                    avatar: avatarUrl
                  }));
                  
              } else {
                  console.log("failed to get response", response.status);
                  setUser(prevUser => ({
                    ...prevUser!,
                    avatar: defaultAvatar
                  }));
              }
          } catch (error) {
              console.log("Problem fetching", error);
              setUser(prevUser => ({
                ...prevUser!,
                avatar: defaultAvatar,
              }));
          }
      }
      fetchFileGet();
  } else if (user && !user.avatarId) {
    setUser(prevUser => ({
      ...prevUser!,
      avatar: defaultAvatar
    }));
  }
  }, [dep]);

  useEffect(() => {
     if (user && !socket) {

      const newSocket = io('http://' + url + ':8080', {
        query: {
          token: `${user.access_token}`,
        },});
      setSocket(newSocket);
      
    }
    return () => {
      if (socket) {
        console.log('disconnect socket');
      }
    };
  }, [user]);
  
useEffect(() => {
  if (socket && user) {
    socket.emit('registerSocket', user.id);}
  return () => {if (socket) {
    socket.disconnect();}}
}, [socket]);
 
  return (
    <div className="App">
      <header>
        <div className="banner" style={{ position: "relative", zIndex: 2 }}>
          <div className="title">
            <h1>TRANSCENDENCE</h1>
          </div>
          <div className="userlog">
            <Banner user={user} socket={socket} onUserUpdate={(user) => setUser(user)} />
          </div>
		</div>
	  <Chat socket={socket} launchGameFromChat={launchGameFromChat} setLaunchGameFromChat={setLaunchGameFromChat} user={user} isConnected={isConnected}/>
      {user?.access_token && (<GameApp launchGameFromChat={launchGameFromChat} setLaunchGameFromChat={setLaunchGameFromChat} isConnected={isConnected} setIsConnected={setIsConnected} user={user}/>)}
      </header>
    </div>
  );
}

export default HomePage;
