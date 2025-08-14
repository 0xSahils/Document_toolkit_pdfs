const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs-extra");
require("dotenv").config();

const connectDB = require("./config/database");
const pdfRoutes = require("./routes/pdfRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running!" });
});

app.use("/api/pdf", pdfRoutes);

// Serve static files from React build
const clientBuildPath = path.join(__dirname, "../frontend/dist");
console.log("Looking for client build at:", clientBuildPath);

if (fs.existsSync(clientBuildPath)) {
  console.log("Client build found, serving static files");

  // Serve static files with proper caching headers
  app.use(
    express.static(clientBuildPath, {
      maxAge: process.env.NODE_ENV === "production" ? "1d" : "0",
      etag: true,
    })
  );

  // Handle React routing, return all requests to React app
  app.get("*", (req, res) => {
    const indexPath = path.join(clientBuildPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({
        success: false,
        message: "Frontend index.html not found",
        buildPath: clientBuildPath,
      });
    }
  });
} else {
  console.log("Client build not found at:", clientBuildPath);
  // Development mode - show message if build doesn't exist
  app.get("*", (req, res) => {
    res.status(404).json({
      success: false,
      message:
        "Frontend build not found. Run 'npm run build' to build the client.",
      buildPath: clientBuildPath,
      hint: "Make sure to run 'npm run build' from the root directory",
    });
  });
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Error:", error);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Internal server error",
  });
});

// Clean up temp files on startup
const cleanupTempFiles = () => {
  const tempDir = path.join(__dirname, "uploads");
  if (fs.existsSync(tempDir)) {
    fs.emptyDirSync(tempDir);
    console.log("Temporary files cleaned up");
  }
};

cleanupTempFiles();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
