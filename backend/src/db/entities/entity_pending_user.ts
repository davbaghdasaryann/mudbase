import { Collection, ObjectId } from "mongodb";
import { AccountActivity } from "../../tsmudbase/company_activities";
import { ChosenPermissionsMap, PermissionLevel, PermissionsId, RadioPermissionChoice } from "../../tsmudbase/permissions_setup";



export interface EntityPendingUser {
    _id?: ObjectId;

    email: string;
    password?: string;

    accountId?: ObjectId;


    firstName?: string;
    middleName?: string;
    lastName?: string;

    phoneNumber?: string

    emailVerificationSent?: boolean;
    emailVerificationId?: string;
    emailVerified?: boolean;


    invited?: boolean;
    invitationId?: string;

    approved?: boolean;
    approvalId?: string;

    role: string;
    company?: string;
    position?: string;

    // givenActivities?: AccountActivity[];

    chosenPermissions?: ChosenPermissionsMap;

    whoSentInvite: ObjectId;
    sentInviteAt: Date;

}

export function getPendingUsersCollection(): Collection<EntityPendingUser> {
    return mongoDb_.collection('pending_users');
}
