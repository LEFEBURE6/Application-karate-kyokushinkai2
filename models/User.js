const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isPaid: { type: Boolean, default: false },

  resetPasswordToken: String,
  resetPasswordExpire: Date
});

module.exports = mongoose.model("User", userSchema);




