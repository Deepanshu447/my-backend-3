const mongoose = require("mongoose");
const MessageSchema = new mongoose.Schema({
  sender: String,
   receiver: String,
  recipient: String,
  text: String,
  ts: { type: Date, default: Date.now }
});
module.exports = mongoose.model("Message", MessageSchema);
