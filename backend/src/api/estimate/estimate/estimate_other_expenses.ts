import * as Db from '@/db';

import { requireQueryParam } from '../../../tsback/req/req_params';
import { registerApiSession } from '../../../server/register';
import { respondJson, respondJsonData } from '../../../tsback/req/req_response';
import { ObjectId } from 'mongodb';
import { Permissions } from '@src/tsmudbase/permissions_setup';
import { verify } from '../../../tslib/verify';
import { requireMongoIdParam } from '@/tsback/mongodb/mongodb_params';
import { calcEstimateOtherExpensesCost } from '@/api/estimate/estimate/estimate_calc_prices';



registerApiSession('estimate/update_other_expenses_key', async (req, res, session) => {
    // session.assertPermission(Permissions.EstimateEditInInformation);

    // Extract parameters.
    const estimateId = requireMongoIdParam(req, 'estimateId');
    const originalKey = requireQueryParam(req, 'originalKey');
    const newKey = requireQueryParam(req, 'newKey');

    // log_.info('Updating expense key from:', originalKey, 'to:', newKey);

    const estimates = Db.getEstimatesCollection();
    const estimate = await estimates.findOne({ _id: estimateId });
    verify(estimate, 'Estimate not found');

    // Ensure otherExpenses is an array.
    const expenses: any[] = Array.isArray(estimate?.otherExpenses) ? estimate.otherExpenses : [];

    // Check if an expense with newKey already exists.
    const newKeyExists = expenses.some(expense => Object.keys(expense).includes(newKey));
    verify(!newKeyExists, `Expense with key "${newKey}" already exists.`);

    // Find the expense object with the original key.
    const index = expenses.findIndex(expense => Object.keys(expense).includes(originalKey));
    verify(index !== -1, `Expense with key "${originalKey}" not found.`);

    // If keys are different, update the expense by replacing the original key with the new key.
    if (originalKey !== newKey) {
        const value = expenses[index][originalKey];
        delete expenses[index][originalKey];
        expenses[index][newKey] = value;
    }

    // Update the document in the database.
    const result = await estimates.updateOne({ _id: estimateId }, { $set: { otherExpenses: expenses } });


    respondJsonData(res, result);
});


registerApiSession('estimate/update_other_expenses_value', async (req, res, session) => {
    // Ensure the user has permission.
    // session.assertPermission(Permissions.EstimateEditInInformation);

    // Extract parameters.
    const estimateId = requireMongoIdParam(req, 'estimateId');
    const fieldKey = requireQueryParam(req, 'fieldKey');
    const fieldValueString = requireQueryParam(req, 'fieldValue');

    // log_.info('Updating expense value for key:', fieldKey, 'with raw value:', fieldValueString);

    // Parse the field value as a double.
    const fieldValue = parseFloat(fieldValueString);
    verify(!Number.isNaN(fieldValue), 'Please enter a valid number for expense value');

    const estimates = Db.getEstimatesCollection();
    const estimate = (await estimates.findOne({ _id: estimateId }))!;
    verify(estimate, 'Estimate not found');

    // Ensure that otherExpenses is an array.
    const expenses: any[] = Array.isArray(estimate.otherExpenses) ? estimate.otherExpenses : [];

    // Find the expense object with the provided key.
    const index = expenses.findIndex(expense => Object.keys(expense).includes(fieldKey));
    verify(index !== -1, `Expense with key "${fieldKey}" not found.`);

    // Update the value for that key with the double value.
    expenses[index][fieldKey] = fieldValue;


    // let otherExpensesSum = 0;
    // if (Array.isArray(expenses)) {
    //     for (const expense of expenses) {
    //         const keys = Object.keys(expense);
    //         if (keys.length > 0) {
    //             const expenseValue = Number(expense[keys[0]]) || 0;
    //             otherExpensesSum += expenseValue;
    //         }
    //     }
    // }

    const otherExpensesCost = calcEstimateOtherExpensesCost(estimate);

    const totalCost = estimate.totalCost ?? 0;
    // const totalCostWithOtherExpenses = totalCost + totalCost * (otherExpensesSum / 100);
    const totalCostWithOtherExpenses = totalCost + otherExpensesCost;

    // log_.info('est', estimate)

    // Update the document in the database.
    const result = await estimates.updateOne(
        { _id: estimateId },
        { $set: { totalCostWithOtherExpenses: totalCostWithOtherExpenses, otherExpenses: expenses } }
    );
   

    respondJson(res, result);
});




registerApiSession("estimate/add_item_in_other_expenses", async (req, res, session) => {
    // Ensure the user has permission to update.
    session.assertPermission(Permissions.EstimateEditInformation);

    const estimateId = new ObjectId(requireQueryParam(req, "estimateId"));
    const estimates = Db.getEstimatesCollection();

    // Fetch the estimate document.
    const estimate = await estimates.findOne({ _id: estimateId });
    verify(estimate, "Estimate not found");

    // Ensure otherExpenses is an array.
    const expenses: any[] = Array.isArray(estimate?.otherExpenses) ? estimate.otherExpenses : [];

    // Check if an expense with key "typeOfCost" already exists.
    const exists = expenses.some(expense => Object.keys(expense).includes("typeOfCost"));
    verify(!exists, req.t('validate.expense_type_exists'));

    // Push the new expense object with default value 0.
    await estimates.updateOne(
        { _id: estimateId },
        { $push: { otherExpenses: { typeOfCost: 0 } } } as any
    );

    // Return the updated estimate.
    const updatedEstimate = await estimates.findOne({ _id: estimateId });
    respondJsonData(res, updatedEstimate);
});


registerApiSession('estimate/remove_other_expenses', async (req, res, session) => {

    const estimateId = new ObjectId(requireQueryParam(req, 'estimateId'));
    const fieldKey = requireQueryParam(req, 'otherExpensesKey');

    log_.info('Removing other expense with key:', fieldKey);

    const estimates = Db.getEstimatesCollection();

    const estimate = await estimates.findOne({ _id: estimateId });
    verify(estimate, 'Estimate not found');

    const expenses: any[] = Array.isArray(estimate?.otherExpenses) ? estimate.otherExpenses : [];

    const index = expenses.findIndex(expense => Object.keys(expense).includes(fieldKey));
    verify(index !== -1, `Expense with key "${fieldKey}" not found.`);

    expenses.splice(index, 1);

    let otherExpensesSum = 0;
    for (const expense of expenses) {
        const keys = Object.keys(expense);
        if (keys.length > 0) {
            const val = Number(expense[keys[0]]) || 0;
            otherExpensesSum += val;
        }
    }

    const baseTotal = Number(estimate?.totalCost) || 0;
    const totalCostWithOtherExpenses = baseTotal + baseTotal * (otherExpensesSum / 100);

    await estimates.updateOne(
        { _id: estimateId },
        { $set: { otherExpenses: expenses, totalCostWithOtherExpenses } }
    );

    const updatedEstimate = await estimates.findOne({ _id: estimateId });
    respondJsonData(res, updatedEstimate);
});
