import React from 'react';

import * as F from 'tsui/Form';
import { FormDataProvider } from '../FormDataProvider';
import * as Api from 'api';
import { useTranslation } from 'react-i18next';
import { fixedToThree } from '../../tslib/parse';

interface Props {
    estimatedLaborId: string;
    estimatedLaborName: string;
    onClose: () => void;
    onConfirm: () => void;

}

export function EstimateLaborEditDialog(props: Props) {
    const form = F.useUpdateForm();
    const [t] = useTranslation()

    const [estimatedLaborItemData, setEstimatedLaborItemData] = React.useState<Api.ApiEstimateLaborItem | null>(null);

    // console.log('props.offerItemName', props.offerItemName)
    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {

        if (form.error)
            return

        if (!evt.data || Object.keys(evt.data).length === 0) { //TODO everywhere by this way
            props.onClose();
            return;
        }

        const isChangedChangableAveragePrice =
        evt?.fields?.changableAveragePrice?.valueChanged ??
        Object.prototype.hasOwnProperty.call(evt.data, 'changableAveragePrice');

        console.log('isChangedChangableAveragePrice', evt)

        Api.requestSession<Api.ApiEstimateLaborItem>({
            command: `estimate/update_labor_item`,
            args: { estimatedLaborId: props.estimatedLaborId, isChangedChangableAveragePrice: isChangedChangableAveragePrice },
            json: evt.data
        })
            .then(response => {

                props.onConfirm();
                // props.onClose();
            })
    }, [])

    // if (!estimatedLaborItemData) {
    //     return <Dialog onClose={props.onClose} open={progIndicator} slotProps={{
    //         paper: {
    //             sx: { width: 200, height: 200 }
    //         }
    //     }}
    //     >
    //         <ProgressIndicator />
    //     </Dialog>
    // }


    return <FormDataProvider<Api.ApiEstimateLaborItem> api={{ command: `estimate/get_labor_item`, args: { estimatedLaborId: props.estimatedLaborId } }} onData={d => { //TODO: Requested code
        console.log('response', d)
        setEstimatedLaborItemData(d);
        // setOfferData(d);
    }} form={form}>

        <F.PageFormDialog title={`${t('Edit Labor:')} ${props.estimatedLaborName}`} form={form} size='md' onSubmit={onSubmit} onClose={props.onClose}>

            <F.InputText label={t('Labor')} id='laborOfferItemName' value={estimatedLaborItemData?.laborOfferItemName} validate='off' autocomplete='given-name' xsMax />
            {/* //🔴 TODO: this will need us in version 2 🔴 <F.InputText label='Labor(Hours)' id='laborHours' value={estimatedLaborItemData?.laborHours.toString()} validate='off' form={form} xsThird /> */}
            <F.InputText label='Labor(Hours)' id='laborHours' value={estimatedLaborItemData?.laborHours.toString()} validate='off' xsThird />
            <F.InputText isThousandsSeparator label={t('Quantity')} id='quantity' value={fixedToThree(estimatedLaborItemData?.quantity)} validate='double-number' xsThird />
            <F.InputText isThousandsSeparator label={t('Average Price')} id='changableAveragePrice' value={fixedToThree(estimatedLaborItemData?.changableAveragePrice ?? 0)} validate='positive-integer' xsThird />


        </F.PageFormDialog>


    </FormDataProvider>

}

