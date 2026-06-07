import { ProductPurchaseVariableModel, ProductPurchaseVariableOptionModel } from '../database/models';
import { nextId } from '../database/counter';

export interface PurchaseVariableRow {
  id: number;
  product_id: number;
  var_key: string;
  label: string;
  kind: 'select' | 'email';
  enabled: number;
  required: number;
  sort_order: number;
}

export interface PurchaseVariableOptionRow {
  id: number;
  variable_id: number;
  option_key: string;
  label: string;
  price_adjustment: number;
  sort_order: number;
}

export interface PurchaseVariableWithOptions extends PurchaseVariableRow {
  options: PurchaseVariableOptionRow[];
}

function toVariableRow(doc: any): PurchaseVariableRow {
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

function toOptionRow(doc: any): PurchaseVariableOptionRow {
  return {
    id: Number(doc.id),
    variable_id: Number(doc.variable_id),
    option_key: String(doc.option_key),
    label: String(doc.label),
    price_adjustment: Number(doc.price_adjustment ?? 0),
    sort_order: Number(doc.sort_order ?? 0),
  };
}

export async function findVariablesWithOptionsByProductId(productId: number): Promise<PurchaseVariableWithOptions[]> {
  const variables = await ProductPurchaseVariableModel.find({ product_id: productId })
    .sort({ sort_order: 1, id: 1 })
    .lean();
  const variableRows = variables.map(toVariableRow);
  if (variableRows.length === 0) return [];

  const options = await ProductPurchaseVariableOptionModel.find({
    variable_id: { $in: variableRows.map((v) => v.id) },
  })
    .sort({ sort_order: 1, id: 1 })
    .lean();
  const byVar = new Map<number, PurchaseVariableOptionRow[]>();
  for (const option of options.map(toOptionRow)) {
    const list = byVar.get(option.variable_id) ?? [];
    list.push(option);
    byVar.set(option.variable_id, list);
  }
  return variableRows.map((variable) => ({ ...variable, options: byVar.get(variable.id) ?? [] }));
}

export async function deleteVariablesForProduct(_conn: unknown, productId: number): Promise<void> {
  const variables = await ProductPurchaseVariableModel.find({ product_id: productId }).select({ id: 1 }).lean();
  const ids = variables.map((v: any) => Number(v.id));
  await ProductPurchaseVariableOptionModel.deleteMany({ variable_id: { $in: ids } });
  await ProductPurchaseVariableModel.deleteMany({ product_id: productId });
}

export interface AdminVariableInput {
  var_key: string;
  label: string;
  kind: 'select' | 'email';
  enabled: boolean;
  required: boolean;
  sort_order: number;
  options: Array<{
    option_key: string;
    label: string;
    price_adjustment: number;
    sort_order: number;
  }>;
}

export async function replaceVariablesForProduct(
  conn: unknown,
  productId: number,
  variables: AdminVariableInput[]
): Promise<void> {
  await deleteVariablesForProduct(conn, productId);
  for (const variable of variables) {
    const variableId = await nextId('product_purchase_variables');
    await ProductPurchaseVariableModel.create({
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
        await ProductPurchaseVariableOptionModel.create({
          id: await nextId('product_purchase_variable_options'),
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
