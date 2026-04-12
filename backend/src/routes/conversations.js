import express from "express";
import OpenAI from "openai";
import Conversation from "../models/Conversation.js";
import ConversationMessage from "../models/ConversationMessage.js";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";
import { io } from "../index.js";

const router = express.Router();
router.use(authMiddleware);

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

function getDMName(conv, myId) {
  const other = conv.members.find((m) => String(m._id) !== String(myId));
  return other?.name ?? "Unknown";
}

function formatConv(conv, myId) {
  const isDM = conv.type === "dm";
  const unreadMap =
    conv.unreadCount instanceof Map
      ? conv.unreadCount
      : new Map(Object.entries(conv.unreadCount ?? {}));
  return {
    id: conv._id,
    type: conv.type,
    name: isDM ? getDMName(conv, myId) : conv.name,
    members: conv.members.map((m) => ({
      id: m._id,
      name: m.name,
      avatar: m.avatar,
    })),
    createdBy: conv.createdBy,
    aiTrigger: conv.aiTrigger,
    last_message: conv.last_message ?? null,
    last_at: conv.last_at ?? null,
    unread: unreadMap.get(String(myId)) ?? 0,
  };
}

function formatMsg(m) {
  return {
    id: m._id,
    sender: m.senderName,
    senderId: m.senderId,
    content: m.content,
    reactions: m.reactions ?? [],
    readBy: (m.readBy ?? []).map((id) => String(id)),
    created_at: m.createdAt,
  };
}

router.get("/", async (req, res) => {
  try {
    const myId = String(req.user.id);
    const convs = await Conversation.find({
      members: req.user.id,
      $or: [
        { type: { $ne: "dm" } },
        { type: "dm", hiddenBy: { $ne: req.user.id } },
      ],
    })
      .populate("members", "name email avatar")
      .sort({ last_at: -1, updatedAt: -1 })
      .lean();

    res.json(convs.map((c) => formatConv(c, myId)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

router.post("/dm", async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId is required" });

  try {
    const targetUser = await User.findById(userId).lean();
    if (!targetUser) return res.status(404).json({ error: "User not found" });

    let conv = await Conversation.findOne({
      type: "dm",
      members: { $all: [req.user.id, userId], $size: 2 },
    }).populate("members", "name email avatar");

    if (conv) {
      await Conversation.findByIdAndUpdate(conv._id, {
        $pull: { hiddenBy: req.user.id },
      });
      return res.json(formatConv(conv.toObject(), String(req.user.id)));
    }

    conv = await Conversation.create({
      type: "dm",
      members: [req.user.id, userId],
      createdBy: req.user.id,
    });
    const populated = await Conversation.findById(conv._id)
      .populate("members", "name email avatar")
      .lean();

    io.to(`user:${userId}`).emit(
      "new_conversation",
      formatConv(populated, String(userId)),
    );
    res.status(201).json(formatConv(populated, String(req.user.id)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create DM" });
  }
});

router.post("/group", async (req, res) => {
  const { name, memberIds, withAI, aiTrigger } = req.body;
  if (!name || typeof name !== "string")
    return res.status(400).json({ error: "name is required" });
  if (name.trim().length < 1 || name.trim().length > 50)
    return res
      .status(400)
      .json({ error: "Group name must be 1-50 characters" });

  try {
    const type = withAI ? "group_ai" : "group";
    const members = [req.user.id, ...(memberIds ?? [])];

    const conv = await Conversation.create({
      type,
      name: name.trim(),
      members,
      createdBy: req.user.id,
      aiTrigger: aiTrigger ?? "/groq",
    });
    const populated = await Conversation.findById(conv._id)
      .populate("members", "name email avatar")
      .lean();
    const formatted = formatConv(populated, String(req.user.id));

    members.forEach((memberId) => {
      if (String(memberId) !== String(req.user.id)) {
        io.to(`user:${memberId}`).emit("new_conversation", formatted);
      }
    });

    res.status(201).json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create group" });
  }
});

router.post("/ai", async (req, res) => {
  try {
    const existing = await Conversation.findOne({
      type: "ai",
      members: { $all: [req.user.id], $size: 1 },
    }).lean();
    if (existing) return res.json(formatConv(existing, String(req.user.id)));

    const conv = await Conversation.create({
      type: "ai",
      name: "AI Assistant",
      members: [req.user.id],
      createdBy: req.user.id,
    });
    res.status(201).json(formatConv(conv, String(req.user.id)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create AI chat" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const conv = await Conversation.findOne({
      _id: req.params.id,
      members: req.user.id,
    });
    if (!conv) return res.status(404).json({ error: "Not found" });

    if (conv.type === "dm" || conv.type === "ai") {
      await Conversation.findByIdAndUpdate(req.params.id, {
        $addToSet: { hiddenBy: req.user.id },
      });
      return res.json({ hidden: true });
    }

    const isCreator = String(conv.createdBy) === String(req.user.id);

    if (isCreator) {
      await ConversationMessage.deleteMany({ conversationId: req.params.id });
      await Conversation.findByIdAndDelete(req.params.id);
      io.to(`conv:${req.params.id}`).emit("conversation_deleted", {
        conversationId: req.params.id,
      });
      return res.json({ deleted: true });
    } else {
      await Conversation.findByIdAndUpdate(req.params.id, {
        $pull: { members: req.user.id },
      });
      io.to(`conv:${req.params.id}`).emit("member_left", {
        conversationId: req.params.id,
        userId: req.user.id,
        userName: req.user.name,
      });
      return res.json({ left: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
});

router.patch("/:id/name", async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "name is required" });

  try {
    const conv = await Conversation.findOne({
      _id: req.params.id,
      members: req.user.id,
    });
    if (!conv) return res.status(404).json({ error: "Not found" });
    if (conv.type === "dm" || conv.type === "ai")
      return res.status(400).json({ error: "Cannot rename this type" });
    if (String(conv.createdBy) !== String(req.user.id))
      return res.status(403).json({ error: "Only creator can rename" });

    const updated = await Conversation.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true },
    )
      .populate("members", "name email avatar")
      .lean();

    io.to(`conv:${req.params.id}`).emit("conversation_renamed", {
      conversationId: req.params.id,
      name: name.trim(),
    });

    res.json(formatConv(updated, String(req.user.id)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to rename" });
  }
});

router.post("/:id/read", async (req, res) => {
  try {
    const myId = String(req.user.id);
    await Conversation.findByIdAndUpdate(req.params.id, {
      [`unreadCount.${myId}`]: 0,
    });

    const updated = await ConversationMessage.updateMany(
      { conversationId: req.params.id, readBy: { $ne: req.user.id } },
      { $addToSet: { readBy: req.user.id } },
    );

    if (updated.modifiedCount > 0) {
      io.to(`conv:${req.params.id}`).emit("messages_read", {
        conversationId: req.params.id,
        userId: myId,
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/:id/messages", async (req, res) => {
  try {
    const conv = await Conversation.findOne({
      _id: req.params.id,
      members: req.user.id,
    });
    if (!conv) return res.status(403).json({ error: "Access denied" });

    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const before = req.query.before;

    const query = { conversationId: req.params.id };
    if (before) {
      const pivot = await ConversationMessage.findById(before).lean();
      if (pivot) query.createdAt = { $lt: pivot.createdAt };
    }

    const messages = await ConversationMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const hasMore = messages.length === limit;

    res.json({ messages: messages.reverse().map(formatMsg), hasMore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.post("/:id/messages", async (req, res) => {
  const { content, socketId } = req.body;
  if (!content || typeof content !== "string")
    return res.status(400).json({ error: "content is required" });
  if (content.trim().length === 0)
    return res.status(400).json({ error: "Message cannot be empty" });
  if (content.length > 4000)
    return res.status(400).json({ error: "Message too long (max 4000 chars)" });

  try {
    const conv = await Conversation.findOne({
      _id: req.params.id,
      members: req.user.id,
    });
    if (!conv) return res.status(403).json({ error: "Access denied" });

    const msgDoc = await ConversationMessage.create({
      conversationId: req.params.id,
      senderId: req.user.id,
      senderName: req.user.name,
      content,
      readBy: [req.user.id],
    });

    const userMessage = formatMsg(msgDoc);

    const otherMembers = conv.members.filter(
      (m) => String(m) !== String(req.user.id),
    );
    const incOps = {};
    otherMembers.forEach((memberId) => {
      incOps[`unreadCount.${memberId}`] = 1;
    });

    await Conversation.findByIdAndUpdate(req.params.id, {
      last_message: content,
      last_at: new Date(),
      $inc: incOps,
    });

    if (conv.type === "dm") {
      await Conversation.findByIdAndUpdate(req.params.id, {
        $pull: { hiddenBy: { $in: conv.members } },
      });
    }

    const emitTarget = socketId
      ? io.to(`conv:${req.params.id}`).except(socketId)
      : io.to(`conv:${req.params.id}`);
    emitTarget.emit("new_conv_message", {
      conversationId: req.params.id,
      message: userMessage,
    });

    const isAIChat = conv.type === "ai";
    const isGroupAI =
      conv.type === "group_ai" && content.startsWith(conv.aiTrigger ?? "/groq");

    if (isAIChat || isGroupAI) {
      const promptContent = isGroupAI
        ? content.slice((conv.aiTrigger ?? "/groq").length).trim()
        : content;

      try {
        const history = await ConversationMessage.find({
          conversationId: req.params.id,
        })
          .sort({ createdAt: -1 })
          .limit(21)
          .lean();

        const historyMessages = history
          .reverse()
          .slice(0, -1)
          .map((m) => ({
            role: m.senderName === "AI Assistant" ? "assistant" : "user",
            content: m.content,
          }));

        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful AI assistant inside a chat app. Be concise, friendly, and professional.",
            },
            ...historyMessages,
            { role: "user", content: promptContent },
          ],
        });

        const aiText = completion.choices[0].message.content;

        let aiUser = await User.findOne({
          email: "ai@chatapp.internal",
        }).lean();
        if (!aiUser) {
          aiUser = await User.create({
            name: "AI Assistant",
            email: "ai@chatapp.internal",
            provider: "local",
          });
        }

        const aiDoc = await ConversationMessage.create({
          conversationId: req.params.id,
          senderId: aiUser._id,
          senderName: "AI Assistant",
          content: aiText,
          readBy: [],
        });

        const aiMessage = formatMsg(aiDoc);

        const aiEmit = socketId
          ? io.to(`conv:${req.params.id}`).except(socketId)
          : io.to(`conv:${req.params.id}`);
        aiEmit.emit("new_conv_message", {
          conversationId: req.params.id,
          message: aiMessage,
        });

        await Conversation.findByIdAndUpdate(req.params.id, {
          last_message: aiText,
        });

        return res.json({ userMessage, aiMessage });
      } catch (aiErr) {
        console.error("AI error:", aiErr.message);
        const errorText =
          aiErr.status === 429
            ? "⚠️ AI quota exceeded."
            : `⚠️ AI error: ${aiErr.message}`;
        const errDoc = await ConversationMessage.create({
          conversationId: req.params.id,
          senderId: req.user.id,
          senderName: "AI Assistant",
          content: errorText,
          readBy: [],
        });
        const errorMessage = formatMsg(errDoc);
        io.to(`conv:${req.params.id}`).emit("new_conv_message", {
          conversationId: req.params.id,
          message: errorMessage,
        });
        return res.json({ userMessage, aiMessage: errorMessage });
      }
    }

    res.json({ userMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

router.post("/:id/messages/:msgId/reactions", async (req, res) => {
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ error: "emoji is required" });

  try {
    const conv = await Conversation.findOne({
      _id: req.params.id,
      members: req.user.id,
    });
    if (!conv) return res.status(403).json({ error: "Access denied" });

    const msg = await ConversationMessage.findById(req.params.msgId);
    if (!msg) return res.status(404).json({ error: "Message not found" });

    const existing = msg.reactions.find((r) => r.emoji === emoji);

    if (existing) {
      const hasReacted = existing.users.some(
        (u) => String(u) === String(req.user.id),
      );
      if (hasReacted) {
        existing.users = existing.users.filter(
          (u) => String(u) !== String(req.user.id),
        );
        if (existing.users.length === 0)
          msg.reactions = msg.reactions.filter((r) => r.emoji !== emoji);
      } else {
        existing.users.push(req.user.id);
      }
    } else {
      msg.reactions.push({ emoji, users: [req.user.id] });
    }

    await msg.save();
    const formatted = formatMsg(msg);

    io.to(`conv:${req.params.id}`).emit("reaction_updated", {
      conversationId: req.params.id,
      message: formatted,
    });

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update reaction" });
  }
});

router.post("/:id/members", async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId is required" });

  try {
    const conv = await Conversation.findOne({
      _id: req.params.id,
      members: req.user.id,
    });
    if (!conv) return res.status(404).json({ error: "Not found" });
    if (conv.type === "dm" || conv.type === "ai")
      return res.status(400).json({ error: "Cannot add members to this type" });

    const target = await User.findById(userId).lean();
    if (!target) return res.status(404).json({ error: "User not found" });

    const alreadyMember = conv.members.some(
      (m) => String(m) === String(userId),
    );
    if (alreadyMember)
      return res.status(400).json({ error: "Already a member" });

    await Conversation.findByIdAndUpdate(req.params.id, {
      $push: { members: userId },
    });

    const updated = await Conversation.findById(req.params.id)
      .populate("members", "name email avatar")
      .lean();

    const formatted = formatConv(updated, String(req.user.id));

    io.to(`user:${userId}`).emit(
      "new_conversation",
      formatConv(updated, String(userId)),
    );
    io.to(`conv:${req.params.id}`).emit("member_joined", {
      conversationId: req.params.id,
      user: { id: target._id, name: target.name },
    });

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add member" });
  }
});

export default router;
