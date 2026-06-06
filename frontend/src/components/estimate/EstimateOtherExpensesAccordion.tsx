"use client";

import { Box, Button, IconButton, Typography } from "@mui/material";
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import React, { useEffect } from "react";
import * as F from 'tsui/Form';
import { InputFormField } from "../../tsui/Form/FormElements/FormFieldContext";
import * as Api from 'api';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SvgIcon from '@mui/material/SvgIcon';
import { useTranslation } from "react-i18next";
import * as GD from '@/data/global_dispatch';
import { usePermissions } from "../../api/auth";
import { estimateOtherExpensesItems, getEstimateOtherExpenseName } from "../../data/estimate_manual";
import { fixedNumber } from "../../tslib/parse";
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { confirmDialog } from "@/components/ConfirmationDialog";
import { EstimateRootAccordion, EstimateRootAccordionSummary, EstimateRootAccordionDetails } from '@/components/AccordionComponent';


interface EstimateOtherExpensesAccordionProps {
    estimateId: string;
    viewOnly?: boolean;
}


export default function EstimateOtherExpensesAccordion(props: EstimateOtherExpensesAccordionProps) {
    // const { data: session } = useSession();
    const { session, status, permissionsSet } = usePermissions();

    let form = F.useForm({ type: (session?.user && permissionsSet?.has?.('EST_EDT_OTHR_XPNS') && !props.viewOnly) ? 'update-fields' : 'displayonly' });

    // let form = F.useForm({
    //     // type: 'input',
    //     type: session?.user && permissionsSet?.has?.('EST_EDT_INFO') ? 'update-fields' : 'readonly',
    // });

    const mounted = React.useRef(false);
    const [dataRequested, setDataRequested] = React.useState(false);
    const [progIndic, setProgIndic] = React.useState(false)
    const [data, setData] = React.useState<any | null>(null); //TODO change any to interface
    const [t] = useTranslation()

    useEffect(() => {
        const updateData = () => {
            setDataRequested(false);
        };

        GD.pubsub_.addListener(GD.estimateDataChangeId, updateData);

        return () => {
            GD.pubsub_.removeListener(GD.estimateDataChangeId, updateData);
        };
    }, []);

    useEffect(() => {
        setProgIndic(true)

        mounted.current = true;
        if (!dataRequested) {

            Api.requestSession<Api.ApiEstimate>({ //TODO change any to interface
                command: 'estimate/get',
                args: { estimateId: props.estimateId }
            })
                .then(myEstimatesList => {
                    if (mounted.current) {
                        console.log(myEstimatesList)

                        setData(myEstimatesList)
                    }
                    setProgIndic(false)

                })

            setDataRequested(true);
            return;
        }
        return () => { mounted.current = false }
    }, [dataRequested]);




    const onRemove = React.useCallback(
        (otherExpensesKey: string) => {
            console.log('id', otherExpensesKey)
            confirmDialog(t('Are you sure?')).then((result) => {
                if (result.isConfirmed) {

                    Api.requestSession<any>({
                        command: 'estimate/remove_other_expenses',
                        args: { estimateId: props.estimateId, otherExpensesKey: otherExpensesKey },
                    }).then(() => {
                        setDataRequested(false)
                        // refreshEverythingAfterRemovingSecOrSubsec(true);
                    });
                }
            });
        },
        [data]
    );

    const handleChange = async (e: InputFormField) => {
        let myEstimatesList;
        console.log("e", e);

        // Use the fieldType provided by the component:
        if (e.fieldType === "select") {
            // This is the select for expense key update.
            // e.origValue holds the original key, and e.value holds the new key.
            const getOriginalKey = e.origValue;
            const getNewKey = e.value;

            const expenses = Array.isArray(data?.otherExpenses) ? data.otherExpenses : [];
            const keyAlreadyExists = expenses.some(expense => Object.keys(expense).includes(getNewKey));

            if (keyAlreadyExists) {
                // If the new key already exists, notify the user and do not update.
                // alert(`Expense with key "${getNewKey}" already exists. Reverting to original value.`);
                // Optionally, reset the form field value to the original value here.
                return; // Do not send the update request.
            }

            myEstimatesList = await Api.requestSession<any>({
                command: "estimate/update_other_expenses_key",
                args: {
                    estimateId: props.estimateId,
                    originalKey: getOriginalKey,
                    newKey: getNewKey,
                },
            });
        } else if (e.fieldType === "text") {
            // This is the input for expense value update.
            // Here we assume e.id contains the expense key.
            const getFieldKey = e.id;
            const getFieldValue = e.value;

            myEstimatesList = await Api.requestSession<any>({
                command: "estimate/update_other_expenses_value",
                args: {
                    estimateId: props.estimateId,
                    fieldKey: getFieldKey,
                    fieldValue: getFieldValue,
                },
            });

            GD.pubsub_.dispatch(GD.estimateDataChangeId);
            GD.pubsub_.dispatch(GD.estimateCostChangedId);
        }

        // console.log(myEstimatesList);

        setData(myEstimatesList);
        setDataRequested(false);
        setProgIndic(false);
    };



    // Handler for "Add expense type" button.
    const handleAddExpense = async () => {
        // Check if there is already an expense with the default key "typeOfCost"
        const expenses = Array.isArray(data?.otherExpenses) ? data.otherExpenses : [];
        const exists = expenses.some((expense) =>
            Object.keys(expense).includes("typeOfCost")
        );
        // if (exists) {
        //     alert("You have already added an expense of type 'Type of cost'. Please fill it before adding a new one.");
        //     return;
        // }

        // Otherwise, call the API to add a new expense item { typeOfCost: 0 }
        const myEstimatesList = await Api.requestSession<any>({
            command: "estimate/add_item_in_other_expenses",
            args: {
                estimateId: props.estimateId,
            },
        });
        setData(myEstimatesList);
    };


    return (
        <Box sx={{ width: '100%' }}>
            <EstimateRootAccordion>
                <EstimateRootAccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SvgIcon viewBox="0 0 24 24" sx={{ fontSize: 18, mr: 1 }}>
                            {/* Single document with dog-ear */}
                            <path fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" d="M5 2h9l4 4v14H5z"/>
                            <path fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" d="M14 2v4h4"/>
                            {/* Content lines */}
                            <line x1="7.5" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                            <line x1="7.5" y1="13" x2="12" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                            {/* Dollar coin badge */}
                            <circle cx="16" cy="17.5" r="4" fill="white" stroke="currentColor" strokeWidth="1.4"/>
                            <text x="16" y="20.2" textAnchor="middle" fontSize="6" fontWeight="bold" fill="currentColor" fontFamily="sans-serif">$</text>
                        </SvgIcon>
                        <Typography sx={{ fontWeight: 500 }}>{t('Other Expenses')}</Typography>
                    </Box>
                </EstimateRootAccordionSummary>
                <EstimateRootAccordionDetails>
                    <Box sx={{
                        p: 1,
                        '& .MuiPaper-root': { boxShadow: 'none', backgroundColor: 'transparent', border: 'none' },
                        '& .MuiInputBase-root': { backgroundColor: '#F5F9F9' },
                        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00ABBE' },
                        '& .MuiFormLabel-root.Mui-focused': { color: '#00ABBE' },
                        '& .MuiSelect-root.Mui-focused + .MuiOutlinedInput-notchedOutline': { borderColor: '#00ABBE' },
                    }}>
                    {(Array.isArray(data?.otherExpenses) ? data.otherExpenses : []).map((expense, index) => {
                        const expenseKey = Object.keys(expense)[0];
                        const expenseValue = expense[expenseKey];

                        if ((session?.user && (!permissionsSet?.has?.('EST_EDT_OTHR_XPNS') || props.viewOnly)) && expenseKey === 'typeOfCost' && expenseValue === 0) {
                            return null;
                        }

                        console.log("expense", expense, expenseValue);

                        const usedExpenseKeys = (data?.otherExpenses || []).map(exp => Object.keys(exp)[0]);
                        const filteredExpenseItems = estimateOtherExpensesItems.filter(item =>
                            // Allow the item if it's the current row's value OR not used in any other row.
                            item.id === expenseKey || !usedExpenseKeys.includes(item.id)
                        );


                        let percentagePriceCalc = 0;
                        if (expenseValue && data?.totalCost) {
                            percentagePriceCalc = expenseValue * data?.totalCost / 100;
                        }

                        return (
                            <F.PageForm
                                key={index}
                                form={form}
                                size="xl"
                                onFieldUpdate={handleChange}
                            >
                                {(session?.user && permissionsSet?.has?.('EST_EDT_OTHR_XPNS') && !props.viewOnly)
                                    ?
                                    <F.SelectField
                                        form={form}
                                        xs={7}
                                        id={`${expenseKey}-${index}`}
                                        items={filteredExpenseItems}
                                        value={t(expenseKey) ?? "typeOfCost"}
                                        label="Type of cost"
                                    />
                                    :
                                    <F.InputText
                                        form={form}
                                        xs={7}
                                        id={`${expenseKey}-${index}`}
                                        value={t(expenseKey === 'typeOfCost' ? "" : t(getEstimateOtherExpenseName(expenseKey)))}
                                        label={expenseKey === 'typeOfCost' ? "" : t(getEstimateOtherExpenseName(expenseKey))}
                                        // value={t(expenseKey) ?? "typeOfCost"}
                                        // label="Type of cost"
                                        placeholder={expenseKey === 'typeOfCost' ? "" : t(getEstimateOtherExpenseName(expenseKey))}
                                    />
                                }
                                <F.InputText
                                    form={form}
                                    xs={2}
                                    // xsHalf
                                    id={expenseKey}
                                    value={expenseValue === 0 ? "0" : expenseValue}
                                    label="Percentage(%)"
                                    placeholder="Percentage(%)"
                                    validate='double-number'
                                // The component should automatically set fieldType to "input"
                                />

                                <F.InputText
                                    isThousandsSeparator={true}
                                    readonly
                                    form={form}
                                    xs={2}
                                    xsHalf
                                    id={'percentagePrice'}
                                    value={fixedNumber(percentagePriceCalc)}
                                    label="Price"
                                    placeholder="Price"
                                    validate="positive-number"
                                // The component should automatically set fieldType to "input"
                                />
                                {!props.viewOnly && (
                                    <IconButton sx={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }}>
                                        <EditOutlinedIcon sx={{ color: '#515151' }} />
                                    </IconButton>
                                )}

                                {!props.viewOnly &&
                                    <IconButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemove(expenseKey);
                                        }}
                                        sx={{ '&:hover .MuiSvgIcon-root': { color: '#DD0505' } }}
                                    >
                                        <DeleteForeverIcon sx={{ color: '#515151' }} />
                                    </IconButton>
                                }
                            </F.PageForm>

                        );
                    })}

                    {(session?.user && permissionsSet?.has?.('EST_EDT_OTHR_XPNS') && !props.viewOnly) &&
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 2 }}>
                            <Button onClick={handleAddExpense} variant="contained" sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                {t("Add expense type")}
                            </Button>
                        </Box>
                    }
                    </Box>
                </EstimateRootAccordionDetails>
            </EstimateRootAccordion>
        </Box>
    );

}
