import { AccountActivity } from "../tsmudbase/company_activities";

export interface ApiAccount {
    _id: string;
    companyNumber: string;
    companyName: string;
    companyTin: string;

    email?: string;

    companyPhone?: string;

    lawAddress: string;
    
    address: string;
    phoneNumber: string;
    accountActivity: AccountActivity[];
    establishedAt?: string;
    website?: string;
    director?: string;
    companyInfo?: string; 

    accountStatus: string;
    accountDescription: string;

    // accountNumber: string;

    companyLogo?: string;
};


export function makeCompanyLogoUrl(account: ApiAccount | undefined): string | undefined {
    if (!account?.companyLogo) return undefined;
    return `/api/static/accounts/${account._id}/${account.companyLogo}`;
}
