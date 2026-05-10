import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { HTTP_STATUS } from "../constants/http.js";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token =
    (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null) ||
    req.cookies?.token;

  if (!token) {
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ error: "Not authenticated" });
  }

  try {
    req.user = jwt.verify(token, config.JWT_SECRET);
    next();
  } catch {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "Invalid token" });
  }
}
