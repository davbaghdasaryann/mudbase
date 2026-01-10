import { Collection, Filter, FindOptions, Int32, ObjectId } from 'mongodb';
import { AccountActivity } from '../../tsmudbase/company_activities';

export interface EntityAccount {
    _id?: ObjectId;
    accountNumber: string;

    // Company details:
    country?: string;
    region?: string;
    companyName: string;
    lawAddress?: string;
    address?: string;
    companyTin: string;
    phoneNumber?: string;

    //User Information:
    email?: string;
    name?: string;
    surname?: string;
    login?: string;
    password?: string;

    establishedAt?: string;
    webiste?: string;
    director?: string;
    companyInfo?: string;

    createdAt: Date;
    // accountNumber: string;

    companyLogo?: string;

    // accountType?: string;
    accountActivity?: AccountActivity[];

    isActive: boolean;

    adminUserId?: ObjectId;

}



// const TEST_ACCOUNT_IDS = [
//     new ObjectId("67d452d482222c16dfdb84b2"), // evotek@gmail.com
//     new ObjectId("67d45529a70a5b1f35903ade"), // akatek@gmail.com
//     new ObjectId("67d543da0b819d3e6de9dfeb"), // englistaic@gmail.com
//     new ObjectId("67d6ac5f78d1807e1e401b22"), // shin@shin.shin
//     new ObjectId("67d6acd378d1807e1e401b23"), // bank@bank.bank
//     new ObjectId("67d6ad0278d1807e1e401b24"), // vend@vend.vend
//     new ObjectId("67d6ad5178d1807e1e401b25"), // archi@archi.archi
//     new ObjectId("67d6ad7f78d1807e1e401b26"), // dit@dit.dit
//     new ObjectId("67d6ad7f78d1807e1e401b26"), // dit@dit.dit
// ];

export function getAccountsCollection(): Collection<EntityAccount> {
    return mongoDb_.collection('accounts');
}

// export function getAccountsCollection(): Collection<EntityAccount> {
//     const base = mongoDb_.collection<EntityAccount>("accounts");

//     // // In non-prod env, just return the raw collection:
//     // if (process.env.NODE_ENV !== "production") {
//     //     return base;
//     // }

//     // In prod, wrap with a Proxy that injects {_id: {$nin: TEST_ACCOUNT_IDS}}
//     const handler: ProxyHandler<Collection<EntityAccount>> = {
//         get(target, prop, receiver) {
//             // Override find()
//             if (prop === "find") {
//                 return (
//                     filter: Filter<EntityAccount> = {},
//                     opts?: FindOptions<EntityAccount>
//                 ) =>
//                     target.find(
//                         { ...filter, _id: { $nin: TEST_ACCOUNT_IDS } },
//                         opts
//                     );
//             }
//             // Override findOne()
//             if (prop === "findOne") {
//                 return (
//                     filter: Filter<EntityAccount> = {},
//                     opts?: FindOptions<EntityAccount>
//                 ) =>
//                     target.findOne(
//                         { ...filter, _id: { $nin: TEST_ACCOUNT_IDS } },
//                         opts
//                     );
//             }
//             // Override aggregate()
//             if (prop === "aggregate") {
//                 return (
//                     pipeline: Document[] = [],
//                     opts?: Parameters<Collection<EntityAccount>["aggregate"]>[1]
//                 ) =>
//                     target.aggregate(
//                         [{ $match: { _id: { $nin: TEST_ACCOUNT_IDS } } }, ...pipeline],
//                         opts
//                     );
//             }
//             // Everything else (insert/update/delete/etc.) passes through
//             return Reflect.get(target, prop, receiver);
//         }
//     };

//     return new Proxy(base, handler) as Collection<EntityAccount>;
// }





// export function accountToApi(user: any) {
//     let api = {...user} as EntityAccount;
//     // api._id = undefined;
//     // api.password = undefined;
//     // api.passwordPlain = undefined;
//     return api;
// }
