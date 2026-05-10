import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import session from "express-session";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { config, isProd } from "./config/index.js";
import { initSocket } from "./socket/index.js";
import { HTTP_STATUS } from "./constants/http.js";

import authRouter, { passport } from "./routes/auth.js";
import conversationsRouter from "./routes/conversations.js";
import usersRouter from "./routes/users.js";

const app = express();
const server = http.createServer(app);

// ─── Socket.io ────────────────────────────────────────────────────────────────
initSocket(server);

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(
  helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }),
);

// CORS — перед rate limiting щоб preflight проходив
app.use(cors({ origin: config.FRONTEND_URL, credentials: true }));
app.options("*", cors({ origin: config.FRONTEND_URL, credentials: true }));

// Rate limiting
const skipOptions = (req) => req.method === "OPTIONS";

app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    skip: skipOptions,
    message: { error: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    skip: skipOptions,
    message: { error: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(
  session({
    secret: config.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProd,
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/conversations", conversationsRouter);
app.use("/api/users", usersRouter);
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", env: config.NODE_ENV }),
);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({ error: "Not found" });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[Error]", err.message, err.stack);
  res.status(err.status ?? HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    error: isProd ? "Internal server error" : err.message,
  });
});

// ─── Database ─────────────────────────────────────────────────────────────────
mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    server.listen(config.PORT, () => {
      console.log(
        `🚀 Server running on http://localhost:${config.PORT} [${config.NODE_ENV}]`,
      );
    });
  })
  .catch((err) => {
    console.error("❌ Startup failed:", err.message);
    process.exit(1);
  });
