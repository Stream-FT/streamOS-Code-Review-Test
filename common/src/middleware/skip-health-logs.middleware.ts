// Custom middleware function to conditionally apply morgan logging
import { Request, Response } from "express";

export function skipLogging(req: Request, _res: Response) {
  // Add the paths you want to skip logging for
  const excludedPaths = ["/health"];

  // Return true if the current request path is in the excludedPaths array
  return excludedPaths.includes(req.path);
}
