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
      // Use PDF.js with Canvas for reliable conversion
      return await this.pdfJsImageConversion(inputPath, outputDir, format);
    } catch (error) {
      throw new Error(`PDF to image conversion failed: ${error.message}`);
    }
  }

  static async pdfJsImageConversion(inputPath, outputDir, format = "png") {
    try {
      // Use legacy build for Node.js
      const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
      const { createCanvas } = require("canvas");

      // Set up PDF.js worker for Node.js environment
      if (typeof global !== "undefined") {
        global.DOMMatrix = require("dommatrix");
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

      return results;
    } catch (error) {
      console.error("PDF.js conversion error:", error.message);
      throw new Error(`PDF.js conversion failed: ${error.message}`);
    }
  }
}

module.exports = PDFProcessor;
