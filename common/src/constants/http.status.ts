/**
 * Generic Http status code constants
 */
export default class HttpStatus {
    static readonly HTTP_SUCCESS_OK = 200;
    static readonly HTTP_SUCCESS_CREATED = 201;
    static readonly HTTP_SUCCESS_NO_ACTION = 204;
  
    static readonly HTTP_CLIENT_ERROR_BAD_REQUEST = 400;
    static readonly HTTP_CLIENT_ERROR_UNAUTHORIZED = 401;
    static readonly HTTP_CLIENT_ERROR_FORBIDDEN = 403;
    static readonly HTTP_CLIENT_ERROR_NOT_FOUND = 404;
  
    static readonly INTERNAL_SERVER_ERROR = 500;
  }
  