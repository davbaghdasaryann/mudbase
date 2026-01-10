import {Collection, ObjectId} from 'mongodb';
import {UserRole} from '@/tsmudbase/user_roles';
import {ChosenPermissionsMap} from '@/tsmudbase/permissions_setup';

export interface EntityUser {
    _id?: ObjectId;

    email: string;
    password?: string;

    accountId?: ObjectId;
    permissions: string;
    role?: UserRole;

    namePrefix?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    nameSuffix?: string;

    passwordResetId?: string;

    phoneNumber?: string;

    isActive?: boolean;

    // userActivity?: AccountActivity[];

    chosenPermissions?: ChosenPermissionsMap;

    whoSentInvite?: ObjectId;
    sentInviteAt?: Date;
    acceptInviteAt?: Date;
}

// const TEST_USER_IDS = [
//     new ObjectId("67b88e313a313122ff90d69f"), // andrey.mirzoyan@gmail.com
//     new ObjectId("67cd72ee1932071a1fb4cde1"), // shinararreg@shin.shin
//     new ObjectId("67cd73411932071a1fb4cde2"), // shinararAd@shin.shin
//     new ObjectId("67cd73871932071a1fb4cde3"), // bankirreg@bank.bank
//     new ObjectId("67cd73a01932071a1fb4cde4"), // bankirAd@bank.bank
//     new ObjectId("67cd74231932071a1fb4cde5"), // archiReg@archi.archi
//     new ObjectId("67cd743a1932071a1fb4cde6"), // archiAd@archi.archi
//     new ObjectId("67cd746d1932071a1fb4cde7"), // vendorReg@vend.vend
//     new ObjectId("67cd749c1932071a1fb4cde8"), // vendorAd@vend.vend
//     new ObjectId("67cd74c01932071a1fb4cde9"), // ditReg@dit.dit
//     new ObjectId("67cd74fd1932071a1fb4cdea"), // ditAd@dit.dit
//     new ObjectId("67d4546b5069acd315b6973b"), // erikerik1188@gmail.com
//     new ObjectId("67debd430050a64f83788999"), // andrei.mirzoyan@gmail.com
//     new ObjectId("67e9566861133bfa43c7375a"), // erik.movsesyan.y@gmail.com
//     new ObjectId("67da8530bc260bf3a1cbfea4"), // netcross@gmail.com
// ];

// export function getUsersCollection(): Collection<EntityUser> {
//     return mongoDb_.collection('users');
// }

export function getUsersCollection(): Collection<EntityUser> {
    return mongoDb_.collection('users');
}

// export function getUsersCollection(): Collection<EntityUser> {
//     const base = mongoDb_.collection<EntityUser>("users");

//     if (process.env.NODE_ENV !== "production") {
//         return base;
//     }

//     const handler: ProxyHandler<Collection<EntityUser>> = {
//         get(target, prop, receiver) {
//             // Override find()
//             if (prop === "find") {
//                 return (filter: Filter<EntityUser> = {}, opts?: FindOptions<EntityUser>) =>
//                     target.find({ ...filter, _id: { $nin: TEST_USER_IDS } }, opts);
//             }
//             // Override findOne()
//             if (prop === "findOne") {
//                 return (filter: Filter<EntityUser> = {}, opts?: FindOptions<EntityUser>) =>
//                     target.findOne({ ...filter, _id: { $nin: TEST_USER_IDS } }, opts);
//             }
//             // Override aggregate()
//             if (prop === "aggregate") {
//                 return (
//                     pipeline: Document[] = [],
//                     opts?: Parameters<Collection<EntityUser>["aggregate"]>[1]
//                 ) =>
//                     target.aggregate(
//                         [
//                             { $match: { _id: { $nin: TEST_USER_IDS } } },
//                             ...pipeline,
//                         ],
//                         opts
//                     );
//             }
//             // Fallback to the normal property (including insert/update/delete)
//             return Reflect.get(target, prop, receiver);
//         },
//     };

//     // Cast back to Collection<EntityUser> so callers don’t need to change their types
//     return new Proxy(base, handler) as Collection<EntityUser>;
// }

// export function userToApi(user: any) {
//     let api = {...user};
//     api._id = undefined;
//     // api.password = undefined;
//     // api.passwordPlain = undefined;
//     return api;
// }
