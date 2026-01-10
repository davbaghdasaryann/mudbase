import { ResponseError, ResponseErrorContainer } from "./req_error";

export function handleReqException(e: unknown): ResponseErrorContainer {
    let resp = new ResponseErrorContainer;

    //if ((e as AWS.AWSError).retryable) {
    //     let aws = e as AWS.AWSError;
    //     log_.error("catch().AWS.AWSError:", aws);
    //     resp.error = new ResponseError(aws.code, aws.message);
    // } else 

    //ServiceException

    // if (e instanceof CognitoIdentityProviderServiceException) {
    //     // console.log("expired code exception");
    //     // log_.error(e);
    //     resp.error = new ResponseError(e.name, e.message);
    //     return resp;
    // } 
    
    if (e instanceof ResponseErrorContainer) {
        log_.error("catch().Error Container", e);
        resp = e;
        return resp;
    } 
    
    if ((e as NodeJS.ErrnoException).code) {
        let err = e as NodeJS.ErrnoException;
        log_.error(err.message);
        //log_.error("catch().ErrnoException:", err);
        resp.error = new ResponseError(err.code, err.code);
        return resp;
    } 
    
    if (e instanceof Error) {
        log_.error(e);
        resp.error = new ResponseError(e.name, e.message);
        return resp;
    } 
    
    log_.error("catch().Unhandled Exception", e);
    resp.error = new ResponseError("unknown", "Unhandled Exception!");

    return resp;
}
