/**
 * Unified API urls
 */
export const UacURL = {
    foundation: {
      createConnection: () => "/versioned/connections/create",
      getConnection: (accessToken: string) => `/versioned/connections/access_token?access_token=${accessToken}&force_fetch=true`,
      getConnectionCredentials: (accessToken: string) => `/versioned/connections/credentials?access_token=${accessToken}`,
      getConnectionStatus: (accessToken: string) => `/versioned/connections/status?access_token=${accessToken}`,
      getAllItems: (accessToken: string, cursor: string, limit: number) =>
        `/versioned/accounting/items?access_token=${accessToken}&cursor=${cursor}&limit=${limit}`,
      createItem: (accessToken: string) => `/versioned/accounting/items?access_token=${accessToken}`,
      updateItem: (accessToken: string, itemId: string) => `/versioned/accounting/items/${itemId}?access_token=${accessToken}`,
      getAllAccounts: (accessToken: string, cursor: string, limit: number) =>
        `/versioned/accounting/accounts?access_token=${accessToken}&cursor=${cursor}&limit=${limit}`,
      createAccount: (accessToken: string) => `/versioned/accounting/accounts?access_token=${accessToken}`,
      updateAccount: (accessToken: string, accountId: string) => `/versioned/accounting/accounts/${accountId}?access_token=${accessToken}`,
      getAllSubsidiaries: (accessToken: string, cursor: string, limit: number) =>
        `/versioned/accounting/subsidiaries?access_token=${accessToken}&cursor=${cursor}&limit=${limit}`,
    },
    receivable: {
      getAllCustomers: (accessToken: string, cursor: string, limit: number) =>
        `/versioned/accounting/customers?access_token=${accessToken}&cursor=${cursor}&limit=${limit}`,
      createCustomer: (accessToken: string) => `/versioned/accounting/customers?access_token=${accessToken}`,
      updateCustomer: (accessToken: string, customerId: string) =>
        `/versioned/accounting/customers/${customerId}?access_token=${accessToken}`,
      getAllInvoices: (accessToken: string, cursor: string, limit: number) =>
        `/versioned/accounting/invoices?access_token=${accessToken}&cursor=${cursor}&limit=${limit}`,
      createInvoice: (accessToken: string) => `/versioned/accounting/invoices?access_token=${accessToken}`,
      updateInvoice: (accessToken: string, id: string) => `/versioned/accounting/invoices/${id}?access_token=${accessToken}`,
      getInvoicePDFById: (accessToken: string, id: string) => `/versioned/accounting/invoices/${id}/pdf?access_token=${accessToken}`,
    },
    payable: {
      getAllVendors: (accessToken: string, cursor: string, limit: number) =>
        `/versioned/accounting/vendors?access_token=${accessToken}&cursor=${cursor}&limit=${limit}`,
      createVendor: (accessToken: string) => `/versioned/accounting/vendors?access_token=${accessToken}`,
      updateVendor: (accessToken: string, customerId: string) => `/versioned/accounting/vendors/${customerId}?access_token=${accessToken}`,
      getAllBills: (accessToken: string, cursor: string, limit: number) =>
        `/versioned/accounting/bills?access_token=${accessToken}&cursor=${cursor}&limit=${limit}`,
      createBill: (accessToken: string) => `/versioned/accounting/bills?access_token=${accessToken}`,
      updateBill: (accessToken: string, billId: string) => `/versioned/accounting/bills/${billId}?access_token=${accessToken}`,
      getAllPurchaseOrders: (accessToken: string, cursor: string, limit: number) =>
        `/versioned/accounting/purchase_orders?access_token=${accessToken}&cursor=${cursor}&limit=${limit}`,
      createPurchaseOrder: (accessToken: string) => `/versioned/accounting/purchase_orders?access_token=${accessToken}`,
      getAllBillPayments: (accessToken: string, cursor: string, limit: number) =>
        `/versioned/accounting/bill_payments?access_token=${accessToken}&cursor=${cursor}&limit=${limit}`,
      createBillPayment: (accessToken: string) => `/versioned/accounting/bill_payment?access_token=${accessToken}`,
      updateBillPayment: (accessToken: string, billPaymentId: string) =>
        `/versioned/accounting/bill_payment/${billPaymentId}?access_token=${accessToken}`,
    },
  };
  