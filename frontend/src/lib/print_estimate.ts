'use client';

import * as Api from 'api';


export function runPrintEstimate(estimateId: string) {
    if (typeof window === 'undefined') return;
    window.open(
        Api.makeApiUrl({
            command: 'estimate/generate_html',
            args: {estimateId: estimateId},
        }),
        '_blank'
    );
}
