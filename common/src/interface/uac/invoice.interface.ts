import { currency, uac_bill_status, uac_invoice_payment_type } from "@prisma/client";

import { IConnectionData } from "./connection-response.interface";
import { IAccountingInvoiceLineItem } from "./line-item.interface";

export interface IInvoice {
  id: string;
  platform_id: string;
  account_id: string | null;
  subsidiary_id: string | null;
  customer_id: string | null;
  due_date: string | null;
  issue_date: string | null;
  status: uac_bill_status | null;
  currency_code: currency | null;
  document_number: string | null;
  memo: string | null;
  amount_due: number | null;
  sub_total: number | string | null;
  tax_amount: number | null;
  total_amount: number | null;
  total_discount: number | null;
  line_items: IAccountingInvoiceLineItem[];
  linked_payments: IInvoicePayment[];
  created_at: string;
  updated_at: string;
  platform_data: Record<string, any>;
}

export interface IInvoicesResponse {
  invoices: IInvoice[];
  next_cursor?: string;
  connection: IConnectionData;
}

export interface IInvoiceResponse {
  invoice: IInvoice;
  connection: IConnectionData;
}

export interface IInvoiceEventData {
  type: string;
  code: string;
  connection_id: string;
  access_token: string;
  invoice: IInvoice;
}

export interface IInvoicePayment {
  id: string | null;
  date: string | null;
  amount: string | null;
  type: uac_invoice_payment_type;
}
