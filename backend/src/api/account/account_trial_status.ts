import { registerApiSession } from '@src/server/register';
import * as Db from '@/db';
import { respondJsonData } from '@tsback/req/req_response';

registerApiSession('account/trial_status', async (req, res, session) => {
    const accounts = Db.getAccountsCollection();
    const account = await accounts.findOne({ _id: session.mongoAccountId });

    if (!account?.trialEndDate) {
        return respondJsonData(res, { isTrial: false });
    }

    const now = new Date();
    const trialEndDate = new Date(account.trialEndDate);
    const isTrialActive = trialEndDate > now;
    const msLeft = trialEndDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

    return respondJsonData(res, {
        isTrial: true,
        isTrialActive,
        trialEndDate,
        daysLeft: isTrialActive ? daysLeft : 0,
    });
});
