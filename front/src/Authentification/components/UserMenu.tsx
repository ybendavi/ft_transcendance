import '../styles/UserMenu.css'
import { User } from '../../types/User.interface'
import { UserProps } from '../../types/UserProps.interface'
import React, { useRef } from 'react'
import { useState } from 'react'
import useOutsideClick from '../hooks/useOutsideClick'
import FormData from 'form-data'
import QrCode from './QrCode'
import FriendList from './FriendList'



function UserMenu({ props, socket, onUsernameUpdate, onAvatarUpdate }: UserProps) {

	const [btnState, setBtnState] = useState(false);
	const [psdState, setPsdState] = useState(false);
	const [friendListState, setFriendListState] = useState(false);
	const [newPseudo, setNewPseudo] = useState('');

	const url = import.meta.env.VITE_URL;
	const user: User = props;

	const fileInputRef = useRef<HTMLInputElement>(null);

	function handleClick() {
		if (!btnState)
			setBtnState(true);
	}

	function handleClickOutside() {
		if (btnState) {
			setBtnState(false);
			setPsdState(false);
			setFriendListState(false);
		}
	}


	function handleClickPseudo(event: React.SyntheticEvent) {
		event.stopPropagation();
		setPsdState(true);
	}

	async function handleSubmitPseudo() {
		if (newPseudo.length === 0 || newPseudo.length > 15) {
			alert("please provide a non-empty and less than 15 char username");
			return;
		}
		fetch('http://' + url + ':8080/login/changePseudo', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${user.access_token}`,
			},
			body: JSON.stringify({ id: props.id, username: newPseudo }),
		}).then(async (response) => {
			if (response.ok) {
				const msg = await response.json();
				const updateUser = { ...props, username: newPseudo };
				onUsernameUpdate(updateUser);
				setBtnState(false);
				setPsdState(false);
				setFriendListState(false);
			} else {
				if (response.status == 409)
					alert('username already used : please provide another one');
				if (response.status == 400)
					alert('Only alphanumeric characters are allowed');

			}
		}).catch((error) => console.log('error in catch: ', error));
		setNewPseudo('');
	}

	async function handleSubmitAvatar() {
		fileInputRef.current?.click();
	}

	function handleLogOut() {
		window.location.href = 'http://' + url + ':8080/login/logout';
	}

	async function handleClickenable2FA() {
		fetch('http://' + url + ':8080/login/2FA/generate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${user.access_token}`,
			},
			body: JSON.stringify({ id: props.id }),
		}).then(async (response) => {
			if (response.ok) {
				const { secret } = await response.json();
				const updateUser = { ...props, secret: secret };
				onUsernameUpdate(updateUser);
				alert('Make sure to scan the QR code with the Google Authenticator App, otherwise you will not be able do loggin after log out');
			} else {
				 console.log('problem in response in handleClickenable2FA', response.status);

			}
		}).catch((error) => console.log('error in fetching in handleClickenable2FA: ', error));
	}

	async function handleClickdisable2FA() {
		fetch('http://' + url + ':8080/login/2FA/disable', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${user.access_token}`,
			},
			body: JSON.stringify({ id: props.id }),
		}).then(async (response) => {
			if (response.ok) {
				const { msg } = await response.json();
				const updateUser = { ...props, secret: undefined, valid: true };
				onUsernameUpdate(updateUser);
			} else {
				console.log('problem in response in handleClickdisable2FA', response.status);

			}
		}).catch((error) => console.log('error in fetching in handleClickdisable2FA: ', error));
	}

	function handleFriendList(event: React.SyntheticEvent) {
		event.stopPropagation();
		setFriendListState(true);
	}


	async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
		event.preventDefault();
		if (!event.target.files || !event.target.files.length) {
			return;
			//setFile(imgObject);
		}
		const imgObject: File = event.target.files[0];
		const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']; // Define the allowed file types
		if (!allowedTypes.includes(imgObject.type)) {
			console.error('Unsupported file type');
			return;
		}

		// Check file size
		const maxSizeInBytes = 10 * 1024 * 1024; // 10MB maximum size
		if (imgObject.size > maxSizeInBytes) {
			console.error('File size exceeds the limit');
			return;
		}
		const formData = new FormData();
		formData.append('file', imgObject);
		formData.append('name', props.username + '_' + imgObject.name);
		formData.append('userId', JSON.stringify(props.id));
		fetch('http://' + url + ':8080/login/changeAvatar', {

			method: 'POST',
			headers: {
				'Authorization': `Bearer ${user.access_token}`,
			},
			body: formData as unknown as BodyInit,
			
		}
		).then(async (response) => {
			if (response.ok) {
				const {avatarId} = await response.json();
				onAvatarUpdate(avatarId, URL.createObjectURL(imgObject));

			} else {
				console.log('non valid image', response.status);
			}
		})
	}

	let toggleClass = btnState ? 'active' : '';
	let friendList = btnState && friendListState ? 'friend' : '';
	let twoFAEnabled = props.secret ? 'enabled' : 'disabled';
	const ref = useOutsideClick(handleClickOutside);

	

	return (
		<div className={`allUserMenu${toggleClass}${friendList}`} ref={ref}>
			<div className={`userMenu${toggleClass}${friendList}`}  onClick={handleClick}>
				{/* <div className={`avatarAndPseudo${toggleClass}`}> */}
				{!btnState ?
					<img className={`avatar${toggleClass}`} src={props.avatar} alt='avatar'/> :
					(
						<div className='avatarArea'><img className={`avatar${toggleClass}`} src={props.avatar} onClick={handleSubmitAvatar} alt='avatar' />
							<input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleChange} />
						</div>
					)
				}
				{!btnState ?
					(<p className={`pseudo${toggleClass}`}>{props.username}</p>) :
					(!psdState ?
						<div className='pseudoArea'>
							<div>
								<p className={`pseudo${toggleClass}`} onClick={handleClickPseudo}>
									{props.username}
									<span className="tooltip">Change username</span>
								</p>
								
							</div>
						</div> :
						(<div className='pseudoArea'>
							<textarea className='changePseudo' value={newPseudo} onChange={(event) => setNewPseudo(event.target.value)} />
							<button onClick={handleSubmitPseudo}>submit</button>
						</div>)
					)
				}
				{!btnState &&
					<p className={`triangle${toggleClass}`}>
						▼
					</p>
				}
				{/* </div> */}
				{btnState &&
					<div className={`TwoFaArea${twoFAEnabled}`}>
						{props.secret ?
							<div className='TwoFa'>
								<QrCode props={props} />
								<button onClick={handleClickdisable2FA}>disable 2FA</button>
							</div> :
							<button onClick={handleClickenable2FA}>enable 2FA</button>
						}
					</div>
				}
				{btnState &&
					<p className="email">{props.email}</p>
				}
				{btnState &&
					<button onClick={handleLogOut}>log out</button>
				}
				{btnState && !friendListState &&
					<div className="dropDownFriendList" onClick={handleFriendList}>
						<p className="triangle2" >
							▼
						</p>
						<span className="tooltipfl">Show friendlist</span>
					</div>
				}
			</div>
			{btnState && friendListState && <FriendList socket={socket} user={props} />}
		</div>
	)
}

export default UserMenu
