/**
 * Generic String constants used in app
 */
export default class StringConstants {
    static readonly API_UNAUTHENTICATED_ERROR = "Unauthenticated User";
    static readonly API_UNKNOWN_ERROR = "Unknown api request";
    static readonly HTTP_CLIENT_ERROR_BAD_REQUEST = "Bad Request";
    static readonly NODE_ENV_TEST = "test";
    static readonly API_FORBIDDEN_USER = "Forbidden";
  
    static readonly API_UNAUTHENTICATED_ERROR_MESSAGE = "Unable to authorize user";
  
    static readonly API_UNKNOWN_ERROR_MESSAGE = "The requested api is not supported on the platform";
  
    static readonly INTERNAL_SERVER_ERROR_MESSAGE = "Something went terribly wrong! Please contact support";
  
    static readonly API_FORBIDDEN_USER_MESSAGE = "User is not authorized to perform this action";
  
    static readonly PRISMA_CLIENT_KNOWN_ISSUE = "Data not found or incorrect data provided";
  
    static USER_DELETED_ERROR = "User does not exists";
  
    static readonly MULTER_NO_FILE_SELECTED_MESSAGE = "No file is selected for upload";
  
    static readonly ADMIN_MODIFICATION_DELETION_ERROR_MESSAGE = "Admin cannot be modified or deleted";
  
    static readonly ORGANIZATION_EMAIL_EXISTS = "Customer with that email already exists.";
  
    static readonly LINE_ITEM_EMPTY = "Item name cannot be blank.";
  
    static readonly LINE_ITEM_TYPE_EMPTY = "Please select the Item Type.";
  
    static readonly DATE_INVALID = "Date is Invalid.";
  
    static readonly LINE_ITEM_TYPE_INVALID = "Invalid Item Type. Allowed values are: Inventory, Service, NonInventory.";
  
    static readonly EXPENSE_ACCOUNT_ID_EMPTY = "expenseAccountId is required if item is of type Inventory, Service, NonInventory.";
  
    static readonly QUANTITY_ON_HAND_EMPTY = "Quantity is required for Inventory type.";
  
    static readonly ASSET_ACCOUNT_ID_EMPTY = "assetAccountId cannot be blank.";
  
    static readonly TRACK_QUANTITY_ON_HAND_IS_TRUE =
      "When you create an item, if Track quantity on hand is turned off, the item cannot be of type Inventory.";
  
    static readonly TRACK_QUANTITY_ON_HAND_IS_FALSE =
      "When you create an item, if Track quantity on hand is turned on, the item must of type Inventory.";
  
    static readonly INCOME_ACCOUNT_ID_EMPTY = "incomeAccountId is required for Inventory/Service type.";
  
    static readonly INVENTORY_START_DATE_EMPTY = "invStartDate is required for Inventory type.";
  
    static readonly ORGANIZATION_ID_INVALID = "Invalid organization id provided.";
  
    static readonly SUB_ITEM_EMPTY = "providerParentId is either required or not if subItem is true or false.";
  
    static readonly LINE_ITEM_QUERY_TYPE_INVALID = "Invalid Item Type. Allowed values are: po and invoice";
  
    static readonly LINE_ITEM_NAME_MAX_LENGTH = "Item name max length 100 characters";
  
    static readonly ORGANIZATION_ID_AND_BILL_ID_REQUIRED = "Organization Id and Bill Id are required";
    static readonly BILL_TRANSACTION_TYPE_INVALID = "Invalid Transaction type. Allowed values are:PurchaseOrder, BillPaymentCheck.";
  
    static readonly ITEM_TYPE_EMPTY = "Item type is required.";
    static readonly ITEM_TYPE_INVALID = "Invalid item type provided.";
    static readonly ASSET_ACCOUNT_ID_INVALID = "Invalid asset account id provided.";
    static readonly ITEM_NAME_EMPTY = "Item name is required.";
    static readonly ITEM_QUANTITY_ON_HAND_EMPTY = "Item quantity is required.";
    static readonly ACCOUNT_ID_INVALID = "Invalid account id provided.";
    static readonly ITEM_UNIT_PRICE_EMPTY = "Unit price is required.";
    static readonly ITEM_DESCRIPTION_EMPTY = "Item description is required.";
    static readonly ITEM_EMPTY = "Item is required.";
    static readonly ITEM_DETAIL_EMPTY = "Either 'bill_item' or 'invoice_item' is required.";
    static readonly ID_INVALID = "Invalid id provided.";
    static readonly ID_EMPTY = "Id is required.";
    static readonly ADDRESS_TYPE_EMPTY = "Address type is required.";
    static readonly ADDRESS_TYPE_INVALID = "Invalid address type provided. Allowed values are: billing,shipping,po_box, unknown";
    static readonly CUSTOMER_ID_EMPTY = "Customer id is required.";
    static readonly CUSTOMER_NAME_EMPTY = "Customer name is required.";
    static readonly CUSTOMER_NAME_INVALID = "Invalid customer name provided.";
    static readonly CONTACT_NAME_EMPTY = "Contact name is required.";
    static readonly CONTACT_NAME_INVALID = "Invalid contact name provided.";
    static readonly EMAIL_EMPTY = "Customer email is required.";
    static readonly EMAIL_INVALID = "Invalid customer email provided.";
    static readonly PHONE_EMPTY = "Customer phone is required.";
    static readonly PHONE_INVALID = "Invalid customer phone provided.";
    static readonly VENDOR_NAME_EMPTY = "Vendor name is required.";
    static readonly VENDOR_NAME_INVALID = "Invalid vendor name provided.";
    static readonly CURRENCY_CODE_INVALID = "Invalid currency code provided.";
    static readonly UUID_INVALID = "Invalid uuid provided.";
    static readonly VENDOR_ID_EMPTY = "Vendor id is required.";
    static readonly ITEM_ID_EMPTY = "Item id is required.";
    static readonly ITEM_QUANTITY_EMPTY = "Item quantity is required.";
  
    // reconciliation
    static readonly INVALID_OBJECT_TYPE =
      "Invalid object type. Allowed values are: banking_entry, invoice, contract, purchase_order, accounting_entry";
    static readonly OBJECT_TYPE_PAIR_NOT_SUPPORTED = "We currently do not support the provided objects comparison.";
    static readonly OBJECT_TYPE_EMPTY = "Object type is required.";
    static readonly OBJECT_TYPE_REFERENCE_EMPTY = "Reconciliation object reference is required.";
    static readonly OBJECT_TYPE_SOURCE_EMPTY = "Reconciliation object source is required.";
    static readonly ORGANIZATION_ID_EMPTY = "Organization id is required.";
    static readonly INVALID_VALUE_PROVIDED = "Invalid value provided.";
    static readonly RECONCILIATION_ARRAY_LENGTH_MISMATCH = "Arrays must have the same length";
    static readonly SOURCE_SAME_TYPE_REQUIRED = "Source must contain object of the same type";
    static readonly REFERENCE_SAME_TYPE_REQUIRED = "Reference must contain object of the same type";
  
    static readonly CUSTOMER_CREATED = "Customer created successfully";
    static readonly CUSTOMER_UPDATED = "Customer updated successfully";
    static readonly ITEM_CREATED = "Item created successfully";
    static readonly ITEM_UPDATED = "Item updated successfully";
  
    static readonly VENDOR_CREATED = "Vendor created successfully";
    static readonly VENDOR_UPDATED = "Vendor updated successfully";
  
    static readonly PURCHASE_ORDER_CREATED = "Purchase order created successfully";
  
    static readonly INVOICE_CREATED = "Invoice created successfully";
    static readonly INVOICE_UPDATED = "Invoice updated successfully";
    static readonly UAC_REQUEST_CREATED = "UAC request created successfully";
  }
  