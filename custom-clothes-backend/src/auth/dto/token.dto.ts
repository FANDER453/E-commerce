export class TokenDto{
    id: string;
    name: string;
    email: string;
    role: string;
    isActivated: string;

    constructor(model) {
        this.id = model.id;
        this.name = model.name
        this.email = model.email;
        this.isActivated = model.isActivated
        this.role = model.role
    }
}