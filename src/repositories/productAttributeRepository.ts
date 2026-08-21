import { ProductAttributeModel, ProductAttributeValueModel } from '../database/models';
import { nextId } from '../database/counter';

export type AttributeKind = 'select' | 'text' | 'email';

export interface ProductAttributeRow {
  id: number;
  product_id: number;
  attr_key: string;
  name: string;
  kind: AttributeKind;
  visible_on_page: number;
  used_for_variations: number;
  sort_order: number;
}

export interface ProductAttributeValueRow {
  id: number;
  attribute_id: number;
  value_key: string;
  label: string;
  color_code?: string | null;
  sort_order: number;
}

export interface AttributeWithValues extends ProductAttributeRow {
  values: ProductAttributeValueRow[];
}

export interface AttributeReplaceInput {
  attr_key: string;
  name: string;
  kind: AttributeKind;
  visible_on_page: boolean;
  used_for_variations: boolean;
  sort_order: number;
  values: Array<{ value_key: string; label: string; color_code?: string | null; sort_order: number }>;
}

function toAttrRow(doc: any): ProductAttributeRow {
  return {
    id: Number(doc.id),
    product_id: Number(doc.product_id),
    attr_key: String(doc.attr_key),
    name: String(doc.name),
    kind: doc.kind as AttributeKind,
    visible_on_page: Number(doc.visible_on_page ?? 1),
    used_for_variations: Number(doc.used_for_variations ?? 0),
    sort_order: Number(doc.sort_order ?? 0),
  };
}

function toValueRow(doc: any): ProductAttributeValueRow {
  return {
    id: Number(doc.id),
    attribute_id: Number(doc.attribute_id),
    value_key: String(doc.value_key),
    label: String(doc.label),
    color_code: doc.color_code ? String(doc.color_code) : null,
    sort_order: Number(doc.sort_order ?? 0),
  };
}

export async function findAttributesWithValuesByProductId(productId: number): Promise<AttributeWithValues[]> {
  const attrs = await ProductAttributeModel.find({ product_id: productId })
    .sort({ sort_order: 1, id: 1 })
    .lean();
  if (attrs.length === 0) return [];
  const attrRows = attrs.map(toAttrRow);
  const ids = attrRows.map((a) => a.id);
  const values = await ProductAttributeValueModel.find({ attribute_id: { $in: ids } })
    .sort({ sort_order: 1, id: 1 })
    .lean();
  const byAttr = new Map<number, ProductAttributeValueRow[]>();
  for (const value of values.map(toValueRow)) {
    const list = byAttr.get(value.attribute_id) ?? [];
    list.push(value);
    byAttr.set(value.attribute_id, list);
  }
  return attrRows.map((attr) => ({ ...attr, values: byAttr.get(attr.id) ?? [] }));
}

export async function productHasAttributes(productId: number): Promise<boolean> {
  return Boolean(await ProductAttributeModel.exists({ product_id: productId }));
}

export async function replaceAttributesForProduct(
  _conn: unknown,
  productId: number,
  inputs: AttributeReplaceInput[]
): Promise<void> {
  const oldAttrs = await ProductAttributeModel.find({ product_id: productId }).select({ id: 1 }).lean();
  const oldIds = oldAttrs.map((attr: any) => Number(attr.id));
  await ProductAttributeValueModel.deleteMany({ attribute_id: { $in: oldIds } });
  await ProductAttributeModel.deleteMany({ product_id: productId });

  for (const attr of inputs) {
    const attrId = await nextId('product_attributes');
    await ProductAttributeModel.create({
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
      await ProductAttributeValueModel.create({
        id: await nextId('product_attribute_values'),
        attribute_id: attrId,
        value_key: value.value_key,
        label: value.label,
        color_code: value.color_code ?? null,
        sort_order: value.sort_order,
      });
    }
  }
}
