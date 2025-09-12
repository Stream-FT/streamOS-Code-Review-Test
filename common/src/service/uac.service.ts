import axios, { AxiosInstance, AxiosResponse, CreateAxiosDefaults } from "axios";
import { TAccountingInvoice } from "@accounting/schema/invoice.schema";
import { IAsyncJobResponse } from "@common/interface/uac/job.interface";
import { UacURL } from "@common/constants/uac.api.url";
import { PLATFORM_CONFIGS } from "@common/constants/platform-config.constant";
import {
    createInvoice as createWaveInvoice,
} from "@common/service/wave.uac.service";
import { IConnectionCredentials } from "@common/interface/uac/connection-response.interface";

const options: CreateAxiosDefaults = {
    baseURL: `${process.env.RUTTER_BASE_URL || "https://production.rutterapi.com"}`,
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.RUTTER_CLIENT_ID}:${process.env.RUTTER_CLIENT_SECRET}`).toString("base64")}`,
      "X-Rutter-Version": process.env.RUTTER_VERSION,
    },
};
  
const axiosInstance: AxiosInstance = axios.create(options);

export async function fetchConnectionCredentials(accessToken: string, connectionId: string) {
  const requestBody = {
    credential: {
      type: "oauth",
    },
    connection: {
      id: connectionId,
    },
  };

  return new Promise<IConnectionCredentials>((resolve, reject) => {
    axiosInstance
      .get(UacURL.foundation.getConnectionCredentials(accessToken), { data: requestBody })
      .then((response: AxiosResponse<IConnectionCredentials>) => resolve(response.data))
      .catch((err: any) => reject(err?.response?.data));
  });
}

export async function createInvoice(accessToken: string, payload: { response_mode: "async" | "prefer_sync"; invoice: TAccountingInvoice }) {
    return new Promise<IAsyncJobResponse>((resolve, reject) => {
      axiosInstance
        .post(UacURL.receivable.createInvoice(accessToken), payload)
        .then((response: AxiosResponse<IAsyncJobResponse>) => resolve(response.data))
        .catch((err: any) => reject(err?.response?.data));
    });
}

export async function createInvoiceByPlatform(organization: any, invoicePayload: any) {
    const platform = organization.uac_platform;
  
    if (!platform) {
      throw new Error(`Platform not found for organization: ${organization.id}`);
    }
  
    const platformConfig = PLATFORM_CONFIGS[platform];
    if (!platformConfig) {
      throw new Error(`Platform config not found for platform: ${platform}, not supported`);
    }
  
    if (platform === "wave") {
      return createWaveInvoice(organization, platformConfig, invoicePayload);
    } else {
      throw new Error(`Platform ${platform} is not supported for creating invoices`);
    }
}

export async function getInvoicePDFById(accessToken: string, id: string) {
  return new Promise<any>((resolve, reject) => {
    axiosInstance
      .get(UacURL.receivable.getInvoicePDFById(accessToken, id))
      .then((response: AxiosResponse<any>) => resolve(response.data))
      .catch((err: any) => reject(err?.response?.data));
  });
}