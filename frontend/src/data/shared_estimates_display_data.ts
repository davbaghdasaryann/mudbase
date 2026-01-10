import * as EstimatesSharesApi from '@/api/estimates_shares';
import {ApiAccount, ApiEstimate} from '@/api';
import {roundNumber, roundToThree} from '@/tslib/parse';

export class SharedEstimatesDisplayData {
    _id: string;

    sharedAt!: Date;

    estimateNumber: string = '';
    name: string = '';
    totalCost: number = 0;
    totalCostWithOtherExpenses: number = 0;

    createdAt!: Date;
    sharedEstimateId!: string;

    sharedByAccountName!: string;

    sharedWithAccountName!: string;

    theSameEstNumAveragePrice: number = 0;

    isOnlyEstimateInfo?: boolean;

    children?: SharedEstimatesDisplayData[];

    constructor(est: EstimatesSharesApi.ApiEstimatesShares) {
        // if (!est)
        //     return;

        this._id = est._id;
        this.sharedAt = est.sharedAt;
        this.theSameEstNumAveragePrice = roundToThree(est.theSameEstNumAveragePrice ?? 0);
        // if (est.isOnlyEstimateInfo)
        this.isOnlyEstimateInfo = est.isOnlyEstimateInfo;

        if (est.estimatesData) {
            let estimate = est.estimatesData as ApiEstimate;
            this.sharedEstimateId = estimate._id;
            this.estimateNumber = estimate.estimateNumber;
            this.name = estimate.name;
            this.totalCost = roundNumber(estimate.totalCost ?? 0);
            this.totalCostWithOtherExpenses = roundNumber(estimate.totalCostWithOtherExpenses ?? 0);
            this.createdAt = estimate.createdAt;
        }

        if (est.sharedByAccountData) {
            let sharedByAccount = est.sharedByAccountData as ApiAccount;
            this.sharedByAccountName = sharedByAccount.companyName;
        }

        if (est.sharedWithAccountData) {
            let sharedWithAccount = est.sharedWithAccountData as ApiAccount;
            this.sharedWithAccountName = sharedWithAccount.companyName;
        }
    }

    childrenAverageTotalCost(): number {
        if (!this.children || this.children.length === 0) return 0;

        const sum = this.children.reduce((acc, child) => acc + (child.totalCost ?? 0), 0);
        return roundNumber(sum / this.children.length);
    }    

    childrenAverageTotalCostWithOtherExpenses(): number {
        if (!this.children || this.children.length === 0) return 0;

        const sum = this.children.reduce((acc, child) => acc + (child.totalCostWithOtherExpenses ?? 0), 0);
        return roundNumber(sum / this.children.length);
    }    
}

export class MultiSharedEstimatesDisplayData {
    _id!: string;
    estimateNumber!: string;
    name!: string;
    totalCost!: number;
    createdAt!: Date;
    totalCostWithOtherExpenses!: number;

    companyName?: string;

    constructor(est?: ApiEstimate) {
        if (!est) return;

        this._id = est._id;
        this.estimateNumber = est.estimateNumber;
        this.name = est.name;
        this.totalCost = roundNumber(est.totalCost ?? 0);
        this.totalCostWithOtherExpenses = roundNumber(est.totalCostWithOtherExpenses ?? 0);
        this.createdAt = est.createdAt;

        if (est.multiSharedAccountData && est.multiSharedAccountData.length > 0) {
            let multiSharedAccount = est.multiSharedAccountData[0] as ApiAccount;
            this.companyName = multiSharedAccount.companyName;
        }
    }
}
