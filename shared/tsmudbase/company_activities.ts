
interface AccountActivityData {
    id: string;
    name: string;
    label: string;
}

// export type AccountActivity = 'A' | 'F' | 'V' | 'B' | 'D';
export type AccountActivity = 'A' | 'F' | 'C' | 'I' | 'V' | 'B' | 'D';
export const allFinancialIds = ['F', 'C', 'I'];

export const accountActivities: AccountActivityData[] = [
    {
        id: 'F',
        // name: 'Financial',
        // label: 'Financial',
        name: 'Bank',
        label: 'Bank',
    },
    {
        id: 'C',
        name: 'Credit',
        label: 'Credit',
    },
    {
        id: 'I',
        name: 'Insurance',
        label: 'Insurance',
    },
    {
        id: 'A',
        name: 'Architect',
        label: 'Architect',
    },
    {
        id: 'V',
        name: 'Vendor',
        label: 'Vendor',
    },
    {
        id: 'B',
        name: 'Builder',
        label: 'Builder',
    },
    {
        id: 'D',
        name: 'Developer',
        label: 'Developer',
    },
];

export function getAccountNameById(id: string | undefined | null): string {
    if (!id) return '';
    const account = accountActivities.find((account) => account.id === id);
    return account ? account.name : '';
}
