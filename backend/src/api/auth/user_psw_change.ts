import { registerHandlerSession } from '../../server/register';
import { respondJsonError } from '../../tsback/req/req_response';

registerHandlerSession('auth', 'change_password', async (req, res, session) => {
    respondJsonError(res, "not implemented, there is a function on profile/change_password");
});
