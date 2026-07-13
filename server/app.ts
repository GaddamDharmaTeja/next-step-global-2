import express, { type Express } from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import cookieParser from "cookie-parser";
import router from "./routes";
import { logger } from "./lib/logger";
import { attachAuthUser, getCookieSecret } from "./lib/auth";
import { getUploadsRoot } from "./lib/uploads";

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
app.use("/uploads", express.static(getUploadsRoot()));
app.use("/uploads", (req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    next();
    return;
  }

  res
    .status(200)
    .type("image/svg+xml")
    .send(
      "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"640\" height=\"420\" viewBox=\"0 0 640 420\"><rect width=\"640\" height=\"420\" fill=\"#f1f5f9\"/><path d=\"M160 298l83-96 62 70 44-48 131 74H160z\" fill=\"#cbd5e1\"/><circle cx=\"410\" cy=\"150\" r=\"34\" fill=\"#e2e8f0\"/><text x=\"320\" y=\"355\" text-anchor=\"middle\" font-family=\"Arial, sans-serif\" font-size=\"24\" fill=\"#64748b\">Image unavailable</text></svg>",
    );
});

app.use("/api", router);

export default app;
