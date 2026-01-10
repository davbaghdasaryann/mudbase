import {Collection, ObjectId} from 'mongodb';

import {PgDb} from './sqldb';

import { generateNewAccountId } from './db_state';

export interface LaborCategory {
    code: string;
    name: string;
}

export interface LaborSubcategory {
    code: string;
    name: string;
    categoryFullCode: string;
    categoryCode: string;
    categoryId: ObjectId;
}

export interface LaborItem {
    code: string;
    name: string;
    measurementUnitMongoId: number;
    fullCode: string;
    subcategoryId: ObjectId;
}

export interface MeasurementUnit {
    id: string;
    commonCode: string;
    levelCat: string;
    name: string;
    representationSymbol: string;
}

export interface MaterialCategory {
    code: string;
    name: string;
}

export interface MaterialSubcategory {
    code: string;
    name: string;
    measurementUnitMongoId: number;
    categoryFullCode: string;
    categoryCode: string;
    categoryId: ObjectId;
}

export interface MaterialItem {
    code: string;
    name: string;
    subcategoryCode: string;
    fullCode: string;
    subcategoryId: ObjectId;
    measurementUnitMongoId: ObjectId;
}

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
    accountId: ObjectId;
    isActive: boolean;
}

export interface LaborOffer{
    isAnonymous: boolean;
    isPublic: boolean;
    itemId: ObjectId | null;
    userId: ObjectId | null;
    price: number;
    laborHours: number;
    currency: string;
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
    accountId: ObjectId;
    measurementUnitMongoId: ObjectId;
}

export interface Account{
    // accountId: string;
    createdAt: Date;
    updatedAt: Date;
    accountTin: string;
    companyName: string;
    regionName: string;
    address: string;
    lawAddress: string;
    isActive: boolean;
    accountNumber: string | null;
}



export async function insertAccounts(sqldb: PgDb){
    await sqldb.connect();
    const results = await sqldb.query(`
        SELECT 
            c.id,
            c.created,
            c.updated,
            c.legal_entity_name,
            c.operating_address,
            c.registered_address,
            c.phone_number,
            c.taxpayer_account,
            c.region_id,
            r.name AS region_name
        FROM 
            customer c
        JOIN 
            region r ON c.region_id = r.id
    `);
    // console.log(results);

    const accounts: Account[] = results.map((res) =>({
        accountId: res.id,
        companyName: res.legal_entity_name,
        createdAt: res.created,
        updatedAt: res.updated,
        accountTin: res.taxpayer_account,
        regionName: res.region_name,
        address: res.operating_address,
        lawAddress: res.registered_address,
        isActive: true,
        //TODO:
        accountNumber: null,
        //accountNumber: await generateNewAccountId(),
    }))
    let accountsCollection = mongoDb_.collection('accounts') as Collection<Account>;
    await accountsCollection.insertMany(accounts);
    
    console.log(`Successfully inserted ${accounts.length} accounts`);
    // console.log(users);
}


export async function AddRequiredFieldsToAccounts(sqldb: PgDb) {
    let isActiveAdded = 0;
    let accountNumberAdded = 0;
  
    await sqldb.connect();
    const accountsCollection = mongoDb_.collection("accounts") as Collection<Account>;
    const documents = await accountsCollection.find().toArray();

    for (const doc of documents) {
    const updates: Partial<Account> = {};
    let needsUpdate = false;

    if (!("isActive" in doc)) {
        updates.isActive = true;
        isActiveAdded++;
        needsUpdate = true;
    }

    if (!("accountNumber" in doc)) {
        updates.accountNumber = await generateNewAccountId();
        accountNumberAdded++;
        needsUpdate = true;
    }

    if (needsUpdate) {
        await accountsCollection.updateOne(
        { _id: doc._id },
        { $set: updates }
        );
        // console.log(doc);
    }
    }

    console.log(`Successfully updated ${documents.length} accounts fields`);
 
}

export async function AddRequiredFieldsToUsers(sqldb: PgDb) {
    let isActiveAdded = 0;
    // let accountNumberAdded = 0;
  
    await sqldb.connect();
    const usersCollection = mongoDb_.collection("users") as Collection<User>;
    const documents = await usersCollection.find().toArray();

    for (const doc of documents) {
    const updates: Partial<User> = {};
    let needsUpdate = false;

    if (!("isActive" in doc)) {
        updates.isActive = true;
        isActiveAdded++;
        needsUpdate = true;
    }

    // if (!("accountNumber" in doc)) {
    //     updates.accountNumber = await generateNewAccountId();
    //     accountNumberAdded++;
    //     needsUpdate = true;
    // }

    if (needsUpdate) {
        await usersCollection.updateOne(
        { _id: doc._id },
        { $set: updates }
        );
        // console.log(doc);
    }
    }

    console.log(`Successfully updated ${isActiveAdded} users fields`);
 
}
  


export async function insertUsers(sqldb: PgDb){
    await sqldb.connect();
    //Fetching users from postgresql
    const results = await sqldb.query(`
        SELECT
            "user".id,
            "user".email,
            "user".first_name,
            "user".last_name,
            "user".password,
            "user".customer_id,
            "user".created,
            "user".updated
        FROM "user";
    `);

    //Fetching accounts from mongodb
    const accountsCollection = mongoDb_.collection('accounts');
    const accountsCursor = await accountsCollection.find({});

    let accounts: any[] = [];
    await accountsCursor.forEach((item: any) => {
        accounts.push(item);
    });

    // Create a map for quick lookup of accounts by accountId
    const parentCodeToIdMap = accounts.reduce((map: any, acc: any) => {
        map[acc.accountId] = acc._id;
        return map;
    }, {});
    // console.log(parentCodeToIdMap)

    // Add parent_mongo_id to each user
    const enrichedUsers = results.map((user) => ({
        ...user,
        account_mongo_id: parentCodeToIdMap[user.customer_id],
    }));
    // console.log(enrichedUsers);

    //Inserting in mongodb
    const users: User[] = enrichedUsers.map((res) => ({
        id: res.id,
        email: res.email,
        firstName: res.first_name,
        lastName: res.last_name,
        password: res.password,
        createdAt: res.created,
        updatedAt: res.updated,
        accountId: res.account_mongo_id,
        isActive: true,
    }));
    
    let userCollection = mongoDb_.collection('users') as Collection<User>;
    await userCollection.insertMany(users);
    
    console.log(`Successfully inserted ${users.length} users`);
    // console.log(users);
}




export async function createAccountsAndAssignToUsers() {

      const accountsCollection = mongoDb_.collection('accounts');
      const usersCollection = mongoDb_.collection('users');
      
      // Create 30 new accounts with companyName as empty string
      const newAccounts = Array.from({ length: 30 }, () => ({
        companyName: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      
      // Insert the new accounts
      const accountsResult = await accountsCollection.insertMany(newAccounts);
      console.log(`Created ${accountsResult.insertedCount} new accounts`);
      
      // Get the _ids of the newly created accounts
      const newAccountIds = Object.values(accountsResult.insertedIds);
      
      // Find 30 users without accountIds
      const usersWithoutAccounts = await usersCollection
        .find({ 
          accountId: { $exists: false } 
        })
        .limit(30)
        .toArray();
      
      console.log(`Found ${usersWithoutAccounts.length} users without accounts`);
      
      // Prepare bulk write operations to update users
      const bulkOperations = usersWithoutAccounts.map((user, index) => ({
        updateOne: {
          filter: { _id: user._id },
          update: { 
            $set: { 
              accountId: newAccountIds[index],
              updatedAt: new Date()
            } 
          }
        }
      }));
      
      // Perform bulk write to update users with new account IDs
      if (bulkOperations.length > 0) {
        const updateResult = await usersCollection.bulkWrite(bulkOperations);
        console.log(`Updated ${updateResult.modifiedCount} users with new account IDs`);
      }

}



export async function deleteAllDocuments(collectionName: string) {
    const collection = mongoDb_.collection(collectionName);

    // try {
        const result = await collection.deleteMany({});
        console.log(`${result.deletedCount} documents were deleted.`);
    // } catch (err) {
    //     console.error('Error deleting documents:', err);
    // }
}



//Delete documents with the specific criteria
export async function deleteDocumentsByFields(collectionName: any, criteria: any) {

      // Get a reference to the collection
      const collection = mongoDb_.collection(collectionName);
      
      // Delete documents matching the criteria
      const result = await collection.deleteMany(criteria);
      
      console.log(`Successfully deleted ${result.deletedCount} document(s) from ${collectionName}`);
      return result.deletedCount;
}



export async function insertLaborCategories(sqldb: PgDb) {
    await sqldb.connect();
   
    //Fetching root categories from postgresql
    const rootCategories = await sqldb.query('SELECT * FROM een_category WHERE parent_id IS NULL');


    //Inserting in mongodb
    const laborCategories: LaborCategory[] = rootCategories.map((category) => ({
        code: category.een_category_code,
        name: category.name,
    }));

    let collection = mongoDb_.collection('labor_categories') as Collection<LaborCategory>;
    await collection.insertMany(laborCategories);

    collection.insertMany([ {code: "aaa", name: "aa"}])
    console.log(`Successfully inserted ${laborCategories.length} root categories`);
}



export async function insertLaborSubcategories(sqldb: PgDb) {
    try {
        await sqldb.connect();
        //Fetching subcategories from postgresql
        const subcategories = await sqldb.query(`
        SELECT 
            child.id,
            child.een_category_code,
            child.name,
            child.parent_id,
            parent.een_category_code as parent_category_code
        FROM een_category child
        INNER JOIN een_category parent ON child.parent_id = parent.id
        WHERE 
            child.parent_id IS NOT NULL 
            AND parent.parent_id IS NULL
        ;`);

        //Fetching root categories from mongodb
        const laborCatsCollection = mongoDb_.collection('labor_categories');
        const laborCategoriesCursor = await laborCatsCollection.find({});

        let parentCategories: any[] = [];
        await laborCategoriesCursor.forEach((item: any) => {
            parentCategories.push(item);
        });

        // Create a map for quick lookup of parent categories by code
        const parentCodeToIdMap = parentCategories.reduce((map: any, parent: any) => {
            map[parent.code] = parent._id;
            return map;
        }, {});

        // Add parent_mongo_id to each subcategory
        const enrichedSubcategories = subcategories.map((sub) => ({
            ...sub,
            parent_mongo_id: parentCodeToIdMap[sub.parent_category_code],
        }));
        // console.log(enrichedSubcategories);

        //Inserting in mongodb
        const laborSubcategories: LaborSubcategory[] = enrichedSubcategories.map((category) => ({
            code: category.een_category_code,
            name: category.name,
            categoryCode: category.parent_category_code,
            categoryFullCode: category.parent_category_code + category.een_category_code,
            categoryId: category.parent_mongo_id,
        }));
        //Open when you want to insert labor_subcategories
        await mongoDb_.collection('labor_subcategories').insertMany(laborSubcategories);
        console.log(`Successfully inserted ${laborSubcategories.length} subcategories`);

        // console.log(laborSubcategories)
    } catch (err) {
        console.error('Database operation failed');
        log_.error(err);
        process.exit(1);
    } finally {
        await sqldb.disconnect();
    }
}



export async function insertLaborItems(sqldb: PgDb) {
    try {
        // console.log("Item")
        await sqldb.connect();
        //Fetching items from postgresql
        const items = await sqldb.query(`
            SELECT
                een.id,
                een.een_code,
                een.een_name,
                een.measurement_unit_id,
                een.een_category_id as een_subcategory_id,
                category.een_category_code as subcategory_code,
                parent_cat.een_category_code as category_code,
                CONCAT(parent_cat.een_category_code, category.een_category_code) as combined_code
            FROM een
            INNER JOIN een_category category
                ON een.een_category_id = category.id
            LEFT JOIN een_category parent_cat
                ON category.parent_id = parent_cat.id
            WHERE
                een.een_category_id IS NOT NULL
                AND category.parent_id IS NOT NULL
          ;`);

        // console.log(items);
        //Fetching subcategories from mongodb
        const laborSubCatsCollection = mongoDb_.collection('labor_subcategories');
        const laborSubCategoriesCursor = await laborSubCatsCollection.find({});

        let subcategories: any[] = [];
        await laborSubCategoriesCursor.forEach((item: any) => {
            subcategories.push(item);
        });
        // console.log(subcategories)
        // Create a map for quick lookup of subcategories by code
        const subcategoryCodeToIdMap = subcategories.reduce((map: any, subcategory: any) => {
            map[subcategory.categoryFullCode] = subcategory._id;
            return map;
        }, {});
        // console.log(subcategoryCodeToIdMap)

        //Fetching measurement units from mongodb
        const measurementUnitsCollection = mongoDb_.collection('measurement_unit');
        const measurementUnitsCursor = await measurementUnitsCollection.find({});

        let units: any[] = [];
        await measurementUnitsCursor.forEach((item: any) => {
            units.push(item);
        });
        // console.log(units)
        // Create a map for quick lookup of units by code
        const unitsCodeToIdMap = units.reduce((map: any, unit: any) => {
            map[unit.measurementUnitId] = unit._id;
            return map;
        }, {});
        // console.log(unitsCodeToIdMap);
        // console.log(items)
        // Add subcategory_mongo_id and measurement_unit_id to each item
        const enrichedItems = items.map((item) => ({
            ...item,
            subcategory_mongo_id: subcategoryCodeToIdMap[item.combined_code],
            measurement_unit_id: unitsCodeToIdMap[item.measurement_unit_id],
        }));
        // console.log(enrichedItems)

        //Inserting in mongodb
        const laborItems: LaborItem[] = enrichedItems.map((item) => ({
            code: item.een_code,
            name: item.een_name,
            measurementUnitMongoId: item.measurement_unit_id,
            subcategoryCode: item.subcategory_code,
            fullCode: item.combined_code + item.een_code,
            subcategoryId: item.subcategory_mongo_id,
        }));
        // console.log(laborItems);
        await mongoDb_.collection('labor_items').insertMany(laborItems);
        console.log(`Successfully inserted ${laborItems.length} items`);
    } catch (err) {
        console.error('Database operation failed');
        log_.error(err);
        process.exit(1);
    } finally {
        await sqldb.disconnect();
    }
}



export async function insertLaborOffers(sqldb: PgDb){
    await sqldb.connect();
    //Fetching from postgresql
    const query = await sqldb.query(`
        SELECT 
            eo.een_price, 
            eo.een_unit_workload AS labor_hours, 
            eo.anonymous, 
            eo.public,
            eo.een_id,
            eo.created,
            eo.updated,
            e.een_name AS item_name,
            eo.user_id,
            c.iso_code AS currency_code
        FROM 
            een_expend_offer eo
        JOIN 
            een e ON eo.een_id = e.id
        JOIN 
            currency c ON eo.currency_id = c.id
    `);
    // console.log(query)
    // First, fetch all labor items from MongoDB to do the name matching
    const laborItems = await mongoDb_.collection("labor_items").find({}).toArray();

    // Create a lookup map for labor items by name
    const laborItemsByName: Record<string, ObjectId> = {};
    const laborItemsByMeasurementUnitId: Record<string, ObjectId> = {};
    laborItems.forEach(item => {
        if (item.name) {
            laborItemsByName[item.name] = item._id;
            laborItemsByMeasurementUnitId[item.name] = item.measurementUnitMongoId;
        }
    });
    // User matching - find users by their PostgreSQL ID
    const users = await mongoDb_.collection("users").find({}).toArray();
    const userIdMap: Record<string, ObjectId> = {};
    const accountIdMap: Record<string, ObjectId> = {};
    users.forEach(user => {
      // Assuming the PostgreSQL user ID is stored in a field called 'id'
      if (user.id) {
        userIdMap[user.id] = user._id;
        accountIdMap[user.id] =  user.accountId;
      }
    });
    // console.log(userIdMap);
    // Match labor item
    const enrichedLaborItems = query.map((item) => ({
        ...item,
        itemMongoId: item.item_name 
        ? laborItemsByName[item.item_name] || null
        : null,
        measurementUnitMongoId: item.item_name 
        ? laborItemsByMeasurementUnitId[item.item_name] || null
        : null,
        userMongoId: userIdMap[item.user_id],
        accountId: accountIdMap[item.user_id],
    }));
    // console.log(enrichedLaborItems)

    //Inserting in mongodb
    const laborOffers: LaborOffer[] = enrichedLaborItems.map((item) => ({
        isAnonymous: item.anonymous,
        isPublic: item.public,
        itemId: item.itemMongoId,
        userId: item.userMongoId,
        price: parseFloat(item.een_price),
        laborHours: parseFloat(item.labor_hours),
        //TODO: we need to change currency code to currency id after
        currency: item.currency_code,
        isArchived: false,
        createdAt: item.created,
        updatedAt: item.updated,
        accountId: item.accountId,
        measurementUnitMongoId: item.measurementUnitMongoId,
    }));
    // console.log(laborOffers);
    await mongoDb_.collection('labor_offers').insertMany(laborOffers);
    console.log(`Successfully inserted ${laborOffers.length} items`);

}



export async function insertMeasurement(sqldb: PgDb) {
    try {
        await sqldb.connect();
        //Fetching measurement units from postgresql
        const units = await sqldb.query(`SELECT * FROM  measurement_unit;`);
        const measurementUnits: MeasurementUnit[] = units.map((unit) => ({
            id: unit.id,
            name: unit.name,
            commonCode: unit.common_code,
            levelCat: unit.level_cat,
            representationSymbol: unit.representation_symbol,
        }));
        await mongoDb_.collection('measurement_unit').insertMany(measurementUnits);
        console.log(`Successfully inserted ${measurementUnits.length} meausurement units`);
        // console.log(result);
    } catch (err) {
        console.error('Database operation failed');
        log_.error(err);
        process.exit(1);
    } finally {
        await sqldb.disconnect();
    }
}



export async function insertMaterialCategory(sqldb: PgDb) {
    try {
        await sqldb.connect();
        //Fetching root categories from postgresql
        const rootCategories = await sqldb.query(
            'SELECT * FROM material_category WHERE parent_id IS NULL'
        );
        //Inserting in mongodb
        const materialCategories: MaterialCategory[] = rootCategories.map((category) => ({
            code: category.material_category_code,
            name: category.name,
        }));
        await mongoDb_.collection('material_categories').insertMany(materialCategories);
        console.log(`Successfully inserted ${materialCategories.length} root categories`);
    } catch (err) {
        console.error('Database operation failed');
        log_.error(err);
        process.exit(1);
    } finally {
        await sqldb.disconnect();
    }
}



export async function insertMaterialSubcategory(sqldb: PgDb) {
    try {
        await sqldb.connect();
        //Fetching subcategories from postgresql
        const subcategories = await sqldb.query(`
            SELECT 
                child.id,
                child.material_category_code,
                child.name,
                child.parent_id,
                child.measurement_unit_id,
                parent.material_category_code as parent_category_code
            FROM material_category child
            INNER JOIN material_category parent ON child.parent_id = parent.id
            WHERE 
                child.parent_id IS NOT NULL 
                AND parent.parent_id IS NULL
            ;`);
        //Fetching root categories from mongodb
        const matCatsCollection = mongoDb_.collection('material_categories');
        const matCategoriesCursor = await matCatsCollection.find({});

        let parentCategories: any[] = [];
        await matCategoriesCursor.forEach((item: any) => {
            parentCategories.push(item);
        });
        // Create a map for quick lookup of parent categories by code
        const parentCodeToIdMap = parentCategories.reduce((map: any, parent: any) => {
            map[parent.code] = parent._id;
            return map;
        }, {});
        //Fetching measurement units from mongodb
        const measurementUnitsCollection = mongoDb_.collection('measurement_unit');
        const measurementUnitsCursor = await measurementUnitsCollection.find({});

        let units: any[] = [];
        await measurementUnitsCursor.forEach((item: any) => {
            units.push(item);
        });
        // console.log(units)
        // Create a map for quick lookup of units by code
        const unitsCodeToIdMap = units.reduce((map: any, unit: any) => {
            map[unit.measurementUnitId] = unit._id;
            return map;
        }, {});
        // console.log(unitsCodeToIdMap);

        // Add parent_mongo_id to each subcategory
        const enrichedSubcategories = subcategories.map((sub) => ({
            ...sub,
            parent_mongo_id: parentCodeToIdMap[sub.parent_category_code],
            measurement_unit_id: unitsCodeToIdMap[sub.measurement_unit_id],
        }));
        //Inserting in mongodb
        const materialSubcategories: MaterialSubcategory[] = enrichedSubcategories.map(
            (category) => ({
                code: category.material_category_code,
                name: category.name,
                categoryCode: category.parent_category_code,
                measurementUnitMongoId: category.measurement_unit_id,
                categoryFullCode: category.parent_category_code + category.material_category_code,
                categoryId: category.parent_mongo_id,
            })
        );
        await mongoDb_.collection('material_subcategories').insertMany(materialSubcategories);
        console.log(`Successfully inserted ${materialSubcategories.length} subcategories`);
        // console.log(materialSubcategories)
    } catch (err) {
        console.error('Database operation failed');
        log_.error(err);
        process.exit(1);
    } finally {
        await sqldb.disconnect();
    }
}



export async function insertMaterialItem(sqldb: PgDb) {
    try {
        await sqldb.connect();
        //Fetching items from postgresql
        const items = await sqldb.query(`
            SELECT
                material.id,
                material.material_code,
                material.material_name,
                material.material_category_id as material_subcategory_id,
                category.material_category_code as subcategory_code,
                parent_cat.material_category_code as category_code,
                CONCAT(parent_cat.material_category_code, category.material_category_code) as combined_code
            FROM material
            INNER JOIN material_category category
                ON material.material_category_id = category.id
            LEFT JOIN material_category parent_cat
                ON category.parent_id = parent_cat.id
            WHERE
                material.material_category_id IS NOT NULL
                AND category.parent_id IS NOT NULL
          ;`);
        //   console.log(items);
        //Fetching subcategories from mongodb
        const materialSubCatsCollection = mongoDb_.collection('material_subcategories');
        const materialSubCategoriesCursor = await materialSubCatsCollection.find({});

        let subcategories: any[] = [];
        await materialSubCategoriesCursor.forEach((item: any) => {
            subcategories.push(item);
        });
        // console.log(subcategories)
        // Create a map for quick lookup of subcategories by code
        const subcategoryCodeToIdMap = subcategories.reduce((map: any, subcategory: any) => {
            map[subcategory.categoryFullCode] = subcategory._id;
            return map;
        }, {});
        // Create a map for quick lookup of subcategories by code
        const measurementUnitToIdMap = subcategories.reduce((map: any, subcategory: any) => {
            map[subcategory.categoryFullCode] = subcategory.measurementUnitMongoId;
            return map;
        }, {});
        // Add subcategory_mongo_id to each item
        const enrichedItems = items.map((item) => ({
            ...item,
            subcategory_mongo_id: subcategoryCodeToIdMap[item.combined_code],
            measurement_unit_id: measurementUnitToIdMap[item.combined_code],
        }));
        // console.log(enrichedItems)

        //Inserting in mongodb
        const materialItems: MaterialItem[] = enrichedItems.map((item) => ({
            code: item.material_code,
            name: item.material_name,
            subcategoryCode: item.subcategory_code,
            fullCode: item.combined_code + item.material_code,
            subcategoryId: item.subcategory_mongo_id,
            measurementUnitMongoId: item.measurement_unit_id,
        }));
        // console.log(materialItems);
        await mongoDb_.collection('material_items').insertMany(materialItems);
        console.log(`Successfully inserted ${materialItems.length} items`);
    } catch (err) {
        console.error('Database operation failed');
        log_.error(err);
        process.exit(1);
    } finally {
        await sqldb.disconnect();
    }
}


