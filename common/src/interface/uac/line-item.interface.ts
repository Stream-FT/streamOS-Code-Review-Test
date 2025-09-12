export interface IAccountingLineItem {
    account_id: string | null;
    class_id: string | null;
    department_id: string | null;
    tax_rate_id: string | null;
    description: string | null;
    total_amount: number | null;
    item: IAccountingItem;
  }
  
  interface IAccountingItem {
    id: string;
    quantity: number | null;
    unit_amount: number | null;
  }
  
  export interface IAccountingInvoiceLineItem {
    platform_id: string;
    account_id: string;
    class_id: string | null;
    item_id: string | null;
    tax_rate_id: string | null;
    amount: string | null;
    description: string | null;
    discount_amount: string | null;
    discount_percentage: string | null;
    quantity: string | null;
    sub_total: string | null;
    tax_amount: string | null;
    unit_amount: string | null;
  }
  