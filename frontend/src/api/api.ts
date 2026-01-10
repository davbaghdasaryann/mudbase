import Env from 'env';
import _ from 'lodash';

import { verify } from '../tslib/verify';

import * as GD from '@/data/global_dispatch';
import { raiseError } from '../lib/app_errors';


export class EndPoint {
    url: string;
    type?: string;

    constructor(_url: string) {
        this.url = _url;
    }
}

export type ApiParams = Record<string, string>;

export type ApiDataTypes = 'json' | 'text' | 'html' | 'yaml';
export type ApiAccess = 'admin' | 'user' | 'public';

export interface RequestOptions {
    group: string;
    command: string;
    params?: ApiParams;

    access?: ApiAccess;

    method?: string;

    body?: any;
    bodyType?: ApiDataTypes;

    resType?: ApiDataTypes; // response type
}

export interface FetchParams {
    limit?: number; // Maximum number of records to retrieve

    page?: number;

    orderBy?: string;
    orderAscending?: boolean;
}

export class FetchStatus {
    code = 0; // status code: 0 - pending, 1 - success, 2 > error code

    data?: string; // status data: depends on the code
    message?: string; // status message: usually error or progress

    count?: number; // Number of recortds returned
    limit?: number; // limit: 0 - no limit
    pages?: number; // total pages: 0 - not paged
    page?: number; // current page
}

export class FetchResponse<T> {
    status?: FetchStatus;
    data?: Array<T>;

    //getStatusCode(): number { return this.status ? this.status.code : 2; }
    getStatus(): FetchStatus {
        return this.status ?? {code: 2};
    }
    getData<DataType>(): DataType {
        return this.data! as unknown as DataType;
    }
}

export class UpdateStatus {
    code = 0;
    message?: string;
}

export type FetchCallback<Data> = (status: FetchStatus, data?: Data) => void;
export type UpdateCallback = (status: UpdateStatus) => void;

export interface ApiRequestParams {
    command: string;
    //args?: ApiDataTypes;
    body?: any;
    contentType?: string;
    json?: any;

    // Data params
    args?: Record<string, any>;
    values?: Record<string, any>;
    fields?: string[]; // Requested fields
    limit?: number; // Limit number of returned rows
    start?: number; // Starting from specific row
    sort?: string[]; // Sort fields
    asc?: boolean;
}

export async function requestPublic<T>(params: ApiRequestParams): Promise<T> {
    let url = makeApiUrl(params);

    // console.log(params);
    //let headers = makeApiHeaders();
    //if (contentType) headers.append('Content-Type', contentType);

    let headers = makeApiHeaders();

    if (params.json) {
        params.body = JSON.stringify(params.json);
        params.contentType = 'application/json';
    }

    if (params.contentType) {
        headers.append('Content-Type', params.contentType);
    }

    return await processFetch<T>({
        url: url,
        headers: headers,
        body: params.body,
        contentType: params.contentType,
    });
}

export async function requestSession<T>(params: ApiRequestParams): Promise<T> {
    let url = makeApiUrlToken(params);

    // console.log(url, params);

    let headers = makeApiHeaders();

    if (params.json) {
        verify(params.body === undefined, "Both .json and .body provided");
        params.body = JSON.stringify(params.json);
        params.contentType = 'application/json';
    }

    if (params.values) {
        params.body = JSON.stringify(params.values);
        params.contentType = 'application/json';
    }

    if (params.contentType) {
        headers.append('Content-Type', params.contentType);
    }

    return await processFetch<T>({
        url: url,
        headers: headers,
        body: params.body,
        contentType: params.contentType,
        credentials: 'include',
    });
}

interface ProcessFetchParams {
    url: string;
    method?: 'POST' | 'GET';
    contentType?: string;
    headers?: Headers;
    body?: any;
    credentials?: 'include' | 'omit' | 'same-origin';
}

async function processFetch<T>(params: ProcessFetchParams) {
    // console.log(url);

    let method = (params.method ?? params.body) ? 'POST' : 'GET';
    let headers = params.headers;
    let body = params.body;

    // const handleError = (error) => {
    // };

    try {
        let req = new Request(params.url, {
            method: method,
            headers: headers,
            body: body,
            credentials: params.credentials,
        });
    
        let res = await fetch(req);

        if (!res.ok)
            throw makeError(res);


        let contentType = res.headers.get('content-type');
        if (contentType?.split(';')[0].trim() === 'text/html') {
            let text = await res.text();
            return text as T;
        }

        let json = await res.json();

        if (json.error) {
            throw new Error(json.error.message ?? 'Unknown Error');
        }


        return json as T;

    }
    catch(error) {
        raiseError(error);
        return Promise.reject(error);
    }

}


export function makeApiEndPoint(...comps: string[]) {

    let endpoint = comps.join('/');
    // return endpoint;


    // // enabled trailling slash
    return endpoint.endsWith('/') ? endpoint : endpoint + '/';;
}


function makeError(res?: Response): Error {
    return new Error(res ? res.statusText : 'Invalid response');
}

export function makeApiUrl(params: ApiRequestParams) {
    let url = makeApiEndPoint(Env.apiRoot, params.command);
    // let url = makeEndPoint('/', params.command);

    let urlParams: Record<string, string> = {};

    if (params.args) {
        urlParams = params.args;
    }

    if (!_.isEmpty(urlParams)) {
        let query = new URLSearchParams(urlParams).toString();

        if (query.length > 0) {
            url += '?' + query;
        }
    }
    return url;
}

function makeApiUrlToken(params: ApiRequestParams) {
    let url = makeApiEndPoint(Env.apiRoot, params.command);

    // console.log(url);

    let first = true;

    let urlParams: Record<string, string> = {};

    if (params.args) {
        urlParams = params.args;
    }

    if (params.fields) {
        urlParams["fields"] = params.fields.join(',');
    }

    if (!_.isEmpty(urlParams)) {
        let query = new URLSearchParams(urlParams).toString();

        if (query.length > 0) {
            if (first) {
                url += '?';
                first = false;
            } else {
                url += '&';
            }

            url += query;
        }
    }
    return url;
}

function makeApiHeaders() {
    let headers = new Headers();
    return headers;
}

