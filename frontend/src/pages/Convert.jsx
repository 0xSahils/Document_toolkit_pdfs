import { useState } from "react";
import { toast } from "react-hot-toast";
import { Download, Image as ImageIcon, FileText } from "lucide-react";
import FileUpload from "../components/FileUpload";
import LoadingSpinner from "../components/LoadingSpinner";
import { pdfApi } from "../utils/api";

const Convert = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [format, setFormat] = useState("png");

  const formatOptions = [
    {
      value: "png",
      label: "PNG",
      description: "High quality, larger file size",
    },
    {
      value: "jpg",
      label: "JPG",
      description: "Good quality, smaller file size",
    },
    {
      value: "jpeg",
      label: "JPEG",
      description: "Good quality, smaller file size",
    },
  ];

  const handleConvert = async () => {
    if (files.length === 0) {
      toast.error("Please select a PDF file to convert");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await pdfApi.convert(files[0], format);

      if (response.success) {
        setResult(response.data);
        toast.success(response.message);
      } else {
        toast.error(response.message || "Failed to convert PDF");
      }
    } catch (error) {
      console.error("Convert error:", error);
      toast.error(error.response?.data?.message || "Failed to convert PDF");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (downloadUrl) => {
    if (downloadUrl.startsWith("http")) {
      window.open(downloadUrl, "_blank");
    } else {
      window.open(`${window.location.origin}${downloadUrl}`, "_blank");
    }
  };

  const resetForm = () => {
    setFiles([]);
    setResult(null);
    setFormat("png");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex p-3 rounded-full bg-orange-100 mb-4">
          <ImageIcon className="h-8 w-8 text-orange-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Convert PDF</h1>
        <p className="text-gray-600">Convert PDF pages to images (PNG, JPG)</p>
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
                Output Format
              </label>
              <div className="space-y-3">
                {formatOptions.map((option) => (
                  <label key={option.value} className="flex items-start">
                    <input
                      type="radio"
                      name="format"
                      value={option.value}
                      checked={format === option.value}
                      onChange={(e) => setFormat(e.target.value)}
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
                <p className="text-sm text-gray-600">
                  Ready to convert PDF to {format.toUpperCase()}
                </p>
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
                  onClick={handleConvert}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <LoadingSpinner size="small" text="Converting..." />
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Convert to {format.toUpperCase()}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="card bg-orange-50 border-orange-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-orange-900 mb-2">
              Conversion Completed Successfully!
            </h3>
            <div className="text-sm text-orange-700 space-y-1">
              <p>
                <strong>Format:</strong> {result.format}
              </p>
              <p>
                <strong>Images Generated:</strong> {result.images?.length || 0}
              </p>
              <p>
                <strong>Processing Time:</strong> {result.processingTime}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-orange-900">
              Generated Images ({result.images?.length || 0})
            </h4>
            <div className="grid gap-3">
              {result.images?.map((image, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border"
                >
                  <div className="flex items-center space-x-3">
                    <ImageIcon className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {image.filename}
                      </p>
                      <p className="text-xs text-gray-500">{image.size}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(image.downloadUrl)}
                    className="btn btn-primary btn-sm"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 p-6 bg-orange-50 rounded-lg">
        <h3 className="text-lg font-semibold text-orange-900 mb-3">
          How to Convert PDFs
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-orange-800">
          <li>Upload a PDF file using the upload area above</li>
          <li>Choose your preferred image format (PNG, JPG, or JPEG)</li>
          <li>Click "Convert to [FORMAT]" to process the file</li>
          <li>Download individual image files when processing is complete</li>
        </ol>
        <div className="mt-4 p-3 bg-orange-100 rounded">
          <p className="text-sm text-orange-800">
            <strong>Note:</strong> Each page of your PDF will be converted to a
            separate image file. PNG format provides better quality but larger
            file sizes, while JPG/JPEG offers smaller files with good quality.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Convert;
