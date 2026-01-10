'use client';

import React from 'react';

import * as Api from '@/api';
import * as F from '@/tsui/Form';
import {useApiFetchOne} from '@/components/ApiDataFetch';
import {useTranslation} from 'react-i18next';

interface Props {
    changableItemCurrentName: string;
    itemType: 'labor' | 'material';
    itemId: string;
    onClose: () => void;
}

export default function EstimatedItemPresentViewDialog(props: Props) {
    const [t] = useTranslation();
    const form = F.useForm({type: 'displayonly'});

    const apiData = useApiFetchOne<Api.ApiEstimateItemPresentView>({
        api: {
            command: props.itemType === 'labor' ? 'estimate/get_labor_item_for_view' : 'estimate/get_material_item_for_view',
            args: {estimatedItemId: props.itemId},
        },
    });

    const item = apiData.data;

    return (
        <F.PageFormDialog type='panel' title={props.changableItemCurrentName ?? t('Information')} form={form} size='md' onClose={props.onClose}>
            <F.InputText id='name' label={t('Item name')} value={item?.name} xsMax />
            <F.InputText id='averagePrice' label={t('Average price')} value={`${item?.averagePrice ? item?.averagePrice.toFixed(0) : '0'} AMD`} xsMax />
        </F.PageFormDialog>
    );
}
