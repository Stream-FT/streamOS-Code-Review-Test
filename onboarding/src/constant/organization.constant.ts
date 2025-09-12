export default class OrganizationConstant {
    static readonly PASSPORT_ALREADY_USED = "Passport has already uploaded. Please upload another type of doc.";
    static readonly IDCARD_ALREADY_USED = "Id Card has already uploaded. Please upload another type of doc";
    static readonly LICENSE_ALREADY_USED = "License has already uploaded. Please upload another type of doc";
    static readonly DOCUMENT_TYPE_USED = "This type of document has already uploaded. Please upload another type of doc.";
    static readonly DOCUMENT_NOT_FOUND = "Document not found";
    static readonly DOCUMENT_DELETED = "Document deleted";
    static readonly INVALID_DOCUMENT_TYPE = "Invalid document type";
    static readonly OWNER_NOT_FOUND = "Organization owner not found";
    static readonly DOCUMENT_ALREADY_EXISTS = "Document already exists";
    static readonly CONTROLLER_NOT_EXIST = "Controller not found";
    static readonly ADD_USERS_TO_GROUP_PARAMS_ERROR = "organizationId, groupId, and userIds are required";
    static readonly USER_GROUP_NOT_FOUND = "The user group does not exist";
    static readonly NON_EXIST_USER_ERROR = "There is at least one user that does not exist";
    static readonly NOTIFICATION_GROUP_ID_REQUIRED = "notificationGroupId is required";
    static readonly NOTIFICATION_TYPE_REQUIRED = "Please specify the type in the notificationData field";
    static readonly NOTIFICATION_LEVEL_REQUIRED = "Please specify the level in the notificationData field";
    static readonly NOTIFICATION_GROUP_NOT_FOUND = "The notification group was not found";
    static readonly NOTIFICATION_GROUP_TYPE_MISSMATCH = "The notification group cannot receive this type of notification";
    static readonly NOTIFICATION_LEVEL_MISSMATCH = "The notification group cannot receive this level of notification";
    static readonly NOTIFICATION_GROUP_RECIPIENTS_DO_NOT_EXIST = "The recipients do not exist";
    static readonly BENEFICIAL_OWNER_NOT_FOUND = "Beneficial owner not found";
    static readonly BENEFICIAL_OWNER_NOT_ONBOARDED = "Beneficial owner not onboarded to dwolla";
    static readonly SEND_GROUP_TYPE_NOTIFICATION_PARAMS_ERROR = "organizationId and notificationType are required";
    static readonly THE_NOTIFICATION_GROUP_DOES_NOT_EXIST = "The notification group does not exist";
    static readonly ORGANIZATION_NOT_FOUND = "Organization not found";
    static readonly ORGANIZATION_CONTROLLER_NOT_FOUND = "Organization controller not found";
    static readonly USER_NOT_FOUND = "User not found";
    static readonly SYSTEM_NOTIFICATION_LEVEL_REQUIRED = "Please specify the notification level that you want to receive";
    static readonly SYSTEM_NOTIFICATION = "system";
    static readonly USER_NOTIFICATION = "user";
    static readonly NEW_USER_GROUP_DOES_NOT_EXIST = "The new user group does not exist";
    static readonly SETTINGS_NOT_FOUND = "Settings not found";
    static readonly GLOBAL_SETTINGS_CANT_BE_UPDATED = "Global settings can't be updated";
    static readonly ORG_SETTING_NOT_FOUND = "Organization setting not found";
    static readonly PAYLOAD_NOT_FOUND = "Please provide the request payload";
    static readonly FETCH_USER_NOTIFICATION_PARAMS_ERROR = "The organizationId and the userId are required";
    static readonly ORG_AUTOMATION_WORKFLOW_NOT_FOUND = "Organization automation workflow not found";
    static readonly ORG_AUTOMATION_ENTITY_NOT_FOUND = "Organization automation entity not found";
    static readonly NOTIFICATION_NOT_FOUND = "The notification does not exist";
    static readonly NOTIFICATION_STATUS_INVALID = "The notification status is not valid";
    static readonly VALID_NOTIFICATION_STATUSES = ["seen", "read", "interacted", "archived"];
    static readonly GET_NOTIFICATIONS_PAGE_SIZE = 500;
    static readonly INCOMING_WEBHOOK_URL_IS_REQUIRED = "Please provide the incoming webhook url";
    static readonly NOTIFICATION_TYPE = {
      SYSTEM: "system",
      USER: "user",
    };
  
    static readonly NOTIFICATION_LEVEL = {
      ERROR: "error",
      DEBUG: "debug",
      WARNING: "warning",
      INFO: "info",
    };
    static readonly NOTIFICATION_LINK = {
      PURCHASE_ORDER: "PURCHASE_ORDER",
      INVOICE: "INVOICE",
      PAYMENT: "PAYMENT",
    };
    static readonly RECONCILIATION_ENGINE_NOTIFICATION_CONTENT =
      "There are some mismatched data from the reconciliation enginer for the organization $ORGANIZATION_ID";
    static readonly USER_ID_REQUIRED = "The user id is required";
    static readonly OBJECT_ID_REQUIRED = "The object id is required";
    static readonly OBJECT_STATUSES = {
      DRAFT: "DRAFT",
      ARPPOVED: "ARPPOVED",
      REJECTED: "REJECTED",
    };
    static readonly INVALID_APPROVER = "The user is not an approver of this object";
    static readonly RECONCILE_SUPPORTED_TYPES = ["product", "customer"];
    static readonly RECONCILE_UNSUPPORTED_TYPES_ERROR = "The type should be cusomter or product";
    static readonly RECONCILE_TYPES = {
      PRODUCT: "product",
      CUSTOMER: "customer",
    };
  }
  