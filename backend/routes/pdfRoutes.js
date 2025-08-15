const express = require("express");
const path = require("path");
const fs = require("fs-extra");
const { uploadSingle, uploadMultiple } = require("../middleware/upload");
const PDFProcessor = require("../utils/pdfProcessor");
const FileManager = require("../utils/fileManager");
const PdfOperation = require("../models/PdfOperation");

const router = express.Router();

router.post("/merge", uploadMultiple, async (req, res) => {
  const startTime = Date.now();
  let operation = null;
  const filesToCleanup = [];

  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least 2 PDF files to merge",
      });
    }

    const originalFiles = req.files.map((file) => ({
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    }));

    operation = new PdfOperation({
      operation: "merge",
      originalFiles,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    if (PdfOperation.db && PdfOperation.db.readyState === 1) {
      await operation.save();
    }

    const inputPaths = req.files.map((file) => file.path);
    filesToCleanup.push(...inputPaths);

    const outputFilename = FileManager.generateUniqueFilename("merged.pdf");
    const outputPath = path.join(__dirname, "../uploads", outputFilename);
    filesToCleanup.push(outputPath);

    await PDFProcessor.mergePDFs(inputPaths, outputPath);

    const resultSize = FileManager.getFileSize(outputPath);
    const processingTime = Date.now() - startTime;

    // Always use direct server download for reliability
    let downloadUrl = `/api/pdf/download/${path.basename(outputPath)}`;

    // Optional: Upload to Cloudinary as backup but use server download
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        await FileManager.uploadToCloudinary(outputPath);
        console.log("Merge file backed up to Cloudinary successfully");
      } catch (cloudError) {
        console.error("Cloudinary backup failed:", cloudError.message);
      }
    }

    if (operation && PdfOperation.db && PdfOperation.db.readyState === 1) {
      operation.status = "completed";
      operation.processingTime = processingTime;
      operation.resultFile = {
        filename: outputFilename,
        size: resultSize,
        url: downloadUrl,
      };
      await operation.save();
    }

    FileManager.cleanupFiles(filesToCleanup);

    res.json({
      success: true,
      message: "PDFs merged successfully",
      data: {
        filename: outputFilename,
        size: FileManager.formatFileSize(resultSize),
        downloadUrl,
        processingTime: `${processingTime}ms`,
      },
    });
  } catch (error) {
    console.error("Merge error:", error);

    if (operation && PdfOperation.db && PdfOperation.db.readyState === 1) {
      operation.status = "failed";
      operation.errorMessage = error.message;
      await operation.save();
    }

    FileManager.cleanupFiles(filesToCleanup);

    res.status(500).json({
      success: false,
      message: "Failed to merge PDFs",
      error: error.message,
    });
  }
});

router.post("/split", uploadSingle, async (req, res) => {
  const startTime = Date.now();
  let operation = null;
  const filesToCleanup = [];

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF file to split",
      });
    }

    const { pages } = req.body;
    let pageNumbers = null;

    if (pages) {
      try {
        pageNumbers = JSON.parse(pages);
      } catch (e) {
        pageNumbers = pages.split(",").map((p) => parseInt(p.trim()));
      }
    }

    operation = new PdfOperation({
      operation: "split",
      originalFiles: [
        {
          filename: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      ],
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    if (PdfOperation.db && PdfOperation.db.readyState === 1) {
      await operation.save();
    }

    filesToCleanup.push(req.file.path);

    const outputDir = await FileManager.createTempDir("split");
    filesToCleanup.push(outputDir);

    const resultPaths = await PDFProcessor.splitPDF(
      req.file.path,
      outputDir,
      pageNumbers
    );

    const processingTime = Date.now() - startTime;
    const results = [];

    for (const resultPath of resultPaths) {
      const filename = path.basename(resultPath);
      const size = FileManager.getFileSize(resultPath);

      // Copy file to uploads directory for download access
      const uploadsPath = path.join(__dirname, "../uploads", filename);
      await fs.copy(resultPath, uploadsPath);
      filesToCleanup.push(uploadsPath);

      // Always use direct server download for reliability
      let downloadUrl = `/api/pdf/download/${filename}`;

      // Optional: Upload to Cloudinary as backup but use server download
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        try {
          await FileManager.uploadToCloudinary(uploadsPath);
          console.log(
            `Split file ${filename} backed up to Cloudinary successfully`
          );
        } catch (cloudError) {
          console.error("Cloudinary backup failed:", cloudError.message);
        }
      }

      results.push({
        filename,
        size: FileManager.formatFileSize(size),
        downloadUrl,
      });
    }

    if (operation && PdfOperation.db && PdfOperation.db.readyState === 1) {
      operation.status = "completed";
      operation.processingTime = processingTime;
      await operation.save();
    }

    FileManager.cleanupFiles(filesToCleanup);

    res.json({
      success: true,
      message: `PDF split into ${results.length} pages`,
      data: {
        pages: results,
        processingTime: `${processingTime}ms`,
      },
    });
  } catch (error) {
    console.error("Split error:", error);

    if (operation && PdfOperation.db && PdfOperation.db.readyState === 1) {
      operation.status = "failed";
      operation.errorMessage = error.message;
      await operation.save();
    }

    FileManager.cleanupFiles(filesToCleanup);

    res.status(500).json({
      success: false,
      message: "Failed to split PDF",
      error: error.message,
    });
  }
});

router.post("/compress", uploadSingle, async (req, res) => {
  const startTime = Date.now();
  let operation = null;
  const filesToCleanup = [];

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF file to compress",
      });
    }

    const { quality = 0.7 } = req.body;

    operation = new PdfOperation({
      operation: "compress",
      originalFiles: [
        {
          filename: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      ],
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    if (PdfOperation.db && PdfOperation.db.readyState === 1) {
      await operation.save();
    }

    filesToCleanup.push(req.file.path);

    const outputFilename = FileManager.generateUniqueFilename(
      req.file.originalname,
      "_compressed"
    );
    const outputPath = path.join(__dirname, "../uploads", outputFilename);
    filesToCleanup.push(outputPath);

    await PDFProcessor.compressPDF(
      req.file.path,
      outputPath,
      parseFloat(quality)
    );

    const originalSize = req.file.size;
    const compressedSize = FileManager.getFileSize(outputPath);
    const compressionRatio = (
      ((originalSize - compressedSize) / originalSize) *
      100
    ).toFixed(1);
    const processingTime = Date.now() - startTime;

    // Always use direct server download for reliability
    let downloadUrl = `/api/pdf/download/${path.basename(outputPath)}`;

    // Optional: Upload to Cloudinary as backup but use server download
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        await FileManager.uploadToCloudinary(outputPath);
        console.log("Compress file backed up to Cloudinary successfully");
      } catch (cloudError) {
        console.error("Cloudinary backup failed:", cloudError.message);
      }
    }

    if (operation && PdfOperation.db && PdfOperation.db.readyState === 1) {
      operation.status = "completed";
      operation.processingTime = processingTime;
      operation.resultFile = {
        filename: outputFilename,
        size: compressedSize,
        url: downloadUrl,
      };
      await operation.save();
    }

    FileManager.cleanupFiles(filesToCleanup);

    // Determine compression message
    let compressionMessage = "PDF compressed successfully";
    if (compressionRatio < 0) {
      compressionMessage =
        "PDF optimized (no size reduction achieved - file was already optimized)";
    } else if (compressionRatio < 5) {
      compressionMessage = "PDF compressed with minimal size reduction";
    } else if (compressionRatio < 20) {
      compressionMessage = "PDF compressed with moderate size reduction";
    } else {
      compressionMessage = "PDF compressed with significant size reduction";
    }

    res.json({
      success: true,
      message: compressionMessage,
      data: {
        filename: outputFilename,
        originalSize: FileManager.formatFileSize(originalSize),
        compressedSize: FileManager.formatFileSize(compressedSize),
        compressionRatio: `${compressionRatio}%`,
        downloadUrl,
        processingTime: `${processingTime}ms`,
        note:
          compressionRatio < 0
            ? "Some PDFs are already optimized and cannot be compressed further"
            : null,
      },
    });
  } catch (error) {
    console.error("Compress error:", error);

    if (operation && PdfOperation.db && PdfOperation.db.readyState === 1) {
      operation.status = "failed";
      operation.errorMessage = error.message;
      await operation.save();
    }

    FileManager.cleanupFiles(filesToCleanup);

    res.status(500).json({
      success: false,
      message: "Failed to compress PDF",
      error: error.message,
    });
  }
});

router.post("/convert", uploadSingle, async (req, res) => {
  const startTime = Date.now();
  let operation = null;
  const filesToCleanup = [];

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF file to convert",
      });
    }

    const { format = "png" } = req.body;

    operation = new PdfOperation({
      operation: "convert",
      originalFiles: [
        {
          filename: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      ],
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

    if (PdfOperation.db && PdfOperation.db.readyState === 1) {
      await operation.save();
    }

    filesToCleanup.push(req.file.path);

    const outputDir = await FileManager.createTempDir("convert");
    filesToCleanup.push(outputDir);

    const imagePaths = await PDFProcessor.convertPDFToImages(
      req.file.path,
      outputDir,
      format
    );

    const processingTime = Date.now() - startTime;
    const results = [];

    for (const imagePath of imagePaths) {
      const filename = path.basename(imagePath);
      const size = FileManager.getFileSize(imagePath);

      // Copy file to uploads directory for download access
      const uploadsPath = path.join(__dirname, "../uploads", filename);
      await fs.copy(imagePath, uploadsPath);
      filesToCleanup.push(uploadsPath);

      // Always use direct server download for reliability
      let downloadUrl = `/api/pdf/download/${filename}`;

      // Optional: Upload to Cloudinary as backup but use server download
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        try {
          await FileManager.uploadToCloudinary(uploadsPath);
          console.log(
            `Convert file ${filename} backed up to Cloudinary successfully`
          );
        } catch (cloudError) {
          console.error("Cloudinary backup failed:", cloudError.message);
        }
      }

      results.push({
        filename,
        size: FileManager.formatFileSize(size),
        downloadUrl,
      });
    }

    if (operation && PdfOperation.db && PdfOperation.db.readyState === 1) {
      operation.status = "completed";
      operation.processingTime = processingTime;
      await operation.save();
    }

    FileManager.cleanupFiles(filesToCleanup);

    res.json({
      success: true,
      message: `PDF converted to ${
        results.length
      } ${format.toUpperCase()} images`,
      data: {
        images: results,
        format: format.toUpperCase(),
        processingTime: `${processingTime}ms`,
      },
    });
  } catch (error) {
    console.error("Convert error:", error);
    console.error("Error stack:", error.stack);

    // Log more details for debugging
    console.error("Environment info:", {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      env: process.env.NODE_ENV,
    });

    if (operation && PdfOperation.db && PdfOperation.db.readyState === 1) {
      operation.status = "failed";
      operation.errorMessage = error.message;
      await operation.save();
    }

    FileManager.cleanupFiles(filesToCleanup);

    // Provide more detailed error information
    let errorMessage = "Failed to convert PDF";
    let errorDetails = error.message;

    if (error.message.includes("Canvas")) {
      errorMessage = "PDF conversion failed due to missing system dependencies";
      errorDetails =
        "The server environment is missing required graphics libraries. Please contact support.";
    } else if (error.message.includes("pdf2pic")) {
      errorMessage = "PDF conversion service temporarily unavailable";
      errorDetails =
        "The PDF to image conversion service is experiencing issues. Please try again later.";
    } else if (
      error.message.includes("All PDF to image conversion methods failed")
    ) {
      errorMessage = "PDF conversion not supported in current environment";
      errorDetails =
        "The server cannot process PDF to image conversion at this time. Please try a different operation.";
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: errorDetails,
      debug:
        process.env.NODE_ENV === "development"
          ? {
              originalError: error.message,
              stack: error.stack,
            }
          : undefined,
    });
  }
});

router.get("/info", uploadSingle, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF file",
      });
    }

    const info = await PDFProcessor.getPDFInfo(req.file.path);

    FileManager.cleanupFiles([req.file.path]);

    res.json({
      success: true,
      message: "PDF info retrieved successfully",
      data: {
        ...info,
        fileSize: FileManager.formatFileSize(req.file.size),
      },
    });
  } catch (error) {
    console.error("Info error:", error);

    if (req.file) {
      FileManager.cleanupFiles([req.file.path]);
    }

    res.status(500).json({
      success: false,
      message: "Failed to get PDF info",
      error: error.message,
    });
  }
});

router.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "../uploads", filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: "File not found",
    });
  }

  // Set proper headers for PDF download
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );

  res.download(filePath, filename, (err) => {
    if (err) {
      console.error("Download error:", err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Failed to download file",
        });
      }
    }
  });
});

router.get("/history", async (req, res) => {
  try {
    if (!PdfOperation.db || PdfOperation.db.readyState !== 1) {
      return res.json({
        success: true,
        message: "Database not connected",
        data: [],
      });
    }

    const { page = 1, limit = 10, operation } = req.query;
    const query = operation ? { operation } : {};

    const operations = await PdfOperation.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-__v");

    const total = await PdfOperation.countDocuments(query);

    res.json({
      success: true,
      data: operations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("History error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get history",
      error: error.message,
    });
  }
});

// Health check endpoint for PDF conversion capabilities
router.get("/health", async (req, res) => {
  try {
    const healthStatus = {
      server: "healthy",
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        env: process.env.NODE_ENV,
      },
      dependencies: {},
    };

    // Check pdf2pic availability
    try {
      require("pdf2pic");
      healthStatus.dependencies.pdf2pic = "available";
    } catch (error) {
      healthStatus.dependencies.pdf2pic = "unavailable";
    }

    // Check pdf-poppler availability
    try {
      require("pdf-poppler");
      healthStatus.dependencies.pdfPoppler = "available";
    } catch (error) {
      healthStatus.dependencies.pdfPoppler = "unavailable";
    }

    // Check canvas availability
    try {
      require("canvas");
      healthStatus.dependencies.canvas = "available";
    } catch (error) {
      healthStatus.dependencies.canvas = "unavailable";
    }

    // Check pdfjs-dist availability
    try {
      require("pdfjs-dist/legacy/build/pdf.js");
      healthStatus.dependencies.pdfjs = "available";
    } catch (error) {
      healthStatus.dependencies.pdfjs = "unavailable";
    }

    // Check database connection
    if (PdfOperation.db && PdfOperation.db.readyState === 1) {
      healthStatus.database = "connected";
    } else {
      healthStatus.database = "disconnected";
    }

    res.json({
      success: true,
      message: "Health check completed",
      data: healthStatus,
    });
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({
      success: false,
      message: "Health check failed",
      error: error.message,
    });
  }
});

module.exports = router;
