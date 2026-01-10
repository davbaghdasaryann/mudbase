import {cognitoChangePassword} from '../../tsback/aws/aws_cognito';
import { requireQueryParam } from '../../tsback/req/req_params';
import { registerHandlerSession } from '../../server/register';
import { respondJsonData, respondJsonError } from '../../tsback/req/req_response';

registerHandlerSession('auth', 'change_password', async (req, res, session) => {
    respondJsonError(res, "not implemented, there is a function on profile/change_password");
    // let previousPassword = requireQueryParam(req, 'current');
    // let newPassword = requireQueryParam(req, 'new');

    // let result = await cognitoChangePassword(
    //     config_.aws,
    //     previousPassword,
    //     newPassword,
    //     session.token
    // );

    // respondJsonData(res, result);
});
