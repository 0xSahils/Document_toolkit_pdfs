import { useState } from "react";
import { toast } from "react-hot-toast";
import { Download, Minimize2 } from "lucide-react";
import FileUpload from "../components/FileUpload";
import LoadingSpinner from "../components/LoadingSpinner";
import { pdfApi } from "../utils/api";

const Compress = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [quality, setQuality] = useState(0.7);

  const qualityOptions = [
    {
      value: 0.3,
      label: "High Compression (Lower Quality)",
      description: "Smallest file size",
    },
    {
      value: 0.5,
      label: "Medium Compression",
      description: "Balanced size and quality",
    },
    {
      value: 0.7,
      label: "Low Compression (Higher Quality)",
      description: "Better quality, larger size",
    },
    {
      value: 0.9,
      label: "Minimal Compression",
      description: "Best quality, minimal size reduction",
    },
  ];

  const handleCompress = async () => {
    if (files.length === 0) {
      toast.error("Please select a PDF file to compress");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await pdfApi.compress(files[0], quality);

      if (response.success) {
        setResult(response.data);
        toast.success(response.message);
      } else {
        toast.error(response.message || "Failed to compress PDF");
      }
    } catch (error) {
      console.error("Compress error:", error);
      toast.error(error.response?.data?.message || "Failed to compress PDF");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (result?.downloadUrl) {
      if (result.downloadUrl.startsWith("http")) {
        window.open(result.downloadUrl, "_blank");
      } else {
        window.open(`${window.location.origin}${result.downloadUrl}`, "_blank");
      }
    }
  };

  const resetForm = () => {
    setFiles([]);
    setResult(null);
    setQuality(0.7);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex p-3 rounded-full bg-purple-100 mb-4">
          <Minimize2 className="h-8 w-8 text-purple-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Compress PDF</h1>
        <p className="text-gray-600">
          Reduce file size while maintaining quality
        </p>
      </div>

      <div className="card mb-8">
        <FileUpload
          files={files}
          setFiles={setFiles}
          multiple={false}
          maxFiles={1}
        />

        {files.length > 0 && (
          <div className="mt-6 pt-6 border-t space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Compression Level
              </label>
              <div className="space-y-3">
                {qualityOptions.map((option) => (
                  <label key={option.value} className="flex items-start">
                    <input
                      type="radio"
                      name="quality"
                      value={option.value}
                      checked={quality === option.value}
                      onChange={(e) => setQuality(parseFloat(e.target.value))}
                      className="mr-3 mt-1"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {option.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <p className="text-sm text-gray-600">Ready to compress PDF</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={resetForm}
                  className="btn btn-outline"
                  disabled={loading}
                >
                  Reset
                </button>
                <button
                  onClick={handleCompress}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <LoadingSpinner size="small" text="Compressing..." />
                  ) : (
                    <>
                      <Minimize2 className="h-4 w-4 mr-2" />
                      Compress PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                Compression Completed Successfully!
              </h3>
              <div className="space-y-1 text-sm text-purple-700">
                <p>
                  <strong>File:</strong> {result.filename}
                </p>
                <p>
                  <strong>Original Size:</strong> {result.originalSize}
                </p>
                <p>
                  <strong>Compressed Size:</strong> {result.compressedSize}
                </p>
                <p>
                  <strong>Size Reduction:</strong> {result.compressionRatio}
                </p>
                <p>
                  <strong>Processing Time:</strong> {result.processingTime}
                </p>
              </div>
            </div>
            <button onClick={handleDownload} className="btn btn-primary">
              <Download className="h-4 w-4 mr-2" />
              Download
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 p-6 bg-purple-50 rounded-lg">
        <h3 className="text-lg font-semibold text-purple-900 mb-3">
          How to Compress PDFs
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-purple-800">
          <li>Upload a PDF file using the upload area above</li>
          <li>Choose your preferred compression level</li>
          <li>Click "Compress PDF" to reduce the file size</li>
          <li>Download your compressed PDF when processing is complete</li>
        </ol>
        <div className="mt-4 p-3 bg-purple-100 rounded">
          <p className="text-sm text-purple-800">
            <strong>Tip:</strong> Higher compression reduces file size more but
            may affect quality. Choose the level that best balances your needs
            for file size and quality.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Compress;
