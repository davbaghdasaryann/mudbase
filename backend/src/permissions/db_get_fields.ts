import { Fields } from "./db_fields_setup";

// Helper functions to get groups of fields (to maintain original array functionality)
export const getUserFields = () => [
    Fields.UserId,
    Fields.UserEmail,
    Fields.UserPassword,
    Fields.UserFirstName,
    Fields.UserLastName,
    Fields.UserAccountId,
    Fields.UserPermissions,

    Fields.UserChosenPermissions
];

export const getPendingUserFields = () => [
    Fields.PendingUserId,
    Fields.PendingUserEmail,

    Fields.PendingUserAccountId,

    Fields.PendingUserInvited,
    Fields.PendingUserApproved,


    Fields.PendingUserFirstName,
    Fields.PendingUserMiddleName,
    Fields.PendingUserLastName,
    Fields.PendingUserPhone,
    Fields.PendingUserPosition,


    Fields.PendingUserCompanyName,
    Fields.PendingUserCompanyTin,
    Fields.PendingUserCompanyWebsite,
    Fields.PendingUserCompanyPhone,
    Fields.PendingUserCompanyActivity,

    Fields.UserChosenPermissions

];

export const getAccountFields = () => [
    Fields.AccountId,
    Fields.AccountEmail,
    Fields.AccountLogin,
    Fields.AccountCompanyName, 
];

export const getMeasurementUnitFields = () => [
    Fields.MeasurementUnitId,
    Fields.MeasurementUnitName,
    Fields.MeasurementUnitCommonCode,
    Fields.MeasurementUnitLevelCat,
    Fields.MeasurementUnitRepSymbol,
];

export const getMaterialCategoryFields = () => [
    Fields.MaterialCatId,
    Fields.MaterialCatCode,
    Fields.MaterialCatName,
];

export const getMaterialSubcategoryFields = () => [
    Fields.MaterialSubcatId,
    Fields.MaterialSubcatCode,
    Fields.MaterialSubcatName,
    Fields.MaterialSubcatCatId,
    Fields.MaterialSubcatMeasUnitId,
];

export const getMaterialItemsFields = () => [
    Fields.MaterialItemId,
    Fields.MaterialItemCode,
    Fields.MaterialItemName,
    Fields.MaterialItemSubcatId,
    Fields.MaterialItemMeasUnitId,
];

export const getMaterialOfferFields = () => [
    Fields.MaterialOfferId,
    Fields.MaterialOfferIsActive,
    Fields.MaterialOfferItemId,
    Fields.MaterialOfferUserId,
    Fields.MaterialOfferAccountId,
    Fields.MaterialOfferPrice,
    Fields.MaterialOfferCurrency,
];

export const getLaborCategoryFields = () => [
    Fields.LaborCatId,
    Fields.LaborCatCode,
    Fields.LaborCatName,
];

export const getLaborSubcategoryFields = () => [
    Fields.LaborSubcatId,
    Fields.LaborSubcatCode,
    Fields.LaborSubcatName,
    Fields.LaborSubcatCatId,   
];

export const getLaborItemFields = () => [
    Fields.LaborItemId,
    Fields.LaborItemCode,
    Fields.LaborItemName,
    Fields.LaborItemSubcatId,
    Fields.LaborItemMeasUnitId,
];

export const getLaborOfferFields = () => [
    Fields.LaborOfferId,
    Fields.LaborOfferIsActive,
    Fields.LaborOfferItemId,
    Fields.LaborOfferUserId,
    Fields.LaborOfferAccountId,
    Fields.LaborOfferPrice,
    Fields.LaborOfferCurrency,
    Fields.LaborOfferLaborHours, //🔴 TODO: this will need us in version 2 🔴
    Fields.LaborOfferMeasUnitId,
];

export const getEstimateFields = () => [
    Fields.EstimateId,
    Fields.EstimateName,
    Fields.EstimateAddress,
    Fields.EstimateConstructionType,
    Fields.EstimateBuildingType,
    Fields.EstimateConstructionSurface,
    Fields.EstimateAccountid,
    Fields.EstimateTotalCost,
    Fields.EstimateIsOriginal
];

export const getEstimateSectionFields = () => [
    Fields.EstimateSectionid,
    Fields.EstimateSectionName,
    Fields.EstimateSectionEstimateid,
    Fields.EstimateSectionTotalCost,
];

export const getEstimateSubsectionFields = () => [
    Fields.EstimateSubsectionId,
    Fields.EstimateSubsectionSectionId,
    Fields.EstimateSubsectionName,
    Fields.EstimateSubsectionTotalCost,
];

export const getEstimateLaborItemFields = () => [
    Fields.EstimateLaborItemId,
    Fields.EstimateLaborItemEstSubsecId,
    Fields.EstimateLaborItemQuantity,
    Fields.EstimateLaborItemMeasUnitId,
    Fields.EstimateLaborItemLabItemId,
    Fields.EstimateLaborItemAvgPrice,
    Fields.EstimateLaborItemChangeAvgPrice,
    // Fields.EstimateLaborItemLabHours,
    Fields.EstimateLaborOfferItemName,
];

export const getEstimatematerialFields = () => [
    Fields.EstimateMatItemId,
    Fields.EstimateMatItemEstSubsecId,
    Fields.EstimateMatItemQuantity,
    Fields.EstimateMatItemMeasUnitId,
    Fields.EstimateMatItemLabItemId,
    Fields.EstimateMatItemEstLabId,
    Fields.EstimateMatItemAvgPrice,
    Fields.EstimateMatItemChangeAvgPrice,
    Fields.EstimateMatOfferItemName,
];

export const getProfileUpdateFields = () => [
    Fields.UserFirstName, 
    Fields.UserMiddleName,
    Fields.UserLastName,
    Fields.UserPhoneNumber,
];


export const getAccountUpdateFields = () => [
    Fields.AccountEmail,
    Fields.AccountCompanyName,
    Fields.AccountAddress,
    Fields.AccountLawAddress,
    Fields.AccountDirector,
    Fields.AccountPhoneNumber,
    Fields.AccountWebsite,
    Fields.AccountCompanyInfo,
    Fields.AccountEstablishedAt,
    Fields.AccountPhoneNumber,
    Fields.AccountActivity
]

export const getProfileFetchFields = () => [
    Fields.UserEmail,
    Fields.UserFirstName, 
    Fields.UserLastName,
    Fields.UserMiddleName,
    Fields.UserPhoneNumber,
];

export const getUserProfileFetchFields = () => [
    Fields.UserEmail,
    Fields.UserFirstName, 
    Fields.UserLastName,
    Fields.UserPhoneNumber,
    Fields.UserPermissions,
    Fields.UserChosenPermissions,
];

export const getUserProfileUpdateFields = () => [
    // Fields.UserPermissions,
    Fields.UserChosenPermissions,
    Fields.UserFirstName,
    Fields.UserMiddleName,
    Fields.UserLastName,
    Fields.UserPhoneNumber,
    // Fields.UserActivity
];

export const getUsersFetchFields = () => [
    Fields.UserAccountId,
    Fields.UserId,
    Fields.UserEmail,
    Fields.UserPhoneNumber,
    Fields.UserFirstName,
    Fields.UserLastName,
    Fields.UserPermissions,
    Fields.UserIsActive,
    // Fields.UserActivity
];

// export const getUsersUpdateFields = () => [
    
// ];

export const getPendingUsersFetchFields = () => [
    Fields.PendingUserAccountId,
    Fields.PendingUserCompanyName,
    Fields.PendingUserId,
    Fields.PendingUserFirstName,
    Fields.PendingUserLastName,
    Fields.PendingUserPhone,
    Fields.PendingUserPosition,
];

export const getPendingusersUpdateFields = () => [
    // Fields.PendingUserRole,
];