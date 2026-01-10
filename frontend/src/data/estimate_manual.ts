interface estimateOtherExpensesItemsInterface {
    id: string;
    label: string;
}

export const estimateOtherExpensesItems: estimateOtherExpensesItemsInterface[] = [

    {
        id: 'unforeseenWorks',
        label: 'Unforeseen works',
    },
    {
        id: 'climaticImpactCosts',
        label: 'Climatic impact costs',
    },
    {
        id: 'temporaryStructures',
        label: 'Temporary structures',
    },
    {
        id: 'operationHandoverCosts',
        label: 'Operation handover costs',
    },
    {
        id: 'stateDutiesAndFees',
        label: 'State duties and fees',
    },
    {
        id: 'valueAddedTax',
        label: 'Value-added tax',
    },
    {
        id: 'turnoverTax',
        label: 'Turnover tax',
    },
    {
        id: 'overheadCosts',
        label: 'Overhead costs',
    },
    {
        id: 'profit',
        label: 'Profit',
    },
    {
        id: 'transportationCosts',
        label: 'Transportation costs',
    },
    {
        id: 'smallScaleConstructionWork',
        label: 'Small-scale construction work',
    },
    {
        id: 'smallScaleConstructionMaterials',
        label: 'Small-scale construction materials',
    },

];


export function getEstimateOtherExpenseName(id: string): string {
    const item = estimateOtherExpensesItems.find(expense => expense.id === id);
    return item ? item.label : '';
}