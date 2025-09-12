import "module-alias/register";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import AccountingRoutes from "@accounting/routes/index.routes";
import authRouter from "@authentication/auth.router";
import StringConstants from "@common/constants/string.constants";
import logger from "@common/logger";
import { errorMiddleware } from "@common/middleware/error.middleware";
import { skipLogging } from "@common/middleware/skip-health-logs.middleware";
import organizationRoute from "@onboarding/route/organization.route";
import userRoute from "@onboarding/route/user.route";

dotenv.config();

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function () {
  return String(this);
};

const app: express.Express = express();
const port = process.env.PORT || 4000;

const corsOptions = {
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: "*",
  credentials: true, // If your frontend sends cookies or auth headers
};
app.use(cors(corsOptions));

// Custom CSP configuration
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    baseUri: ["'self'"],
    fontSrc: ["'self'", "https://fonts.googleapis.com"],
    formAction: ["'self'"],
    frameAncestors: ["'self'", "https://us-east-1.quicksight.aws.amazon.com"],
    connectSrc: ["'self'", "https://*.quicksight.amazonaws.com"],
    imgSrc: ["'self'", "https://cdn.example.com", "data:"],
    objectSrc: ["'none'"],
    scriptSrc: ["'self'"], // Limit scripts to self-hosted
    styleSrc: ["'self'"],
    upgradeInsecureRequests: [],
  },
};

app.use(helmet.hidePoweredBy());

// Serve static files with caching
app.use(
  "/static",
  express.static("public", {
    maxAge: "1d",
    immutable: true,
  }),
);

app.use(helmet.contentSecurityPolicy(cspConfig));

app.use((_req: express.Request, res: express.Response, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

app.use((_req: express.Request, res: express.Response, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});

// Set HSTS header with helmet
app.use(
  helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  }),
);

app.use(morgan("combined", { skip: skipLogging }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(express.json({ limit: "5mb" }));
app.use("/organization", organizationRoute);
app.use("/user", userRoute);
app.use("/accounting", AccountingRoutes);
app.use("/auth", authRouter);
app.get("/health", (_req: express.Request, res: express.Response) => {
  res.status(200).send({ message: "ok" });
});

app.use(errorMiddleware);
if (process.env.NODE_ENV !== StringConstants.NODE_ENV_TEST) {
  app.listen(port, () => {
    logger.info(`⚡️[server]: Server is running at http://localhost:${port}`);
  });
}

export default app;
