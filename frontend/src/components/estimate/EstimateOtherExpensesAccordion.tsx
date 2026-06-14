"use client";

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField, Typography } from "@mui/material";
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
    disableEditIcons?: boolean;
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
    const [editDialog, setEditDialog] = React.useState<{ open: boolean; type: 'percentage' | 'price'; expenseKey: string; inputValue: string }>({ open: false, type: 'percentage', expenseKey: '', inputValue: '' });

    const openEditDialog = (type: 'percentage' | 'price', expenseKey: string, currentValue: number) => {
        setEditDialog({ open: true, type, expenseKey, inputValue: String(currentValue) });
    };

    const handleEditConfirm = async () => {
        const val = parseFloat(editDialog.inputValue);
        if (!isNaN(val)) {
            let fieldValue: string;
            if (editDialog.type === 'price') {
                const totalCost = data?.totalCost ?? 0;
                fieldValue = totalCost > 0 ? String(fixedNumber((val / totalCost) * 100)) : '0';
            } else {
                fieldValue = String(val);
            }
            const result = await Api.requestSession<any>({
                command: 'estimate/update_other_expenses_value',
                args: { estimateId: props.estimateId, fieldKey: editDialog.expenseKey, fieldValue },
            });
            setData(result);
            GD.pubsub_.dispatch(GD.estimateDataChangeId);
            GD.pubsub_.dispatch(GD.estimateCostChangedId);
            setDataRequested(false);
        }
        setEditDialog({ open: false, type: 'percentage', expenseKey: '', inputValue: '' });
    };

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
                        '& .MuiPaper-root': { boxShadow: 'none', backgroundColor: 'transparent', border: 'none', paddingTop: '10px', paddingBottom: '10px' },
                        '& .MuiInputBase-root': { backgroundColor: '#F5F9F9', height: '45px' },
                        '& .MuiInputBase-input': { paddingTop: '8px', paddingBottom: '8px' },
                        '& .MuiOutlinedInput-input': { padding: '8px 14px' },
                        '& .MuiSelect-select': { paddingTop: '8px', paddingBottom: '8px' },
                        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00ABBE' },
                        '& .MuiFormLabel-root.Mui-focused': { color: '#00ABBE' },
                        '& .MuiSelect-root.Mui-focused + .MuiOutlinedInput-notchedOutline': { borderColor: '#00ABBE' },
                        '& .MuiIconButton-colorInherit': { color: '#515151' },
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
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', width: '100%', minWidth: 0, gap: 1, pr: 1, borderRadius: 1, '&:hover': { backgroundColor: '#E8EFEF' } }}>
                                {/* Left: Cost Type — 50% of row */}
                                <Box sx={{ width: '50%', flexShrink: 1, minWidth: 0, overflow: 'hidden' }}>
                                    <F.PageForm form={form} size="xl" onFieldUpdate={handleChange} slotProps={{ paper: { sx: { width: '100%', maxWidth: '100%', minWidth: 0, py: '10px' } } }}>
                                        {(session?.user && permissionsSet?.has?.('EST_EDT_OTHR_XPNS') && !props.viewOnly)
                                            ? props.disableEditIcons
                                                ? <Box sx={{ pointerEvents: 'none', width: '100%', '& .MuiAutocomplete-popupIndicator': { display: 'none' } }}>
                                                    <F.SelectField form={form} xs={12} id={`${expenseKey}-${index}`} items={filteredExpenseItems} value={t(expenseKey) ?? "typeOfCost"} label="Type of cost" />
                                                  </Box>
                                                : <F.SelectField form={form} xs={12} id={`${expenseKey}-${index}`} items={filteredExpenseItems} value={t(expenseKey) ?? "typeOfCost"} label="Type of cost" />
                                            : <F.InputText form={form} xs={12} id={`${expenseKey}-${index}`} value={t(expenseKey === 'typeOfCost' ? "" : t(getEstimateOtherExpenseName(expenseKey)))} label={expenseKey === 'typeOfCost' ? "" : t(getEstimateOtherExpenseName(expenseKey))} placeholder={expenseKey === 'typeOfCost' ? "" : t(getEstimateOtherExpenseName(expenseKey))} />
                                        }
                                    </F.PageForm>
                                </Box>
                                {/* Right: Percentage + edit + Price + edit — identical layout for both */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                                    <TextField label={t('Percentage (%)')} value={expenseValue === 0 ? '0' : expenseValue} size="small" inputProps={{ readOnly: true }} sx={{ width: 150, '& .MuiInputBase-root': { backgroundColor: '#F5F9F9', height: '45px' }, '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00ABBE' } }} />
                                    {!(props.viewOnly || props.disableEditIcons) && (
                                        <IconButton onClick={() => openEditDialog('percentage', expenseKey, expenseValue)} sx={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }}>
                                            <EditOutlinedIcon sx={{ color: '#515151' }} />
                                        </IconButton>
                                    )}
                                    <TextField label={t('Amount AMD')} value={fixedNumber(percentagePriceCalc)} size="small" inputProps={{ readOnly: true }} sx={{ width: 170, '& .MuiInputBase-root': { backgroundColor: '#F5F9F9', height: '45px' }, '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#00ABBE' } }} />
                                    {!(props.viewOnly || props.disableEditIcons) && (
                                        <IconButton onClick={() => openEditDialog('price', expenseKey, percentagePriceCalc)} sx={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }}>
                                            <EditOutlinedIcon sx={{ color: '#515151' }} />
                                        </IconButton>
                                    )}
                                </Box>
                                {/* Delete — pushed to far right edge */}
                                {!(props.viewOnly || props.disableEditIcons) && (
                                    <IconButton onClick={(e) => { e.stopPropagation(); onRemove(expenseKey); }} sx={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, marginLeft: 'auto', '&:hover .MuiSvgIcon-root': { color: '#DD0505' } }}>
                                        <DeleteForeverIcon sx={{ color: '#515151' }} />
                                    </IconButton>
                                )}
                            </Box>
                        );
                    })}

                    {(session?.user && permissionsSet?.has?.('EST_EDT_OTHR_XPNS') && !props.viewOnly && !props.disableEditIcons) &&
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 2 }}>
                            <Button onClick={handleAddExpense} variant="contained" sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                {t("Add expense type")}
                            </Button>
                        </Box>
                    }
                    </Box>
                </EstimateRootAccordionDetails>
            </EstimateRootAccordion>

            {/* Unified edit dialog for Percentage and Price */}
            <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, type: 'percentage', expenseKey: '', inputValue: '' })} PaperProps={{ sx: { minWidth: 300 } }}>
                <DialogTitle>{editDialog.type === 'price' ? t('Edit Price') : t('Edit Percentage')}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        label={editDialog.type === 'price' ? t('Amount AMD') : t('Percentage (%)')}
                        type="number"
                        value={editDialog.inputValue}
                        onChange={(e) => setEditDialog((prev) => ({ ...prev, inputValue: e.target.value }))}
                        sx={{ mt: 1, minWidth: 250 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialog({ open: false, type: 'percentage', expenseKey: '', inputValue: '' })}>{t('Cancel')}</Button>
                    <Button variant="contained" onClick={handleEditConfirm}>{t('Confirm')}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );

}
