export interface ILobby {
    _id: string;
    name: string;
    owner: {
        _id: string;
        username: string;
    };
    allowedUsers: string[];
    createdAt: string;
}

