import React from 'react';

import * as Api from '@/api';
import { makeError } from '@/tslib/error';
import { useRouter } from 'next/navigation';
import { authSignOut } from '../api/auth';

export interface ApiFetchParams {
    api?: Api.ApiRequestParams;
    defer?: boolean;
}

export interface ApiFetchState<DataT> {
    data: DataT | undefined; // | unknown[];
    error: Error | undefined;
    loading: boolean;
    invalidate: () => void;
    setApi: (api: Api.ApiRequestParams) => void;
}

function useApiFetchCore<ItemT, DataT>(params: ApiFetchParams, isArray: boolean) {
    const router = useRouter();

    const [apiParams, setApiParams] = React.useState(params.api);
    const deferredRef = React.useRef(params.defer ?? false);

    const invalidate = React.useCallback(() => {
        deferredRef.current = false;
        setDataRequested(false);
    }, []);

    const setApi = React.useCallback((api: Api.ApiRequestParams) => {
        setApiParams(api);
        invalidate();
    }, []);

    const [state, setState] = React.useState<ApiFetchState<DataT>>({
        data: undefined,
        error: undefined,
        loading: true,
        invalidate: invalidate,
        setApi: setApi,
    });

    const mounted = React.useRef(false);

    let [dataRequested, setDataRequested] = React.useState(false);

    React.useEffect(() => {
        mounted.current = true;
        if (deferredRef.current) return;

        if (!dataRequested && apiParams) {
            Api.requestSession<DataT>(apiParams)
                .then((response) => {
                    if (mounted.current) {
                        setState({
                            data: (isArray ? Object.values(response ?? {}) : response) as DataT | undefined,
                            // data: response,
                            error: undefined,
                            loading: false,
                            invalidate: invalidate,
                            setApi: setApi,
                        });
                    }
                })
                .catch((reason) => {
                    if (mounted.current) {
                        let errorMsg = reason.message ? reason.message : reason.toString();
                        if (errorMsg.includes("Unauthorized")) {
                            authSignOut();
                            router.replace('/login');
                            errorMsg = "Super admin has changed your activity"; //TODO: translate
                        }
                
                        setState({
                            data: undefined,
                            error: makeError(errorMsg),
                            loading: false,
                            invalidate: invalidate,
                            setApi: setApi,
                        });
                        // const errorMsg = reason.message ? reason.message : reason.toString();
                        // if (errorMsg.includes("Unauthorized")) {
                        //     errorMsg = 
                        //     authSignOut();
                        //     router.replace('/login');
                        // }

                        // setState({
                        //     data: undefined,
                        //     error: makeError(reason),
                        //     loading: false,
                        //     invalidate: invalidate,
                        //     setApi: setApi,
                        // });
                    }
                });

            setDataRequested(true);
        }

        return () => {
            mounted.current = false;
        };
    }, [dataRequested, apiParams]);

    return state;
}

export function useApiFetchMany<T>(params: ApiFetchParams) {
    return useApiFetchCore<T, T[]>(params, true);
}

export function useApiFetchOne<T>(params: ApiFetchParams) {
    return useApiFetchCore<T, T>(params, false);
}
