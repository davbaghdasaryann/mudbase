'use client';

import * as React from 'react';
import {useRef, useState} from 'react';
import {RadioGroup, FormControlLabel, Radio} from '@mui/material';
import {useTranslation} from 'react-i18next';

import * as F from '@/tsui/Form';
import * as Api from '@/api';
import * as GD from '@/data/global_dispatch';

import ProgressIndicator from '@/tsui/ProgressIndicator';

interface CategoryButtonPopupProps {
    onClose: () => void;
    estimateSubsectionId?: string | null;
    estimateSectionId?: string | null; //This we use when there is not subsection only section and labors
    estimateOfferId?: string | null; //it is null when catalog type is Labor and user can't see companies that made offers
    estimateItemId: string;
    estimateOfferItemType: 'labor' | 'material';

    offerItemNameForEstimation?: string;

    averagePrice: number | null;

    estimatedLaborId?: string | null;
    offerItemMeasurementUnitMongoId: string;

    currentMaterialOfferPrice?: number | null;

    laborHours?: number; //this for labor estimation //🔴 TODO: this will need us in version 2 🔴

    onConfirm: () => void;
}

export default function EstimateAddItemFromOffersDialog(props: CategoryButtonPopupProps) {
    const [t] = useTranslation();
    const form = F.useForm({
        type: 'input',
    });

    const [selectedValue, setSelectedValue] = useState(props.currentMaterialOfferPrice ? 'currentPrice' : 'averagePrice');
    const selectedValueRef = useRef<'currentPrice' | 'averagePrice'>(props.currentMaterialOfferPrice ? 'currentPrice' : 'averagePrice');

    const handleRadioChange = (event) => {
        setSelectedValue(event.target.value);
        selectedValueRef.current = event.target.value;
    };

    const [progIndic, setProgIndic] = useState(false);

    // console.log('props.currentMaterialOfferPrice', props.currentMaterialOfferPrice)
    // console.log('props.estimateSubsectionId: ', props.estimateSubsectionId, ' props.estimateSectionId: ', props.estimateSectionId)

    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        // console.log('evt.data', evt.data)
        if (form.error) return;

        if (!evt.data || Object.keys(evt.data).length === 0) {
            //TODO everywhere by this way
            props.onClose();
            return;
        }

        if (props.estimateOfferItemType === 'labor' && evt.data.quantity === '') {
            evt.data.quantity = '0';
        }
        if (props.estimateOfferItemType === 'material' && evt.data.materialConsumptionNorm === '') {
            evt.data.materialConsumptionNorm = '0';
        }

        if (props.estimateOfferItemType === 'labor') {
            // console.log('props', props)
            try {
                await Api.requestSession<any>({
                    //TODO change any to interface
                    command: 'estimate/add_labor_item',
                    args: {
                        estimateSubsectionId: props.estimateSubsectionId,
                        estimateSectionId: props.estimateSectionId,
                        laborItemQuantity: evt.data.quantity,
                        laborItemMeasurementUnitMongoId: props.offerItemMeasurementUnitMongoId,
                        laborItemId: props.estimateItemId,
                        laborOfferId: props.estimateOfferId,
                        laborOffersAveragePrice: props.averagePrice,
                        laborOfferItemName: props.offerItemNameForEstimation,
                        laborOfferItemLaborHours: props.laborHours, //🔴 TODO: this will need us in version 2 🔴
                    }, //TODO: remove this _id hardCode
                });
                // dlkjdf
                props.onConfirm();
            } finally {
                setProgIndic(false);
                props.onClose();
            }
            // }).catch();
        } else if (props.estimateOfferItemType === 'material') {
            setProgIndic(true);
            console.log('props.averagePrice material:', props.averagePrice);
            try {
                await Api.requestSession<any>({
                    //TODO change any to interface
                    command: 'estimate/add_material_item',
                    args: {
                        estimateSubsectionId: props.estimateSubsectionId ?? '',
                        // materialItemQuantity: evt.data.quantity,
                        materialConsumptionNorm: evt.data.materialConsumptionNorm,
                        materialItemMeasurementUnitMongoId: props.offerItemMeasurementUnitMongoId,
                        materialItemId: props.estimateItemId,
                        materialOfferId: props.estimateOfferId,
                        estimatedLaborId: props.estimatedLaborId,
                        materialOffersAveragePrice: selectedValueRef.current === 'currentPrice' ? props.currentMaterialOfferPrice : props.averagePrice,
                        materialOfferItemName: props.offerItemNameForEstimation,
                    }, //TODO: remove this _id hardCode
                });
                props.onConfirm();
            } finally {
                setProgIndic(false);
                props.onClose();
                GD.pubsub_.dispatch(GD.estimateDataChangeId);
            }
        }
    }, []);

    if (progIndic) {
        return <ProgressIndicator show={progIndic} background='backdrop' />;
    }

    // console.log('props', props)
    if (props.estimateOfferItemType === 'material') {
        if (props.currentMaterialOfferPrice) {
            return (
                <F.PageFormDialog ignoreDataChecking={true} title={t('Add Material')} form={form} size='md' onSubmit={onSubmit} onClose={props.onClose}>
                    <RadioGroup value={selectedValue} onChange={handleRadioChange} row sx={{mx: 'auto', p: 1}}>
                        <FormControlLabel
                            value='currentPrice'
                            control={<Radio />}
                            label={`${t('Current Price')}: ${props.currentMaterialOfferPrice.toString()} AMD`}
                            sx={{mr: 5}}
                        />
                        <FormControlLabel value='averagePrice' control={<Radio />} label={`${t('Average Price')}: ${props.averagePrice} AMD`} />
                    </RadioGroup>
                    <F.InputText
                        xsMax
                        id='materialConsumptionNorm'
                        label='Enter Material consumption norm'
                        placeholder='Material consumption norm'
                        validate='double-number'
                    />
                </F.PageFormDialog>
            );
        } else {
            return (
                <F.PageFormDialog ignoreDataChecking={true} title='Add Material' form={form} size='sm' onSubmit={onSubmit} onClose={props.onClose}>
                    <F.InputText
                        xsMax
                        id='materialConsumptionNorm'
                        label='Enter Material consumption norm'
                        placeholder='Material consumption norm'
                        validate='double-number'
                    />
                </F.PageFormDialog>
            );
        }
    }

    return (
        <F.PageFormDialog ignoreDataChecking={true} title={'Add Labor'} form={form} size='sm' onSubmit={onSubmit} onClose={props.onClose}>
            <F.InputText xsMax id='quantity' label='Enter quantity' placeholder='Quantity' validate='double-number' />
        </F.PageFormDialog>
    );
}
