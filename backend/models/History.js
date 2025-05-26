const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  outputName: { type: String, required: true },
  spriteSheetPath: { type: String, required: true },
  dataPath: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  options: { type: Object }
});

module.exports = mongoose.model('History', historySchema);