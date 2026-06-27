import * as Db from '../../db';
import { registerApiSession } from '@src/server/register';
import { respondJsonData } from '@tsback/req/req_response';
import { Permissions } from '@src/tsmudbase/permissions_setup';

registerApiSession('dashboard/fetch_offers_trend', async (req, res, session) => {
    session.assertPermission(Permissions.DashboardUse);

    const laborColl = Db.getLaborOffersCollection();
    const materialColl = Db.getMaterialOffersCollection();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const dailyNewAgg = (coll: any) => coll.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
    ]).toArray();

    const [laborDailyNew, materialDailyNew, laborTotal, materialTotal] = await Promise.all([
        dailyNewAgg(laborColl),
        dailyNewAgg(materialColl),
        laborColl.countDocuments(),
        materialColl.countDocuments(),
    ]);

    // Build ordered list of the last 30 days
    const days: string[] = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        days.push(d.toISOString().slice(0, 10));
    }

    const buildCumulative = (dailyRows: any[], currentTotal: number) => {
        const dailyMap: Record<string, number> = Object.fromEntries(dailyRows.map((r: any) => [r._id, r.count]));
        const totalNew = Object.values(dailyMap).reduce((a: number, b: number) => a + b, 0);
        const beforeWindow = currentTotal - totalNew;
        let running = beforeWindow;
        return days.map(day => {
            running += (dailyMap[day] ?? 0);
            return { day, value: running, timestamp: day + 'T12:00:00.000Z' };
        });
    };

    respondJsonData(res, {
        labor:    buildCumulative(laborDailyNew,    laborTotal),
        material: buildCumulative(materialDailyNew, materialTotal),
    });
});
