import express, { type Express } from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import cookieParser from "cookie-parser";
import router from "./routes";
import legacyUploadsRouter from "./routes/legacy-uploads";
import { logger } from "./lib/logger";
import { attachAuthUser, getCookieSecret } from "./lib/auth";

const app: Express = express();
const allowedOrigins = (process.env.APP_CORS_ALLOWED_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS origin not allowed"));
    },
  }),
);
app.use(cookieParser(getCookieSecret()));
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(attachAuthUser);

app.use("/uploads", legacyUploadsRouter);
app.use("/api", router);

export default app;
