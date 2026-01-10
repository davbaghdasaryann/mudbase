import React from 'react';

import * as Api from "api/api";
import { FormHookInstance } from '../tsui/Form/FormContext/FormHookInstance';


interface Props<DataT> {
    api: Api.ApiRequestParams;
    
    form: FormHookInstance;
    
    onData: (d: DataT) => void;
    
    // fields?: Array<any>[];  // Optional provided fields containing `name` `value`

    children: React.ReactNode;
}

export function FormDataProvider<DataT>(props: Props<DataT>) {
    const mounted = React.useRef(false);
    const [dataRequested, setDataRequested] = React.useState(false);
    
    React.useEffect(() => {
        const form = props.form;

        mounted.current = true;
        if (!dataRequested) {
            
            setDataRequested(true);
            form.dataRequested = dataRequested;

            form.setLoading();
            Api.requestSession<DataT>(props.api).then(d => {
                if (mounted.current) {
                    form.clearLoading();
                    props.onData(d);
                }
            })
            setDataRequested(true);

            return;
        }
        return () => {mounted.current = false}
    }, [dataRequested]);


    if (!mounted.current)
        return <></>;

    if (props.form.dataRequested !== dataRequested) {
        //setDataRequested(props.form.dataRequested);
    }

    return <>{props.children}</>;
}

