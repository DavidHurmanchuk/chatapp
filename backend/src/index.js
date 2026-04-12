import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import session from "express-session";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Server } from "socket.io";

import authRouter, { passport } from "./routes/auth.js";
import conversationsRouter from "./routes/conversations.js";
import usersRouter from "./routes/users.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export const io = new Server(server, {
  cors: { origin: FRONTEND_URL, credentials: true },
});

io.on("connection", (socket) => {
  socket.on("register_user", (userId) => socket.join(`user:${userId}`));
  socket.on("join_conversation", (convId) => socket.join(`conv:${convId}`));
  socket.on("disconnect", () => {});
});

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }),
);

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.options("*", cors({ origin: FRONTEND_URL, credentials: true }));

const skipOptions = (req) => req.method === "OPTIONS";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skip: skipOptions,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  skip: skipOptions,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth", authLimiter);
app.use("/api", generalLimiter);

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.JWT_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRouter);
app.use("/api/conversations", conversationsRouter);
app.use("/api/users", usersRouter);
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 4000;

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/chatapp")
  .then(() => {
    console.log("✅ MongoDB connected");
    server.listen(PORT, () =>
      console.log(`🚀 Backend running on http://localhost:${PORT}`),
    );
  })
  .catch((err) => {
    console.error("Startup failed:", err);
    process.exit(1);
  });
