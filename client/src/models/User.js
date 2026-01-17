export class User {
    constructor(username) {
        this.username = username;
    }

    isValid() {
        return !!this.username && this.username.trim().length > 0;
    }

    static fromApiResponse(data) {
        return new User(data.username);
    }
}
