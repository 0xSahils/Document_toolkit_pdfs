const mongoose = require("mongoose");

const pdfOperationSchema = new mongoose.Schema(
  {
    operation: {
      type: String,
      required: true,
      enum: ["merge", "split", "compress", "convert"],
    },
    originalFiles: [
      {
        filename: String,
        size: Number,
        mimetype: String,
      },
    ],
    resultFile: {
      filename: String,
      size: Number,
      url: String,
    },
    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
    },
    processingTime: {
      type: Number, // in milliseconds
    },
    errorMessage: String,
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

// Add index for better query performance
pdfOperationSchema.index({ createdAt: -1 });
pdfOperationSchema.index({ operation: 1 });

module.exports = mongoose.model("PdfOperation", pdfOperationSchema);
