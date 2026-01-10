import * as F from 'tsui/Form';
import React from 'react';
import { ApiAccount, ApiLaborOffer, ApiMaterialOffer } from '../../api';
import { FormDataProvider } from '../../components/FormDataProvider';
import * as Api from 'api';
import { Dialog } from '@mui/material';
import ProgressIndicator from '../../tsui/ProgressIndicator';

interface Props {
    offerMongoId: string;
    offerType: 'labor' | 'material';
    offerItemName: string | null;
    onClose: () => void;
    onConfirm: () => void;

}

export function UserPageOfferEditDialog(props: Props) {
    const form = F.useUpdateForm();
    const [offerData, setOfferData] = React.useState<ApiLaborOffer | ApiMaterialOffer | null>(null);

    const [progIndicator, setProgIndicator] = React.useState(false);

    console.log('props.offerMongoId', props.offerMongoId)

    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        if (form.error)
            return
        if (!evt.data || Object.keys(evt.data).length === 0) { //TODO everywhere by this way
            props.onClose();
            return;
        }

        if (!evt.data.price && !evt.data.laborHours)
            return


        console.log('evt.data', evt.data)
        setProgIndicator(true);

        if (props.offerType === 'labor') {
            Api.requestSession<Api.ApiLaborOffer>({
                command: "labor/update_offer",
                args: {
                    laborOfferId: props.offerMongoId,
                    laborOfferPrice: evt.data.price,
                    laborOfferLaborHours: evt.data.laborHours, //🔴 TODO: this will need us in version 2 🔴
                    laborOfferAnonymous: false,
                    laborOfferPublic: true,
                    isActive: true,
                    laborOfferCurrency: 'AMD'
                }

            }).then((d) => {
                setProgIndicator(false);
                props.onConfirm();
                props.onClose();

            })

        } else if (props.offerType === 'material') {
            Api.requestSession<Api.ApiMaterialOffer>({
                command: "material/update_offer",
                args: {
                    materialOfferId: props.offerMongoId,
                    materialOfferPrice: evt.data.price,
                    // materialOfferMeasurementUnitMongoId: evt.data.measurementUnitMongoId,
                    materialOfferAnonymous: false,
                    materialOfferPublic: true,
                    isActive: true,
                    materialOfferCurrency: 'AMD'

                }

            }).then((d) => {
                setProgIndicator(false);
                props.onConfirm();
                props.onClose();

            })
        }


    }, [])

    // if (progIndicator === true) {
    //     return <Dialog onClose={props.onClose} open={progIndicator} slotProps={{
    //         paper: {
    //             sx: { width: 200, height: 200 }
    //         }
    //     }}
    //     >
    // return <ProgressIndicator show={progIndicator}/>
    //     </Dialog>
    // }

    return <FormDataProvider<ApiLaborOffer | ApiMaterialOffer> api={{ command: `${props.offerType}/get_offer`, args: { offerId: props.offerMongoId } }} onData={d => {
        console.log(d)
        setOfferData(d);
    }} form={form}>
        <F.PageFormDialog title={props.offerItemName ?? "Information"} form={form} size='sm' onSubmit={onSubmit} onClose={props.onClose}>

            <ProgressIndicator show={progIndicator} background='backdrop' />

            {props.offerType === 'material' && <F.InputText required label='Price' id='price' value={offerData?.price?.toString()} validate='positive-double-number' autocomplete='given-name' form={form} xsMax />}
            {/* {props.offerType === 'material' && <F.InputText label='Normative Expand' id='normative_expand' value={(offerData as ApiMaterialOffer)?.measurementUnitMongoId.toString()} validate='off' autocomplete='family-name' form={form} xsHalf />} */}

            {/* //🔴 TODO: this will need us in version 2 🔴  */}
            {props.offerType === 'labor' && <F.InputText required label='Work per hour' id='laborHours' value={(offerData as ApiLaborOffer)?.laborHours?.toString()} validate='double-number' autocomplete='family-name' form={form} xsHalf />}

            {props.offerType === 'labor' && <F.InputText required label='Price' id='price' value={offerData?.price?.toString()} validate='positive-double-number' autocomplete='given-name' form={form} xsHalf />}



        </F.PageFormDialog>


    </FormDataProvider>

}

