/** Shown on the pay page for manual / bank transfer (demo values in seed; replace in production). */
export interface BankTransferDetailsPublic {
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  /** Domestic routing / sort code when applicable */
  routing_number?: string | null;
  iban?: string | null;
  swift_bic?: string | null;
  /** e.g. use order number in the transfer memo */
  payment_reference_hint?: string | null;
}

export interface PaymentMethodPublic {
  id: string;
  name: string;
  description: string;
  gateway: string;
  bank_details?: BankTransferDetailsPublic | null;
  /** Present when loaded from payment_options. */
  kind?: 'manual' | 'merchant';
  manual_flow?: 'mfs_reference' | 'bank_proof' | null;
  ui_brand?: string | null;
}

export type PaymentProofStatus = 'pending' | 'verified' | 'rejected';

export interface PaymentProofRow {
  id: number;
  order_id: number;
  user_id: number;
  sender_number: string | null;
  transaction_id: string | null;
  paid_amount: number | null;
  file_path: string | null;
  status: PaymentProofStatus;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentProofPublic {
  id: number;
  order_id: number;
  sender_number: string | null;
  transaction_id: string | null;
  paid_amount: number | null;
  file_path: string | null;
  status: PaymentProofStatus;
  created_at: string;
  updated_at: string;
}

/** Admin list rows (includes submitter email and order snapshot for amount / context). */
export interface PaymentProofAdmin extends PaymentProofPublic {
  user_id: number;
  user_email: string;
  order_number: string;
  order_total: number;
  order_currency: string;
}
