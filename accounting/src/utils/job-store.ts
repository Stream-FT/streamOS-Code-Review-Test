type AsyncJobMetadata = {
    organizationId: string;
    jobId: string;
    response_url: string;
    status: string;
    response_body?: Record<string, any> | null;
  };
  
  const jobStore = new Map<string, AsyncJobMetadata>();
  
  export const storeJob = (jobId: string, metadata: AsyncJobMetadata) => {
    jobStore.set(jobId, metadata);
  };
  
  export const getJobMetadata = (jobId: string): AsyncJobMetadata | undefined => {
    return jobStore.get(jobId);
  };
  
  export const deleteJob = (jobId: string): void => {
    jobStore.delete(jobId);
  };
  
  export const updateJobMetadata = (jobId: string, updates: Partial<AsyncJobMetadata>): void => {
    const job = jobStore.get(jobId);
    if (job) {
      const updatedJob = { ...job, ...updates };
      jobStore.set(jobId, updatedJob);
    } else {
      console.warn(`Attempted to update metadata for non-existent jobId: ${jobId}`);
    }
  };
  