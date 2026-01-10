import React, { useCallback } from 'react';

import * as F from '@/tsui/Form';
import { FormDataProvider } from '../FormDataProvider';
import * as Api from 'api';
import ProgressIndicator from '../../tsui/ProgressIndicator';
import { t } from 'i18next';
import { fixedToThree } from '../../tslib/parse';

interface Props {
    estimatedMaterialId: string;
    estimatedMaterialName: string;
    estimatedLaborId: string;
    onClose: () => void;
    onConfirm: () => void;

}

export function EstimateMaterialEditDialog(props: Props) {
    const form = F.useUpdateForm();

    const [estimatedMaterialItemData, setEstimatedMaterialItemData] = React.useState<Api.ApiEstimateMaterialItem | null>(null);

    const [progIndicator, setProgIndicator] = React.useState(false);

    const onSubmit = useCallback(async (evt: F.InputFormEvent) => {

        if (form.error)
            return

        if (!evt.data || Object.keys(evt.data).length === 0) { //TODO everywhere by this way
            props.onClose()
            return;
        }




        setProgIndicator(true);

        Api.requestSession<Api.ApiEstimateMaterialItem>({
            command: `estimate/update_material_item`,
            args: { estimatedMaterialId: props.estimatedMaterialId, estimatedLaborId: props.estimatedLaborId },
            json: evt.data
        })
            .then(response => {

                props.onConfirm();
                setProgIndicator(false);
                props.onClose();
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

    // if (progIndicator) {
    //     // return <Dialog onClose={props.onClose} open={progIndicator} slotProps={{
    //     //     paper: {
    //     //         sx: { width: 200, height: 200 }
    //     //     }
    //     // }}
    //     // >
    //         return <ProgressIndicator show={progIndicator} background='backdrop'/>
    //     // </Dialog>
    // }

    return <FormDataProvider<Api.ApiEstimateMaterialItem> api={{ command: `estimate/get_material_item`, args: { estimatedMaterialId: props.estimatedMaterialId } }} onData={d => { //TODO: Requested code
        console.log('response', d)
        setEstimatedMaterialItemData(d);
        // setOfferData(d);
    }} form={form}>

        <F.PageFormDialog title={`${t('Edit Material:')} ${props.estimatedMaterialName}`} form={form} size='md' onSubmit={onSubmit} onClose={props.onClose}>

            <ProgressIndicator show={progIndicator} background='backdrop' />

            <F.InputText label={t('Material')} id='materialOfferItemName' value={estimatedMaterialItemData?.materialOfferItemName} validate='off' autocomplete='given-name' xsMax />
            {/* <F.InputText label={t('Quantity')} id='quantity' value={estimatedMaterialItemData?.quantity.toString()} validate='positive-number' form={form} xsThird /> */}
            <F.InputText label={t('Material consumption norm')} id='materialConsumptionNorm' value={fixedToThree(estimatedMaterialItemData?.materialConsumptionNorm)} validate='double-number' xsHalf />
            <F.InputText isThousandsSeparator label={t('Price')} id='changableAveragePrice' value={fixedToThree(estimatedMaterialItemData?.changableAveragePrice ?? 0)} validate='positive-integer' xsHalf />
            {/* <F.InputText label='Labor(Hours)' id='laborHours' value={estimatedMaterialItemData?.laborHours.toString()} validate='off' form={form} xsThird /> */}


        </F.PageFormDialog>


    </FormDataProvider>

}

