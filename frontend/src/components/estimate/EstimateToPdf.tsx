'use client';

import React from 'react';

import * as F from 'tsui/Form';
import {useTranslation} from 'react-i18next';
import dynamic from 'next/dynamic';

interface EstimateToPdfProps {
    pdfUrl?: string;
    //show?: boolean;
    title: 'string';
    // data: any;
}

export default function EstimateToPdf(props: EstimateToPdfProps) {
    if (!props.pdfUrl) return null;
    return <EstimateToPdfBody {...props} />;
}

function EstimateToPdfBody(props: EstimateToPdfProps) {
    return (
        <div style={{width: '100%', height: '100vh'}}>
            <iframe src={props.pdfUrl} width='100%' height='100%' style={{border: 'none'}} />
        </div>
    );

    // let [htmlOfPdf, setHtmlOfPdf] = React.useState<any>();

    // const form = F.useForm({type: 'input'});
    // const [t] = useTranslation();
    // let printed = false;

    // React.useEffect(() => {
    //     if (!printed) {
    //         console.log('mnamsndmans,dmnamsdn');
    //         let filename = props.title;
    //         setHtmlOfPdf(props.data.html);
    //         const uint8Array = new Uint8Array(props.data.pdf.data);

    //         const blob = new Blob([uint8Array], {type: 'application/pdf'});
    //         const url = window.URL.createObjectURL(blob);
    //         const a = document.createElement('a');
    //         a.href = url;
    //         a.download = filename;
    //         document.body.appendChild(a);
    //         a.click();
    //         window.URL.revokeObjectURL(url);
    //         document.body.removeChild(a);
    //         printed = true;
    //     }
    // }, []);

    // return <iframe src={'data:text/html;charset=utf-8, ' + encodeURIComponent(htmlOfPdf)} height='1000px' width={'100%'}></iframe>;
}

/*
export default function EstimateToPdf(props: EstimateToPdfProps) {
    let [htmlOfPdf, setHtmlOfPdf] = React.useState<any>();

    const form = F.useForm({type: 'input'});
    const [t] = useTranslation();
    let printed = false;

    React.useEffect(() => {
        if (!printed) {
            console.log('mnamsndmans,dmnamsdn');
            let filename = props.title;
            setHtmlOfPdf(props.data.html);
            const uint8Array = new Uint8Array(props.data.pdf.data);

            const blob = new Blob([uint8Array], {type: 'application/pdf'});
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            printed = true;
        }
    }, []);

    return <iframe src={'data:text/html;charset=utf-8, ' + encodeURIComponent(htmlOfPdf)} height='1000px' width={'100%'}></iframe>;
}
*/
