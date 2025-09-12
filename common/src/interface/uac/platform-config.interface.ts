export interface PlatformConfig {
  clientId?: string | undefined;
  clientSecret?: string;
  redirectUri?: string | undefined;
  baseUrl: string | undefined;
  scope?: string;
  approvalPrompt?: string;
  showBusinessSelector?: string;
  graphQLUrl?: string;
  apiBaseUrl?: string;
  endpoints?: Record<string, (ENV?: string, company_id?: string, realmId?: string, platform_id?: string) => string>;
  invoice?: {
    endpoints: {
      fetchDeferralTemplateEDI: (ENV?: string, company_id?: string) => string;
      create: (ENV?: string, company_id?: string) => string;
      createEDI: (ENV?: string, company_id?: string) => string;
      createLines: (ENV?: string, company_id?: string, invoice_id?: string) => string;
      createLinesEDI: (ENV?: string, company_id?: string, invoice_id?: string) => string;
      fetch: (ENV?: string, company_id?: string, invoice_id?: string) => string;
      actions: (ENV?: string, company_id?: string, platform_id?: string, action?: string) => string;
      lines: (ENV?: string, company_id?: string, invoice_id?: string) => string;
      pdf: (ENV?: string, company_id?: string, invoice_id?: string) => string;
    };
    boundActions: Record<string, string>;
  };
}
