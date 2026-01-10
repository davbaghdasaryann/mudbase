export const Fields = {

    Id: "_id",

    //User fields
    UserId: "_id",
    UserEmail: "email",
    UserPassword: "password",
    UserFirstName: "firstName",
    UserMiddleName: "middleName",
    UserLastName: "lastName",
    UserPhoneNumber: "phoneNumber",
    UserAccountId: "accountId",
    UserPermissions: "permissions",
    UserIsActive: "isActive",
    // UserActivity: "userActivity",
    UserChosenPermissions: "chosenPermissions",

    //Pending user fields
    PendingUserId: "_id",
    PendingUserEmail: "email",
    PendingUserAccountId: "accountId",

    PendingUserInvited: "invited",
    PendingUserApproved: "approved",
    
    PendingUserFirstName: "firstName",
    PendingUserMiddleName: "middleName",
    PendingUserLastName: "lastName",
    PendingUserPhone: "phoneNumber",
    PendingUserPosition: "position",
    
    PendingUserCompanyName: "companyName",
    PendingUserCompanyTin: "companyTin",
    PendingUserCompanyWebsite: "companyWebsite",
    PendingUserCompanyPhone: "companyPhone",
    PendingUserCompanyActivity: "companyActivity",

    //Account fields
    AccountId: "_id",
    AccountEmail: "email",
    AccountLogin: "login",
    AccountAddress: "address",
    AccountLawAddress: "lawAddress",
    AccountCompanyTin: "companyTin",
    AccountPhoneNumber: "phoneNumber",
    AccountEstablishedAt: "establishedAt",
    AccountCompanyName: "companyName",
    AccountDirector: "director",
    AccountCompanyInfo: "companyInfo",
    AccountActivity: "accountActivity",
    AccountWebsite: "website",
    

    //Measurement unit fields
    MeasurementUnitId: "_id",
    MeasurementUnitName: "name",
    MeasurementUnitCommonCode: "commonCode",
    MeasurementUnitLevelCat: "levelCat",
    MeasurementUnitRepSymbol: "representationSymbol",

    //Material category fields
    MaterialCatId: "_id",
    MaterialCatCode: "code",
    MaterialCatName: "name",

    //Material subcategory filds
    MaterialSubcatId: "_id",
    MaterialSubcatCode: "code",
    MaterialSubcatName: "name",
    MaterialSubcatCatId: "categoryId",
    MaterialSubcatMeasUnitId: "measurementUnitMongoId",

    //Material items fields
    MaterialItemId: "_id",
    MaterialItemCode: "code",
    MaterialItemName: "name",
    MaterialItemSubcatId: "subcategoryId",
    MaterialItemMeasUnitId: "measurementUnitMongoId",

    //Material offer fields
    MaterialOfferId: "_id",
    MaterialOfferIsActive: "isActive",
    MaterialOfferItemId: "itemId",
    MaterialOfferUserId: "userId",
    MaterialOfferAccountId: "accountId",
    MaterialOfferPrice: "price",
    MaterialOfferCurrency: "currency",

    //Labor category fields
    LaborCatId: "_id",
    LaborCatCode: "code",
    LaborCatName: "name",

    //labor subcategory filds
    LaborSubcatId: "_id",
    LaborSubcatCode: "code",
    LaborSubcatName: "name",
    LaborSubcatCatId: "categoryId",

    //Labor items fields
    LaborItemId: "_id",
    LaborItemCode: "code",
    LaborItemName: "name",
    LaborItemSubcatId: "subcategoryId",
    LaborItemMeasUnitId: "measurementUnitMongoId",

    //Labor offer fields
    LaborOfferId: "_id",
    LaborOfferIsActive: "isActive",
    LaborOfferItemId: "itemId",
    LaborOfferUserId: "userId",
    LaborOfferAccountId: "accountId",
    LaborOfferPrice: "price",
    LaborOfferCurrency: "currency",
    LaborOfferLaborHours: "laborHours", //🔴 TODO: this will need us in version 2 🔴
    LaborOfferMeasUnitId: "measurementUnitMongoId",

    //Estimate fields 
    EstimateId: "_id",
    EstimateName: "name",
    EstimateAddress: "address",
    EstimateConstructionType: "constructionType",
    EstimateBuildingType: "buildingType",
    EstimateConstructionSurface: "constructionSurface",
    EstimateAccountid: "accountId",
    EstimateTotalCost: "totalCost",
    EstimateIsOriginal: "isOriginal",

    //Estimate section fields
    EstimateSectionid: "_id",
    EstimateSectionName: "name",
    EstimateSectionEstimateid: "estimateId",
    EstimateSectionTotalCost: "totalCost",

    //Estimate subsection fields
    EstimateSubsectionId: "_id",
    EstimateSubsectionSectionId: "estimateSectionId",
    EstimateSubsectionName: "name",
    EstimateSubsectionTotalCost: "totalCost",

    //Estimate labor item fields
    EstimateLaborItemId: "_id",
    EstimateLaborItemEstSubsecId: "estimateSubsectionId",
    EstimateLaborItemQuantity: "quantity",
    EstimateLaborItemMeasUnitId: "measurementUnitMongoId",
    EstimateLaborItemLabItemId: "laborItemId",
    EstimateLaborItemAvgPrice: "averagePrice",
    EstimateLaborItemChangeAvgPrice: "changableAveragePrice",
    EstimateLaborItemLabHours: "laborHours", //🔴 TODO: this will need us in version 2 🔴
    EstimateLaborOfferItemName: "laborOfferItemName",

    //Estimate material item fields
    EstimateMatItemId: "_id",
    EstimateMatItemEstSubsecId: "estimateSubsectionId",
    EstimateMatItemQuantity: "quantity",
    EstimateMatItemMeasUnitId: "measurementUnitMongoId",
    EstimateMatItemLabItemId: "laborItemId",
    EstimateMatItemEstLabId: "estimatedLaborId",
    EstimateMatItemAvgPrice: "averagePrice",
    EstimateMatItemChangeAvgPrice: "changableAveragePrice",
    EstimateMatOfferItemName: "materialOfferItemName",

} as const;

