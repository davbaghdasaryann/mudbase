"use client";

import React from "react";

import { Accordion, AccordionDetails, AccordionSummary, TextField, Typography } from "@mui/material";

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';


import * as F from '@/tsui/Form';
import { InputFormField } from "@/tsui/Form/FormElements/FormFieldContext";
import * as Api from 'api';
import { useTranslation } from "react-i18next";
import { fixedNumber } from "@/tslib/parse";

interface Props {
    estimateId: string;
}

// // const [t] = useTranslation()

// const constrData = [  //ConstructionType, BuildingType
//     {
//         id: 'currentRenovation',
//         label: 'Current Renovation'
//     },
//     {
//         id: 'renovation',
//         label: 'Renovation'
//     },
//     {
//         id: 'majorRepairs',
//         label: 'Major repairs'
//     },
//     {
//         id: 'reconstruction',
//         label: 'Reconstruction'
//     },
//     {
//         id: 'reinforcement',
//         label: 'Reinforcement'
//     },
//     {
//         id: 'restorationWork',
//         label: 'Restoration Work'
//     },
//     {
//         id: 'construction',
//         label: 'Construction'
//     },
// ];

export default function EstimateInfoOnlyForViewAccardionContent(props: Props) {
    const form = F.useForm({
        // type: 'input',
        type: 'readonly',
    });

    const mounted = React.useRef(false);
    const [dataRequested, setDataRequested] = React.useState(false);
    const [progIndic, setProgIndic] = React.useState(false)
    const [data, setData] = React.useState<any | null>(null); //TODO change any to interface
    const [t] = useTranslation()


    React.useEffect(() => {
        setProgIndic(true)

        mounted.current = true;
        if (!dataRequested) {

            Api.requestSession<any>({ //TODO change any to interface
                command: 'estimate/get',
                args: { estimateId: props.estimateId }
            })
                .then(myEstimatesList => {
                    if (mounted.current) {
                        console.log(myEstimatesList)
                        setData(myEstimatesList)
                    }
                    setProgIndic(false)

                })

            setDataRequested(true);
            return;
        }
        return () => { mounted.current = false }
    }, [dataRequested]);


    const handleChange = async (e: InputFormField) => {
        const getFieldKey = e.id;
        const getFieldValue = e.value;
        if (getFieldKey && getFieldValue) {
            let myEstimatesList = await Api.requestSession<any>({ //TODO change any to interface
                command: 'estimate/rename',
                args: {
                    estimateId: props.estimateId,
                    fieldKey: getFieldKey,
                    fieldValue: getFieldValue,
                } //TODO: remove this _id hardCode
            })
            setData(myEstimatesList)
            setDataRequested(false);
            setProgIndic(false)
        }
    };



    return <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography >{t('Information')}</Typography>
        </AccordionSummary>
        <AccordionDetails>
            <F.PageForm form={form} size='xl' onFieldUpdate={handleChange} >
                <F.InputText xsHalf id='name' value={data?.name} label={t('Title')} placeholder='Title' />
                <F.InputText xsHalf id='address' value={data?.address} label={t('Address')} placeholder='Address' />
                <F.InputText isThousandsSeparator={true} xsQuarter id='totalCost' value={fixedNumber(data?.totalCost) ?? '0'} label={t('Total Cost AMD')} placeholder='Total Cost AMD' />
                <F.InputText isThousandsSeparator={true} readonly xsQuarter id='totalCostWithOtherExpenses' value={fixedNumber(data?.totalCostWithOtherExpenses) ?? '0'} label='Total Cost With Other Expenses AMD' placeholder='Total Cost With Other Expenses AMD' />
                <F.InputText xsQuarter id='constructionType' value={t(data?.constructionType)} label={t('Type of construction')} placeholder='Type of construction' />
                {/* <F.InputText xsQuarter id='buildingType' value={data?.buildingType} label={t('Type of building')} placeholder='Type of building' /> */}
                <F.InputText xsQuarter id='constructionSurface' value={data?.constructionSurface} label={t('Construction surface')} placeholder='Construction surface' />
                {/* <F.InputText xsThird id='constructionSurface' value={data?.constructionSurface} label={t('Construction surface')} placeholder='Construction surface' /> */}

            </F.PageForm>
        </AccordionDetails>
    </Accordion>
}
