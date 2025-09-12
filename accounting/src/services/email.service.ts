import axios from "axios";
import { format } from "date-fns";

import { PLATFORM_CONFIGS } from "@common/constants/platform-config.constant";
import { prismaClient } from "@common/prisma";
import { salesInvoiceActions as sendInvoiceViaDynamics } from "@common/service/dynamics.service";
import { extractErrorMessage } from "@common/service/error-handler.service";
import { getPaymentLink } from "@common/service/qbo.uac.service";
import { getInvoicePDFById } from "@common/service/uac.service";
import { sendInvoice as sendWaveInvoiceEmail } from "@common/service/wave.uac.service";

export const sendEmailToCustomer = async (invoice: any, organization: any) => {
  try {
    if (organization.uac_email_external_send_enabled && organization.uac_platform === "DYNAMICS365") {
      await sendInvoiceViaDynamics(organization, invoice.platform_id, "send");
      return;
    }

    const uac_customer = await prismaClient.uac_customer.findFirst({
      where: {
        id: invoice.customer_id,
      },
    });

    if (!uac_customer) {
      console.error(`UAC Customer not found for invoice ${invoice.id}`);
      throw {
        status_code: 404,
        data: {
          message: `The accounting customer with id ${invoice.customer_id} not found in the database, cannot send email`,
          error_code: "NOT_FOUND",
        },
      };
    }

    const to: string | null = uac_customer.email ?? process.env.DEFAULT_EMAIL ?? null;
    if (!to) {
      console.error(`No email address found for UAC Customer ${uac_customer.id}`);
      throw {
        status_code: 400,
        data: {
          message: `No email address found for UAC Customer ${uac_customer.customer_name}, cannot send email`,
          error_code: "NO_EMAIL",
        },
      };
    }

    let pdfLink = null;
    let invoicePaymentLink = null;

    try {
      const pdfResponse = await getInvoicePDFById(organization.uac_access_token, invoice.provider_entity_id);
      pdfLink = pdfResponse?.invoice?.pdf_link;
    } catch (error) {
      console.log("Error fetching pdf for invoice ", error);
      const error_message = extractErrorMessage(error);

      throw `Failed to fetch PDF for invoice ${invoice.id}: ${error_message}`;
    }

    console.log(`Fetched PDF for invoice ${invoice.id}`);

    if (organization.uac_platform === "QUICKBOOKS") {
      invoicePaymentLink = await getPaymentLink(invoice, organization);
    }
    console.log(`Fetched payment link for invoice ${invoice.id}`);

    const emailPayload = {
      to: to,
      subject: `${uac_customer.customer_name} Invoice: ${invoice.document_number}`,
      html: prepareInvoiceEmailTemplate(invoice, uac_customer, invoicePaymentLink),
      /*text: `Dear ${uac_customer.customer_name},\n\nPlease find attached your invoice for $${invoice.total_amount}.\n\nKind regards,\n\nThe Accounting Team`,*/
      attachments: [
        {
          filename: `${uac_customer.customer_name}_${format(new Date(invoice.issue_date), "MM/dd/yyyy")}.pdf`,
          path: invoice.pdf_link ?? pdfLink,
        },
      ],
      invoice_id: invoice.provider_entity_id,
      due_date: invoice.due_date,
      type: "invoice",
    };

    const reminder_payload = {
      organization_id: organization.id,
      id: invoice.id,
      reminder_type: "invoice",
      to: to,
      subject: `Reminder: Payment due for ${uac_customer.customer_name} Invoice: ${invoice.document_number}`,
      attachments: [
        {
          filename: `${uac_customer.customer_name}_${format(new Date(invoice.issue_date), "MM/dd/yyyy")}.pdf`,
          path: invoice.pdf_link,
        },
      ],
      due_date: invoice.due_date,
    };

    if (organization.uac_email_external_send_enabled) {
      console.log(`Sending email to ${to} for invoice ${invoice.id} via ${organization.uac_platform}`);
      if (organization.uac_platform === "wave") {
        const platformConfig = PLATFORM_CONFIGS[organization.uac_platform];
        await sendWaveInvoiceEmail(organization, platformConfig, emailPayload);
      } else {
        throw new Error("We do not support sending emails directly from this platform. : " + organization.uac_platform);
      }
    } else {
      await axios.post(`${process.env.EMAIL_SERVICE_URL}/sendMessage/${organization.id}`, emailPayload);
    }
    await prismaClient.acc_uac_invoice.update({
      where: {
        id: invoice.id,
      },
      data: {
        email_status: "SENT",
      },
    });
    console.log(`Email sent to ${to} for invoice ${invoice.id}`);

    axios.post(`${process.env.REMINDER_SERVICE_URL}/schedule_reminders`, reminder_payload);

    console.log(`Reminder scheduled for invoice ${invoice.id}`);
  } catch (error) {
    console.error(`Failed to send email for invoice ${invoice.id}:`, error);

    await prismaClient.acc_uac_invoice.update({
      where: {
        id: invoice.id,
      },
      data: {
        email_status: "FAILED_TO_SEND",
      },
    });

    throw error;
  }
};

const prepareInvoiceEmailTemplate = (invoice: any, customer: any, invoice_payment_link?: string) => {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${customer.customer_name} Invoice ${invoice.document_number}</title></head><body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; -webkit-font-smoothing: antialiased;"><div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); margin-top: 20px; margin-bottom: 20px;"><div style="padding: 40px 30px;"><p style="color: #1f2937; font-size: 16px; line-height: 1.6; margin-bottom: 25px; font-weight: 500;">Dear ${customer.customer_name},</p><div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin-bottom: 25px;"><div style="text-align: center;"><p style="color: #4b5563; font-size: 16px; margin: 0 0 8px 0;">Amount Due</p><h2 style="color: #1f2937; font-size: 32px; margin: 0; font-weight: 600;">$${invoice.total_amount}</h2></div></div><div style="margin-bottom: 30px; text-align: center;"><p style="color: #4b5563; font-size: 16px; margin: 0;">Due Date</p><p style="color: #1f2937; font-size: 20px; font-weight: 600; margin: 5px 0 0 0;">${format(new Date(invoice.due_date), "MMMM d, yyyy")}</p></div>${invoice.payment_link ? `<div style="text-align: center; margin: 35px 0;"><a href="${invoice.payment_link ?? invoice_payment_link}" style="display: inline-block; background-color: #464EB8; color: white; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px; transition: background-color 0.2s ease;">Review and Pay</a></div>` : ""}<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;"><div style="text-align: right;"><a href="https://www.streamos.io/" style="display: inline-block;"><div ><div><div ><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-radius: 4px; display: inline-block;" ><tr><td style="padding: 6px;"><img src="https://streamos-public-hosting-bucket.s3.us-east-1.amazonaws.com/assets/poweredByLogo.png" alt="Powered by streamOS" style="width: 150px; height: auto; display: block;" /></td></tr></table></div></div></div></a></div></div></div></div></body></html>`;
};
