import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/User.js";

const router = express.Router();

const isProd = process.env.NODE_ENV === "production";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 днів
};

function generateToken(user) {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

function setTokenCookie(res, token) {
  res.cookie("token", token, COOKIE_OPTIONS);
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || "http://localhost:4000"}/api/auth/google/callback`,
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

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL || "http://localhost:4000"}/api/auth/github/callback`,
      scope: ["user:email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email)
          return done(
            new Error(
              "No email from GitHub. Make sure your GitHub email is public.",
            ),
          );

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
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res
      .status(400)
      .json({ error: "name, email and password are required" });

  if (password.length < 6)
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });

  try {
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ error: "Email already in use" });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashed,
      provider: "local",
    });

    const token = generateToken(user);
    setTokenCookie(res, token);

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "email and password are required" });

  try {
    const user = await User.findOne({ email });
    if (!user || !user.password)
      return res.status(401).json({ error: "Invalid email or password" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: "Invalid email or password" });

    const token = generateToken(user);
    setTokenCookie(res, token);

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token", COOKIE_OPTIONS);
  res.json({ message: "Logged out" });
});

router.get("/me", async (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google`,
  }),
  (req, res) => {
    const token = generateToken(req.user);
    setTokenCookie(res, token);
    res.redirect(process.env.FRONTEND_URL || "http://localhost:3000");
  },
);

router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] }),
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=github`,
  }),
  (req, res) => {
    const token = generateToken(req.user);
    setTokenCookie(res, token);
    res.redirect(process.env.FRONTEND_URL || "http://localhost:3000");
  },
);

export { passport };
export default router;
