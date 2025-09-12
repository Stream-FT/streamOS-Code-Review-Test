import { prismaClient } from "@common/prisma";
import { getSingleOrganizationById } from "@onboarding/service/organization.service";
import {
    createInvoice,
    createInvoiceByPlatform
} from "@common/service/uac.service";
import { invoice_create as createDynamicsInvoice } from "@common/service/dynamics.service";
import { storeJob, updateJobMetadata } from "@accounting/utils/job-store";
import { extractErrorMessage } from "@common/service/error-handler.service";
import { sendEmailToCustomer } from "./email.service";
import StringConstants from "@common/constants/string.constants";
import { IInvoice } from "@common/interface/uac/invoice.interface";
import { IAccountingInvoiceLineItem } from "@common/interface/uac/line-item.interface";
import logger from "@common/logger";

export const syncInvoiceInternal = async (organizationId: string, invoiceId: string) => {
    console.log(`Begin invoice creation in accounting for ${invoiceId}`);
    // Validate organization and charge data
    const { organization, currentUACInvoiceData } = await invoiceCreateValidations(organizationId, invoiceId);
  
    // Prepare payload
    const { invoiceToSync, customFields } = await invoiceCreatePayload(organization, currentUACInvoiceData);
  
    // Invoice Creation
    let uacInvoice = null;
    let invoice = null;
    let async_job = null;
    let streamosInvoice = null;
    let updatedStreamosInvoice = null;
  
    if (organization.invoice_create_override) {
      if (organization.uac_platform === "wave") {
        console.log("Creating invoice by platform wave");
        uacInvoice = await createInvoiceByPlatform(organization, invoiceToSync);
      } else if (organization.uac_platform === "DYNAMICS365") {
        console.log("Creating invoice by platform DYNAMICS365");
        uacInvoice = await createDynamicsInvoice(organization, "post", invoiceToSync, customFields);
      }
  
      invoice = uacInvoice?.invoice;
      async_job = {
        id: invoice?.id,
      };
    } else {
      console.log("Creating invoice via Rutter");
      if (!organization?.uac_access_token) {
        throw new Error("UAC access token is null or undefined.");
      }
      uacInvoice = await createInvoice(organization.uac_access_token, { response_mode: "async", invoice: invoiceToSync });
      async_job = uacInvoice?.async_response;
    }
  
    const jobId = async_job?.id;
  
    if (!jobId) {
      throw {
        status_code: 500,
        data: {
          message: "Failed to create invoice in the accounting system",
          error_code: "INVOICE_CREATION_FAILED",
        },
      };
    }
  
    storeJob(jobId, {
      organizationId: organization.id,
      status: "processing",
      response_url: async_job?.response_url || "",
      response_body: invoice,
      jobId: jobId,
    });
  
    if (invoice) {
      try {
        streamosInvoice = await upsertUACInvoice({
          invoice,
          organizationId: organization.id,
          streamCustomer: currentUACInvoiceData.stream_customer_id,
          uac_customer_id: currentUACInvoiceData?.stream_customer.uac_customer?.id,
        });
  
        console.log(`Successfully updated the database with the new invoice data: ${streamosInvoice.id}`);
  
        if (new Date(streamosInvoice.created_at).getTime() == new Date(streamosInvoice.updated_at).getTime()) {
          await Promise.all([createLineItems(invoice.line_items, streamosInvoice.id)]);
        }
  
        console.log(`Successfully created line items for : ${streamosInvoice.id}`);
  
        updatedStreamosInvoice = await prismaClient.acc_uac_invoice.findUnique({
          where: { id: streamosInvoice.id },
          include: {
            line_items: {
              include: {
                invoice_adjustment_line_item: {
                  include: {
                    invoice_adjustment: true,
                  },
                },
                product: {
                  include: {
                    uac_item: true,
                  },
                },
              },
            },
          },
        });
      } catch (error) {
        console.log("Error while creating/updating invoice in streamOS", error);
        const message = "Invoice created in accounting platform, but failed to update in streamOS";
  
        const error_message = extractErrorMessage(error);
  
        updateJobMetadata(jobId, {
          status: "failed",
          response_body: {
            error_code: "INTERNAL_ERROR",
            error_message: `${message} : ${error_message}`,
          },
        });
  
        throw {
          status_code: 500,
          data: {
            message: `${message} : ${error_message}`,
            error_code: "INTERNAL_ERROR",
          },
        };
      }
  
      try {
        await sendEmailToCustomer(streamosInvoice, organization);
      } catch (error) {
        console.log("Error while sending invoice email to customer", error);
        const message = "Invoice created in accounting platform, but failed to send email";
  
        const error_message = extractErrorMessage(error);
  
        updateJobMetadata(jobId, {
          status: "failed",
          response_body: {
            error_code: "FAILED_TO_SEND_EMAIL",
            error_message: `${message} : ${error_message}`,
          },
        });
  
        throw {
          status_code: 500,
          data: {
            message: `${message} : ${error_message}`,
            error_code: "FAILED_TO_SEND_EMAIL",
          },
        };
      }
  
      updateJobMetadata(jobId, {
        status: "success",
      });
    }
  
    return {
      message: StringConstants.INVOICE_CREATED,
      invoice: updatedStreamosInvoice ?? null,
      job: async_job ?? null,
    };
};

const invoiceCreateValidations = async (organizationId: string, invoiceId: string) => {
    const organization = await getSingleOrganizationById(organizationId);
  
    if (!organization) {
      throw {
        data: { message: `Organization with id ${organizationId} not found`, error_code: "NOT_FOUND" },
        status_code: 404,
      };
    }
  
    //Fetch charge by id
    const currentUACInvoiceData = await prismaClient.uac_invoice.findUnique({
      where: { id: invoiceId },
      include: {
        line_items: {
          include: {
            product: {
              include: {
                uac_item: true,
              },
            },
            invoice_adjustment_line_item: {
              include: {
                invoice_adjustment: true,
              },
            },
          },
        },
        stream_customer: {
          include: {
            uac_customer: {
              include: {
                addresses: true,
              },
            },
          },
        },
      },
    });
  
    if (!currentUACInvoiceData) {
      throw {
        status_code: 404,
        data: {
          message: `Charge with id ${invoiceId} not found`,
          error_code: "NOT_FOUND",
        },
      };
    }
  
    if (!organization?.uac_access_token)
      throw {
        status_code: 400,
        data: {
          message: `The organization associated with the uac_invoice does not have a valid UAC access token, they have not set up integration with an Accounting Platform. Cannot create invoices`,
          error_code: "NO_ACCESS_TOKEN",
        },
      };
  
    // Document number
    if (organization.uac_platform !== "DYNAMICS365") {
      if (!currentUACInvoiceData.document_number || currentUACInvoiceData.document_number.trim() === "") {
        throw {
          status_code: 400,
          data: {
            message: `Document number is required for invoice with id ${invoiceId}`,
            error_code: "DOCUMENT_NUMBER_REQUIRED",
          },
        };
      }
  
      const invoiceExists = await prismaClient.acc_uac_invoice.findFirst({
        where: {
          document_number: currentUACInvoiceData.document_number,
          organization_id: currentUACInvoiceData.organization_id,
        },
      });
  
      if (invoiceExists) {
        throw {
          status_code: 400,
          data: {
            message: `An invoice with document number ${currentUACInvoiceData.document_number} already exists in the platform`,
            error_code: "DUPLICATE_DOCUMENT_NUMBER",
          },
        };
      }
    }
  
    return {
      organization,
      currentUACInvoiceData,
    };
};
  

export const processInvoiceLineItems = (invoice: any, organization: any) => {
    const processedLineItems = invoice.line_items
      .filter((lineItem: any) => lineItem.suppress_line_item === false)
      .filter((lineItem: any) => lineItem.product_id !== null)
      .map((lineItem: any) => {
        let quantity = lineItem.quantity;
        let unit_amount = parseFloat(lineItem.unit_amount);
        let total_amount = parseFloat(lineItem.total_amount ?? 0);
  
        if (Array.isArray(lineItem.invoice_adjustment_line_item) && lineItem.invoice_adjustment_line_item.length > 0) {
          const latestAdjustment = lineItem.invoice_adjustment_line_item.reduce(
            (latest: { created_at: string }, item: { created_at: string }) =>
              new Date(item.created_at) > new Date(latest.created_at) ? item : latest,
          );
  
          quantity = latestAdjustment.quantity;
          unit_amount = parseFloat(latestAdjustment.unit_price);
          total_amount = parseFloat(latestAdjustment.total_amount);
        }
  
        const item_id = organization?.invoice_create_override
          ? lineItem?.product?.uac_item?.platform_id
          : lineItem?.product?.uac_item?.provider_entity_id;
  
        return {
          key: `${item_id}||${lineItem.description}||${lineItem.department_id}`,
          department_id: lineItem.department_id,
          product_id: lineItem.product_id,
          item_id,
          description: lineItem.description,
          comment_line_item: lineItem.comment_line_item,
          quantity,
          unit_amount,
          total_amount,
        };
      });
    // Grouping logic
    const groupedMap = new Map();
  
    for (const item of processedLineItems) {
      if (!groupedMap.has(item.key)) {
        groupedMap.set(item.key, {
          ...(item.quantity != null && item.unit_amount != null
            ? {
                item: {
                  id: item.item_id,
                  quantity: item.quantity,
                  unit_amount: item.unit_amount,
                },
              }
            : {}),
          total_amount: item.total_amount ?? 0,
          description: item.description,
          product_id: item.product_id,
        });
      } else {
        const existing = groupedMap.get(item.key);
  
        if (item.quantity != null && item.unit_amount != null && item.total_amount != null) {
          const isCurrentQuantityValid = !Number.isNaN(item.quantity);
          const isExistingQuantityValid = existing.item && !Number.isNaN(existing.item.quantity);
  
          if (isCurrentQuantityValid && (!isExistingQuantityValid || !existing.item)) {
            if (!existing.item) existing.item = {};
            existing.item.quantity = item.quantity;
          }
  
          if (existing.item) {
            existing.item.unit_amount = (existing.item.unit_amount ?? 0) + item.unit_amount;
            existing.total_amount = (existing.total_amount ?? 0) + (item.total_amount ?? 0);
          }
        }
      }
    }
  
    let groupedLineItems = Array.from(groupedMap.values());
  
    const finalGroupedByProductId = new Map();
  
    for (const item of groupedLineItems) {
      const { product_id, ...rest } = item;
  
      if (!finalGroupedByProductId.get(product_id)) {
        finalGroupedByProductId.set(product_id, []);
      }
  
      finalGroupedByProductId.get(product_id)?.push(rest);
    }
  
    const sortedAndFlattened = Array.from(finalGroupedByProductId.values())
      .map((items) => {
        const sortedItems = [...items].sort((a, b) => {
          const aUnit = a.item?.unit_amount ?? -Infinity;
          const bUnit = b.item?.unit_amount ?? -Infinity;
          return bUnit - aUnit;
        });
  
        const sortKey = sortedItems[0]?.item?.unit_amount ?? 0;
  
        return { sortKey, items: sortedItems };
      })
      .sort((a, b) => b.sortKey - a.sortKey)
      .flatMap((group) => group.items);
  
      const priceIncreaseItemsRaw = sortedAndFlattened.filter(
        (item) => item.description?.toLowerCase().startsWith("price increase")
      );
      
      const priceIncreaseItems = Object.values(
        priceIncreaseItemsRaw.reduce((acc: Record<string, any>, curr: any) => {
          const id = curr.item?.id;
      
          if (!id) return acc;
      
          if (!acc[id]) {
            acc[id] = {
              ...curr,
              total_amount: curr.total_amount,
            };
          } else {
            acc[id].total_amount += curr.total_amount;
            acc[id].item.unit_amount += curr.item?.unit_amount;
          }
      
          return acc;
        }, {})
      );
      
  
    const regularItems = sortedAndFlattened.filter((item) => !item.description?.toLowerCase().startsWith("price increase"));
  
    const baseComments = invoice.line_items
    .filter((lineItem: any) => lineItem.suppress_line_item === false)
    .filter((lineItem: any) => lineItem.product_id === null)
    .map((lineItem: any) => ({
      total_amount: 0,
      description: lineItem.description,
    }));
  
    const comments = invoice.po_number && invoice.po_number.trim() !== ""
      ? [{ total_amount: 0, description: invoice.po_number }, ...baseComments]
      : baseComments;
  
    groupedLineItems = [...regularItems, ...priceIncreaseItems, ...comments];
  
    console.log("Grouped Line Items", JSON.stringify(groupedLineItems, null, 2));
  
    return groupedLineItems;
  };


  const invoiceCreatePayload = async (organization: any, currentUACInvoiceData: any) => {
    const usePlatformValues = organization.uac_platform === "DYNAMICS365";
  
    const billingEmail = currentUACInvoiceData.stream_customer.uac_customer.email;
    const customerAddress = currentUACInvoiceData.stream_customer?.uac_customer?.addresses;
    const contractStartDate = currentUACInvoiceData?.period_start_date;
    const contractEndDate = currentUACInvoiceData?.period_end_date;
  
    const invoiceAdditionalFields = {
      ...(billingEmail && billingEmail !== "" ? { billing_email: billingEmail } : {}),
      ...(customerAddress && customerAddress.length > 0
        ? {
            addresses: customerAddress.map((address: any) => ({
              type: address.type ?? "unknown",
              address1: address.address1 ?? null,
              address2: address.address2 ?? null,
              city: address.city ?? null,
              country: address.country ?? null,
              postal_code: address.postal_code ?? null,
              region: address.region ?? null,
            })),
          }
        : {}),
    };
  
    const groupedLineItems = processInvoiceLineItems(currentUACInvoiceData, organization);
  
    const invoiceToSync = {
      customer_id: usePlatformValues
        ? currentUACInvoiceData.stream_customer.uac_customer.platform_id
        : currentUACInvoiceData.stream_customer.uac_customer.provider_entity_id,
      due_date: currentUACInvoiceData.due_date,
      issue_date: currentUACInvoiceData.issue_date,
      currency_code: currentUACInvoiceData.stream_customer.uac_customer.currency_code,
      ...(currentUACInvoiceData.document_number && {
        document_number: currentUACInvoiceData.document_number,
      }),
      //...(poNumber && poNumber !== "" && { memo: poNumber }),
      line_items: groupedLineItems,
      ...(Object.keys(invoiceAdditionalFields).length > 0 && {
        additional_fields: invoiceAdditionalFields,
      }),
    };
  
    const customFields = {
      contract_start_date: contractStartDate,
      contract_end_date: contractEndDate,
      payment_terms: currentUACInvoiceData.payment_terms,
    };
  
    console.log("Invoice to sync", JSON.stringify(invoiceToSync, null, 2));
    console.log("Custom fields for MS DYNAMICS if any", JSON.stringify(invoiceToSync, null, 2));
  
    return {
      invoiceToSync,
      customFields,
    };
};
  
export const upsertUACInvoice = async (data: {
    invoice: IInvoice;
    organizationId: string;
    streamCustomer?: string;
    pdf?: string;
    invoicePaymentLink?: string;
    uac_customer_id?: string;
  }) => {
    const { invoice, organizationId } = data;
  
    const uac_customer = await prismaClient.uac_customer.findFirst({
      where: {
        provider_entity_id: invoice.customer_id,
      },
    });
  
    return prismaClient.acc_uac_invoice.upsert({
      where: {
        organization_id_provider_entity_id: {
          organization_id: organizationId,
          provider_entity_id: invoice.id,
        },
      },
      create: {
        provider_entity_id: invoice.id,
        organization_id: organizationId,
        platform_id: invoice.platform_id,
        customer_id: data?.uac_customer_id ?? uac_customer?.id,
        stream_customer_id: data.streamCustomer,
        account_id: invoice.account_id,
        status: invoice.status,
        memo: invoice.memo,
        issue_date: invoice.issue_date,
        currency_code: invoice.currency_code,
        total_amount: invoice.total_amount,
        tax_amount: invoice.tax_amount,
        document_number: invoice.document_number,
        subsidiary_id: invoice.subsidiary_id,
        due_date: invoice.due_date,
        amount_due: invoice.amount_due,
        sub_total: invoice.sub_total,
        total_discount: invoice.total_discount,
        pdf_link: data.pdf ? data.pdf : null,
        payment_link: data.invoicePaymentLink ?? null,
      },
      update: {
        provider_entity_id: invoice.id,
        organization_id: organizationId,
        platform_id: invoice.platform_id,
        customer_id: data?.uac_customer_id,
        stream_customer_id: data.streamCustomer,
        status: invoice.status,
        issue_date: invoice.issue_date,
        currency_code: invoice.currency_code,
        total_amount: invoice.total_amount,
        document_number: invoice.document_number,
        subsidiary_id: invoice.subsidiary_id,
        due_date: invoice.due_date,
        amount_due: invoice.amount_due,
        sub_total: invoice.sub_total,
        total_discount: invoice.total_discount,
        pdf_link: data.pdf ? data.pdf : null,
        payment_link: data.invoicePaymentLink ?? null,
        memo: invoice.memo ?? null,
      },
    });
};

const createLineItems = async (lineItems: IAccountingInvoiceLineItem[], invoiceId: string, tx?: any) => {
    if (!lineItems.length) {
      return;
    }
  
    await (tx || prismaClient).uac_line_item.deleteMany({
      where: {
        acc_uac_invoice_id: invoiceId,
      },
    });
  
    const lineItemData = lineItems.map((item) => ({
      acc_uac_invoice_id: invoiceId,
      platform_id: item.platform_id,
      provider_entity_id: item.item_id,
      account_id: item.account_id,
      item_id: item.item_id,
      tax_rate_id: item.tax_rate_id,
      description: item.description,
      quantity: item.quantity != null ? parseFloat(item.quantity) : null,
      total_amount: item.amount ? parseFloat(item.amount) : null,
      discount_amount: item.discount_amount ? parseFloat(item.discount_amount) : null,
      discount_percentage: item.discount_percentage ? parseFloat(item.discount_percentage) : null,
      sub_total: item.sub_total !== null ? parseFloat(item.sub_total) : null,
      tax_amount: item.tax_amount ? parseFloat(item.tax_amount) : null,
      unit_amount: item.unit_amount != null ? parseFloat(item.unit_amount) : null,
    }));
    logger.info("lineItemData", lineItemData);
    return (tx || prismaClient).uac_line_item.createMany({ data: lineItemData });
};
  