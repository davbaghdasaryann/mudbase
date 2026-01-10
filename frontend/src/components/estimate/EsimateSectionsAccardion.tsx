import { Dialog, Typography } from "@mui/material";
import PageContents from "../PageContents";
import Accardion from "../Accardion";
import React from "react";
import ProgressIndicator from "../../tsui/ProgressIndicator";
import * as Api from 'api';
import * as LaborsApi from 'api/labor'
import * as MaterialsApi from 'api/material'
import * as EstimateSectionsApi from '@/api/estimate'
import { LaborCategoryDisplayData } from "../../data/labor_display_data";
import { MaterialCategoryDisplayData } from "../../data/material_display_data";
import { EstimateSectionsDisplayData } from "../../data/estimate_sections_display_data";
import EstimateThreeLevelAccordion from "./EstimateThreeLevelAccordion";

// interface Props {
//     offerStatus: boolean;
// }

export {};

/*
export default function EstimateSectionsAccardion() {
    const mounted = React.useRef(false);
    const [dataRequested, setDataRequested] = React.useState(false);
    const [progIndic, setProgIndic] = React.useState(false)
    const [chosenCatalogCategories, setChosenCataloCategories] = React.useState<EstimateSectionsDisplayData[] | null>(null);



    const onCancelDialog = React.useCallback((event, reason) => {
        if (reason && (reason === 'backdropClick' || reason === 'escapeKeyDown')) return;
    }, []);


    React.useEffect(() => {
        setProgIndic(true)

        mounted.current = true;
        if (!dataRequested) {
            Api.requestSession<EstimateSectionsApi.ApiEstimateSecttion[]>({
                command: 'estimate/fetch_sections',
                args: {
                    estimateId: "67b495ff9a81f4eb4c0f2637", //TODO remove this hard code
                }
            })
                .then(estimateSectionsList => {
                    if (mounted.current) {

                        console.log('estimate sections: ', estimateSectionsList)
                        let estimateSectionsData: EstimateSectionsDisplayData[] = [];

                        for (let estimateSection of estimateSectionsList) {
                            estimateSectionsData.push(new EstimateSectionsDisplayData(estimateSection));
                        }

                        setChosenCataloCategories(estimateSectionsData)
                    }
                    setProgIndic(false)

                })
            setDataRequested(true);

            return;

        }
        return () => { mounted.current = false }
    }, [dataRequested]);


    if (progIndic === true) {
        return <Dialog onClose={onCancelDialog} open={progIndic} slotProps={{
            paper: {
                sx: { width: 200, height: 200 }
            }
        }}
        >
            <ProgressIndicator />
        </Dialog>
    }
    if (!chosenCatalogCategories)
        return <></>

    console.log('chosenCatalogCategories', chosenCatalogCategories)
    const accordionData = [] as any;

    chosenCatalogCategories.forEach(chosenCategory => {
        accordionData.push({
            id: chosenCategory._id,
            label: chosenCategory.name,
            totalCost: chosenCategory.totalCost ?? 0,
            children: []
            // content: (<AdminPageSubcategory />),
        })
    });

    // chosenCatalogCategories!.map((chosenCategory, index) => {
    //     accordionData.push({
    //         id: chosenCategory._id,
    //         label: chosenCategory.name,
    //         children: []
    //         // content: (<AdminPageSubcategory />),
    //     })
    // })

    if (!accordionData)
        return <></>

    return (
        // <></>
        <EstimateThreeLevelAccordion data={accordionData} />
        // <AccardionCatalog data={accordionData} />
    );
}

*/
