import { uac_bill_status } from "@prisma/client";
import axios from "axios";
import dotenv from "dotenv";
import dayjs from 'dayjs';

import { PLATFORM_CONFIGS } from "@common/constants/platform-config.constant";
import { IInvoice } from "@common/interface/uac/invoice.interface";
import { fetchConnectionCredentials } from "@common/service/uac.service";

dotenv.config();

const STATUS_MAPPING: Record<string, string> = {
  Draft: uac_bill_status.draft,
  "In Review": uac_bill_status.submitted,
  Open: uac_bill_status.open,
  Paid: uac_bill_status.paid,
  Canceled: uac_bill_status.void,
};

// Cache storage
const tokenCache: Record<string, { accessToken: string; expiresAt: number }> = {};

export const getAccessToken = async (organization: any) => {
  try {
    const cacheKey = organization.id;
    const cachedToken = tokenCache[cacheKey];
    const now = Date.now();

    if (cachedToken && cachedToken.expiresAt > now) {
      return cachedToken.accessToken;
    }

    const connectionCreds = await fetchConnectionCredentials(organization.uac_access_token, organization.uac_connection_id);

    const newAccessToken = connectionCreds.credential.access_token;
    const expiresIn = 3600 * 1000;

    tokenCache[cacheKey] = {
      accessToken: newAccessToken,
      expiresAt: now + expiresIn,
    };
    return newAccessToken;
  } catch (error) {
    console.log(`Error fetching QBO access token for organization ${organization.id} with error: ${error}`);
    throw error;
  }
};

export const fetchDeferralCode = async (organization: any, customFields: any) => {
  try{
    if(organization.id !== "2075f798-3bb1-4731-a6d4-a4a4ecc6753c") {
      console.log(`Organization ${organization.id} is not EDI organization. Skipping deferral code fetch.`);
      return "";
    }

    if(!customFields || !customFields.contract_start_date || !customFields.contract_end_date) {
      throw new Error("Custom fields 'contract_start_date' and 'contract_end_date' are required to fetch deferral code.");
    }
    console.log(`Fetching deferral code for organization ${organization.id} with custom fields: ${JSON.stringify(customFields)}`);
    // Calculate deferral period in months
    const startDate = new Date(customFields.contract_start_date);
    const endDate = new Date(customFields.contract_end_date);

    console.log(`Start Date: ${startDate.toISOString()}, End Date: ${endDate.toISOString()}`);


    let period_in_months = (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12 + 
                      (endDate.getUTCMonth() - startDate.getUTCMonth());

    // If the end day is >= start day, we have a full month
    // If the end day is < start day, we're in a partial month
    if (endDate.getUTCDate() >= startDate.getUTCDate()) {
        period_in_months += 1;
    }

    console.log(`Calculated deferral period in months: ${period_in_months}`);
  
    if (period_in_months <= 0) {
        throw new Error("Invalid contract period. Start date must be before end date.");
    }

    const targetCode = `${period_in_months}M DEFER`;
    const accessToken = await getAccessToken(organization);
    const platformConfig = PLATFORM_CONFIGS.DYNAMICS365;
    const apiUrl = `${platformConfig.apiBaseUrl}/${platformConfig?.invoice?.endpoints?.fetchDeferralTemplateEDI(organization.uac_user_id, organization.uac_business_id)}`;
    console.log(`Fetching deferral template via Dynamics for organization ${organization.id} to URL: ${apiUrl}`);

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    const deferralTemplate = response.data.value;

    if (!deferralTemplate || deferralTemplate.length === 0) {
      throw new Error("No deferral template found in Dynamics.");
    }
    const deferralCode = deferralTemplate.find((template: any) =>
      new RegExp(`\\b${targetCode}\\b`).test(template.deferralCode)
    );
    if (!deferralCode) {
      throw new Error(`No deferral code found for period of ${period_in_months} months.`);
    }

    console.log(`Deferral code fetched successfully: ${deferralCode}`);
    return deferralCode.deferralCode;

  }  catch (error: any) {
    console.error(`Error fectching deferral template via Dynamics for organization ${organization.id}:`, error);
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw error.response.data;
      }
    }

    throw error;
  }
}

export const testPayloads = async(organization: any, invoiceData: any, customFields?: any) => {
  try{
    const salesInvoicePayload = payloadSalesInvoice(organization, invoiceData, customFields);
    const line_items = [];
    console.log(`Sales Invoice Payload: ${JSON.stringify(salesInvoicePayload)}`);

    if(!invoiceData.line_items || invoiceData.line_items.length === 0) {
      throw new Error("No line items provided for the invoice.");
    }
    const deferralCode = await fetchDeferralCode(organization, customFields);

    for(const line of invoiceData.line_items) {
      const lineType = typeof line.item === "object" && line.item !== null && !Array.isArray(line.item) ? "Item" : "Comment";
      const defCode = lineType === "Item" ? deferralCode : "";
      const salesInvoiceLinePayload = payloadSalesInvoiceLines(organization, lineType, line, defCode);
      line_items.push(salesInvoiceLinePayload);
      console.log(`Sales Invoice Payload: ${JSON.stringify(salesInvoicePayload)}`);
    }

    (salesInvoicePayload as any).line_items = line_items;

    return salesInvoicePayload;
    } catch (error: any) {
      throw error;
    }
  
};

export const payloadSalesInvoice = (organization: any, invoiceData: any, customFields?: any) => {
  try{
    if(!invoiceData){
      throw new Error("Invoice data is required to create sales invoice payload.");
    }

    if(!invoiceData.issue_date || !invoiceData.due_date || !invoiceData.customer_id) {
      throw new Error("Invoice data must include issue_date, due_date, and customer_id.");
    }

    if(organization.id === "2075f798-3bb1-4731-a6d4-a4a4ecc6753c" && (!customFields || !customFields.contract_start_date || !customFields.contract_end_date)) {
      throw new Error("Custom fields 'contract_start_date' and 'contract_end_date' are required for EDI organization.");
    }


    const today = new Date();
    const issueDate = new Date(invoiceData.issue_date);

    const invoiceDate = new Date(Math.max(today.getTime(), issueDate.getTime())).toISOString().slice(0, 10);

    return {
      postingDate: invoiceDate,
      invoiceDate: invoiceDate,
      ...(customFields.payment_terms && {
        dueDate: dayjs(invoiceDate).add(customFields.payment_terms, 'day').toISOString().slice(0, 10),
      }),
      customerId: invoiceData.customer_id,
      ...(organization.id === "2075f798-3bb1-4731-a6d4-a4a4ecc6753c" && {
        contractEndDate: new Date(customFields.contract_end_date).toISOString().slice(0, 10),
        contractStartDate: new Date(customFields.contract_start_date).toISOString().slice(0, 10),
      }),
    };
  } catch (error: any) {
    throw error;
  }
  
};

export const payloadSalesInvoiceLines = (organization: any, lineType: string, invoiceLinesData: any, deferralCode: string) => {
  try{
    if(lineType !== "Item" && lineType !== "Comment") {
      throw new Error(`Invalid line type: ${lineType}. Expected 'Item' or 'Comment'.`);
    }
    
    if(lineType === "Item" && (!invoiceLinesData?.item || !invoiceLinesData?.item?.quantity || !invoiceLinesData?.item?.unit_amount)) {
      throw new Error("Item line type requires item data with quantity and unit amount.");
    }
    if(lineType === "Item" && !(deferralCode || deferralCode === ""))
    {
      throw new Error("Deferral code is required for Item line type.");
    }
    if(lineType === "Comment" && deferralCode != "") {
      throw new Error("Deferral code should not be provided for Comment line type.");
    }
    const payload = {
      lineType: lineType,
      ...(lineType === "Item" && {
        quantity: invoiceLinesData?.item?.quantity,
        unitPrice: invoiceLinesData?.item?.unit_amount,  
        itemId: invoiceLinesData?.item?.id,
      }),
      ...(organization.id === "2075f798-3bb1-4731-a6d4-a4a4ecc6753c"
        ? {
            slgDescription: invoiceLinesData.description,
            deferralCode: deferralCode,
          }
        : {
          description: invoiceLinesData.description,
          }
      ),
     
    };
  
    return payload
  }  catch (error: any) {
    console.error(`Error creating sales invoice via Dynamics for organization ${organization.id}:`, error);
    throw error;
  }
  

}

export const createSalesInvoiceViaDynamics = async (organization: any, invoiceData: any, customFields?: any) => {
  try {
    const accessToken = await getAccessToken(organization);
    const platformConfig = PLATFORM_CONFIGS.DYNAMICS365;
    const apiUrl =
      organization.id === "2075f798-3bb1-4731-a6d4-a4a4ecc6753c"
        ? `${platformConfig.apiBaseUrl}/${platformConfig?.invoice?.endpoints?.createEDI(organization.uac_user_id, organization.uac_business_id)}`
        : `${platformConfig.apiBaseUrl}/${platformConfig?.invoice?.endpoints?.create(organization.uac_user_id, organization.uac_business_id)}`;

    
        
    const data = payloadSalesInvoice(organization, invoiceData, customFields);
    

    console.log(`Creating sales invoice via Dynamics for organization ${organization.id} to URL: ${apiUrl}`);
    console.log(`Data: ${JSON.stringify(data)}`);
    const response = await axios.post(apiUrl, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    console.log(`Sales invoice created via Dynamics for organization ${organization.id} with response: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error creating sales invoice via Dynamics for organization ${organization.id}:`, error);
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw error.response.data;
      }
    }

    throw error;
  }
};

export const createSalesInvoiceLinesViaDynamics = async (organization: any, invoiceId: string, invoiceLinesData: any, deferralCode: string) => {
  try {
    const accessToken = await getAccessToken(organization);
    const platformConfig = PLATFORM_CONFIGS.DYNAMICS365;
    const apiUrl =
      organization.id === "2075f798-3bb1-4731-a6d4-a4a4ecc6753c"
        ? `${platformConfig.apiBaseUrl}/${platformConfig?.invoice?.endpoints?.createLinesEDI(organization.uac_user_id, organization.uac_business_id, invoiceId)}`
        : `${platformConfig.apiBaseUrl}/${platformConfig?.invoice?.endpoints?.createLines(organization.uac_user_id, organization.uac_business_id, invoiceId)}`;

    const data = payloadSalesInvoiceLines(organization, "Item", invoiceLinesData, deferralCode);

    console.log(`Data for sales invoice line: ${JSON.stringify(data)}`);

    console.log(`Creating sales invoice lines via Dynamics for organization ${organization.id} to URL: ${apiUrl}`);

    const response = await axios.post(apiUrl, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error(`Error creating sales invoice via Dynamics for organization ${organization.id}:`, error);
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw error.response.data;
      }
    }
    throw error;
  }
};

export const createSalesInvoiceCommentsViaDynamics = async (organization: any, invoiceId: string, invoiceLinesData: any, deferralCode: string) => {
  try {
    const accessToken = await getAccessToken(organization);
    const platformConfig = PLATFORM_CONFIGS.DYNAMICS365;
    const apiUrl =
      organization.id === "2075f798-3bb1-4731-a6d4-a4a4ecc6753c"
        ? `${platformConfig.apiBaseUrl}/${platformConfig?.invoice?.endpoints?.createLinesEDI(organization.uac_user_id, organization.uac_business_id, invoiceId)}`
        : `${platformConfig.apiBaseUrl}/${platformConfig?.invoice?.endpoints?.createLines(organization.uac_user_id, organization.uac_business_id, invoiceId)}`;

    const data = payloadSalesInvoiceLines(organization, "Comment", invoiceLinesData, deferralCode ?? "");

    console.log(`Data for sales invoice line: ${JSON.stringify(data)}`);

    console.log(`Creating sales invoice lines via Dynamics for organization ${organization.id} to URL: ${apiUrl}`);

    const response = await axios.post(apiUrl, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error(`Error creating sales invoice via Dynamics for organization ${organization.id}:`, error);
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw error.response.data;
      }
    }

    throw error;
  }
};

export const salesInvoiceActions = async (organization: any, invoiceId: string, action: string) => {
  try {
    const normalizedAction = action.toLowerCase();
    if (normalizedAction === "draft") {
      console.log("Draft action selected. No operation performed.");
      return { status: "success", message: "Draft action no operation performed." };
    }

    const accessToken = await getAccessToken(organization);
    const platformConfig = PLATFORM_CONFIGS.DYNAMICS365;

    const boundAction = platformConfig.invoice?.boundActions?.[normalizedAction];

    if (!boundAction) {
      throw new Error(
        JSON.stringify({
          error_code: "INVALID_ACTION",
          error_message: `Unsupported invoice action: '${action}'`,
          status_code: 400,
        }),
      );
    }

    const apiUrl = `${platformConfig.apiBaseUrl}/${platformConfig?.invoice?.endpoints?.actions(organization.uac_user_id, organization.uac_business_id, invoiceId, boundAction)}`;
    console.log(`Performing '${boundAction}' action on invoice ${invoiceId} for organization ${organization.id} at URL: ${apiUrl}`);

    const response = await axios.post(
      apiUrl,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error: any) {
    console.error(`Error creating sales invoice via Dynamics for organization ${organization.id}:`, error);
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw error.response.data;
      }
    }

    throw error;
  }
};

export const fetchSalesInvoiceLinesViaDynamics = async (organization: any, invoiceId: string) => {
  try {
    const accessToken = await getAccessToken(organization);
    const platformConfig = PLATFORM_CONFIGS.DYNAMICS365;

    const apiUrl = `${platformConfig.apiBaseUrl}/${platformConfig?.invoice?.endpoints?.lines(organization.uac_user_id, organization.uac_business_id, invoiceId)}`;

    console.log(`Fetching sales invoice via Dynamics for organization ${organization.id} to URL: ${apiUrl}`);
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const line_items = response.data.value;

    if (!line_items || line_items.length === 0) {
      throw new Error("Failed to fetch sales invoice from Dynamics.");
    }
    return line_items;
  } catch (error: any) {
    console.error(`Error creating sales invoice via Dynamics for organization ${organization.id}:`, error);
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw error.response.data;
      }
    }

    throw error;
  }
};

export const fetchSalesInvoiceViaDynamics = async (organization: any, invoiceId: string) => {
  try {
    const accessToken = await getAccessToken(organization);
    const platformConfig = PLATFORM_CONFIGS.DYNAMICS365;
    const apiUrl = `${platformConfig.apiBaseUrl}/${platformConfig?.invoice?.endpoints?.fetch(organization.uac_user_id, organization.uac_business_id, invoiceId)}`;

    console.log(`Fetching sales invoice via Dynamics for organization ${organization.id} to URL: ${apiUrl}`);
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const invoice = response.data;

    if (!invoice || !invoice.id) {
      throw new Error("Failed to fetch sales invoice from Dynamics.");
    }
    return invoice;
  } catch (error: any) {
    console.error(`Error creating sales invoice via Dynamics for organization ${organization.id}:`, error);
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw error.response.data;
      }
    }

    throw error;
  }
};

export const fetchSalesInvoicePdfViaDynamics = async (organization: any, invoiceId: string) => {
  try {
    const accessToken = await getAccessToken(organization);
    const platformConfig = PLATFORM_CONFIGS.DYNAMICS365;
    const apiUrl = `${platformConfig.apiBaseUrl}/${platformConfig?.invoice?.endpoints?.pdf(organization.uac_user_id, organization.uac_business_id, invoiceId)}`;

    console.log(`Fetching sales invoice via Dynamics for organization ${organization.id} to URL: ${apiUrl}`);
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log(
      `Sales invoice PDF fetched via Dynamics for organization ${organization.id} with response: ${JSON.stringify(response.data)}`,
    );

    const invoice = response.data;

    if (!invoice || !invoice.id) {
      throw new Error("Failed to fetch sales invoice from Dynamics.");
    }
    return invoice;
  } catch (error: any) {
    console.error(`Error creating sales invoice via Dynamics for organization ${organization.id}:`, error);
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw error.response.data;
      }
    }

    throw error;
  }
};

export const invoice_format = async (organization: any, invoiceId: string) => {
  try {
    const invoice = await fetchSalesInvoiceViaDynamics(organization, invoiceId);

    const lineItems = await fetchSalesInvoiceLinesViaDynamics(organization, invoiceId);

    const uac_invoice: IInvoice = {
      id: invoice?.id,
      platform_id: invoice?.id,
      account_id: null,
      subsidiary_id: null,
      memo: null,
      customer_id: invoice?.customerId,
      issue_date: invoice?.invoiceDate ? new Date(invoice.invoiceDate).toISOString() : null,
      due_date: invoice?.dueDate ? new Date(invoice.dueDate).toISOString() : null,
      status: STATUS_MAPPING[invoice.status] as uac_bill_status | null,
      amount_due: invoice?.remainingAmount,
      total_discount: invoice?.discountAmount ?? 0,
      currency_code: invoice?.currencyCode,
      document_number: invoice?.number,
      sub_total: invoice?.totalAmountExcludingTax,
      tax_amount: invoice?.totalTaxAmount,
      total_amount: invoice?.totalAmountIncludingTax,
      linked_payments: [],
      updated_at: invoice?.lastModifiedDateTime ? new Date(invoice.lastModifiedDateTime).toISOString() : "",
      line_items: lineItems.map((line: any) => ({
        platform_id: line?.["@odata.etag"],
        account_id: line?.accountId ?? null,
        class_id: null,
        item_id: line?.itemId ?? null,
        tax_rate_id: line?.taxCode ?? null,
        amount: parseFloat(line?.amountIncludingTax) ?? "0",
        description: line?.description,
        discount_amount: parseFloat(line?.discountAmount) ?? "0",
        discount_percentage: parseFloat(line?.discountPercent) ?? "0",
        quantity: line?.quantity ?? 0,
        unit_amount: parseFloat(line?.unitPrice) ?? "0",
        sub_total: line?.amountExcludingTax ?? 0,
        tax_amount: parseFloat(line?.totalTaxAmount) ?? "0",
      })),
      created_at: invoice?.lastModifiedDateTime ? new Date(invoice.lastModifiedDateTime).toISOString() : "",
      platform_data: {},
    };

    return uac_invoice;
  } catch (error: any) {
    console.error(`Error creating sales invoice via Dynamics for organization ${organization.id}:`, error);
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw error.response.data;
      }
    }

    throw error;
  }
};

export const invoice_create = async (organization: any, action: string, invoiceData?: any, customFields?: any, invoiceId?: string) => {
  try {
    let invoice_id = invoiceId;

    if (!invoiceId && invoiceData) {
      const sales_invoice = await createSalesInvoiceViaDynamics(organization, invoiceData, customFields);

      if (!sales_invoice || !sales_invoice.id) {
        throw new Error("Failed to create sales invoice in Dynamics.");
      }
      invoice_id = sales_invoice.id;

      const line_items = [];

      if(!invoiceData.line_items || invoiceData.line_items.length === 0) {
        throw new Error("No line items provided for the invoice.");
      }

      const deferralCode = await fetchDeferralCode(organization, customFields);

      for (const line of invoiceData.line_items) {
        console.log("Creating sales invoice line:", line);
        if (!invoice_id) {
          throw new Error("Invoice ID is undefined. Cannot create sales invoice lines.");
        }
        let sales_invoice_line = null;
        

        if (typeof line.item !== "object" || line.item === null || Array.isArray(line.item)) {
          sales_invoice_line = await createSalesInvoiceCommentsViaDynamics(organization, invoice_id, line, "");
        } else {
          sales_invoice_line = await createSalesInvoiceLinesViaDynamics(organization, invoice_id, line, deferralCode);
        }

        if (!sales_invoice_line || !sales_invoice_line.id) {
          throw new Error("Failed to create sales invoice line in Dynamics.");
        }
        line_items.push(sales_invoice_line);
      }
    }

    if (!invoice_id) {
      throw new Error("Invoice ID is required for actions.");
    }

    await salesInvoiceActions(organization, invoice_id, action);

    const formatted_invoice = await invoice_format(organization, invoice_id);

    return {
      invoice: formatted_invoice,
    };
  } catch (error) {
    console.error(`Error sending invoice via Dynamics for organization ${organization.id} with error: ${error}`);
    throw error;
  }
};
