import { Prisma } from "@prisma/client";
import { Request, Response, NextFunction } from "express";

import { prismaClient } from "@common/prisma";

export async function checkOrganization(req: Request, _res: Response, next: NextFunction) {
  try {
    const { organizationId } = req.params;

    const orgFound = await prismaClient.organization.findUnique({
      where: { id: organizationId },
    });

    if (!orgFound) {
      return next(
        Object.assign(new Error(), {
          status_code: 400,
          data: {
            message: `Organization with id ${organizationId} not found`,
            error_code: "ORGANIZATION_NOT_FOUND",
          },
        }),
      );
    }

    next();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return next(
        Object.assign(new Error(), {
          status_code: 400,
          data: {
            message: `Database error: Visit https://www.prisma.io/docs/orm/reference/error-reference for more details.`,
            error_code: error.code,
          },
        }),
      );
    } else if (error instanceof Prisma.PrismaClientValidationError) {
      return next(
        Object.assign(new Error(), {
          status_code: 400,
          data: {
            message: `Validation error: ${error.message}. Please check your request parameters.`,
            error_code: "PRISMA_VALIDATION_ERROR",
          },
        }),
      );
    }

    console.error("Unexpected error in checkOrganization middleware:", error);
    return next(error); // catch-all
  }
}
