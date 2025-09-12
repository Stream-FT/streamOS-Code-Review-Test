import { uac_bill_status } from "@prisma/client";
import axios from "axios";

import { PLATFORM_CONFIGS } from "@common/constants/platform-config.constant";
import { IInvoice } from "@common/interface/uac/invoice.interface";
import { PlatformConfig } from "@common/interface/uac/platform-config.interface";
import { prismaClient } from "@common/prisma";

export async function getBusinessById(organization: any, platformConfig: PlatformConfig, businessId: string) {
  const query = `
  query{
    business(id: "${businessId}"){
      id
      name
      isPersonal
      emailSendEnabled
      isArchived
      createdAt
      modifiedAt
    }
  }`;
  const response = (await postGraphQLRequest(organization, platformConfig.graphQLUrl || "", query)) as {
    data: { business: any };
  };

  return response.data.business;
}

export async function getItems(organization: any, platformConfig: PlatformConfig, page: number, limit: number) {
  const query = `
      query {
        business(id: "${organization.uac_business_id}") {
          id
          products(page: ${page}, pageSize: ${limit}, sort: [NAME_ASC]) {
            pageInfo {
              currentPage
              totalPages
              totalCount
            }
            edges {
              node {
                id
                name
                description
                unitPrice
                isSold
                isBought
                isArchived
                createdAt
                modifiedAt
              }
            }
          }
        }
      }
    `;

  const response = (await postGraphQLRequest(organization, platformConfig.graphQLUrl || "", query)) as {
    data: { business: { products: any } };
  };

  return response.data.business.products;
}

export async function getCustomers(organization: any, platformConfig: PlatformConfig, page: number, limit: number) {
  const query = `
      query {
        business(id: "${organization.uac_business_id}") {
          id
          customers(page: ${page}, pageSize: ${limit}, sort: [NAME_ASC]) {
            pageInfo {
              currentPage
              totalPages
              totalCount
            }
            edges {
              node {
                id
                name
                email
                firstName
                lastName
                phone
                modifiedAt
                currency {
                  code
                }
                shippingDetails {
                  name
                  phone
                  instructions
                  address {
                    addressLine1
                    addressLine2
                    city
                    province {
                      code
                      name
                    }
                    country {
                      code
                      name
                    }
                    postalCode
                  }
                }
                address {
                  addressLine1
                  addressLine2
                  city
                  province {
                    code
                    name
                  }
                  country {
                    code
                    name
                  }
                  postalCode
                }
                
              }
            }
          }
        }
      }
    `;

  const response = (await postGraphQLRequest(organization, platformConfig.graphQLUrl || "", query)) as {
    data: { business: { customers: any } };
  };
  return response.data.business.customers;
}

export async function getVendors(organization: any, platformConfig: PlatformConfig, page: number, limit: number) {
  const query = `
      query {
        business(id: "${organization.uac_business_id}") {
          id
          vendors(page: ${page}, pageSize: ${limit}) {
            pageInfo {
              currentPage
              totalPages
              totalCount
            }
            edges {
              node {
                id
                isArchived
                name
                email
                firstName
                lastName
                phone
                modifiedAt
                website
                currency {
                  code
                }
                shippingDetails {
                  name
                  phone
                  instructions
                  address {
                    addressLine1
                    addressLine2
                    city
                    province {
                      code
                      name
                    }
                    country {
                      code
                      name
                    }
                    postalCode
                  }
                }
                address {
                  addressLine1
                  addressLine2
                  city
                  province {
                    code
                    name
                  }
                  country {
                    code
                    name
                  }
                  postalCode
                }
                
              }
            }
          }
        }
      }
    `;

  const response = (await postGraphQLRequest(organization, platformConfig.graphQLUrl || "", query)) as {
    data: { business: { vendors: any } };
  };
  return response.data.business.vendors;
}

export async function getInvoices(organization: any, platformConfig: PlatformConfig, page: number, limit: number) {
  const query = `
      query {
        business(id: "${organization.uac_business_id}") {
          id
          invoices(page: ${page}, pageSize: ${limit}) {
            pageInfo {
              currentPage
              totalPages
              totalCount
            }
            edges {
              node {
                id
                customer{
                  id
                  name
                }
                dueDate
                invoiceDate
                status
                currency {
                  code
                }
                invoiceNumber
                memo
                amountDue {
                  minorUnitValue
                }
                amountPaid {
                  minorUnitValue
                }
                total{
                  minorUnitValue
                }
                subtotal{
                  minorUnitValue
                }
                taxTotal{
                  minorUnitValue
                }
                discountTotal{
                  minorUnitValue
                }
                pdfUrl
                viewUrl
                createdAt
                modifiedAt
                items {
                  account{
                    id
                  }
                  description
                  quantity
                  unitPrice
                  product {
                    id
                    name
                  }
                  subtotal{
                    minorUnitValue
                  }
                  total {
                    minorUnitValue
                  }
                  taxes {
                    salesTax {
                      rate
                    }
                    amount {
                      minorUnitValue
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

  const response = (await postGraphQLRequest(organization, platformConfig.graphQLUrl || "", query)) as {
    data: { business: { invoices: any } };
  };
  return response.data.business.invoices;
}

export async function getAccounts(organization: any, platformConfig: PlatformConfig, page: number, limit: number) {
  const query = `
      query {
        business(id: "${organization.uac_business_id}") {
          id
          accounts(page: ${page}, pageSize: ${limit}) {
            pageInfo {
              currentPage
              totalPages
              totalCount
            }
            edges {
              node {
                id
                business
                {
                  id
                }
                type {
                  name
                  normalBalanceType
                  value
                }
                subtype{
                  name
                  value
                  type {
                    name
                    normalBalanceType
                    value
                  }
                  description
                }
                isArchived
                balance
                balanceInBusinessCurrency
                currency {
                  code
                }
                name
              }
            }
          }
        }
      }
    `;

  const response = (await postGraphQLRequest(organization, platformConfig.graphQLUrl || "", query)) as {
    data: { business: { accounts: any } };
  };
  return response.data.business.accounts;
}

export async function createInvoice(organization: any, platformConfig: PlatformConfig, invoicePayload: any) {
  const mutation = `
    mutation ($input: InvoiceCreateInput!) {
      invoiceCreate(input: $input) {
        didSucceed
        inputErrors {
          message
          code
          path
        }
        invoice {
          id
          createdAt
          modifiedAt
          pdfUrl
          viewUrl
          status
          title
          subhead
          invoiceNumber
          invoiceDate
          poNumber
          customer {
            id
            name
          }
          currency {
            code
          }
          dueDate
          amountDue {
            minorUnitValue
            currency {
              symbol
            }
          }
          amountPaid {
            minorUnitValue
            currency {
              symbol
            }
          }
          taxTotal {
            minorUnitValue
            currency {
              symbol
            }
          }
          total {
            minorUnitValue
            currency {
              symbol
            }
          }
          exchangeRate
          footer
          memo
          disableCreditCardPayments
          disableBankPayments
          itemTitle
          unitTitle
          priceTitle
          amountTitle
          hideName
          hideDescription
          hideUnit
          hidePrice
          hideAmount
          items {
            product {
              id
              name
            }
            description
            quantity
            unitPrice
            subtotal {
              minorUnitValue
              currency {
                symbol
              }
            }
            total {
              minorUnitValue
              currency {
                symbol
              }
            }
            account {
              id
              name
              subtype {
                name
                value
              }
              
            }
            taxes {
              amount {
                minorUnitValue
              }
              salesTax {
                id
                name
                
              }
            }
          }
          lastSentAt
          lastSentVia
          lastViewedAt
        }
      }
    }
    
  `;

  const variables = {
    input: {
      businessId: organization.uac_business_id,
      customerId: invoicePayload.customer_id,
      dueDate: formatDateToGraphQLDate(invoicePayload.due_date),
      invoiceDate: formatDateToGraphQLDate(invoicePayload.issue_date),
      currency: invoicePayload.currency_code,
      invoiceNumber: invoicePayload.document_number,
      poNumber: invoicePayload?.additional_fields?.po_number || "",
      status: "SAVED",
      items: invoicePayload.line_items.map((lineItem: any) => {
        return {
          productId: lineItem.item.id,
          quantity: lineItem.item.quantity === 0 ? 1 : lineItem.item.quantity,
          unitPrice: lineItem.item.unit_amount,
          description: lineItem.description,
        };
      }),
    },
  };

  const response = (await postGraphQLRequest(organization, platformConfig.graphQLUrl || "", mutation, variables)) as {
    data: { invoiceCreate: any };
  };

  const result = response.data.invoiceCreate;

  if (result.didSucceed) {
    console.log("Invoice created successfully:", result.invoice);

    return formatInvoice(result);
  } else {
    // Handle input errors
    const errors = result.inputErrors.map((err: any) => `${err.message} (Code: ${err.code}, Path: ${err.path})`);
    console.error("Invoice creation failed with input errors:", errors);
    throw new Error(errors.join(", "));
  }
}

export function formatInvoice(uacInvoice: any) {
  const invoicePayload: IInvoice = {
    id: uacInvoice.invoice.id,
    platform_id: uacInvoice.invoice.id,
    account_id: null,
    subsidiary_id: null,
    customer_id: uacInvoice.invoice.customer?.id,
    due_date: new Date(uacInvoice.invoice.dueDate).toISOString(),
    issue_date: new Date(uacInvoice.invoice.invoiceDate).toISOString(),
    status: mapInvoiceStatus(uacInvoice.invoice.status),
    currency_code: uacInvoice.invoice.currency?.code,
    document_number: uacInvoice.invoice.invoiceNumber,
    memo: uacInvoice.invoice.memo,
    amount_due: parseFloat(uacInvoice.invoice.amountDue?.minorUnitValue) / 100,
    sub_total: parseFloat(uacInvoice.invoice.subtotal?.minorUnitValue) / 100,
    tax_amount: parseFloat(uacInvoice.invoice.taxTotal?.minorUnitValue) / 100,
    total_amount: parseFloat(uacInvoice.invoice.total?.minorUnitValue) / 100,
    total_discount: parseFloat(uacInvoice.invoice.discountTotal?.minorUnitValue) / 100,
    line_items: uacInvoice.invoice.items.map((item: any) => ({
      platform_id: item.product?.id,
      account_id: item.account?.id,
      class_id: null,
      item_id: item.product?.id,
      tax_rate_id: null,
      amount: item.total?.minorUnitValue ? parseFloat(item.total?.minorUnitValue) / 100 : null,
      description: item.description,
      quantity: item.quantity,
      sub_total: item.subtotal?.minorUnitValue ? parseFloat(item.subtotal?.minorUnitValue) / 100 : null,
      unit_amount: item.unitPrice,
      tax_amount: null,
    })),
    linked_payments: [],
    created_at: uacInvoice.invoice.createdAt,
    updated_at: uacInvoice.invoice.modifiedAt,
    platform_data: {},
  };

  return {
    invoice: invoicePayload,
  };
}

export async function sendInvoice(organization: any, platformConfig: PlatformConfig, invoiceSendPayload: any) {
  const mutation = `
    mutation ($input: InvoiceSendInput!){
      invoiceSend(input: $input){
        didSucceed
        inputErrors {
          message
          path
          code
        }
      }
    }
  `;

  const variables = {
    input: {
      invoiceId: invoiceSendPayload.invoice_id,
      to: invoiceSendPayload.to,
      attachPDF: true,
    },
  };

  const response = (await postGraphQLRequest(organization, platformConfig.graphQLUrl || "", mutation, variables)) as {
    data: { invoiceSend: any };
  };

  const result = response.data.invoiceSend;

  if (result.didSucceed) {
    console.log("Invoice sent successfully");
    return result;
  } else {
    const errors = result.inputErrors.map((err: any) => `${err.message} (Code: ${err.code}, Path: ${err.path})`);
    console.error("Invoice sending failed with input errors:", errors);
    throw new Error(errors.join(", "));
  }
}

export async function markInvoiceAsSent(organization: any, platformConfig: PlatformConfig, invoiceId: string) {
  const mutation = `
    mutation ($input: InvoiceMarkSentInput!){
      invoiceMarkSent(input: $input){
        didSucceed
        inputErrors {
          message
          path
          code
        }
      }
    }

  `;

  const variables = {
    input: {
      invoiceId: invoiceId,
      sendMethod: process.env.WAVE_SEND_METHOD,
    },
  };

  const response = (await postGraphQLRequest(organization, platformConfig.graphQLUrl || "", mutation, variables)) as {
    data: { invoiceMarkSent: any };
  };
  const result = response.data.invoiceMarkSent;

  if (result.didSucceed) {
    console.log("Invoice created successfully:", result.invoice);
    return result;
  } else {
    const errors = result.inputErrors.map((err: any) => `${err.message} (Code: ${err.code}, Path: ${err.path})`);
    console.error("Invoice creation failed with input errors:", errors);
    throw new Error(errors.join(", "));
  }
}

export async function postGraphQLRequest(organization: any, baseURL: string, query: string, variables?: any): Promise<any> {
  const access_token = organization.uac_access_token;
  try {
    const response = await fetch(baseURL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query,
        variables: variables,
      }),
    })
      .then((res) => res.json())
      .then(async (data: any) => {
        if (data.errors && data.errors.length > 0) {
          const unauthenticatedError = data.errors.find((error: any) => error.extensions?.code === "UNAUTHENTICATED");

          if (unauthenticatedError) {
            console.log("Access token expired. Refreshing token...");
            try {
              const updatedOrganization = await refreshAuthToken(organization.id);

              if (!updatedOrganization || !updatedOrganization.uac_access_token) {
                throw new Error("Failed to refresh access token");
              }

              console.log("Access token refreshed successfully. Retrying request...");
              return await postGraphQLRequest(updatedOrganization, baseURL, query, variables);
            } catch (error) {
              console.log("Error in refresh token: ", error);
              throw new Error("Failed to refresh token");
            }
          }
          const errorMessages = data.errors
            .map((error: any) => {
              return `Message: ${error.message}, Code: ${error.extensions?.code}, Location: ${JSON.stringify(error.locations)}`;
            })
            .join("; ");

          throw new Error(`GraphQL Errors: ${errorMessages}`);
        }
        return data;
      });

    return response;
  } catch (error) {
    console.log("Error in actual fetch: ", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error("An unknown error occurred");
    }
  }
}

function formatDateToGraphQLDate(date: string): string {
  const parsedDate = new Date(date);
  const year = parsedDate.getFullYear();
  const month = (parsedDate.getMonth() + 1).toString().padStart(2, "0");
  const day = parsedDate.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function refreshAuthToken(organizationId: string) {
  const organization = await prismaClient.organization.findUnique({
    where: {
      id: organizationId,
    },
  });

  if (!organization) {
    throw new Error("Organization not found");
  }

  if (!organization.uac_access_token) {
    throw new Error("Organization does not have a valid access token, please connect to accounting platform first");
  }

  if (!organization.uac_refresh_token) {
    throw new Error("Organization does not have a valid refresh token, please connect to accounting platform first");
  }

  if (!organization.uac_platform) {
    throw new Error("Organization does not have a valid platform, please connect to accounting platform first");
  }

  const platformConfig = PLATFORM_CONFIGS[organization.uac_platform];

  if (!platformConfig) {
    throw new Error(`Platform ${organization.uac_platform} is not supported`);
  }

  if (!platformConfig.baseUrl || !platformConfig.clientId || !platformConfig.clientSecret || !platformConfig.redirectUri) {
    throw new Error("Platform configuration is not valid, missing either base url, client id, client secret or redirect uri");
  }

  try {
    const tokenResponse = await axios.post(
      `${platformConfig.baseUrl!}/oauth2/token/`,
      new URLSearchParams({
        client_id: platformConfig.clientId!,
        client_secret: platformConfig.clientSecret!,
        refresh_token: organization.uac_refresh_token,
        grant_type: "refresh_token",
        redirect_uri: platformConfig.redirectUri!,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    const connection = await prismaClient.organization.update({
      where: {
        id: organizationId,
      },
      data: {
        uac_access_token: access_token,
        uac_refresh_token: refresh_token,
        uac_token_expires_in: expires_in,
      },
    });
    if (!connection) {
      throw new Error("Failed to set up connection");
    }
    return connection;
  } catch (error) {
    if (error instanceof Error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      } else {
        throw new Error("An unknown error occurred");
      }
    } else {
      throw new Error("An unknown error occurred");
    }
  }
}

function mapInvoiceStatus(status: string): uac_bill_status {
  switch (status) {
    case "DRAFT":
      return uac_bill_status.draft;
    case "OVERDUE":
      return uac_bill_status.open;
    case "OVERPAID":
      return uac_bill_status.unknown;
    case "PAID":
      return uac_bill_status.paid;
    case "PARTIAL":
      return uac_bill_status.partially_paid;
    case "SAVED":
      return uac_bill_status.open;
    case "SENT":
      return uac_bill_status.open;
    case "UNPAID":
      return uac_bill_status.open;
    case "VIEWED":
      return uac_bill_status.open;
    default:
      return uac_bill_status.unknown;
  }
}
