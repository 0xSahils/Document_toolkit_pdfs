const PDFMerger = require("pdf-merger-js");
const { PDFDocument } = require("pdf-lib");
const fs = require("fs-extra");
const path = require("path");

class PDFProcessor {
  static async mergePDFs(filePaths, outputPath) {
    const merger = new PDFMerger();

    for (const filePath of filePaths) {
      await merger.add(filePath);
    }

    await merger.save(outputPath);
    return outputPath;
  }

  static async splitPDF(inputPath, outputDir, pages) {
    const pdfBytes = await fs.readFile(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const totalPages = pdfDoc.getPageCount();

    const results = [];

    if (pages && pages.length > 0) {
      for (let i = 0; i < pages.length; i++) {
        const pageNum = pages[i];
        if (pageNum > 0 && pageNum <= totalPages) {
          const newPdf = await PDFDocument.create();
          const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageNum - 1]);
          newPdf.addPage(copiedPage);

          const outputPath = path.join(outputDir, `page_${pageNum}.pdf`);
          const pdfBytesNew = await newPdf.save();
          await fs.writeFile(outputPath, pdfBytesNew);
          results.push(outputPath);
        }
      }
    } else {
      for (let i = 0; i < totalPages; i++) {
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
        newPdf.addPage(copiedPage);

        const outputPath = path.join(outputDir, `page_${i + 1}.pdf`);
        const pdfBytesNew = await newPdf.save();
        await fs.writeFile(outputPath, pdfBytesNew);
        results.push(outputPath);
      }
    }

    return results;
  }

  static async compressPDF(inputPath, outputPath, quality = 0.7) {
    try {
      const pdfBytes = await fs.readFile(inputPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const originalSize = pdfBytes.length;

      // Try different compression strategies based on quality
      let compressedBytes;

      if (quality <= 0.3) {
        // Aggressive compression - convert to images and back
        compressedBytes = await this.imageBasedCompression(pdfDoc, quality);
      } else if (quality <= 0.6) {
        // Medium compression - optimize existing PDF
        compressedBytes = await this.optimizePDF(pdfDoc, true);
      } else {
        // Light compression - basic optimization
        compressedBytes = await this.optimizePDF(pdfDoc, false);
      }

      // Check if compression was effective
      if (compressedBytes.length < originalSize) {
        await fs.writeFile(outputPath, compressedBytes);
        console.log(
          `Compression successful: ${originalSize} -> ${compressedBytes.length} bytes`
        );
      } else {
        // If no compression achieved, copy original
        console.log("No compression benefit, keeping original file");
        await fs.copy(inputPath, outputPath);
      }

      return outputPath;
    } catch (error) {
      console.error("PDF compression failed:", error.message);
      // Fallback: copy original file
      await fs.copy(inputPath, outputPath);
      return outputPath;
    }
  }

  static async optimizePDF(pdfDoc, aggressive = false) {
    const options = {
      useObjectStreams: true,
      addDefaultPage: false,
    };

    if (aggressive) {
      options.objectsPerTick = 10; // Smaller chunks for better compression
    }

    return await pdfDoc.save(options);
  }

  static async imageBasedCompression(pdfDoc, quality) {
    try {
      // This is a placeholder for image-based compression
      // For now, use the most aggressive pdf-lib settings
      return await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 5,
      });
    } catch (error) {
      console.error("Image-based compression failed:", error.message);
      return await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });
    }
  }

  static async getPDFInfo(filePath) {
    const pdfBytes = await fs.readFile(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    return {
      pageCount: pdfDoc.getPageCount(),
      title: pdfDoc.getTitle() || "Untitled",
      author: pdfDoc.getAuthor() || "Unknown",
      creator: pdfDoc.getCreator() || "Unknown",
      producer: pdfDoc.getProducer() || "Unknown",
      creationDate: pdfDoc.getCreationDate(),
      modificationDate: pdfDoc.getModificationDate(),
    };
  }

  static async convertPDFToImages(inputPath, outputDir, format = "png") {
    try {
      // Try multiple conversion methods for better deployment compatibility
      console.log("Starting PDF to image conversion...");

      // Method 1: Try pdf2pic (most reliable for deployments)
      try {
        return await this.pdf2picConversion(inputPath, outputDir, format);
      } catch (pdf2picError) {
        console.log(
          "pdf2pic failed, trying alternative method:",
          pdf2picError.message
        );
      }

      // Method 2: Try PDF.js with Canvas (fallback)
      try {
        return await this.pdfJsImageConversion(inputPath, outputDir, format);
      } catch (pdfJsError) {
        console.log("PDF.js conversion failed:", pdfJsError.message);
      }

      // Method 3: Try pdf-poppler (another fallback)
      try {
        return await this.pdfPopplerConversion(inputPath, outputDir, format);
      } catch (popplerError) {
        console.log("pdf-poppler failed:", popplerError.message);
      }

      throw new Error("All PDF to image conversion methods failed");
    } catch (error) {
      console.error("PDF to image conversion error:", error.message);
      throw new Error(`PDF to image conversion failed: ${error.message}`);
    }
  }

  static async pdf2picConversion(inputPath, outputDir, format = "png") {
    try {
      const pdf2pic = require("pdf2pic");

      const options = {
        density: 150, // Output resolution
        saveFilename: "page", // Output filename
        savePath: outputDir, // Output directory
        format: format.toLowerCase() === "jpg" ? "jpeg" : format.toLowerCase(),
        width: 2000, // Max width
        height: 2000, // Max height
        quality: 80, // JPEG quality
      };

      console.log("Using pdf2pic for conversion with options:", options);

      const convert = pdf2pic.fromPath(inputPath, options);
      const results = await convert.bulk(-1); // Convert all pages

      const outputPaths = results.map((result) => result.path);

      if (outputPaths.length === 0) {
        throw new Error("No pages were converted");
      }

      console.log(
        `Successfully converted ${outputPaths.length} pages using pdf2pic`
      );
      return outputPaths;
    } catch (error) {
      console.error("pdf2pic conversion error:", error.message);
      throw new Error(`pdf2pic conversion failed: ${error.message}`);
    }
  }

  static async pdfPopplerConversion(inputPath, outputDir, format = "png") {
    try {
      const pdf = require("pdf-poppler");

      const options = {
        format: format.toLowerCase() === "jpg" ? "jpeg" : format.toLowerCase(),
        out_dir: outputDir,
        out_prefix: "page",
        page: null, // Convert all pages
        scale: 2048, // High resolution
      };

      console.log("Using pdf-poppler for conversion");

      const results = await pdf.convert(inputPath, options);

      if (!results || results.length === 0) {
        throw new Error("No pages were converted");
      }

      console.log(
        `Successfully converted ${results.length} pages using pdf-poppler`
      );
      return results;
    } catch (error) {
      console.error("pdf-poppler conversion error:", error.message);
      throw new Error(`pdf-poppler conversion failed: ${error.message}`);
    }
  }

  static async pdfJsImageConversion(inputPath, outputDir, format = "png") {
    try {
      // Use legacy build for Node.js
      const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

      // Check if canvas is available
      let createCanvas;
      try {
        createCanvas = require("canvas").createCanvas;
      } catch (canvasError) {
        throw new Error("Canvas package not available in this environment");
      }

      // Set up PDF.js worker for Node.js environment
      if (typeof global !== "undefined") {
        try {
          global.DOMMatrix = require("dommatrix");
        } catch (domError) {
          console.log("DOMMatrix not available, continuing without it");
        }
      }

      // Read PDF file
      const pdfBuffer = await fs.readFile(inputPath);
      const pdfData = new Uint8Array(pdfBuffer);

      // Load PDF document
      const pdfDocument = await pdfjsLib.getDocument({ data: pdfData }).promise;
      const numPages = pdfDocument.numPages;

      const results = [];

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        try {
          // Get page
          const page = await pdfDocument.getPage(pageNum);

          // Set scale for good quality
          const scale = 2.0;
          const viewport = page.getViewport({ scale });

          // Create canvas
          const canvas = createCanvas(viewport.width, viewport.height);
          const context = canvas.getContext("2d");

          // Render page to canvas
          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };

          await page.render(renderContext).promise;

          // Save image
          const filename = `page-${pageNum}.${format}`;
          const outputPath = path.join(outputDir, filename);

          let buffer;
          if (
            format.toLowerCase() === "jpg" ||
            format.toLowerCase() === "jpeg"
          ) {
            buffer = canvas.toBuffer("image/jpeg", { quality: 0.8 });
          } else {
            buffer = canvas.toBuffer("image/png");
          }

          await fs.writeFile(outputPath, buffer);
          results.push(outputPath);

          console.log(`Converted page ${pageNum}/${numPages} to ${filename}`);
        } catch (pageError) {
          console.error(`Error converting page ${pageNum}:`, pageError.message);
          // Continue with other pages
        }
      }

      if (results.length === 0) {
        throw new Error("No pages could be converted to images");
      }

      console.log(
        `Successfully converted ${results.length} pages using PDF.js`
      );
      return results;
    } catch (error) {
      console.error("PDF.js conversion error:", error.message);
      throw new Error(`PDF.js conversion failed: ${error.message}`);
    }
  }
}

module.exports = PDFProcessor;
