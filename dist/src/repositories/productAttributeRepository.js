"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAttributesWithValuesByProductId = findAttributesWithValuesByProductId;
exports.productHasAttributes = productHasAttributes;
exports.replaceAttributesForProduct = replaceAttributesForProduct;
const models_1 = require("../database/models");
const counter_1 = require("../database/counter");
function toAttrRow(doc) {
    return {
        id: Number(doc.id),
        product_id: Number(doc.product_id),
        attr_key: String(doc.attr_key),
        name: String(doc.name),
        kind: doc.kind,
        visible_on_page: Number(doc.visible_on_page ?? 1),
        used_for_variations: Number(doc.used_for_variations ?? 0),
        sort_order: Number(doc.sort_order ?? 0),
    };
}
function toValueRow(doc) {
    return {
        id: Number(doc.id),
        attribute_id: Number(doc.attribute_id),
        value_key: String(doc.value_key),
        label: String(doc.label),
        sort_order: Number(doc.sort_order ?? 0),
    };
}
async function findAttributesWithValuesByProductId(productId) {
    const attrs = await models_1.ProductAttributeModel.find({ product_id: productId })
        .sort({ sort_order: 1, id: 1 })
        .lean();
    if (attrs.length === 0)
        return [];
    const attrRows = attrs.map(toAttrRow);
    const ids = attrRows.map((a) => a.id);
    const values = await models_1.ProductAttributeValueModel.find({ attribute_id: { $in: ids } })
        .sort({ sort_order: 1, id: 1 })
        .lean();
    const byAttr = new Map();
    for (const value of values.map(toValueRow)) {
        const list = byAttr.get(value.attribute_id) ?? [];
        list.push(value);
        byAttr.set(value.attribute_id, list);
    }
    return attrRows.map((attr) => ({ ...attr, values: byAttr.get(attr.id) ?? [] }));
}
async function productHasAttributes(productId) {
    return Boolean(await models_1.ProductAttributeModel.exists({ product_id: productId }));
}
async function replaceAttributesForProduct(_conn, productId, inputs) {
    const oldAttrs = await models_1.ProductAttributeModel.find({ product_id: productId }).select({ id: 1 }).lean();
    const oldIds = oldAttrs.map((attr) => Number(attr.id));
    await models_1.ProductAttributeValueModel.deleteMany({ attribute_id: { $in: oldIds } });
    await models_1.ProductAttributeModel.deleteMany({ product_id: productId });
    for (const attr of inputs) {
        const attrId = await (0, counter_1.nextId)('product_attributes');
        await models_1.ProductAttributeModel.create({
            id: attrId,
            product_id: productId,
            attr_key: attr.attr_key,
            name: attr.name,
            kind: attr.kind,
            visible_on_page: attr.visible_on_page ? 1 : 0,
            used_for_variations: attr.used_for_variations ? 1 : 0,
            sort_order: attr.sort_order,
        });
        for (const value of attr.values) {
            await models_1.ProductAttributeValueModel.create({
                id: await (0, counter_1.nextId)('product_attribute_values'),
                attribute_id: attrId,
                value_key: value.value_key,
                label: value.label,
                sort_order: value.sort_order,
            });
        }
    }
}
//# sourceMappingURL=productAttributeRepository.js.map