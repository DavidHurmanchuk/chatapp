import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import passport from "passport";
import { config } from "../config/index.js";
import { HTTP_STATUS } from "../constants/http.js";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/User.js";

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateToken(user) {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    config.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

// ─── Passport: Google ─────────────────────────────────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${config.BACKEND_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("No email from Google"));
        let user = await User.findOne({
          $or: [{ providerId: profile.id, provider: "google" }, { email }],
        });
        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email,
            avatar: profile.photos?.[0]?.value,
            provider: "google",
            providerId: profile.id,
          });
        }
        done(null, user);
      } catch (err) {
        done(err);
      }
    },
  ),
);

// ─── Passport: GitHub ─────────────────────────────────────────────────────────
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${config.BACKEND_URL}/api/auth/github/callback`,
      scope: ["user:email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("No email from GitHub"));
        let user = await User.findOne({
          $or: [{ providerId: profile.id, provider: "github" }, { email }],
        });
        if (!user) {
          user = await User.create({
            name: profile.displayName || profile.username,
            email,
            avatar: profile.photos?.[0]?.value,
            provider: "github",
            providerId: String(profile.id),
          });
        }
        done(null, user);
      } catch (err) {
        done(err);
      }
    },
  ),
);

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    done(null, await User.findById(id));
  } catch (err) {
    done(err);
  }
});

// ─── Auth middleware ───────────────────────────────────────────────────────────
// Читаємо токен з Authorization header АБО з куки (для сумісності)
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token =
    (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null) ||
    req.cookies?.token;

  if (!token)
    return res
      .status(HTTP_STATUS.UNAUTHORIZED)
      .json({ error: "Not authenticated" });

  try {
    req.user = jwt.verify(token, config.JWT_SECRET);
    next();
  } catch {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "Invalid token" });
  }
}

// ─── Register ─────────────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: "name, email and password are required" });
  if (password.length < 6)
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: "Password must be at least 6 characters" });

  try {
    const existing = await User.findOne({ email });
    if (existing)
      return res
        .status(HTTP_STATUS.CONFLICT)
        .json({ error: "Email already in use" });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashed,
      provider: "local",
    });
    const token = generateToken(user);

    res.status(HTTP_STATUS.CREATED).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error(err);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: "Registration failed" });
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json({ error: "email and password are required" });

  try {
    const user = await User.findOne({ email });
    if (!user || !user.password)
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ error: "Invalid email or password" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res
        .status(HTTP_STATUS.UNAUTHORIZED)
        .json({ error: "Invalid email or password" });

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error(err);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: "Login failed" });
  }
});

// ─── Logout ───────────────────────────────────────────────────────────────────
router.post("/logout", (req, res) => {
  res.json({ message: "Logged out" });
  // Токен видаляється на фронтенді з localStorage
});

// ─── Me ───────────────────────────────────────────────────────────────────────
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user)
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ error: "User not found" });
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: "Failed" });
  }
});

// ─── Google OAuth ─────────────────────────────────────────────────────────────
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${config.FRONTEND_URL}/login?error=google`,
  }),
  (req, res) => {
    const token = generateToken(req.user);
    // Передаємо токен через URL — фронтенд збереже в localStorage
    res.redirect(`${config.FRONTEND_URL}/auth/callback?token=${token}`);
  },
);

// ─── GitHub OAuth ─────────────────────────────────────────────────────────────
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] }),
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: `${config.FRONTEND_URL}/login?error=github`,
  }),
  (req, res) => {
    const token = generateToken(req.user);
    res.redirect(`${config.FRONTEND_URL}/auth/callback?token=${token}`);
  },
);

export { passport };
export default router;
