import { Router } from "express";

import { checkOrganization } from "@onboarding/middleware/organization.middleware";

import * as approvalController from "./approval.controller";

const router = Router();

// GET /:organizationId/approval - List all approval requests for an organization    
router.get("/:organizationId/approval", checkOrganization, approvalController.getApprovals);

// POST /:organizationId/approval - Create a new approval request
router.post("/:organizationId/approval", checkOrganization, approvalController.addApproval);

// GET /:organizationId/approval/:id - Fetch a specific approval request by ID
router.get("/:organizationId/approval/:id", checkOrganization, approvalController.getApprovalById);

// PATCH /:organizationId/approval/:id - Update an existing approval request
router.patch("/:organizationId/approval/:id", checkOrganization, approvalController.updateApproval);

// DELETE /:organizationId/approval/:id - Delete an approval request
router.delete("/:organizationId/approval/:id", checkOrganization, approvalController.deleteApproval);

export default router;
