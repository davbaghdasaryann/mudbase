
import { makeError } from '@/tslib/error';
import { validateEmail } from '@/tslib/validate';
import { FormHookInstance } from '../FormContext/FormHookInstance';
import * as FT from '../FormTypes/FormBasicTypes';
import { InputFormField } from '../FormElements/FormFieldContext';
import { ProcessFormSubmitResult } from './FormProcessSubmit';
import { i18nt } from '@/tsui/I18n/SafeTranslation';

// export function prepareUpdateData(formCtx: FormHookInstance, ev: FT.InputFormEvent) {
//     // for (let [id, field] of formCtx.registeredFields) {
//     //     ev.fields[id] = field;
//     // }
// }
const NUMERIC_VALIDATES = new Set([
    'integer',
    'positive-integer',
    'double-number',
    'positive-double-number',
    'positive-number',
  ]);
  
  const isNumericValidate = (v?: string) => !!v && NUMERIC_VALIDATES.has(v);
  
  /** Should be an integer? */
  const needsInteger = (v?: string) =>
    v === 'integer' || v === 'positive-integer';
  
  /** Should be > 0 ? (you can change to >= 0 if you prefer non-negative) */
  const needsPositive = (v?: string) =>
    v === 'positive-integer' ||
    v === 'positive-double-number' ||
    v === 'positive-number';
  
  /** Remove thousands separators and normalize decimal dot */
  export function normalizeNumberString(value: unknown): string {
    let s = typeof value === 'string' ? value : String(value);
  
    // Unicode normalize, then remove common thousands separators:
    // normal space, NBSP, narrow NBSP, thin space, figure space, commas, apostrophes
    s = s.normalize?.('NFKC') ?? s;
    s = s.replace(/[\u00A0\u202F\u2009\u2007\u0020,']/g, '');
  
    // If you ever accept comma as decimal, convert it here:
    // (since we already removed commas above, leave as-is; your UI uses dot decimals)
    // s = s.replace(',', '.');
  
    return s.trim();
  }
  
  /** Convert a string (possibly formatted) into a number, respecting validate rules */
  function parseNumericForSubmit(raw: unknown, validate?: string): number | null {
    const cleaned = normalizeNumberString(raw);
    if (cleaned === '') return null;
  
    const num = needsInteger(validate)
      ? parseInt(cleaned, 10)
      : parseFloat(cleaned);
  
    if (!Number.isFinite(num)) return null;
    if (needsInteger(validate) && !Number.isInteger(num)) return null;
    if (needsPositive(validate) && !(num > 0)) return null; // change to >= 0 if needed
  
    return num;
  }

export function validateForm(formCtx: FormHookInstance, ev: FT.InputFormEvent): ProcessFormSubmitResult {
    let errors: Error[] = [];
    let dataCount = 0;

    for (let [id, field] of formCtx.registeredFields) {
        ev.fields[id] = field;

        let res = validateFormField(field);

        if (res.error) {
            // console.log('res.error', res.error);
            field.error = res.error; // makeError(err)
            let err: any = [];
            err.push(res.error)
            let fieldIdArr: any = [];
            fieldIdArr.push(field.id);
            err.push(fieldIdArr)

            // errors.push(res.error);  // maybe bring back
            errors.push(err);

            //if (!firstError) firstError = field.error
            continue;
        }

        //let value = res.value!
        // const value = field.value;
        // const origValue = field.origValue;

        //console.debug(`${field.id}: ${value}, ${origValue}`);

        let skipValue = false;

        // If it's an update form and nothing change, do not send the value
        if (formCtx.formType === 'update' && !field.valueChanged) {
            skipValue = true;
        }

        // console.log(field, skipValue);

        if (!skipValue) {
            if (field.isData) {
                let outVal = field.value;

                // ✨ normalize numeric fields before adding to payload
                if (isNumericValidate(field.validate)) {
                    const parsed = parseNumericForSubmit(field.value, field.validate);

                    // If parsing failed, surface a generic error (or set field.error and collect it)
                    if (parsed === null) {
                        const err: any = [];
                        err.push({ message: 'Invalid number', code: 'validate.float' });
                        const fieldIdArr: any = [];
                        fieldIdArr.push(field.id);
                        err.push(fieldIdArr);
                        errors.push(err);
                        // optionally continue; but usually we still set the value for debugging:
                    } else {
                        outVal = String(parsed);
                    }
                }

                ev.data[id] = outVal;

                // ev.data[id] = field.value;
                ++dataCount;
            } else {
                ev.notData[id] = field.value;
            }
        }
    }

    // console.log(ev.data);

    if (errors.length > 0) {
        // console.log('FormValidate.tsx', errors);
        // formCtx.setError(errors[0]);
        // formCtx.setError(errors[0][0], errors[0][1]);
    }

    return {
        errorsCount: errors.length,
        dataCount: dataCount,
    }
}

interface FormValidateResult {
    value?: string;
    error?: Error;
}

const assertField = (condition: any, message: string, field?: string): FormValidateResult | undefined => {
    if (!condition) {
        let text = (field ? i18nt(field) : '')!;
        if (text.length !== 0) text += ' ';
        text += i18nt(message);
        let err = new Error();
        err.name = text;
        return {
            error: makeError(err),
        };
    }

    return undefined;
};

function validateFormField(field: InputFormField): FormValidateResult {
    let errres: FormValidateResult | undefined = undefined;

    let value = field.value;

    switch (field.fieldType) {
        case 'text':
        case 'password':
        case 'date':
            if (field.required) {
                errres = assertField(value.length !== 0, 'is required', field.name);
                if (errres) return errres;
            }

            if (value.length !== 0) {
                switch (field.validate) {
                    case 'email':
                        errres = assertField(validateEmail(value.trim()), 'Invalid email format');
                        if (errres) return errres;
                        break;
                    case 'off':
                    default:
                        break;
                }
            }

            break;
        case 'select':
            // console.log(field);
            if (field.required) {
                errres = assertField(value.length !== 0, 'is required', field.name);
                if (errres) return errres;
            }
            break;
        default:
            break;
    }

    return {
        value: value,
    };
}
