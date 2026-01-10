import * as F from 'tsui/Form';
import React from 'react';
import { ApiCompany } from '../api';

interface Props {
    comapniesData: ApiCompany[];
    onClose: () => void;
    onClick: (event: any) => void;
    onSelected: (data: ApiCompany[]) => void;

}

export function AddCompanyDialog(props: Props) {
    const form = F.useForm({ type: 'input' });
    const [data, setData] = React.useState<ApiCompany | null>(null);
    const onSubmit = React.useCallback(async (evt: F.InputFormEvent) => {
        if (form.error)
            return;
        if (!evt.data || Object.keys(evt.data).length === 0) { //TODO everywhere by this way
            props.onClose()
            return;
        }
        console.log('Submit', evt.data)
        if (evt.data) {
            // if(evt.data.le !== )

            const newCompanyData: ApiCompany = {
                companyId: '',
                companyName: '',
                activity: '',
                email: '',
            };
            for (const [key, value] of Object.entries(evt.data)) {
                newCompanyData[key] = value;
            }


            if (newCompanyData) {
                let lastIndexString = props.comapniesData[props.comapniesData.length - 1].companyId;
                let lastIndex = parseInt(lastIndexString);
                let newIndex = (lastIndex + 1).toString();
                newCompanyData.companyId = newIndex;
                newCompanyData.isActive = false;
                let allData = [...props.comapniesData];
                allData.push(newCompanyData);
                // props.comapniesData.push(newCompanyData);
                props.onSelected(allData);

            } else {
                props.onSelected(props.comapniesData);
            }
            props.onClose();
        }


    }, []);


    return <F.PageFormDialog title='Information' form={form} size='md' onSubmit={onSubmit} onClose={props.onClose}>
        {/* <Form.InputGroup label='Email' form={form} /> */}

        {/* <F.InputText label='Email' id='email' validate="email" autocomplete='email' required value={data?.email} form={form} xs={7}/>
            {/* {data?.phone &&   <F.InputText label='Phone' id='phone' value={data?.phone} validate='off' autocomplete='given-name'  form={form} xsThird/>} */}

        <F.InputGroup label='Description' form={form} />
        <F.InputText label='Company Name' id='companyName' value={data?.companyName} validate='off' autocomplete='given-name' required form={form} xsThird />
        <F.InputText label='Activity' id='activity' value={data?.activity} validate='off' autocomplete='given-name' required form={form} xsThird />

        <F.InputGroup label='Contacts' form={form} />
        <F.InputText label='Email' id='email' value={data?.email} validate='email' autocomplete='given-name' required form={form} xsThird />
        {/* <F.InputText label='Last Name' id='lastName' value={data?.lastName} validate='off' autocomplete='family-name'  form={form} xsThird/> */}



    </F.PageFormDialog>



}

