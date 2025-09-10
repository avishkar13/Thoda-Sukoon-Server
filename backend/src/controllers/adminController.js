// src/controllers/adminController.js
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Assessment from "../models/Assessment.js";
import Chat from "../models/Chat.js";

// 📊 Dashboard stats
export const getAdminStats = asyncHandler(async (req, res) => {
  const users = await User.countDocuments();
  const counsellors = await User.countDocuments({ role: "counsellor" });
  const assessments = await Assessment.countDocuments();
  const chats = await Chat.countDocuments();

  res.json({
    users,
    counsellors,
    assessments,
    chats,
  });
});

// 👥 List all users
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("aliasId role createdAt");
  res.json(users);
});

// 📝 List all assessments 
export const getAllAssessments = asyncHandler(async (req, res) => {
  const assessments = await Assessment.find()
    .populate("userId", "aliasId role")
    .sort({ createdAt: -1 });

  const formatted = assessments.map((a) => {
    return {
      id: a._id,
      aliasId: a.userId?.aliasId || "Unknown",
      role: a.userId?.role || "student",
      phq9: a.phq9?.total
        ? { total: a.phq9.total, result: a.phq9.result }
        : null,
      gad7: a.gad7?.total
        ? { total: a.gad7.total, result: a.gad7.result }
        : null,
      ghq: a.ghq?.total
        ? { total: a.ghq.total, result: a.ghq.result }
        : null,
      createdAt: a.createdAt,
    };
  });

  res.json(formatted);
});


// 💬 Return chat statistics per user
export const getChatStats = asyncHandler(async (req, res) => {
//   const collegeId = req.user.collegeId; // optional scoping for future

  const stats = await Chat.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    // Optional: filter by college
    // { $match: { "user.collegeId": collegeId } },
    {
      $project: {
        aliasId: "$user.aliasId",
        role: "$user.role",
        userMessages: {
          $size: {
            $filter: {
              input: "$messages",
              as: "msg",
              cond: { $eq: ["$$msg.sender", "user"] },
            },
          },
        },
        botMessages: {
          $size: {
            $filter: {
              input: "$messages",
              as: "msg",
              cond: { $eq: ["$$msg.sender", "bot"] },
            },
          },
        },
      },
    },
  ]);

  res.json(stats);
});