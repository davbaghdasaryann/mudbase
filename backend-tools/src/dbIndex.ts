

export async function createOrReplaceIndex(
  collectionName: string,
  indexName: string,
  typeOfIndex: "single" | "unique" | "text",
  indexFields: Record<string, any>,
  options: Record<string, any> = {} // Additional settings if needed
) {
      const collection = mongoDb_.collection(collectionName);

      // Get existing indexes
      const indexes = await collection.indexes();

      let existingIndex: any = null;

      // Special handling for text indexes, since MongoDB only allows ONE text index per collection
      if (typeOfIndex === "text") {
          existingIndex = indexes.find((idx: any) =>
              Object.values(idx.key).includes("text") // Checks if any field is a text index
          );
      } else {
          // For single-field & unique indexes, find an exact match by key fields
          existingIndex = indexes.find((idx: any) =>
              JSON.stringify(idx.key) === JSON.stringify(indexFields)
          );
      }

      // Drop existing index if it's a conflicting text index or an exact match
      if (existingIndex) {
          console.log(`Dropping existing index "${existingIndex.name}" on ${collectionName}`);
          await collection.dropIndex(existingIndex.name);
      }

      // Define base index options
      let indexOptions: Record<string, any> = { name: indexName, background: true };

      // Adjust options based on index type
      if (typeOfIndex === "unique") {
          indexOptions.unique = true;
      } else if (typeOfIndex === "text") {
          // Convert all provided fields to text index
          indexFields = Object.fromEntries(
              Object.keys(indexFields).map((key) => [key, "text"])
          );
      }

      // Merge additional options
      indexOptions = { ...indexOptions, ...options };

      // Create the index
      const result = await collection.createIndex(indexFields, indexOptions);

      console.log(`Created ${typeOfIndex} index: ${result}`);
      return {
          collection: collectionName,
          indexName: result,
          indexType: typeOfIndex,
          status: existingIndex ? "recreated" : "created",
          message: `${typeOfIndex.charAt(0).toUpperCase() + typeOfIndex.slice(1)} index on ${collectionName} successfully ${existingIndex ? "re" : ""}created`
      };

}



export async function CreateUserIndexes(collectionName: string){
  await createOrReplaceIndex(collectionName, "account_id_idx", "single", {accountId: 1});
  await createOrReplaceIndex(collectionName, "email_idx", "unique", {email: 1});
  await createOrReplaceIndex(collectionName, "user_name_idx", "text", {firstName: 1, lastName: 1});
}

export async function CreateAccountIndexes(collectionName: string){
  await createOrReplaceIndex(collectionName, "comany_name_idx", "unique",{companyName: 1});
  await createOrReplaceIndex(collectionName, "company_tin_idx", "unique", {companyTin: 1});
  //TODO: change email index to unique
  await createOrReplaceIndex(collectionName, "email_idx", "single", {email: 1});
}

export async function CreatePendingUsersIndexes(collectionName: string){
  await createOrReplaceIndex(collectionName, "account_id_idx", "single", {accountId: 1});
  await createOrReplaceIndex(collectionName, "email_idx", "unique", {email: 1});
  await createOrReplaceIndex(collectionName, "user_name_idx", "text", {firstName: 1, lastName: 1});
  await createOrReplaceIndex(collectionName, "invitation_code_idx", "single", {invitationCode: 1});
}

export async function CreateMaterialCategoryIndexes(collectionName: string){
  await createOrReplaceIndex(collectionName, "code_idx", "single", {code: 1});
  await createOrReplaceIndex(collectionName, "name_idx", "text", {name: 1});
}

export async function CreateMaterialSubcategoryIndexes(collectionName: string){
  await createOrReplaceIndex(collectionName, "code_idx", "single", {code: 1});
  await createOrReplaceIndex(collectionName, "name_idx", "text", {name: 1});
  await createOrReplaceIndex(collectionName, "category_id_idx", "single", {categoryId: 1});
  //await createIndex(mongoDatabase, collectionName, "measurement_unit_id_idx", "single", {measurementUnitMongoId: 1}); //maybe no need
}

export async function CreateMaterialItemsIndexes(collectionName: string){
  await createOrReplaceIndex(collectionName, "code_idx", "single", {code: 1});
  await createOrReplaceIndex(collectionName, "full_code_idx", "unique", {fullCode: 1});
  await createOrReplaceIndex(collectionName, "name_idx", "text", {name: 1});
  await createOrReplaceIndex(collectionName, "subcategory_id_idx", "single", {subcategoryId: 1});
  await createOrReplaceIndex(collectionName, "measurement_unit_idx", "single", {measurementUnitMongoId: 1})
}

export async function CreateLaborCategoryIndexes(collectionName: string){
  await createOrReplaceIndex(collectionName, "code_idx", "single", {code: 1});
  await createOrReplaceIndex(collectionName, "name_idx", "text", {name: 1});
}

export async function CreateLaborSubcategoryIndexes(collectionName: string){
  await createOrReplaceIndex(collectionName, "code_idx", "single", {code: 1});
  await createOrReplaceIndex(collectionName, "name_idx", "text", {name: 1});
  await createOrReplaceIndex(collectionName, "category_id_idx", "single", {categoryId: 1});
  await createOrReplaceIndex(collectionName, "measurement_unit_id_idx", "single", {measurementUnitMongoId: 1}); //maybe no need
}

export async function CreateLaborItemsIndexes(collectionName: string){
  await createOrReplaceIndex(collectionName, "code_idx", "single", {code: 1});
  await createOrReplaceIndex(collectionName, "full_code_idx", "unique", {fullCode: 1});
  await createOrReplaceIndex(collectionName, "name_idx", "text", {name: 1});
  await createOrReplaceIndex(collectionName, "subcategory_id_idx", "single", {subcategoryId: 1});
  await createOrReplaceIndex(collectionName, "measurement_unit_idx", "single", {measurementUnitMongoId: 1});
}

export async function CreateLaborPricesJournalIndexes(collectionName: string){
  await createOrReplaceIndex(collectionName, "item_id_idx", "single", {itemId: 1});
  await createOrReplaceIndex(collectionName, "user_id_idx", "single", {userId: 1});
}

export async function CreateMaterialOffersIndexes(collectionName: string){
  await createOrReplaceIndex(collectionName, "item_id_idx", "single", {itemId: 1});
  await createOrReplaceIndex(collectionName, "user_id_idx", "single", {userId: 1});
  await createOrReplaceIndex(collectionName, "account_id_idx", "single", {accountId: 1});
  await createOrReplaceIndex(collectionName, "measurement_unit_idx", "single", {measurementUnitMongoId: 1});
}

export async function CreateLaborOffersIndexes(collectionName: string){
  await createOrReplaceIndex(collectionName, "item_id_idx", "single", {itemId: 1});
  await createOrReplaceIndex(collectionName, "user_id_idx", "single", {userId: 1});
  await createOrReplaceIndex(collectionName, "account_id_idx", "single", {accountId: 1});
  await createOrReplaceIndex(collectionName, "measurement_unit_idx", "single", {measurementUnitMongoId: 1});
}

export async function CreateEstimatesIndexes(collectionName: string){
  await createOrReplaceIndex(collectionName, "account_id_idx", "single", {accountId: 1});
  await createOrReplaceIndex(collectionName, "created_by_user_id_idx", "single", {createdByUserId: 1});
  await createOrReplaceIndex(collectionName, "estimate_number_idx", "text", {estimateNumber: 1});
  await createOrReplaceIndex(collectionName, "address_idx", "text", {address: 1});
  await createOrReplaceIndex(collectionName, "name_idx", "text", {name: 1});
}

export async function CreateEstimateSectionsIndexes(collectionName: string){
  await createOrReplaceIndex(collectionName, "name_idx", "text", {name: 1});
  await createOrReplaceIndex(collectionName, "estimate_id_idx", "single", {estimateId: 1});
}

export async function CreateEstimateSubsectionsIndexes(collectionName: string){
  await createOrReplaceIndex(collectionName, "name_idx", "text", {name: 1});
  await createOrReplaceIndex(collectionName, "estimate_section_id_idx", "single", {estimateSectionId: 1});
}

export async function CreateEstimateMaterialItemsIndexes(collectionName: string){
  await createOrReplaceIndex(collectionName, "estimate_subsection_id_idx", "single", {estimateSubSectionId: 1});
  await createOrReplaceIndex(collectionName, "measurement_unit_idx", "single", {measurementUnitMongoId: 1});
  await createOrReplaceIndex(collectionName, "material_item_id_idx", "single", {materialItemId: 1});
  await createOrReplaceIndex(collectionName, "estimated_labor_id_idx", "single", {estimatedLaborId: 1});
  await createOrReplaceIndex(collectionName, "material_offer_item_name_idx", "text", {materialOfferItemName: 1});
}

export async function CreateEstimateLaborItemsIndexes(collectionName: string){
  await createOrReplaceIndex(collectionName, "estimate_subsection_id_idx", "single", {estimateSubSectionId: 1});
  await createOrReplaceIndex(collectionName, "measurement_unit_idx", "single", {measurementUnitMongoId: 1});
  await createOrReplaceIndex(collectionName, "labor_item_id_idx", "single", {laborItemId: 1});
  await createOrReplaceIndex(collectionName, "labor_offer_item_name_idx", "text", {laborOfferItemName: 1});
}

export async function CreateEstimatesSharesIndexes(collectionName: string){
  await createOrReplaceIndex(collectionName, "shared_by_user_id_idx", "single", {sharedByUserId: 1});
  await createOrReplaceIndex(collectionName, "shared_by_account_id_idx", "single", {sharedByAccountId: 1});
  await createOrReplaceIndex(collectionName, "shared_estimate_id_idx", "single", {sharedEstimateId: 1});
  await createOrReplaceIndex(collectionName, "shared_with_account_id_idx", "single", {sharedWithAccountId: 1});
}

//TODO: functions for accounts, estimate_shares



