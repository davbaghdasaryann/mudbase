import { ObjectId } from 'mongodb';

import { registerApiSession } from '@src/server/register';
import { respondJsonData } from '@tsback/req/req_response';

import { authjsSignUp } from '@src/authjs/authjs_signup';
import * as Db from '@src/db';
import { requireQueryParam, getReqParam } from '@tsback/req/req_params';
import { authjsChangePassword } from '../../authjs/authjs_lib';

import htmlPdf from 'html-pdf-node';
import { loadEmailTemplate } from '@src/lib/email';



registerApiSession('dev/pdf_estimation', async (req, res, session) => {
    const { estimateName, printDate, estimateDate, printId, estimateId,
        name,
        address,
        totalCost,
        constructionType,
        // buildingType, 
        constructionSurface,
    } = req.body;

    let html = loadEmailTemplate("estimate_pdf.html", {
        estimateName: estimateName,
        printDate: printDate,
        estimateDate: estimateDate,
        printId: printId,
        estimateId: estimateId,

        name: name,
        address: address,
        totalCost: totalCost,
        constructionType: constructionType,
        // buildingType:buildingType,
        constructionSurface: constructionSurface,
    });


    const options = { format: 'A4' };
    const file = { content: html };

    const pdfBuffer = await htmlPdf.generatePdf(file, options);
    // log_.info(pdfBuffer)
    respondJsonData(res, { pdf: pdfBuffer, html: html });

});



