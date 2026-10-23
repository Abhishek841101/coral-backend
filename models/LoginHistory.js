
import mongoose from "mongoose";

const loginHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  loginAt: {
    type: Date,
    default: Date.now,
    required: true,
    index: true,
  },
});

const LoginHistory = mongoose.model(
  "LoginHistory",
  loginHistorySchema
);

export default LoginHistory;
