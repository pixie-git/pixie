export interface ILobby {
    _id: string;
    name: string;
    owner: {
        _id: string;
        username: string;
    };

    createdAt: string;
}

export interface INotification {
    _id: string;
    recipient: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
}

