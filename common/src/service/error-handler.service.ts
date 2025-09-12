import { Prisma } from "@prisma/client";
import { AxiosError } from "axios";
import { Response } from "express";
import { Logger } from "winston";

// Error handler
import HttpStatus from "@common/constants/http.status";
import StringConstants from "@common/constants/string.constants";
import { CustomError } from "@common/middleware/error.middleware";
/**
 * Generic error handler service to catch and report any expected/unexpected error in the app.
 */
export class ErrorHandlerService {
  constructor(private readonly logger: Logger) {}

  /**
   * A generic error handler to catch and report any expected/unexpected error in the app.
   * @param res  Response object to respond api
   * @param err Details of the error thrown
   */
  handleError(res: Response, err: Error) {
    let stack = "";
    let status = err instanceof CustomError ? (err as CustomError).status : HttpStatus.INTERNAL_SERVER_ERROR;
    let error = err.name;
    let description = err instanceof CustomError ? err.stack : StringConstants.INTERNAL_SERVER_ERROR_MESSAGE;
    status = err instanceof Prisma.PrismaClientKnownRequestError ? HttpStatus.HTTP_CLIENT_ERROR_BAD_REQUEST : status;
    stack =
      err instanceof Prisma.PrismaClientKnownRequestError ? ((err as Prisma.PrismaClientKnownRequestError).meta?.message as string) : stack;
    description = err instanceof Prisma.PrismaClientKnownRequestError ? StringConstants.PRISMA_CLIENT_KNOWN_ISSUE : description;

    status = err instanceof Prisma.PrismaClientValidationError ? HttpStatus.HTTP_CLIENT_ERROR_BAD_REQUEST : status;
    stack = err instanceof Prisma.PrismaClientValidationError ? ((err as Prisma.PrismaClientValidationError).message as string) : stack;
    description = err instanceof Prisma.PrismaClientValidationError ? StringConstants.PRISMA_CLIENT_KNOWN_ISSUE : description;
    status = err instanceof Prisma.PrismaClientKnownRequestError ? HttpStatus.HTTP_CLIENT_ERROR_BAD_REQUEST : status;
    stack = err instanceof Prisma.PrismaClientKnownRequestError ? ((err as Prisma.PrismaClientValidationError).message as string) : stack;
    description = err instanceof Prisma.PrismaClientKnownRequestError ? StringConstants.PRISMA_CLIENT_KNOWN_ISSUE : description;
    status = err instanceof AxiosError ? HttpStatus.HTTP_CLIENT_ERROR_BAD_REQUEST : status;
    error = err instanceof AxiosError ? (err.code as string) : error;
    description = err instanceof AxiosError ? err.message : description;
    error = (err as any).errCode ? (err as any).errCode : error;
    description = (err as any).description ? (err as any).description : description;
    status = err instanceof RangeError ? HttpStatus.HTTP_CLIENT_ERROR_BAD_REQUEST : status;
    error = err instanceof RangeError ? StringConstants.HTTP_CLIENT_ERROR_BAD_REQUEST : error;
    description = err instanceof RangeError ? err.message : description;
    const errRes = {
      error,
      description,
    };
    // log the error in error.log
    this.logger.error(
      JSON.stringify({
        error,
        description,
        stack,
      }),
    );
    res.status(status).json(errRes);
  }

  /**
   * A generic error handler to catch and report any expected/unexpected error in the async services.
   * @param err Details of the error thrown
   */
  handleAsyncError(err: Error) {
    const stack = err.stack;
    const error = err.name;
    const description = err instanceof CustomError ? err.stack : err.message;

    // log the error in error.log
    this.logger.error(
      JSON.stringify({
        error,
        description,
        stack,
      }),
    );
  }
}

export const extractErrorMessage = (error: any): string => {
  console.log("Error:", error);

  let errorMessage: string;

  if (typeof error?.data?.error === "object") {
    errorMessage =
      error.data.error.message ||
      error.data.error.error_message ||
      JSON.stringify(error.data.error);
  } else if (typeof error?.data === "object") {
    errorMessage =
      error.data.message ||
      error.data.error_message ||
      JSON.stringify(error.data);
  } else if (typeof error?.error === "object") {
    errorMessage =
      error.error.message ||
      error.error.error_message ||
      JSON.stringify(error.error);
  } else {
    errorMessage =
      typeof error?.data?.error === "string" ? error.data.error :
      typeof error?.data === "string" ? error.data :
      error?.message ||
      error?.error_message ||
      String(error) ||
      "An error occurred";
  }

  return errorMessage;
};

