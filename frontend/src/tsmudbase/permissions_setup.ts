import { AccountActivity } from "./company_activities";

export const Permissions = {
    UsersFetch: "USR_FCH",
    UsersFetchAll: "USR_FCH_ALL",
    UsersFetchLocal: "USR_FCH_LOC",
    UsersFetchAccount: "USR_FCH_ACC",
    UserManageAll: "USR_MNG_ALL",
    UserManageAccount: "USR_MNG_ACC",

    // UsersPendingManage: "USERS_PENDING_MANAGE",
    PendingUsersManage: "PND_USR_MNG",
    PendingUsersFetch: "PND_USR_FCH",

    InvitesFetch: "INV_FCH",
    InviteSendAnyone: "INV_SND_ANY",
    InviteSendLocal: "INV_SND_LOC",

    AccountsFetch: "ACC_FCH",
    AccountsFetchAll: "ACC_FCH_ALL",
    AccountsFetchAccount: "ACC_FCH_ACC",
    AccountsEditAccount: "ACC_EDT_ACC",


    // OfferCreate: "OFF_CRT",
    OffersFetchAll: "OFF_FCH_ALL",
    OffersFetchAccount: "OFF_FCH_ACC",
    OffersViewLocalMaterial: "OFF_VW_LOC_MTRL",
    OffersViewLocalLabor: "OFF_VW_LOC_LBR",
    OfferCreateMaterial: "OFF_CRT_MTRL",
    OfferCreateLabor: "OFF_CRT_LBR",


    EstimateUse: "EST_USE",
    EstimatesFetchAll: "EST_FCH_ALL",
    // EstimatesFetchAccount: "EST_FCH_ACC",
    EstimatesFetchOwn: "EST_FCH_OWN",
    // EstimatesFetchShared: "EST_FCH_SHRD",
    EstimateGetShared: "EST_GET_SHRD",
    EstimateCreate: "EST_CRT",
    EstimateEdit: "EST_EDT",
    EstimateViewOtherExpenses: "EST_VW_OTHR_XPNS",
    EstimateEditOtherExpenses: "EST_EDT_OTHR_XPNS",
    EstimateEditCost: "EST_EDT_CST",
    EstimateEditLaborQuanity: "EST_EDT_LBR_QTY",
    EstimateEditMaterialQuantity: "EST_EDT_MTRL_QTY",
    EstimateEditInformation: "EST_EDT_INFO",
    EstimateAddFields: "EST_ADD_FLDS",
    EstimateShare: "EST_SHR",
    EstimateShareWithBank: "EST_SHR_WITH_BNK",
    EstimateCreateByBank: "EST_CRT_BY_BNK",
    EstimateCreateByDeveloper: "EST_CRT_BY_DEV",
    EstimateShareWithBuilder: "EST_SHR_WITH_BLDR",
    EstimateShareWithBankAndBuilder: "EST_SHR_WITH_BNK_AND_BLDR",
    EstimateShareWithBankAndArchitecture: "EST_SHR_WITH_BNK_AND_ARCH",
    EstimateMultipleSharedEdit: "EST_MULT_SHRD_EDT",
    EstimateMultipleSharedDelete: "EST_MULT_SHRD_DEL",
    // EstimateMultipleSharedEditQuantity: "EST_MULT_SHRD_EDT_QTY",
    EstimateMultipleSharedOnlyViewOne: "EST_MULT_SHRD_ONLY_VW_ONE", // Only current estimate can see
    EstimateMultipleSharedOnlyViewAll: "EST_MULT_SHRD_ONLY_VW_ALL", // by accordion current estimate can see and who else work on that estiamte (bank, developer view)

    EstimateShareFromReceiverViewAndReshare: "EST_SHR_RCV_VW_RSHR",
    EstimateShareFromReciversView: "EST_SHR_VW_RCV",

    // EstimateShareViewFromSendersView: "EST_SHR_VW_SND",

    CatalogsEdit: "CAT_EDT",
    CatalogMaterialView: "CAT_MTRL_VW",
    CatalogLaborView: "CAT_LBR_VW",

    DashboardUse: "DASH_USE",


    // AccountProfileView: "ACC_PROF_VW",
    AccountProfileEdit: "ACC_PROF_EDT",


    // ALL, EDIT_CATALOGS, EST_EDT, EST_EDT_CST, EST_EDT_INFO, EST_ADD_FLDS, EST_SHR

    DevUse: "DEV_USE",

    All: "ALL",


} as const;



export type PermissionsId = 'estimates' | 'accountLaborOfferCatalog' | 'accountMaterialsOfferCatalog' | 'accountInfo';

export type PermissionsDisplay = 'Estimates' | 'Labor catalog' | 'Materials catalog' | 'Company profile';
export type RadioPermissionChoice = 'view' | 'edit';

export interface AllowedPage {
    id: PermissionsId;
    name: PermissionsDisplay;
    allowedPermission: PermissionLevel;
}

export type PermissionLevel = 'none' | 'viewOnly' | 'viewOrEdit';

export interface AccountData {
    accountActivity: AccountActivity[];
}

// export interface ChosenPermission {
//     id: PermissionsId;
//     radioPermissionChoice: RadioPermissionChoice;
// }

export type ChosenPermissionsMap = {
    [key in PermissionsId]?: RadioPermissionChoice;
};

export const pageDisplayNames: Record<PermissionsId, PermissionsDisplay> = {
    estimates: "Estimates",
    accountLaborOfferCatalog: "Labor catalog",
    accountMaterialsOfferCatalog: "Materials catalog",
    accountInfo: "Company profile",
};

const accountActivityToPagePermissions: Record<AccountActivity, Record<PermissionsId, PermissionLevel>> = {
    A: { // Architect
        estimates: 'viewOrEdit',
        accountLaborOfferCatalog: 'viewOnly',
        accountMaterialsOfferCatalog: 'viewOnly',
        accountInfo: 'viewOrEdit',
    },
    B: { // Builder
        estimates: 'viewOrEdit',
        accountLaborOfferCatalog: 'viewOrEdit',
        accountMaterialsOfferCatalog: 'viewOrEdit',
        accountInfo: 'viewOrEdit',
    },
    D: { // Developer
        estimates: 'viewOrEdit',
        accountLaborOfferCatalog: 'viewOnly',
        accountMaterialsOfferCatalog: 'viewOnly',
        accountInfo: 'viewOrEdit',
    },
    V: { // Vendor
        estimates: 'none',
        accountLaborOfferCatalog: 'none',
        accountMaterialsOfferCatalog: 'viewOrEdit',
        accountInfo: 'viewOrEdit',
    },
    F: { // Financial
        estimates: 'viewOrEdit', // 'viewOnly',
        accountLaborOfferCatalog: 'viewOnly',
        accountMaterialsOfferCatalog: 'viewOnly',
        accountInfo: 'viewOrEdit',
    },
    C: { // Credit (Added Key)
        estimates: 'viewOrEdit', // 'viewOnly',
        accountLaborOfferCatalog: 'viewOnly',
        accountMaterialsOfferCatalog: 'viewOnly',
        accountInfo: 'viewOrEdit',
    },
    I: { // Insurance (Added Key)
        estimates: 'viewOrEdit', // 'viewOnly',
        accountLaborOfferCatalog: 'viewOnly',
        accountMaterialsOfferCatalog: 'viewOnly',
        accountInfo: 'viewOrEdit',
    },
};

function permissionValue(level: PermissionLevel): number {
    switch (level) {
        case 'none': return 0;
        case 'viewOnly': return 1;
        case 'viewOrEdit': return 2;
    }
}

// Merge two permission levels, returning the more permissive one.
function mergePermissionLevels(a: PermissionLevel, b: PermissionLevel): PermissionLevel {
    return permissionValue(a) >= permissionValue(b) ? a : b;
}


export function getAllowedPagesByActivities(accountData: AccountData): AllowedPage[] {
    const activities = accountData.accountActivity;
    const allPageIds: PermissionsId[] = ['estimates', 'accountLaborOfferCatalog', 'accountMaterialsOfferCatalog', 'accountInfo'];

    return allPageIds.reduce<AllowedPage[]>((acc, pageId) => {
        // Start merging with "none".
        let mergedPermission: PermissionLevel = 'none';
        activities.forEach((activity) => {
            const rolePermission = accountActivityToPagePermissions[activity][pageId];
            mergedPermission = mergePermissionLevels(mergedPermission, rolePermission);
        });
        // Only include the page if the effective permission is not "none".
        if (mergedPermission !== 'none') {
            acc.push({
                id: pageId,
                name: pageDisplayNames[pageId],
                allowedPermission: mergedPermission,
            });
        }
        return acc;
    }, []);
}

// /**
//  * Alternatively, if you want to call the function with just an array of AccountActivity:
//  */
// export function getAllowedPagesByActivitiesFromArray(activities: AccountActivity[]): AllowedPage[] {
//     // Create a temporary AccountData object.
//     const accountData: AccountData = { accountActivity: activities };
//     return getAllowedPagesByActivities(accountData);
// }