import dotenv from "dotenv";

import { PlatformConfig } from "@common/interface/uac/platform-config.interface";
dotenv.config();

export const PLATFORMS = ["wave"];
export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  wave: {
    clientId: process.env.WAVE_CLIENT_ID,
    clientSecret: process.env.WAVE_CLIENT_SECRET,
    redirectUri: process.env.WAVE_REDIRECT_URI,
    baseUrl: process.env.WAVE_BASE_URL,
    scope: "account:* business:* customer:* invoice:* product:* user:* vendor:*",
    approvalPrompt: "auto",
    showBusinessSelector: "true",
    graphQLUrl: process.env.WAVE_GRAPHQL_URL,
  },
  QUICKBOOKS: {
    baseUrl: process.env.QUICKBOOKS_BASE_URL || "",
    apiBaseUrl: process.env.QUICKBOOKS_BASE_URL || "",
    endpoints: {
      fetchInvoice: (realmId?: string, platform_id?: string) =>
        `/v3/company/${realmId}/invoice${platform_id}?minorversion=62&include=invoiceLink`,
    },
  },
  DYNAMICS365: {
    baseUrl: process.env.DYNAMICS365_BASE_URL || "",
    apiBaseUrl: process.env.DYNAMICS365_BASE_URL || "",
    invoice: {
      endpoints: {
        fetchDeferralTemplateEDI: (ENV?: string, company_id?: string) =>
          `v2.0/${ENV}/api/ttl/ediapi/v2.0/companies(${company_id})/deferralTemplates`,

        create: (ENV?: string, company_id?: string) => `v2.0/${ENV}/api/v2.0/companies(${company_id})/salesInvoices`,

        createEDI: (ENV?: string, company_id?: string) => `v2.0/${ENV}/api/ttl/ediapi/v2.0/companies(${company_id})/salesInvoices`,

        createLines: (ENV?: string, company_id?: string, invoice_id?: string) =>
          `v2.0/${ENV}/api/v2.0/companies(${company_id})/salesInvoices(${invoice_id})/salesInvoiceLines`,

        createLinesEDI: (ENV?: string, company_id?: string, invoice_id?: string) =>
          `v2.0/${ENV}/api/ttl/ediapi/v2.0/companies(${company_id})/salesInvoices(${invoice_id})/salesInvoiceLines`,

        fetch: (ENV?: string, company_id?: string, invoice_id?: string) =>
          `v2.0/${ENV}/api/v2.0/companies(${company_id})/salesInvoices(${invoice_id})`,

        actions: (ENV?: string, company_id?: string, platform_id?: string, action?: string) =>
          `v2.0/${ENV}/api/v2.0/companies(${company_id})/salesInvoices(${platform_id})/Microsoft.NAV.${action}`,

        lines: (ENV?: string, company_id?: string, invoice_id?: string) =>
          `v2.0/${ENV}/api/v2.0/companies(${company_id})/salesInvoices(${invoice_id})/salesInvoiceLines`,

        pdf: (ENV?: string, company_id?: string, invoice_id?: string) =>
          `v2.0/${ENV}/api/v2.0/companies(${company_id})/salesInvoices(${invoice_id})/pdfDocument/(${invoice_id})/content`,
      },

      boundActions: {
        cancel: "cancel",
        post: "post",
        send: "send",
        postandsend: "postAndSend",
      },
    },
  },
};
