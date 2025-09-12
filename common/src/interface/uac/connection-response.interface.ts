export interface IConnectionResponse {
    connection: IConnection;
  }
  
  interface IConnection {
    id: string;
    access_token: string;
    link_url: string;
    platform: string;
  }
  
  export interface IConnectionData {
    id: string;
    platform: string;
    orgId: string;
  }
  
  export interface IConnectionStatusData {
    last_sync_completed_at: string;
  }
  
  export interface IConnectionStatus {
    status: IConnectionStatusData;
    connection: IConnectionData;
  }
  
  export interface IConnectionCredentials {
    credential: {
      type: string;
      access_token: string;
      platform_specific_credentials: {
        realm: string;
      };
      scopes: string;
    };
    connection: IConnectionData;
  }
  