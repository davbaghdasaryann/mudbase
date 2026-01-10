import {damm} from '../tslib/cdigit';
import {genStateIntValue} from '../tsback/mongodb/mongodb_state';
import {encodeBase32} from '../tslib/base32';

export async function generateNewEstimateId(): Promise<string> {
    let currentBase = await genStateIntValue('nextEstimateIdBase');

    let estimateId = damm.generate(currentBase.toString());

    return estimateId;
}

export async function generateNewUserId(): Promise<string> {
    let currentBase = await genStateIntValue('nextUserIdBase');

    let userId = damm.generate(currentBase.toString());

    return userId;
}

export async function generateNewOrderId(): Promise<string> {
    let currentBase = await genStateIntValue('nextOrderIdBase');

    let userId = damm.generate(currentBase.toString());

    return userId;
}

export async function generateNewPaymentId(): Promise<string> {
    let currentBase = await genStateIntValue('nextPaymentIdBase');

    let paymentId = damm.generate(currentBase.toString());

    return paymentId;
}

export async function generateNewCardId(): Promise<string> {
    let currentBase = await genStateIntValue('nextCardIdBase');
    // console.log('currentBase', currentBase)
    let cardRandomId = damm.generate(currentBase.toString());
    let cardId = encodeBase32(parseInt(cardRandomId));

    return cardId;
}

export async function generateNewAccountId(): Promise<string> {
    let currentBase = await genStateIntValue('nextAccountIdBase');

    let userId = damm.generate(currentBase.toString());

    return userId;
}

export async function generateNewMessageId(): Promise<string> {
    let currentBase = await genStateIntValue('nextMessageIdBase');

    let userId = damm.generate(currentBase.toString());

    return userId;
}
