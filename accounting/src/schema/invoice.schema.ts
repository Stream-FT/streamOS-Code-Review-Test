import { currency } from "@prisma/client";
import { z } from "zod";

import StringConstants from "@common/constants/string.constants";

const AccountingInvoiceLineItemSchema = z.object({
  account_id: z.string().optional(),
  discount_item_id: z.string().optional(),
  item: z.object({
    id: z
      .string({
        required_error: StringConstants.ITEM_ID_EMPTY,
      })
      .optional(),
    quantity: z.number({ required_error: StringConstants.ITEM_QUANTITY_EMPTY }).optional(),
    unit_amount: z.number().optional().optional(),
  }),
  total_amount: z.number(),
  discount_amount: z.number().optional(),
  description: z.string().optional(),
});

const QueryParamSchema = z.object({
  orgId: z.string({ required_error: StringConstants.ORGANIZATION_ID_EMPTY }).uuid({ message: StringConstants.ORGANIZATION_ID_INVALID }),
  id: z.string({ required_error: StringConstants.ID_EMPTY }).uuid({ message: StringConstants.ID_INVALID }).optional(),
});

const AccountingInvoiceAddressSchema = z.object({
  type: z.string().optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
});

const AccountingInvoiceAdditionalFieldSchema = z.object({
  billing_email: z.string().optional(),
  addresses: z.array(AccountingInvoiceAddressSchema).optional(),
});

const AccountingInvoiceSchema = z.object({
  subsidiary_id: z.string().optional(),
  customer_id: z
    .string({
      required_error: StringConstants.CUSTOMER_ID_EMPTY,
    })
    .uuid({ message: StringConstants.UUID_INVALID }),
  due_date: z.string().optional(),
  issue_date: z.string().optional(),
  currency_code: z
    .nativeEnum(currency, {
      invalid_type_error: StringConstants.CURRENCY_CODE_INVALID,
    })
    .optional(),
  document_number: z.string().optional(),
  line_items: z.array(AccountingInvoiceLineItemSchema),
  additional_fields: AccountingInvoiceAdditionalFieldSchema.optional(),
});

export const AccountingInvoiceSchemaReq = z.object({
  body: AccountingInvoiceSchema,
  params: QueryParamSchema,
});

export type TAccountingInvoice = z.infer<typeof AccountingInvoiceSchema>;
export type TAccountingLineItem = z.infer<typeof AccountingInvoiceLineItemSchema>;
