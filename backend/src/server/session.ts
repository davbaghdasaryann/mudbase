import { ObjectId } from "mongodb";

export class ReqSession {
    // _id!: string;
    userId!: string;
    email!: string;
    accountId!: string;
    sessionId!: string;

    mongoUserId?: ObjectId;
    mongoAccountId?: ObjectId;

    permissions?: string[];
    permissionsSet?: Set<string>;


    assertPermission(permission: string) {
        if (!this.permissions) throw new Error("Access Denied");

        if (this.permissions.includes("ALL")) return;

        if (!this.permissions.includes(permission)) throw new Error(`Permission Denied: ${permission}`);
    }

    checkPermission(permission: string): boolean {
        if (!this.permissions) return false;

        // if(deve mode)
        if (this.permissions.includes("ALL")) return true;

        return this.permissions.includes(permission);
    }

    checkPermissionsOr(permissions: string[]): boolean {
        if (!this.permissions) return false;

        const perms = this.permissions;

        if (perms.includes("ALL")) return true;

        // Return true if at least one permission in the array exists.
        return permissions.some(p => perms.includes(p));
    }

    checkPermissionsAnd(permissions: string[]): boolean {
        if (!this.permissions) return false;

        const perms = this.permissions;

        if (perms.includes("ALL")) return true;

        // Return true if all permissions exist in the array.
        return permissions.every(p => perms.includes(p));
    }

}
