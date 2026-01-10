'use client';

import React from 'react';

import {FormHookInstance} from './FormHookInstance';
import {FormHookProps} from './FormHookProps';

export function useUpdateForm() {
    return useForm({type: 'update'});
}

export function useInputForm() {
    return useForm({type: 'input'});
}

export function useForm(props: FormHookProps): FormHookInstance {
    const stableId = React.useId(); 

    // Instantiate FormHook
    const formInstanceRef = React.useRef<FormHookInstance | null>(null);

    if (formInstanceRef.current === null) {
        formInstanceRef.current = new FormHookInstance(props, stableId);
    }

    return formInstanceRef.current;
}
