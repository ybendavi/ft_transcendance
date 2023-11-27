import React, { useState , useEffect, ChangeEvent} from "react";
import '../styles/Banner.css';
import { User } from '../../types/User.interface'
import UserMenu from './UserMenu'
import { Socket } from 'socket.io-client';

interface BannerProps {
    user: User | undefined,
    socket: Socket | undefined,
    onUserUpdate: (user: User) => void,
}

function Banner({user, socket, onUserUpdate}: BannerProps) {
    const [inputValue, setInputValue] = useState('');
	const [clicked, setClicked] = useState(false);

  const url = import.meta.env.VITE_URL;
    function handleClick() {
		if (clicked === true)
			return ;
		setClicked(true);
        window.location.href = 'http://' + url + ':8080/login/42';


        
    }
    function handleAvatarUpdate(id: number, updateAvatar: string) {
        if (!user) {return; }
        onUserUpdate({
                ...user,
                avatarId: id,
                avatar: updateAvatar,
              }
            );
    }

    useEffect(
        () => {
            if (!user || user.valid) {
                return ;
            }
            if (inputValue.length === 6) {
                fetch('http://' + url + ':8080/login/2FA/otpCheck', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${user.access_token}`,
                    },
                    body: JSON.stringify({ otp: inputValue, id: user.id }),
                  }).then(async (response) => {
                    if (response.ok) {
                      const { msg } = await response.json();
					  console.log(msg);
window.location.href = 'http://' + url + ':3000';
                    } else {
                      alert('error in authentificating with 2FA. Please try again');
                      onUserUpdate({
                        ...user,
                        valid: true,
                      }
                    );
                    }
                  }).catch((error) => console.log('error in catch: OTP ', error));
            }
            return () => setInputValue('');
       
    }, [inputValue]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!/^\d$/.test(event.key) && event.key !== 'Backspace') {
          event.preventDefault();
        }
    };

    function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
           setInputValue(event.target.value);
    }

    return (
        <div>
            {
                user ? ( user.valid || !user.secret ?
                            <UserMenu props={user} socket={socket} onUsernameUpdate={(updateUser: User) => onUserUpdate(updateUser)} onAvatarUpdate={handleAvatarUpdate} /> :
                            <div className='otpArea'>
                                <p className="otpMessage">You activated 2FA, please go on the Google Authenticator App and provide the 6-digit code</p>
                                <textarea
                                    className="sixDigit"
                                    maxLength={6}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                />
                            </div>
                ) : (
                    <button className="logInButton" onClick={handleClick}>{'log in'}</button>
                )
            }
        </div>)
}


export default Banner
