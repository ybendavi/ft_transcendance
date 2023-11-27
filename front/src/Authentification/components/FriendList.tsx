import { Socket } from 'socket.io-client';
import { useEffect, useState } from 'react';
import { User } from '../../types/User.interface';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import '../styles/FriendList.css'

interface FriendListProps {
    socket: Socket | undefined
    user: User
}

const FriendList = ({socket, user}: FriendListProps) => {
    const [friendRequestsTab, setFriendRequestsTab] = useState<User[]>([]);
    const [friendList, setFriendList] = useState<User[]>([]);
    const url = import.meta.env.VITE_URL;
    useEffect(() => {

        fetch('http://' + url + ':8080/user/allFriendRequests', {
            method: 'POST',
			headers: {
				'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.access_token}`,
			},
			body: JSON.stringify({ id: user.id }),
		}).then(async (response) => {
			if (response.ok) {
				const {friendRequests, friendsList} = await response.json();
                setFriendRequestsTab(friendRequests);
                setFriendList(friendsList);
			} else {
				console.log('problem in response in handleClickenable2FA', response.status);

			}
		}).catch((error) => console.log('error in fetching in handleClickenable2FA: ', error))
    }, [])
    useEffect(() => {
        if (socket) {
            socket.on('FriendRequestToReceiver', ({message}) => {
                setFriendRequestsTab([...friendRequestsTab, message]);
            })
        }
        return () => {
            if (socket) {
                socket.off('FriendRequestToReceiver')
        };}
    })

    function handleClickDelete(friendId: number) {
        fetch('http://' + url + ':8080/user/deleteFriend', {
            method: 'POST',
			headers: {
				'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.access_token}`,
			},
			body: JSON.stringify({ idSender: user.id , idReceiver: friendId}),
		}).then(async (response) => {
			if (response.ok) {
                setFriendList(friendList.filter((user) => user.id !== friendId));
			} else {
                if (response.status === 409) {
                    console.log('not in friendList', response.status);
                }
			}
		}).catch((error) => console.log('error in fetching in handleClickAccept: ', error));
    }

    function handleClickAccept(newFriend: User) {
        fetch('http://' + url + ':8080/user/acceptFriendRequest', {
            method: 'POST',
			headers: {
				'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.access_token}`,
			},
			body: JSON.stringify({ idSender: user.id , idReceiver: newFriend.id}),
		}).then(async (response) => {
			if (response.ok) {
                setFriendRequestsTab(friendRequestsTab.filter(user => user.id !== newFriend.id));
                setFriendList([...friendList, newFriend]);
			} else {
				console.log('problem in response of handling accepting friend request', response.status);

			}
		}).catch((error) => console.log('error in fetching in handleClickAccept: ', error));
    }

    function handleClickRefuse(id: number) {
        fetch('http://' + url + ':8080/user/refuseFriendRequest', {
            method: 'POST',
			headers: {
				'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.access_token}`,
			},
			body: JSON.stringify({ idSender: user.id , idReceiver: id}),
		}).then(async (response) => {
			if (response.ok) {
                setFriendRequestsTab(friendRequestsTab.filter((user) => user.id !== id));
			} else {
				console.log('problem in response of handling refusing friend request', response.status);

			}
		}).catch((error) => console.log('error in fetching in handleClickRefuse: ', error));
    }
    function status(user: User) {
        let userstatus: string = "offline";

        if (user.socket){
            userstatus = "online";
        }
        if (user.socketgame){
            userstatus = "ingame";
        }
        return (userstatus);
    }
    return (
        <div className="friendListArea">
            {friendRequestsTab.length > 0 &&
                <div className="friendRequests">
                    <div className="fLRnotif">
                        <p className="friendTitle">New friend requests:</p>
                        <p className="nbrFR">{friendRequestsTab.length}</p>
                    </div>
                    <div className="allFR">
                        {friendRequestsTab.map((friendRequest, i) => (
                            <div className='oneFriendRequest' key={i}>
                                <p className='userName'>{friendRequest.username}</p>
                                <div>
                                    <CheckCircleOutlineIcon className="okIcon" fontSize='small' onClick={() => handleClickAccept(friendRequest)}/>
                                    <HighlightOffIcon className="okIcon" fontSize='small' onClick={() => {handleClickRefuse(friendRequest.id)}}/>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            }
            {friendList.length > 0 && 
                <div className="friendList">
                    <div className="fLRnotif">
                        <p className="friendTitle">Friend List</p>
                    </div>
                    <div className="allFR">
                        {friendList.map((friend, i) => (
                            <div className='oneFriendRequest' key={i}>
                                <p className='userName'>{friend.username}</p>
                                <p className={`status${status(friend)}`}>{status(friend)}</p>
                                <div>
                                    <HighlightOffIcon className="okIcon" fontSize='small' onClick={() => {handleClickDelete(friend.id)}}/>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            }
        </div>
    );
}

export default FriendList;
