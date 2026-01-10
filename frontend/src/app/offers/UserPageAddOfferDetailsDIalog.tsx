import { Button } from "@mui/material";
import React from "react";
import PageDialog from "../../tsui/PageDialog";
import * as F from 'tsui/Form';
import * as Api from 'api';
import * as OffersApi from 'api/offer'
import { MeasurementUnitDisplayData, MeasurementUnitSelectItem } from "../../data/measurement_unti_display_data";
import { SelectProps } from "tsui/Form";
import { LaborItemDisplayData } from "../../data/labor_display_data";
import { MaterialItemDisplayData } from "../../data/material_display_data";
import { useTranslation } from "react-i18next";


interface Props {
    onClose: () => void;
    onConfirm: () => void;
    offerItemMongoId: string;
    catalogType: 'labor' | 'material'
}


export default function UserPageAddOfferDetailsDialog(props: Props) {
    // const form = F.useUpdateForm();
    const form = F.useForm({ type: 'input' });

    const mounted = React.useRef(false);
    const [dataRequested, setDataRequested] = React.useState(false);
    const [offerItemData, setOfferItemData] = React.useState<LaborItemDisplayData | MaterialItemDisplayData | null>(null);
    const offerItemDataRef = React.useRef<LaborItemDisplayData | MaterialItemDisplayData | null>(null);
    const [t] = useTranslation()
    // const measurementUnitListSelect = React.useRef<MeasurementUnitSelectItem[] | null>(null);


    React.useEffect(() => {
        // setProgIndic(true)

        mounted.current = true;
        if (!dataRequested) {
            if (props.catalogType === 'labor') {
                Api.requestSession<Api.ApiLaborItems>({
                    command: 'labor/get_item',
                    args: { laborItemMongoId: props.offerItemMongoId }
                })
                    .then(currentLaborResData => {
                        if (mounted.current) {
                            console.log('currentLaborResData', currentLaborResData)

                            let currentLaborData: LaborItemDisplayData;

                            currentLaborData = new LaborItemDisplayData(currentLaborResData);
                            offerItemDataRef.current = currentLaborData;

                            setOfferItemData(currentLaborData);

                        }
                        // setProgIndic(false)

                    })
            } else if (props.catalogType === 'material') {
                Api.requestSession<Api.ApiMaterialItems>({
                    command: 'material/get_item',
                    args: { materialItemMongoId: props.offerItemMongoId }
                })
                    .then(currentLaborResData => {
                        if (mounted.current) {
                            console.log('currentLaborResData', currentLaborResData)

                            let currentLaborData: LaborItemDisplayData;

                            currentLaborData = new LaborItemDisplayData(currentLaborResData);
                            offerItemDataRef.current = currentLaborData;

                            setOfferItemData(currentLaborData);

                        }
                        // setProgIndic(false)

                    })
            }

            setDataRequested(true);
            return;
        }
        return () => { mounted.current = false }
    }, [dataRequested]);




    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        if (form.error)
            return

        if (!offerItemDataRef.current)
            return
        if (!evt.data || Object.keys(evt.data).length === 0) { //TODO everywhere by this way
            props.onClose();
            return;
        }


        console.log('evt.data', evt.data)

        if (props.catalogType === 'labor') {
            await Api.requestSession<OffersApi.ApiLaborOffer>({
                command: `labor/add_offer`,
                //🔴 TODO: this will need us in version 2 🔴
                args: { laborItemId: props.offerItemMongoId, laborOfferMeasurementUnitMongoId: offerItemDataRef.current.measurementUnitMongoId, laborOfferLaborHours: evt.data.laborHours, laborOfferPrice: evt.data.price, laborOfferCurrency: evt.data.currency, laborOfferAnonymous: false, laborOfferPublic: true, isActive: true, }
                // args: { laborItemId: props.offerItemMongoId, laborOfferMeasurementUnitMongoId: offerItemDataRef.current.measurementUnitMongoId, laborOfferPrice: evt.data.price, laborOfferCurrency: evt.data.currency, laborOfferAnonymous: false, laborOfferPublic: true, isActive: true, }
            })
            props.onConfirm();
            props.onClose();
        } else if (props.catalogType === 'material') {
            await Api.requestSession<OffersApi.ApiMaterialOffer>({
                command: `material/add_offer`,
                args: {
                    materialItemId: props.offerItemMongoId, materialOfferPrice: evt.data.price, materialOfferCurrency: evt.data.currency, materialOfferMeasurementUnitMongoId: offerItemDataRef.current.measurementUnitMongoId, materialOfferAnonymous: false, materialOfferPublic: true, isActive: true,
                }
            })
            props.onConfirm();
            props.onClose();
        }



    }, []);

    if (!offerItemData) {
        return <F.PageFormDialog title='Add Offer Details' form={form} size='md' onSubmit={onSubmit} onClose={props.onClose}>

        </F.PageFormDialog>
    }

    if (props.catalogType === 'labor') {

        return <F.PageFormDialog title={t('Add Labor Offer Details')} form={form} size='md' onSubmit={onSubmit} onClose={props.onClose}>

            {/* 🔴 TODO: this will need us in version 2 🔴 */}
            <F.InputText maxLength={50} label='Work per hour' id='laborHours' required form={form} xsHalf />

            <F.InputText maxLength={50} value={offerItemData.measurementUnitName} readonly label='Measurement Unit' id='measurementUnitName' required form={form} xsHalf />

            <F.InputText maxLength={50} label='Price' id='price' required form={form} xsHalf validate='positive-double-number' />
            <F.InputText maxLength={50} value='AMD' readonly label='Currency' id='currency' required form={form} xsHalf />

        </F.PageFormDialog>
    }

    return <F.PageFormDialog title={t('Add Material Offer Details')} form={form} size='md' onSubmit={onSubmit} onClose={props.onClose}>
        {/* <F.SelectField form={form} xsThird id="measurementUnitMongoId" items={measurementUnitList} label={'Measurement Unit'} /> */}
        <F.InputText maxLength={50} value={offerItemData.measurementUnitName} readonly label='Measurement Unit' id='measurementUnitName' required form={form} xsThird />
        <F.InputText maxLength={50} label='Price' id='price' required form={form} xsThird validate='positive-double-number' />
        <F.InputText maxLength={50} value='AMD' readonly label='Currency' id='currency' required form={form} xsThird />

    </F.PageFormDialog>
}
