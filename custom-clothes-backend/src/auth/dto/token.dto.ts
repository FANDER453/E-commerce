export class TokenDto{
    id: string;
    email: string;
    role: string;
    isActivated: string;

    constructor(model) {
        this.id = model.id;
        this.email = model.email;
        this.isActivated = model.isActivated
        this.role = model.role
    }
}