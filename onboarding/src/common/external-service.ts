// externalService.ts

import { approval } from "@prisma/client";
import axios from "axios";

const debounceInterval = 500; // .5 seconds
const maxDelay = 1000; // 1 second

let debounceTimer: any = null;
let lastCallTime = 0; // Track the last call time

export async function contractFactoryRun(organizationId: string): Promise<void> {
  //TODO: Update URL with environment variable updated to correct path
  const url = `${process.env.CONTRACT_API_URL}/contracts/${organizationId}/factory/run`;
  try {
    await axios.post(
      url,
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    console.log(`POST to contractFactoryRun was successful (url: ${url})`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error(`Network Error in contractFactoryRun: ${error.response.status} ${error.response}`);
      } else {
        console.error(`Unexpected Axios Error in contractFactoryRun: ${error.message}`);
      }
    } else {
      console.error(`Error posting to contractFactoryRun: url ${url} : ${error}`);
    }
  }
}

export async function triggerWorkflow(organizationId: string): Promise<void> {
  const today = new Date();
  const todayYearMonth = today.getFullYear().toString() + (today.getMonth() + 1).toString().padStart(2, "0");
  const url = `${process.env.AUTOMATIONS_API_URL}/organization/${organizationId}/sync/create-uac-invoices?sync_to_accounting=false`;
  console.log(`Today's year month: ${todayYearMonth} and url: ${url}`);

  const billingPeriods = ["202312", "202402", "202403", "202404", "202405"];
  for (const billingPeriod of billingPeriods) {
    try {
      await axios.post(url, { billing_period: billingPeriod });
      console.log(`POST to triggerWorkflow for ${billingPeriod} was successful (url: ${url})`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error(
            `Network Error in triggerWorkflow(${billingPeriod}): ${error?.response?.status} ${JSON.stringify(error?.response?.data)}`,
          );
        } else {
          console.error(`Unexpected Axios Error in triggerWorkflow(${billingPeriod}): ${error?.message}`);
        }
      } else {
        console.error(`Error posting to triggerWorkflow(${billingPeriod}): url ${url} : ${error}`);
      }
    }
  }
  lastCallTime = Date.now();
}

export function triggerWorkflowWithConditions(organizationId: string) {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;

  // If it's been more than maxDelay since the last call, execute immediately
  if (timeSinceLastCall > maxDelay) {
    triggerWorkflow(organizationId);
  } else {
    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
      triggerWorkflow(organizationId);
    }, debounceInterval);
  }
}

export async function notifySlackServiceForApproval(approval: approval) {
  const url = `${process.env.SLACK_SERVICE_URL}/send_approval_request`;
  try {
    await axios.post(url, { approval });
    console.log(`POST to notifySlackServiceForApproval was successful (approval_id: ${approval.approval_id}) (url: ${url})`);
    lastCallTime = Date.now();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error("Network Error in notifySlackServiceForApproval:", error.response.status, error.response.data);
      } else {
        console.error("Unexpected Axios Error in notifySlackServiceForApproval:", error.message);
      }
    } else {
      console.error(
        `Error posting to notifySlackServiceForApproval (approval_id: ${approval.approval_id}) (url: ${url}) : ${(error as Error).message}`,
      );
    }
  }
}
