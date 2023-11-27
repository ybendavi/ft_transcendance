import {User} from './User.interface'
import { Socket } from 'socket.io-client';

export interface UserProps {
    props: User,
    socket: Socket | undefined,
    onUsernameUpdate: (updateUser: User) => void,
    onAvatarUpdate: (id: number, updateAvatar: string) => void
  }

export interface CommonProps {
    socket: Socket | undefined,
    user: User | undefined
    }
