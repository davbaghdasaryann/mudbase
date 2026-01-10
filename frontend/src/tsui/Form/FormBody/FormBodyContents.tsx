import {Skeleton} from '@mui/material';
import {FormGridContainer} from './FormGridContainer';
import {FormProps} from '../FormTypes';
import FormAlertSection from './FormAlertSection';
import { useFormContext } from '../FormContext/FormContextProvider';
import { FormComputedAtts } from '@/tsui/Form/FormBody/FormImpl';

export interface FormBodyProps {
    formProps: FormProps;
    formAtts: FormComputedAtts;
    children: React.ReactNode;
    onSubmit?: () => void;
}


export function FormBodyContents(props: FormBodyProps) {
    const loading = props.formProps.loading;

    if (loading) {
        return (
            <Skeleton animation='wave'>
                <FormBodyContentsWrapper {...props}>{props.children}</FormBodyContentsWrapper>
            </Skeleton>
        );
    }

    return <FormBodyContentsWrapper {...props}>{props.children}</FormBodyContentsWrapper>;
}

function FormBodyContentsWrapper(props: FormBodyProps) {
    const form = useFormContext();

    // console.log(form.formInstance);

    return (
        <>
            <FormAlertSection formProps={props.formProps} formError={form.formInstance.error}/>
            <FormBodyContentsWrapperSections formProps={props.formProps}>{props.children}</FormBodyContentsWrapperSections>
        </>
    );
}

function FormBodyContentsWrapperSections({formProps, children}: {formProps: FormProps; children: React.ReactNode}) {
    let haveGrid = true;

    if (formProps.layoutItemType === 'none' || formProps.layoutContainerType === 'none') haveGrid = false;
    if (formProps.slots?.grid === null) haveGrid = false;

    if (!haveGrid) {
        return <>{children}</>;
    }

    return <FormGridContainer formProps={formProps}>{children}</FormGridContainer>;
}
