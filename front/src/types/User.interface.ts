export interface User {
    id: number;
    username: string;
    email: string;
    avatarId?: number;
    avatar?: string;
    secret?: string;
    level: number;
    valid: boolean
    access_token: string | undefined;
    socket?: string;
    socketgame?: string;
    status?: string;
}
