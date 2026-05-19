// src/models/ApplicableIssue.js
const mongoose = require("mongoose");

const applicableIssueSchema = new mongoose.Schema(
  {
    companyShareId: { type: Number, index: true },
    scrip: { type: String, index: true },
    companyName: { type: String },
    shareTypeName: { type: String },   // e.g. "IPO", "FPO", "RIGHT"
    shareGroupName: { type: String },  // e.g. "Ordinary Shares"
    issueOpenDate: { type: String },
    issueCloseDate: { type: String },
    subGroup: { type: String },
    statusName: { type: String },
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ApplicableIssue", applicableIssueSchema);
