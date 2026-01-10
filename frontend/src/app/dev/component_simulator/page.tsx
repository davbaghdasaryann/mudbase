'use client'

import React from 'react';
import PageContents from '../../../components/PageContents';
import * as F from 'tsui/Form';
import { accountRoles } from '@/data/account_roles';
import PageText from '@/components/PageText';
import { PageSelect } from '../../../tsui/PageSelect';
import { PageButton } from '../../../tsui/Buttons/PageButton';


export default function ComponentSimulatorPage() {


    return (
        <PageContents type='dev'>
            <PageSelect
                type='select'
                value='Account Type'
                label='Account Type'
                items={accountRoles.map((type) => ({
                    id: type.id,
                    label: type.name,
                }))}
            />
            <PageText text='Company Name' h2 />
            <PageButton label='Register' />


        </PageContents>
    );
}