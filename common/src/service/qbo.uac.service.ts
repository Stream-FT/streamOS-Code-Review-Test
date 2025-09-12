import axios from "axios";

import { PLATFORM_CONFIGS } from "@common/constants/platform-config.constant";
import { fetchConnectionCredentials } from "@common/service/uac.service";

// Cache storage
const tokenCache: Record<string, { accessToken: string; expiresAt: number }> = {};

export const getAccessToken = async (organization: any) => {
  try {
    const cacheKey = organization.id;
    const cachedToken = tokenCache[cacheKey];
    const now = Date.now();

    if (cachedToken && cachedToken.expiresAt > now) {
      return cachedToken.accessToken;
    }

    const connectionCreds = await fetchConnectionCredentials(organization.uac_access_token, organization.uac_connection_id);

    const newAccessToken = connectionCreds.credential.access_token;
    const expiresIn = 3600 * 1000;

    tokenCache[cacheKey] = {
      accessToken: newAccessToken,
      expiresAt: now + expiresIn,
    };
    return newAccessToken;
  } catch (error) {
    console.log(`Error fetching QBO access token for organization ${organization.id} with error: ${error}`);
    throw error;
  }
};

export const getPaymentLink = async (invoice: any, organization: any) => {
  try {
    const credentials = await getAccessToken(organization);
    const platform = organization.uac_platform;
    const platformConfig = PLATFORM_CONFIGS[platform];

    const BASE_URL = platformConfig.baseUrl;
    const url = `${BASE_URL}/v3/company/${organization.uac_realm_id}/invoice/${invoice.platform_id}?minorversion=62&include=invoiceLink`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${credentials}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const invoiceLink = response.data.Invoice.InvoiceLink;

    return invoiceLink;
  } catch (error) {
    console.error(`Error fetching payment link for invoice ${invoice.id} for organization ${organization.id}:`, error);
    throw error;
  }
};
