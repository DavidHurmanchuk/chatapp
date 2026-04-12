import express from "express";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 1) return res.json([]);

  try {
    const users = await User.find({
      _id: { $ne: req.user.id },
      $or: [
        { name: { $regex: q.trim(), $options: "i" } },
        { email: { $regex: q.trim(), $options: "i" } },
      ],
    })
      .select("_id name email avatar")
      .limit(10)
      .lean();

    res.json(
      users.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
      })),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
});

export default router;
