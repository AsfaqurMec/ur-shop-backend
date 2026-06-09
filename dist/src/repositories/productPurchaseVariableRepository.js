"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findVariablesWithOptionsByProductId = findVariablesWithOptionsByProductId;
exports.deleteVariablesForProduct = deleteVariablesForProduct;
exports.replaceVariablesForProduct = replaceVariablesForProduct;
const models_1 = require("../database/models");
const counter_1 = require("../database/counter");
function toVariableRow(doc) {
    return {
        id: Number(doc.id),
        product_id: Number(doc.product_id),
        var_key: String(doc.var_key),
        label: String(doc.label),
        kind: doc.kind === 'email' ? 'email' : 'select',
        enabled: Number(doc.enabled ?? 1),
        required: Number(doc.required ?? 1),
        sort_order: Number(doc.sort_order ?? 0),
    };
}
function toOptionRow(doc) {
    return {
        id: Number(doc.id),
        variable_id: Number(doc.variable_id),
        option_key: String(doc.option_key),
        label: String(doc.label),
        price_adjustment: Number(doc.price_adjustment ?? 0),
        sort_order: Number(doc.sort_order ?? 0),
    };
}
async function findVariablesWithOptionsByProductId(productId) {
    const variables = await models_1.ProductPurchaseVariableModel.find({ product_id: productId })
        .sort({ sort_order: 1, id: 1 })
        .lean();
    const variableRows = variables.map(toVariableRow);
    if (variableRows.length === 0)
        return [];
    const options = await models_1.ProductPurchaseVariableOptionModel.find({
        variable_id: { $in: variableRows.map((v) => v.id) },
    })
        .sort({ sort_order: 1, id: 1 })
        .lean();
    const byVar = new Map();
    for (const option of options.map(toOptionRow)) {
        const list = byVar.get(option.variable_id) ?? [];
        list.push(option);
        byVar.set(option.variable_id, list);
    }
    return variableRows.map((variable) => ({ ...variable, options: byVar.get(variable.id) ?? [] }));
}
async function deleteVariablesForProduct(_conn, productId) {
    const variables = await models_1.ProductPurchaseVariableModel.find({ product_id: productId }).select({ id: 1 }).lean();
    const ids = variables.map((v) => Number(v.id));
    await models_1.ProductPurchaseVariableOptionModel.deleteMany({ variable_id: { $in: ids } });
    await models_1.ProductPurchaseVariableModel.deleteMany({ product_id: productId });
}
async function replaceVariablesForProduct(conn, productId, variables) {
    await deleteVariablesForProduct(conn, productId);
    for (const variable of variables) {
        const variableId = await (0, counter_1.nextId)('product_purchase_variables');
        await models_1.ProductPurchaseVariableModel.create({
            id: variableId,
            product_id: productId,
            var_key: variable.var_key,
            label: variable.label,
            kind: variable.kind,
            enabled: variable.enabled ? 1 : 0,
            required: variable.required ? 1 : 0,
            sort_order: variable.sort_order,
        });
        if (variable.kind === 'select') {
            for (const option of variable.options) {
                await models_1.ProductPurchaseVariableOptionModel.create({
                    id: await (0, counter_1.nextId)('product_purchase_variable_options'),
                    variable_id: variableId,
                    option_key: option.option_key,
                    label: option.label,
                    price_adjustment: option.price_adjustment,
                    sort_order: option.sort_order,
                });
            }
        }
    }
}
//# sourceMappingURL=productPurchaseVariableRepository.js.map