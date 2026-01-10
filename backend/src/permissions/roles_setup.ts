import { ChosenPermissionsMap, Permissions, PermissionsId, RadioPermissionChoice } from '@src/tsmudbase/permissions_setup';
import { UserRole } from '@src/tsmudbase/user_roles';
import { AccountActivity } from '@src/tsmudbase/company_activities';

export const RoleNames = {
    SuperAdmin: "SUPER_ADMIN",
    AccountAdmin: "ACCOUNT_ADMIN",
    DevDebugger: "DEV_DEBUGGER",
    Bank: "BANK",
    Architect: "ARCHITECT",
    Builder: "BUILDER",
    Vendor: "VENDOR"

} as const;

export const Roles = {
    SUPER_ADMIN: [Permissions.UserManageAll, Permissions.AccountsFetchAll],
    ACCOUNT_ADMIN: [Permissions.UserManageAccount],
    VENDOR: [Permissions.OffersFetchAccount],
    ARCHITECT: [Permissions.OffersFetchAll, Permissions.EstimateCreate],
    BUILDER: [Permissions.OffersFetchAll, Permissions.EstimateCreate],
    BANK: [Permissions.EstimateGetShared],
    DEV_DEBUGGER: [Permissions.UsersFetchAll]
} as const;




// Now, the combineUserPermissions helper:
export function combineUserPermissions(
    userRole: UserRole,
    selectedActivities: AccountActivity[],
    chosenPermissions?: ChosenPermissionsMap
): string {
    // Convert the chosenPermissions array into a mapping.
    // const chosenPermissionsMap = convertChosenPermissionsArrayToMap(chosenPermissions);

    // Create a Set to collect unique permission codes.
    const permissionSet = new Set<string>();

    // Iterate over each activity and accumulate permissions.
    for (const activity of selectedActivities) {
        const perms = userPermissionsSetUp(userRole, activity, chosenPermissions);
        perms.forEach(perm => permissionSet.add(perm));
    }

    // Return an array from the set, ensuring uniqueness.
    return Array.from(permissionSet).join(',');
}




export function userPermissionsSetUp(userRole: UserRole, accountActivity: AccountActivity, chosenPermissions?: ChosenPermissionsMap): string[] {
    let permissions: string[] = [];



    switch (userRole) {
        case 'R': { // Regular
            switch (accountActivity) {
                case 'A': { // Architect
                    permissions = [
                        Permissions.EstimateUse,
                        Permissions.EstimatesFetchOwn,
                        Permissions.EstimateGetShared,
                        Permissions.EstimateCreate,
                        Permissions.EstimateEdit,
                        Permissions.EstimateViewOtherExpenses,
                        Permissions.EstimateEditOtherExpenses,
                        // Permissions.EstimateMultipleSharedEditQuantity,
                        Permissions.EstimateEditLaborQuanity,
                        Permissions.EstimateEditMaterialQuantity,
                        Permissions.EstimateEditCost,
                        Permissions.EstimateEditInformation,
                        Permissions.EstimateAddFields,
                        Permissions.EstimateShare,
                        Permissions.EstimateShareWithBankAndBuilder,
                        Permissions.EstimateMultipleSharedOnlyViewOne,
                        Permissions.EstimateShareFromReciversView,
                        Permissions.EstimateMultipleSharedDelete,


                        Permissions.CatalogMaterialView,
                        Permissions.CatalogLaborView,


                        Permissions.AccountProfileEdit,
                    ];

                    // Reg Admin
                    break;
                }
                case 'F': { // Bank Financial
                    permissions = [
                        Permissions.EstimateUse,
                        Permissions.EstimatesFetchOwn,
                        Permissions.EstimateGetShared,
                        Permissions.EstimateCreate,
                        Permissions.EstimateEdit,
                        // Permissions.EstimateEditCost,
                        Permissions.EstimateEditInformation,
                        // Permissions.EstimateAddFields,
                        Permissions.EstimateShare,
                        Permissions.EstimateShareWithBuilder,
                        Permissions.EstimateCreateByBank,
                        Permissions.EstimateMultipleSharedOnlyViewAll,
                        Permissions.EstimateShareFromReceiverViewAndReshare,
                        Permissions.EstimateMultipleSharedDelete,


                        Permissions.CatalogMaterialView,
                        Permissions.CatalogLaborView,

                        Permissions.AccountProfileEdit,
                    ];

                    break;
                }
                case 'C': { // Credit Financial
                    permissions = [
                        Permissions.EstimateUse,
                        Permissions.EstimatesFetchOwn,
                        Permissions.EstimateGetShared,
                        Permissions.EstimateCreate,
                        Permissions.EstimateEdit,
                        // Permissions.EstimateEditCost,
                        Permissions.EstimateEditInformation,
                        // Permissions.EstimateAddFields,
                        Permissions.EstimateShare,
                        Permissions.EstimateShareWithBuilder,
                        Permissions.EstimateCreateByBank,
                        Permissions.EstimateMultipleSharedOnlyViewAll,
                        Permissions.EstimateShareFromReceiverViewAndReshare,
                        Permissions.EstimateMultipleSharedDelete,


                        Permissions.CatalogMaterialView,
                        Permissions.CatalogLaborView,

                        Permissions.AccountProfileEdit,
                    ];

                    break;
                }
                case 'I': { // Insurance Financial
                    permissions = [
                        Permissions.EstimateUse,
                        Permissions.EstimatesFetchOwn,
                        Permissions.EstimateGetShared,
                        Permissions.EstimateCreate,
                        Permissions.EstimateEdit,
                        // Permissions.EstimateEditCost,
                        Permissions.EstimateEditInformation,
                        // Permissions.EstimateAddFields,
                        Permissions.EstimateShare,
                        Permissions.EstimateShareWithBuilder,
                        Permissions.EstimateCreateByBank,
                        Permissions.EstimateMultipleSharedOnlyViewAll,
                        Permissions.EstimateShareFromReceiverViewAndReshare,
                        Permissions.EstimateMultipleSharedDelete,


                        Permissions.CatalogMaterialView,
                        Permissions.CatalogLaborView,

                        Permissions.AccountProfileEdit,
                    ];

                    break;
                }
                case 'V': { // Vendor
                    permissions = [
                        // Permissions.OfferCreate,
                        Permissions.OffersFetchAll,
                        Permissions.OfferCreateMaterial,
                        Permissions.OffersViewLocalMaterial,

                        Permissions.CatalogMaterialView,

                        Permissions.AccountProfileEdit,

                    ];

                    break;
                }
                case 'B': { // Builder
                    permissions = [
                        Permissions.EstimateUse,
                        Permissions.EstimatesFetchOwn,
                        Permissions.EstimateGetShared,
                        Permissions.EstimateCreate,
                        Permissions.EstimateEdit,
                        Permissions.EstimateViewOtherExpenses,
                        Permissions.EstimateEditOtherExpenses,
                        Permissions.EstimateEditLaborQuanity,
                        Permissions.EstimateEditMaterialQuantity,
                        Permissions.EstimateEditCost,
                        Permissions.EstimateEditInformation,
                        Permissions.EstimateAddFields,
                        Permissions.EstimateShare,
                        Permissions.EstimateShareWithBankAndArchitecture,
                        Permissions.EstimateMultipleSharedEdit,
                        Permissions.EstimateShareFromReciversView,
                        Permissions.EstimateMultipleSharedDelete,

                        // Permissions.OfferCreate,
                        Permissions.OffersFetchAll,

                        Permissions.CatalogMaterialView,
                        Permissions.CatalogLaborView,
                        Permissions.OfferCreateMaterial,
                        Permissions.OffersViewLocalMaterial,
                        Permissions.OfferCreateLabor,
                        Permissions.OffersViewLocalLabor,

                        Permissions.AccountProfileEdit,
                    ];
                    //
                    break;
                }
                case 'D': { // Developer
                    permissions = [
                        Permissions.EstimateUse,
                        Permissions.EstimatesFetchOwn,
                        Permissions.EstimateCreate,
                        Permissions.EstimateEdit,
                        Permissions.EstimateEditInformation,
                        Permissions.EstimateShare,
                        Permissions.EstimateShareWithBankAndBuilder,
                        Permissions.EstimateCreateByDeveloper,
                        Permissions.EstimateViewOtherExpenses,
                        Permissions.EstimateEditOtherExpenses,
                        Permissions.EstimateMultipleSharedDelete,

                        Permissions.CatalogMaterialView,
                        Permissions.CatalogLaborView,

                        Permissions.AccountProfileEdit,
                    ];


                    break;
                }
                default: {
                    break;
                }
            }
            break;
        }

        case 'A': { // Admin
            switch (accountActivity) {
                case 'A': { // Architect
                    permissions = [

                        Permissions.InvitesFetch,
                        Permissions.InviteSendLocal,


                        Permissions.UsersFetch,
                        Permissions.UsersFetchLocal,

                        Permissions.EstimateUse,
                        Permissions.EstimatesFetchOwn,
                        Permissions.EstimateGetShared,
                        Permissions.EstimateCreate,
                        Permissions.EstimateEdit,
                        Permissions.EstimateViewOtherExpenses,
                        Permissions.EstimateEditOtherExpenses,
                        // Permissions.EstimateMultipleSharedEditQuantity,
                        Permissions.EstimateEditLaborQuanity,
                        Permissions.EstimateEditMaterialQuantity,
                        Permissions.EstimateEditCost,
                        Permissions.EstimateEditInformation,
                        Permissions.EstimateAddFields,
                        Permissions.EstimateShare,
                        Permissions.EstimateShareWithBankAndBuilder,
                        Permissions.EstimateMultipleSharedOnlyViewOne,
                        Permissions.EstimateShareFromReciversView,
                        Permissions.EstimateMultipleSharedDelete,

                        Permissions.CatalogMaterialView,
                        Permissions.CatalogLaborView,

                        Permissions.AccountProfileEdit,

                    ];
                    break;
                }
                case 'F': { // Bank Financial
                    permissions = [

                        Permissions.InvitesFetch,
                        Permissions.InviteSendLocal,

                        Permissions.UsersFetch,
                        Permissions.UsersFetchLocal,

                        Permissions.EstimateUse,
                        Permissions.EstimatesFetchOwn,
                        Permissions.EstimateGetShared,
                        Permissions.EstimateCreate,
                        Permissions.EstimateEdit,
                        // Permissions.EstimateEditCost,
                        Permissions.EstimateEditInformation,
                        // Permissions.EstimateAddFields,
                        Permissions.EstimateShare,
                        Permissions.EstimateCreateByBank,
                        Permissions.EstimateShareWithBuilder,
                        Permissions.EstimateMultipleSharedOnlyViewAll,
                        Permissions.EstimateShareFromReceiverViewAndReshare,
                        Permissions.EstimateMultipleSharedDelete,

                        Permissions.CatalogMaterialView,
                        Permissions.CatalogLaborView,

                        Permissions.AccountProfileEdit,
                    ];
                    break;
                }
                case 'C': { // Credit Financial
                    permissions = [

                        Permissions.InvitesFetch,
                        Permissions.InviteSendLocal,

                        Permissions.UsersFetch,
                        Permissions.UsersFetchLocal,

                        Permissions.EstimateUse,
                        Permissions.EstimatesFetchOwn,
                        Permissions.EstimateGetShared,
                        Permissions.EstimateCreate,
                        Permissions.EstimateEdit,
                        // Permissions.EstimateEditCost,
                        Permissions.EstimateEditInformation,
                        // Permissions.EstimateAddFields,
                        Permissions.EstimateShare,
                        Permissions.EstimateCreateByBank,
                        Permissions.EstimateShareWithBuilder,
                        Permissions.EstimateMultipleSharedOnlyViewAll,
                        Permissions.EstimateShareFromReceiverViewAndReshare,
                        Permissions.EstimateMultipleSharedDelete,

                        Permissions.CatalogMaterialView,
                        Permissions.CatalogLaborView,

                        Permissions.AccountProfileEdit,
                    ];
                    break;
                }
                case 'I': { // Insurance Financial
                    permissions = [

                        Permissions.InvitesFetch,
                        Permissions.InviteSendLocal,

                        Permissions.UsersFetch,
                        Permissions.UsersFetchLocal,

                        Permissions.EstimateUse,
                        Permissions.EstimatesFetchOwn,
                        Permissions.EstimateGetShared,
                        Permissions.EstimateCreate,
                        Permissions.EstimateEdit,
                        // Permissions.EstimateEditCost,
                        Permissions.EstimateEditInformation,
                        // Permissions.EstimateAddFields,
                        Permissions.EstimateShare,
                        Permissions.EstimateCreateByBank,
                        Permissions.EstimateShareWithBuilder,
                        Permissions.EstimateMultipleSharedOnlyViewAll,
                        Permissions.EstimateShareFromReceiverViewAndReshare,
                        Permissions.EstimateMultipleSharedDelete,

                        Permissions.CatalogMaterialView,
                        Permissions.CatalogLaborView,

                        Permissions.AccountProfileEdit,
                    ];
                    break;
                }
                case 'V': { // Vendor
                    permissions = [

                        Permissions.InvitesFetch,
                        Permissions.InviteSendLocal,

                        Permissions.UsersFetch,
                        Permissions.UsersFetchLocal,


                        // Permissions.OfferCreate,
                        Permissions.OffersFetchAll,
                        Permissions.OfferCreateMaterial,
                        Permissions.OffersViewLocalMaterial,

                        Permissions.CatalogMaterialView,

                        Permissions.AccountProfileEdit,
                    ];
                    break;
                }
                case 'B': { // Builder
                    permissions = [

                        Permissions.InvitesFetch,
                        Permissions.InviteSendLocal,

                        Permissions.UsersFetch,
                        Permissions.UsersFetchLocal,


                        Permissions.EstimateUse,
                        Permissions.EstimatesFetchOwn,
                        Permissions.EstimateGetShared,
                        Permissions.EstimateCreate,
                        Permissions.EstimateEdit,
                        Permissions.EstimateViewOtherExpenses,
                        Permissions.EstimateEditLaborQuanity,
                        Permissions.EstimateEditMaterialQuantity,
                        Permissions.EstimateEditCost,
                        Permissions.EstimateEditInformation,
                        Permissions.EstimateAddFields,
                        Permissions.EstimateShare,
                        Permissions.EstimateShareWithBankAndArchitecture,
                        Permissions.EstimateMultipleSharedEdit,
                        Permissions.EstimateShareFromReciversView,
                        Permissions.EstimateViewOtherExpenses,
                        Permissions.EstimateEditOtherExpenses,
                        Permissions.EstimateMultipleSharedDelete,

                        // Permissions.OfferCreate,
                        Permissions.OffersFetchAll,

                        Permissions.CatalogMaterialView,
                        Permissions.CatalogLaborView,
                        Permissions.OfferCreateMaterial,
                        Permissions.OffersViewLocalMaterial,
                        Permissions.OfferCreateLabor,
                        Permissions.OffersViewLocalLabor,

                        Permissions.AccountProfileEdit,


                    ];
                    break;
                }
                case 'D': { // Developer
                    permissions = [

                        Permissions.InvitesFetch,
                        Permissions.InviteSendLocal,

                        Permissions.UsersFetch,
                        Permissions.UsersFetchLocal,

                        Permissions.EstimateUse,
                        Permissions.EstimatesFetchOwn,
                        Permissions.EstimateCreate,
                        Permissions.EstimateEdit,
                        Permissions.EstimateEditInformation,
                        Permissions.EstimateShare,
                        Permissions.EstimateShareWithBankAndBuilder,
                        Permissions.EstimateCreateByDeveloper,
                        Permissions.EstimateMultipleSharedDelete,

                        Permissions.EstimateViewOtherExpenses,
                        Permissions.EstimateEditOtherExpenses,


                        Permissions.CatalogMaterialView,
                        Permissions.CatalogLaborView,

                        Permissions.AccountProfileEdit,

                    ];
                    break;
                }
                default: {
                    break;
                }
            }
            break;
        }

        case 'S': { // Super Admin
            permissions = [

                Permissions.AccountsFetch,

                Permissions.DashboardUse,

                Permissions.UsersFetch,
                Permissions.UsersFetchAll,
                Permissions.UsersFetchAccount,
                Permissions.UserManageAll,
                Permissions.UserManageAccount,

                Permissions.PendingUsersManage,
                Permissions.PendingUsersFetch,

                Permissions.InvitesFetch,
                Permissions.InviteSendAnyone,


                Permissions.CatalogsEdit,
                Permissions.CatalogMaterialView,
                Permissions.CatalogLaborView,

                Permissions.AccountProfileEdit,

            ];
            break;
        }

        case 'X': { // Dev
            permissions = ['All'];

            break;
        }

        default: {
            break;
        }
    }






    // 💬 defaultCodes: the set of permission codes that the default logic would have given for that page.
    // 💬 overrideCodes: the set of permission codes corresponding to the chosen radio value for that page.

    // 💬 so defaultCodes and overrideCodes would be the same


    // 💬 What a regular user can have should be written in the very beginning switch case.
    // 💬 Then when chosenPermissions loop is done, it will clear what is in defaultCodes and start filling according to the given permissons:
    // 💬 What is needed for view
    // 💬 What is needed for edit

    log_.info('permissions: ', permissions, 'chosenPermissions: ', chosenPermissions)

    if (chosenPermissions) {
        for (const pageKey in chosenPermissions) {
            const pageId = pageKey as PermissionsId;
            const choice = chosenPermissions[pageId];
            let defaultCodes: string[] = [];
            let overrideMapping: { [defaultCode: string]: string } = {};

            switch (pageId) {
                case 'estimates': {
                    defaultCodes = [
                        Permissions.EstimateCreate,
                        Permissions.EstimateEdit,
                        Permissions.EstimateEditOtherExpenses,
                        Permissions.EstimateEditLaborQuanity,
                        Permissions.EstimateEditMaterialQuantity,
                        Permissions.EstimateEditCost,
                        Permissions.EstimateEditInformation,
                        Permissions.EstimateAddFields,
                        Permissions.EstimateShare,
                        Permissions.EstimateShareWithBank,
                        Permissions.EstimateCreateByBank,
                        Permissions.EstimateCreateByDeveloper,
                        Permissions.EstimateShareWithBuilder,
                        Permissions.EstimateShareWithBankAndBuilder,
                        Permissions.EstimateShareWithBankAndArchitecture,
                        Permissions.EstimateMultipleSharedEdit,
                        Permissions.EstimateMultipleSharedOnlyViewOne,
                        Permissions.EstimateMultipleSharedOnlyViewAll,
                        Permissions.EstimateMultipleSharedDelete,
                        // Permissions.EstimateMultipleSharedEditQuantity,

                    ];
                    if (choice === 'edit') {
                        // For edit, we want to keep these permissions.
                        overrideMapping = {
                            [Permissions.EstimateCreate]: Permissions.EstimateCreate,
                            [Permissions.EstimateEdit]: Permissions.EstimateEdit,
                            [Permissions.EstimateEditOtherExpenses]: Permissions.EstimateEditOtherExpenses,
                            [Permissions.EstimateEditLaborQuanity]: Permissions.EstimateEditLaborQuanity,
                            [Permissions.EstimateEditMaterialQuantity]: Permissions.EstimateEditMaterialQuantity,
                            [Permissions.EstimateEditCost]: Permissions.EstimateEditCost,
                            [Permissions.EstimateEditInformation]: Permissions.EstimateEditInformation,
                            [Permissions.EstimateAddFields]: Permissions.EstimateAddFields,
                            [Permissions.EstimateShare]: Permissions.EstimateShare,
                            [Permissions.EstimateShareWithBank]: Permissions.EstimateShareWithBank,
                            [Permissions.EstimateCreateByBank]: Permissions.EstimateCreateByBank,
                            [Permissions.EstimateCreateByDeveloper]: Permissions.EstimateCreateByDeveloper,
                            [Permissions.EstimateShareWithBuilder]: Permissions.EstimateShareWithBuilder,
                            [Permissions.EstimateShareWithBankAndBuilder]: Permissions.EstimateShareWithBankAndBuilder,
                            [Permissions.EstimateShareWithBankAndArchitecture]: Permissions.EstimateShareWithBankAndArchitecture,
                            [Permissions.EstimateMultipleSharedEdit]: Permissions.EstimateMultipleSharedEdit,
                            [Permissions.EstimateMultipleSharedOnlyViewOne]: Permissions.EstimateMultipleSharedOnlyViewOne,
                            // [Permissions.EstimateMultipleSharedEditQuantity]: Permissions.EstimateMultipleSharedEditQuantity,
                            [Permissions.EstimateMultipleSharedOnlyViewAll]: Permissions.EstimateMultipleSharedOnlyViewAll,
                            [Permissions.EstimateMultipleSharedDelete]: Permissions.EstimateMultipleSharedDelete,
                        };
                    } else if (choice === 'view') {
                        // For view, we remove editing permissions.
                        overrideMapping = {
                            [Permissions.EstimateCreate]: '',
                            [Permissions.EstimateEdit]: '',
                            [Permissions.EstimateEditOtherExpenses]: '',
                            [Permissions.EstimateEditLaborQuanity]: '',
                            [Permissions.EstimateEditMaterialQuantity]: '',
                            [Permissions.EstimateEditCost]: '',
                            [Permissions.EstimateEditInformation]: '',
                            [Permissions.EstimateAddFields]: '',
                            // Optionally remove sharing permissions if you want view-only
                            [Permissions.EstimateShare]: '',
                            [Permissions.EstimateShareWithBank]: '',
                            [Permissions.EstimateCreateByBank]: '',
                            [Permissions.EstimateCreateByDeveloper]: '',
                            [Permissions.EstimateShareWithBuilder]: '',
                            [Permissions.EstimateShareWithBankAndBuilder]: '',
                            [Permissions.EstimateShareWithBankAndArchitecture]: '',
                            [Permissions.EstimateMultipleSharedEdit]: '',
                            [Permissions.EstimateMultipleSharedDelete]: '',
                            // [Permissions.EstimateMultipleSharedEditQuantity]: '',
                            // Optionally, you may want to keep view-only sharing codes:
                            [Permissions.EstimateMultipleSharedOnlyViewOne]: Permissions.EstimateMultipleSharedOnlyViewOne,
                            [Permissions.EstimateMultipleSharedOnlyViewAll]: Permissions.EstimateMultipleSharedOnlyViewAll,
                        };
                    }
                    break;
                }
                case 'accountLaborOfferCatalog': {
                    defaultCodes = [
                        // Permissions.OfferCreate,
                        Permissions.OfferCreateLabor,
                    ];
                    if (choice === 'edit') {
                        overrideMapping = {
                            // [Permissions.OfferCreate]: Permissions.OfferCreate,
                            [Permissions.OfferCreateLabor]: Permissions.OfferCreateLabor,
                        };
                    } else if (choice === 'view') {
                        overrideMapping = {
                            // [Permissions.OfferCreate]: '',
                            [Permissions.OfferCreateLabor]: '',
                        };
                    }
                    break;
                }
                case 'accountMaterialsOfferCatalog': {
                    defaultCodes = [
                        // Permissions.OfferCreate,
                        Permissions.OfferCreateMaterial,
                    ];
                    if (choice === 'edit') {
                        overrideMapping = {
                            // [Permissions.OfferCreate]: Permissions.OfferCreate,
                            [Permissions.OfferCreateMaterial]: Permissions.OfferCreateMaterial,
                        };
                    } else if (choice === 'view') {
                        overrideMapping = {
                            // [Permissions.OfferCreate]: '',
                            [Permissions.OfferCreateMaterial]: '',
                        };
                    }
                    break;
                }
                case 'accountInfo': {
                    defaultCodes = [
                        Permissions.AccountProfileEdit,
                    ];
                    if (choice === 'edit') {
                        overrideMapping = {
                            [Permissions.AccountProfileEdit]: Permissions.AccountProfileEdit,
                        };
                    } else if (choice === 'view') {
                        overrideMapping = {
                            [Permissions.AccountProfileEdit]: '',
                        };
                    }
                    break;
                }
                default:
                    break;
            }

            const overridesToAdd = new Set<string>();

            defaultCodes.forEach((defaultCode) => {
                if (permissions.includes(defaultCode)) {
                    // Collect the override code (if any) for this default code.
                    const overrideCode = overrideMapping[defaultCode];
                    if (overrideCode) {
                        overridesToAdd.add(overrideCode);
                    }
                }
            });

            // Remove all default codes from permissions.
            permissions = permissions.filter(code => !defaultCodes.includes(code));

            // Add all override codes collected.
            permissions.push(...Array.from(overridesToAdd));
        }
    }

    log_.info('permissions 2', permissions)

    return permissions;
}





