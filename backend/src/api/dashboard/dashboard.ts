import * as Db from '../../db';
import { registerApiSession } from '@src/server/register';
import { respondJsonData } from '@tsback/req/req_response';
import { Permissions } from '@src/tsmudbase/permissions_setup';

registerApiSession('dashboard/fetch_data', async (req, res, session) => {
    // Only superadmin (or users with ALL permission) can access dashboard
    session.assertPermission(Permissions.DashboardUse);

    const usersCollection = Db.getUsersCollection();
    const pendingUsersCollection = Db.getPendingUsersCollection();
    const accountsCollection = Db.getAccountsCollection();
    const laborOffersCollection = Db.getLaborOffersCollection();
    const materialOffersCollection = Db.getMaterialOffersCollection();
    const laborItemsCollection = Db.getLaborItemsCollection();
    const materialItemsCollection = Db.getMaterialItemsCollection();

    const userCountPromise = usersCollection.countDocuments();
    const pendingUserCountPromise = pendingUsersCollection.countDocuments();
    const accountCountPromise = accountsCollection.countDocuments();
    const laborOffersCountPromise = laborOffersCollection.countDocuments();
    const materialOffersCountPromise = materialOffersCollection.countDocuments();
    const laborItemsCountPromise = laborItemsCollection.countDocuments();
    const materialItemsCountPromise = materialItemsCollection.countDocuments();

    const [
        userCount, 
        pendingUserCount,
        accountCount,
        laborOffersCount,
        materialOffersCount,
        laborItemsCount,
        materialItemsCount,
    ] = await Promise.all([
        userCountPromise, 
        pendingUserCountPromise,
        accountCountPromise,
        laborOffersCountPromise,
        materialOffersCountPromise,
        laborItemsCountPromise,
        materialItemsCountPromise,
    ]);

    // const userCount = userCountPromise;

    
    // const userCount = await usersCollection.countDocuments();
    // const pendingUserCount = await pendingUsersCollection.countDocuments();
    // const accountCount = await accountsCollection.countDocuments();
    // const laborOffersCount = await laborOffersCollection.countDocuments();
    // const materialOffersCount = await materialOffersCollection.countDocuments();
    // const laborItemsCount = await laborItemsCollection.countDocuments();
    // const materialItemsCount = await materialItemsCollection.countDocuments();



    // const data = {
    //     users: userCount,
    //     pendingUsers: pendingUserCount,
    //     accounts: accountCount
    // }

    


    let data = {
        dashboard: [
            {
                title: "Pending Users",
                count: pendingUserCount,
                hasPending: pendingUserCount > 0
            },
            {
                title: "Users",
                count: userCount,
            },
            {
                title: "Accounts",
                count: accountCount
            },
            {
                title: "Labor Offers",
                count: laborOffersCount
            },
            {
                title: "Material Offers",
                count: materialOffersCount
            },
            {
                title: "Labor Catalog",
                count: laborItemsCount
            },
            {
                title: "Materials Catalog",
                count: materialItemsCount
            }
        ]
    }

    respondJsonData(res, data);
});

