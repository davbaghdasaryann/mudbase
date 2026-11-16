import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';

registerApiSession('shop/category_fetch_all', async (req, res, session) => {
    const col = Db.getShopCategoriesCollection();
    const categories = await col.find({}).sort({ displayIndex: 1 }).toArray();
    respondJsonData(res, categories);
});
