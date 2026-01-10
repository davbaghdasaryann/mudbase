'use client';

import React, {useCallback} from 'react';

import {IconButton, Stack} from '@mui/material';

import {useTranslation} from 'react-i18next';

import AddToPhotosIcon from '@mui/icons-material/AddToPhotos';


import * as EstimatesApi from '@/api/estimates_shares';

import * as Api from '@/api';
import * as F from '@/tsui/Form';
import {useApiFetchOne} from '@/components/ApiDataFetch';

import ProgressIndicator from '../../tsui/ProgressIndicator';
import {EstimateShareToAccountConfirmationDialog} from '../EstimateShareToAccountConfirmationDialog';
import {usePermissions} from '@/api/auth';
import DataTableComponent from '../DataTableComponent';

interface Props {
    show?: boolean;
    title?: string;
    estimateId: string;
    onClose: () => void;
    onConfirm: () => void;

    calledFromPage: 'estimates' | 'sharedEstimates';
}

export default function EstimateShareToAccountSelectionDialog(props: Props) {
    if (props.show === false) return null;

    return <AccountSelectionDialogBody {...props} />;
}

function AccountSelectionDialogBody(props: Props) {
    const {session, status, permissionsSet} = usePermissions();

    const form = F.useForm({type: 'update'});

    const [progIndic, setProgIndic] = React.useState(false);
    const [currentCompanyName, setCurrentCompanyName] = React.useState<string | null>(null);
    const accountIdRef = React.useRef<string | null>(null);
    const [t] = useTranslation();

    const apiData = useApiFetchOne<Api.ApiAccount>({
        api: {
            command: 'accounts/fetch_shareable_accounts_for_estimate',
            // args: { accountActivity: session?.user && permissionsSet?.has?.('EST_SHR_WITH_BLDR') ? 'B' : 'F' }
        },
    });

    // const onSearch = useCallback((value: string) => {
    //     apiData.setApi({
    //         command: 'accounts/fetch_shareable_accounts_for_estimate',
    //         args: {
    //             search: value,
    //         },
    //     });
    // }, []);

    const onSubmit = useCallback(async (value: 'totalEstimate' | 'onlyEstimateInfo') => {
        // console.log('permissionsSet?.has?', permissionsSet?.has?.('EST_CRT_BY_BNK'));
        // console.log('accountIdRef', accountIdRef.current);

        if (form.error) return;

        setCurrentCompanyName(null);
        setProgIndic(true);

        // if (session?.user && (permissionsSet?.has?.('EST_CRT_BY_BNK') || permissionsSet?.has?.('EST_CRT_BY_DEV'))) {
        //     // console.log('props.estimateId', props.estimateId);

        //     if (props.calledFromPage === 'estimates') {
        //         let estimateShareRes = await Api.requestSession<EstimatesApi.ApiEstimatesShares>({
        //             command: 'estimates_shares/add_for_view',
        //             args: {estimateId: props.estimateId, calledFromPage: 'estimates'},
        //         });

        //         await Api.requestSession<EstimatesApi.ApiEstimatesShares>({
        //             command: 'estimates_shares/add_for_update',
        //             args: {estimateShareId: estimateShareRes._id, sharedWithAccountId: accountIdRef.current, estimateMultiShareType: value},
        //         });
        //     } else {
        //         await Api.requestSession<EstimatesApi.ApiEstimatesShares>({
        //             command: 'estimates_shares/add_for_update',
        //             args: {estimateShareId: props.estimateId, sharedWithAccountId: accountIdRef.current, estimateMultiShareType: value},
        //         });
        //     }
        // } else {
        //     console.log('props.estimateId, accountIdRef.current', props.estimateId, accountIdRef.current);

            await Api.requestSession<EstimatesApi.ApiEstimatesShares>({
                command: 'estimates_shares/add_full_for_share',
                args: {estimateId: props.estimateId, sharedWithAccountId: accountIdRef.current, estimateMultiShareType: value},
            });
        // }

        apiData.setApi({
            command: 'accounts/fetch_shareable_accounts_for_estimate',
        });

        setProgIndic(false);
        props.onConfirm();
    }, []);

    return (
        <F.PageFormDialog type='panel' title={props.title ?? 'Share'} form={form} formContainer='none' size='md' onClose={props.onClose}>
            <Stack direction='column' sx={{width: 1}}>
                {progIndic && <ProgressIndicator show={progIndic} background='backdrop' />}
                {/* <Toolbar disableGutters sx={{backgroundColor: 'inherit'}}>
                    <SearchComponent onSearch={onSearch} />
                    <SpacerComponent />
                </Toolbar> */}

                <DataTableComponent
                    rows={Array.isArray(apiData.data) ? apiData.data : []}
                    loading={apiData.loading}
                    // autoPageSize={true}
                    disableRowSelectionOnClick
                    getRowId={(row) => row?._id ?? crypto.randomUUID()}
                    sx={
                        {
                            // width: '100%',
                            // color: "red"
                        }
                    }
                    columns={[
                        {field: 'companyName', headerName: t('Company'), headerAlign: 'left', flex: 0.7, disableColumnMenu: true},
                        {
                            field: 'actions',
                            type: 'actions',
                            headerName: t('Select'),
                            flex: 0.3,
                            renderCell: (cell) => {
                                return (
                                    <>
                                        <IconButton
                                            onClick={() => {
                                                setCurrentCompanyName(cell.row.companyName);
                                                accountIdRef.current = cell.row._id as string;

                                                // props.onConfirm(cell.row);
                                            }}
                                        >
                                            <AddToPhotosIcon />
                                        </IconButton>
                                    </>
                                );
                            },
                        },
                    ]}
                />
            </Stack>

            {/* <CreateAccountDialog show={addAccountActive} onClose={() => setAddAccountActive(false)} /> */}
            {currentCompanyName && (
                <EstimateShareToAccountConfirmationDialog
                    title={props.title ?? 'Share'}
                    message={`${t('Are you sure you want to share it')} ${t('share_word_with')} ${currentCompanyName}${t('share_word_with_in_armenian')} ${t('share_question_mark')}`}
                    onClose={() => {
                        setCurrentCompanyName(null);
                    }}
                    onConfirm={onSubmit}
                />
            )}
        </F.PageFormDialog>
    );
}
