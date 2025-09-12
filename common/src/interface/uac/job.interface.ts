export interface IAsyncJob {
    id: string;
    status: string;
    response_url: string;
  }
  
  export interface IAsyncJobResponse {
    async_response: IAsyncJob;
  }
  
  export interface AsyncJobs {
    job_id: string;
    job_type: string;
    response_url: string;
    status: string;
    organization_id: string;
    response_body: Record<string, any> | null;
    platform_id: string | null;
  }
  
  export interface IJobRequest {
    url: string;
    method: string;
    body: Record<string, any>;
  }
  
  export interface IJobResponse {
    http_status: number;
    body: Record<string, any>;
  }
  
  export interface IJob {
    id: string;
    status: string;
    request: IJobRequest | null;
    response: IJobResponse | null;
  }
  
  export interface IJobEventData {
    type: "JOB";
    code: "JOB_COMPLETED";
    connection_id: string;
    access_token: string;
    job: IJob;
  }
  