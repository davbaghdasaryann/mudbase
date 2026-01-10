'use client';

import React from 'react';
import * as Api from '@/api';
import PageContents from '@/components/PageContents';
import Link from 'next/link';
import { Button } from '@mui/material';

import * as F from 'tsui/Form';
import { useTranslation } from 'react-i18next';
import { InputFormField } from '@/tsui/Form/FormElements/FormFieldContext';



export default function PdfEstimationContent() {
    let pdfObj = { 
        estimateName:'estimateName', 
        printDate:'printDate', 
        estimateDate:'estimateDate', 
        printId:'printId', 
        estimateId:'estimateId',
        name: 'pdfName',
        address: 'address',
        totalCost: 'totalCost',
        constructionType: 'constructionType',
        // buildingType:'buildingType'
        constructionSurface:'constructionSurface'
    }
    
    // console.log(html)
    let [htmlOfPdf, setHtmlOfPdf] = React.useState<any>()
    let [pdfTitle, setPdfTitle] = React.useState<any>(pdfObj.name)

    const form = F.useForm({type: 'input'});
    const [t] = useTranslation();



    let sendForPdf = React.useCallback(async () => {
        let result = await Api.requestSession<any>({
            command: 'dev/pdf_estimation',
            json: pdfObj
        });
        return result
    }, []);


    const downloadPdfFromBuffer = React.useCallback(async (pdfTitle:string) => {
        try {
            let filename = pdfTitle;
            sendForPdf().then(response => {
                if (!response || !response.pdf || !response.pdf.data) {
                    console.error('Invalid PDF data received from API.');
                    return;
                }
                setHtmlOfPdf(response.html)
                const uint8Array = new Uint8Array(response.pdf.data); 

                const blob = new Blob([uint8Array], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            });
        } catch (error) {
            console.error('Error downloading PDF:', error);
        }
    },[pdfTitle]);


    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        console.log('pdfTitle is ', evt.data.pdfTitle   )
        downloadPdfFromBuffer(evt.data.pdfTitle)
    },[]);

    return (
        <PageContents type='dev'>
            <br />
            {htmlOfPdf ? 
            <iframe src={'data:text/html;charset=utf-8, ' + htmlOfPdf} height="1000px" width={'500px'}></iframe>
            :

            <F.PageForm form={form} formSx={{width: 1, height: 1}} onSubmit={onSubmit} >
            
                <F.InputText id='pdfTitle' label='Pdf Title' value={pdfTitle}  xsMax />
                
                {/* <Button variant='contained' onClick={downloadPdfFromBuffer}>Download PDF</Button> */}
                <F.SubmitButton label='Download PDF' xsHalf />
                
            </F.PageForm>

            }
        </PageContents>
    );
}
