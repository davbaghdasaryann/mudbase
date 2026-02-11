import { ApiEstimate } from '@/api';
import { roundNumber } from '@/tslib/parse';


export class EstimatesDisplayData {
    _id!: string;
    estimateNumber!: string;
    name!: string;
    totalCost!: number;
    createdAt!: Date;
    totalCostWithOtherExpenses!: number;
    accountId?: string;
    companyName?: string;

    constructor(est?: ApiEstimate) {
        if (!est)
            return;

        this._id = est._id
        this.estimateNumber = est.estimateNumber
        this.name = est.name
        this.totalCost = roundNumber(est.totalCost ?? 0)
        this.createdAt = est.createdAt
        this.totalCostWithOtherExpenses = roundNumber(est.totalCostWithOtherExpenses ?? 0);
        this.accountId = est.accountId;
        this.companyName = (est as any).companyName;
    }
}