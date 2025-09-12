import { approval_object_type, approval_status } from "@prisma/client";

import { syncInvoiceInternal } from "@accounting/services/invoice.service";
import { prismaClient as prisma } from "@common/prisma";
import { extractErrorMessage } from "@common/service/error-handler.service";
import { triggerWorkflow, notifySlackServiceForApproval } from "@onboarding/common/external-service";

export async function getApprovals(organizationId: string, status?: approval_status, approvalObjectType?: approval_object_type) {
  return await prisma.approval.findMany({
    where: {
      organization_id: organizationId,
      ...(status && { status: status }),
      ...(approvalObjectType && { object_type: approvalObjectType }),
    },
  });
}

export async function getApprovalById(id: string) {
  return await prisma.approval.findUnique({
    where: {
      approval_id: id,
    },
  });
}

export async function addApproval(organizationId: string, sendSlackNotification: boolean, payload: { object_type: approval_object_type }) {
  const approval = await prisma.approval.create({
    data: {
      ...payload,
      organization_id: organizationId,
    },
  });
  if (sendSlackNotification) {
    notifySlackServiceForApproval(approval);
  } else {
    console.log(`Approval created with approval_id: ${approval.approval_id}. NOT sending slack notification`);
  }

  const approvalWithInvoice = await prisma.approval.findUnique({
    where: {
      approval_id: approval.approval_id,
    },
    include: {
      invoice: {
        include: {
          stream_customer: true,
          adjustments: true,
          line_items: {
            include: {
              invoice_adjustment_line_item: {
                include: {
                  invoice_adjustment: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return approvalWithInvoice;
}

export async function updateApproval(organizationId: string, approvalId: string, payload: any) {
  const approval = await prisma.approval.findUnique({
    where: {
      approval_id: approvalId,
    },
  });

  if (!approval) {
    throw {
      status_code: 404,
      data: {
        error_code: "NOT_FOUND",
        message: `This approval object with id ${approvalId} does not exist`,
      },
    };
  }

  let updatedApproval = null;
  let job = null;
  let invoice = null;

  if (approval.status !== approval_status.APPROVED && payload.status === approval_status.APPROVED) {
    console.log("Approval update received for status change to APPROVED. Updating approval with change and syncing invoice.");
    let result;

    if (approval.object_type === approval_object_type.INVOICE) {
      if (approval.invoice_id == null) {
        throw {
          status_code: 400,
          data: {
            error_code: "INVALID_INPUT",
            message: "The invoice_id is missing from the approval object, cannot create approval",
          },
        };
      }

      console.log(`Syncing invoice for organizationId: ${organizationId}, invoiceId: ${approval.invoice_id}`);
      result = await syncInvoiceInternal(organizationId, approval.invoice_id);

      if (result?.invoice || result?.job) {
        console.log("Invoice sync complete, updating invoice status on approval");
        job = result.job;
        invoice = result.invoice;
        try {
          updatedApproval = await prisma.approval.update({
            where: { approval_id: approvalId },
            data: payload,
          });
        } catch (error) {
          console.error(`Error updating approval for approval_id: ${approvalId}`, error);
          throw error;
        }
      }
    } else {
      // Update approval for all other object types
      console.log(`Updating approval for object type: ${approval.object_type}`);
      updatedApproval = await prisma.approval.update({
        where: { approval_id: approvalId },
        data: payload,
      });

      // For these approval types, trigger pricer after the update
      if (updatedApproval) {
        console.log(`Approval updated for object type: ${approval.object_type}. Triggering workflow.`);
        switch (approval.object_type) {
          case approval_object_type.INVOICE_ADJUSTMENT:
          case approval_object_type.ORGANIZATION_ADDON:
          case approval_object_type.CUSTOMER_ADDON:
          case approval_object_type.CONTRACT_ADDON:
          case approval_object_type.PRODUCT_ADDON:
            await triggerWorkflow(organizationId);
            break;
        }
      }
    }
  } else {
    console.log("Approval update received for change that is other than APPROVED status. Updating approval with change.");
    try {
      updatedApproval = await prisma.approval.update({
        where: {
          approval_id: approvalId,
        },
        data: payload,
      });
    } catch (error) {
      console.error(`Error updating approval for approval_id: ${approvalId} with payload status ${payload.status}`, error);
      throw error;
    }
  }

  return {
    approval: updatedApproval,
    invoice: invoice,
    job: job,
  };
}

export async function deleteApproval(approvalId: string) {
  await prisma.approval.delete({
    where: {
      approval_id: approvalId,
    },
  });

  return true;
}

export async function validateInvoiceApproval(payload: any) {
  if (!payload?.invoice_id) {
    throw {
      status_code: 400,
      data: {
        error_code: "INVALID_INPUT",
        message: "The invoice_id is missing from the payload, cannot create approval",
      },
    };
  }

  const uac_invoice = await prisma.uac_invoice.findUnique({
    where: {
      id: payload.invoice_id,
    },
    include: {
      organization: true,
      line_items: {
        include: {
          product: {
            include: {
              uac_item: true,
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

  if (!uac_invoice) {
    throw {
      status_code: 404,
      data: {
        error_code: "NOT_FOUND",
        message: `a uac_invoice with id ${payload.invoice_id} not found in the database, cannot create approval`,
      },
    };
  }

  if (!uac_invoice.organization.uac_access_token) {
    throw {
      status_code: 400,
      data: {
        error_code: "NO_ACCESS_TOKEN",
        message:
          "The organization associated with the uac_invoice does not have a valid UAC access token, they have not set up integration with an Accounting Platform",
      },
    };
  }

  if (
    uac_invoice?.stream_customer?.reconciliation_status === "UNMATCHED" ||
    uac_invoice?.stream_customer?.reconciliation_status === null ||
    uac_invoice?.stream_customer?.uac_customer_id === null
  ) {
    throw {
      status_code: 409,
      data: {
        error_code: "UNRECONCILED_CUSTOMER",
        message: "Stream customer associated with the uac_invoice is not reconciled with an accounting customer",
        data: uac_invoice?.stream_customer,
      },
    };
  }

  const invalidItems = uac_invoice.line_items.filter((item) => {
    return (
      item.product !== null &&
      (item.product.reconciliation_status === "UNMATCHED" ||
        item.product.reconciliation_status === null ||
        item.product.uac_item_id === null)
    );
  });

  if (invalidItems.length > 0) {
    throw {
      status_code: 409,
      data: {
        error_code: "UNRECONCILED_ITEM",
        message: "The product associated with the line items in this uac_invoice is not reconciled with an accounting item",
        data: invalidItems,
      },
    };
  }

  const invoiceExists = await prisma.acc_uac_invoice.findMany({
    where: {
      customer_id: uac_invoice?.stream_customer?.uac_customer?.id,
      issue_date: uac_invoice.issue_date,
    },
    include: {
      customer: true,
    },
  });

  if (invoiceExists.length > 0) {
    console.log(
      `An invoice with the same issue date already exists for this customer associated with ${payload.invoice_id}, could be a duplicate`,
    );
    return {
      message: "An invoice with the same issue date already exists for this customer",
      error_code: "DUPLICATE_INVOICE",
      status_code: 409,
      data: invoiceExists,
    };
  }

  return true;
}

export async function processApprovals(
  organizationId: string,
  payload: { object_type: approval_object_type },
  sendSlackNotification: boolean,
) {
  let isSimilar;

  if (payload?.object_type === approval_object_type.INVOICE) {
    const result = await validateInvoiceApproval(payload);
    if (typeof result === "object" && result !== null && "error_code" in result && result.error_code === "DUPLICATE_INVOICE") {
      isSimilar = result.data;
    }
  }

  let createdApproval;
  try {
    const approval: any = await addApproval(organizationId, sendSlackNotification, payload);
    createdApproval = approval;
  } catch (error) {
    console.error("Error processing approval", error);
    const error_message = extractErrorMessage(error);
    throw new Error(`Error processing approval: ${error_message}`);
  }

  return isSimilar ? { approval: createdApproval, invoice: isSimilar } : { approval: createdApproval };
}
