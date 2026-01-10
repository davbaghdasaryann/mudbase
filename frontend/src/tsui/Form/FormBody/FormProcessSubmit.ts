"use client";

import * as FT from "../FormTypes";
import { validateForm } from "./FormValidate";

export interface ProcessFormSubmitResult {
    errorsCount: number;
    dataCount: number;
}

export async function processFormSubmit(props: FT.FormProps): Promise<ProcessFormSubmitResult> {
    const form = props.form;

    form.clearError();

    let ev = new FT.InputFormEvent();
    const validateResult = validateForm(form, ev);

    // console.log(form.registeredFields);
    if (validateResult.errorsCount > 0 && props.ignoreDataChecking !== true) return validateResult;

    // console.log(props.ignoreDataChecking, ev.data);

    if (props.ignoreDataChecking !== true && !ev.isData())
        return validateResult;

    // if (form.formType === "update" && dataCount === 0) {
    //     form.setError("No changes made.");
    // }

    if (props.onSubmit) {
        await props.onSubmit(ev);

        // console.log(form);

        if (form.error) {
            validateResult.errorsCount = 1;
        }
    }

    // Reset original values
    for (let [_, field] of form.registeredFields) {
        field.origValue = field.value;
    }

    return validateResult;
}
