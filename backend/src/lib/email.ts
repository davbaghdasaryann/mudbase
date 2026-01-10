import fs from 'fs';

//import {Resend} from 'resend';

// import FormData from 'form-data';
// import Mailgun from 'mailgun.js';
//import { MailgunClientOptions, MessagesSendResult } from 'mailgun.js/definitions';

import {verify} from '@/tslib/verify';

export interface EmailParams {
    from: string;
    to: string[];
    subject: string;
    text?: string;
    html?: string;
}

export function loadEmailTemplate(templateName: string, vars: Record<string, string>) {
    // log_.info('vars', vars);

    let templatePath = setup_.getTemplatePath(templateName);

    let contents = fs.readFileSync(templatePath, {encoding: 'utf-8'});

    for (let [name, value] of Object.entries(vars)) {
        contents = contents.replaceAll('${' + name + '}', value);
    }

    return contents;
}

export async function sendEmail(params: EmailParams) {
    return sendEmailMailgun(params);
    // return sendEmailResend(params);
}

export async function sendEmailMailgun(params: EmailParams) {
    verify(config_.email.apiKey, 'email.apiKey is missing');
    verify(config_.email.domain, 'email.domain is missing');

    const form = new FormData();
    form.append('from', params.from);
    form.append('to', params.to.join(','));
    form.append('subject', params.subject);
    if (params.html)
        form.append('html', params.html);
    if (params.text)
        form.append('text', params.text);


    const domainName = config_.email.domain;

    const resp = await fetch(
        `https://api.mailgun.net/v3/${domainName}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: 'Basic ' + Buffer.from(`api:${config_.email.apiKey}`).toString('base64')
          },
          body: form
        }
      );
    
      const result = await resp.json();
      return result;

    // const mailgun = new Mailgun(FormData);
    // const mg = mailgun.client({username: 'api', key: config_.email.apiKey});

    // const result = await mg.messages.create(config_.email.domain, {
    //     from: params.from,
    //     to: params.to,
    //     subject: params.subject,
    //     html: params.html!,
    // });

    // // log_.info(result);
    // return result;
}

// export async function sendEmailResend(params: EmailParams) {
//     verify(config_.email.apiKey, 'email.apiKey is missing');

//     const resend = new Resend(config_.email.apiKey);
//     const {data, error} = await resend.emails.send({
//         from: params.from,
//         to: params.to,
//         subject: params.subject,
//         html: params.html!,
//         // text: params.text,
//     });

//     if (error) {
//         throw error;
//     }

//     return data;
// }
