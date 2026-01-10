import { AccountActivity } from "../tsmudbase/company_activities";
import { ChosenPermissionsMap } from "../tsmudbase/permissions_setup";

export class Address {
    address1 = '';
    address2 = '';
    city = '';
    state = '';
    country = '';
}


export interface ApiUser {
    //
    // Internal Identification
    //
    //key: string;

    // User Identification
    _id?: string;
    email: string;
    accountId: string;

    role?: string;
    permissions?: string;

    // phone?: string;
    phoneAreaCode?: string;
    phoneNumber?: string;

    namePrefix?: string;
    nameSuffix?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;

    profession?: string;
    location?: string;
    workingTime?: string;
    access?: string;

    isAccountAdmin?: boolean;
    homeAddress?: Address;

    isActive?: boolean;


    chosenPermissions?: ChosenPermissionsMap;

    whoSentInvite?: string;
    // userActivity: AccountActivity[];


    // homeAddress = new Address();

    //
    // Status flags
    //
    // emailVerified = false;
    // phoneVerified = false;
}

export interface ApiPendingUser {
    _id?: string;
    email: string;
    accountId?: string;

    approved?: boolean;
    invited?: boolean;
    invitationId?: string;

    emailVerified?: boolean;

    //approvalId?: string;

    namePrefix?: string;
    nameSuffix?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;

    phoneNumber?: string;
    position?: string;

    companyName?: string;
    companyTin?: string;
    webiste?: string;
    companyPhone?: string;
    companyActivity?: string;


    // Runtime data
    displayStatus: string;

    chosenPermissions?: ChosenPermissionsMap;

    whoSentInvite?: string;
    
    // givenActivities?: AccountActivity[];

}
