import { CustomError, ErrorCode } from "@common/middleware/error.middleware";
import { prismaClient as prisma } from "@common/prisma";
import OrganizationConstant from "@onboarding/constant/organization.constant";

export async function getSingleOrganizationById(organizationId: string) {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });
  
    if (!organization) {
      throw new CustomError(400, ErrorCode.ORGANIZATION_NOT_FOUND, OrganizationConstant.ORGANIZATION_NOT_FOUND);
    }
  
    return organization;
}