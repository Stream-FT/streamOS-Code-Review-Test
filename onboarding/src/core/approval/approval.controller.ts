import { approval_object_type, approval_status } from "@prisma/client";
import { Request, Response } from "express";
import { extractErrorMessage} from "@common/service/error-handler.service";


import * as approvalService from "./approval.service";

export async function getApprovals(req: Request, res: Response) {
  const organizationId = req.params.organizationId as string;
  const status = req.query.status as approval_status;
  const approvalObjectType = req.query.approval_object_type as approval_object_type;
  try {
    res.status(200).json(await approvalService.getApprovals(organizationId, status, approvalObjectType));
  } catch (error: any) {
        console.log("Error:", error);
      
        const status_code = error?.status_code || error?.status || 400;
        const errorMessage = extractErrorMessage(error);
        const errorCode = error?.data?.error_code || "OTHER";
        res.status(status_code).json({ error_code: errorCode, error_message: errorMessage, data:error?.data, error: { message: errorMessage, error_code: errorCode } });
    }
}

export async function getApprovalById(req: Request, res: Response) {
  try {
    res.status(200).json(await approvalService.getApprovalById(req.params.id));
  } catch (error: any) {
        console.log("Error:", error);
      
        const status_code = error?.status_code || error?.status || 400;
        const errorMessage = extractErrorMessage(error);
        const errorCode = error?.data?.error_code || "OTHER";
        res.status(status_code).json({ error_code: errorCode, error_message: errorMessage, data:error?.data, error: { message: errorMessage, error_code: errorCode } });
    }
}

export async function addApproval(req: Request, res: Response) {
  const organizationId = req.params.organizationId;
  const sendSlackNotification = req.query.send_slack_notification === "true";
  const payload: { object_type: approval_object_type } = req.body;

  try {
    const { approval, invoice } = await approvalService.processApprovals(organizationId, payload, sendSlackNotification);
    if (!invoice) {
      res.status(200).json({
        status: "success",
        data: approval,
      });
    } else {
      res.status(409).json({
        error_code: "DUPLICATE",
        error_message: `An invoice with the same issue date already exists for this customer associated with ${approval.invoice_id}, could be a duplicate`,
        error: {
          error_code: "DUPLICATE",
          message:  `An invoice with the same issue date already exists for this customer associated with ${approval.invoice_id}, could be a duplicate`,
          
        },
        data: {
          approval: approval,
          invoice: invoice,
        },
      });
    }
  } catch (error: any) {
        console.log("Error:", error);
      
        const status_code = error?.status_code || error?.status || 400;
        const errorMessage = extractErrorMessage(error);
        const errorCode = error?.data?.error_code || "OTHER";
        res.status(status_code).json({ error_code: errorCode, error_message: errorMessage, data:error?.data, error: { message: errorMessage, error_code: errorCode } });
  }
}

export async function updateApproval(req: Request, res: Response) {
  const approvalId = req.params.id;
  const organizationId = req.params.organizationId;
  try {
    const approval = await approvalService.updateApproval(organizationId, approvalId, req.body);
    res.status(200).json({
      status: "success",
      data: approval,
    });
  } catch (error: any) {
        console.log("Error:", error);
      
        const status_code = error?.status_code || error?.status || 400;
        const errorMessage = extractErrorMessage(error);
        const errorCode = error?.data?.error_code || "OTHER";
        res.status(status_code).json({ error_code: errorCode, error_message: errorMessage, data:error?.data, error: { message: errorMessage, error_code: errorCode } });
    }
}

export async function deleteApproval(req: Request, res: Response) {
  const approvalId = req.params.id;
  try {
    res.status(200).json(await approvalService.deleteApproval(approvalId));
  } catch (error: any) {
    res.status(500).json({
      error: error?.message || "An error occurred",
    });
  }
}
