const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    text: { type: String, required: true },
    ts: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Message", messageSchema);