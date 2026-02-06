"use client";

import React from "react";

import { Accordion, AccordionDetails, AccordionSummary, Box, TextField, Typography } from "@mui/material";

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
                {/* Row 1 */}
                <F.InputText xsQuarter id='name' value={data?.name} label={t('Title')} placeholder={t('Title')} />
                <F.InputText xsQuarter id='constructionType' value={t(data?.constructionType)} label={t('Type of construction')} placeholder={t('Type of construction')} />
                <F.InputText xsQuarter id='builtUpArea' value={data?.builtUpArea} label={t('Built-up Area')} placeholder={t('Built-up Area')} />
                <F.InputText isThousandsSeparator={true} xsQuarter id='totalCost' value={fixedNumber(data?.totalCost) ?? '0'} label={t('Direct costs')} placeholder={t('Direct costs')} />

                {/* Row 2 */}
                <F.InputText xsQuarter id='address' value={data?.address} label={t('Address')} placeholder={t('Address')} />
                <F.InputText xsQuarter id='constructionSurface' value={data?.constructionSurface} label={t('Construction area')} placeholder={t('Construction area')} />
                <F.InputText
                    isThousandsSeparator={true}
                    readonly
                    xsQuarter
                    id='builtUpCostPerSqM'
                    value={
                        data?.builtUpArea && parseFloat(data.builtUpArea) > 0
                            ? fixedNumber((data?.totalCost ?? 0) / parseFloat(data.builtUpArea))
                            : '0'
                    }
                    label={t('Built-up Cost per sq. m')}
                    placeholder={t('Built-up Cost per sq. m')}
                />
                <F.InputText isThousandsSeparator={true} readonly xsQuarter id='otherCosts' value={fixedNumber((data?.totalCostWithOtherExpenses ?? 0) - (data?.totalCost ?? 0)) ?? '0'} label={t('Other costs')} placeholder={t('Other costs')} />

                {/* Row 3 - Empty spaces in col1 and col3 */}
                <F.InputText xsQuarter readonly value='' label='' placeholder='' sx={{ visibility: 'hidden' }} />
                <F.InputText
                    isThousandsSeparator={true}
                    readonly
                    xsQuarter
                    id='constructionCostPerSqM'
                    value={
                        data?.constructionSurface && parseFloat(data.constructionSurface) > 0
                            ? fixedNumber((data?.totalCost ?? 0) / parseFloat(data.constructionSurface))
                            : '0'
                    }
                    label={t('Construction Cost per sq. m')}
                    placeholder={t('Construction Cost per sq. m')}
                />
                <F.InputText xsQuarter readonly value='' label='' placeholder='' sx={{ visibility: 'hidden' }} />
                <F.InputText isThousandsSeparator={true} readonly xsQuarter id='totalCostWithOtherExpenses' value={fixedNumber(data?.totalCostWithOtherExpenses) ?? '0'} label={t('Total Cost AMD')} placeholder={t('Total Cost AMD')} />
                {/* <F.InputText xsQuarter id='buildingType' value={data?.buildingType} label={t('Type of building')} placeholder='Type of building' /> */}

            </F.PageForm>
        </AccordionDetails>
    </Accordion>
}
