export class ApiInvite {
    inviteId!: string;
    email!: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    role!: string; // Admin etc.
    isActive!: boolean;
}