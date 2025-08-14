import { useState } from "react";
import { toast } from "react-hot-toast";
import { Download, Split as SplitIcon, FileText } from "lucide-react";
import FileUpload from "../components/FileUpload";
import LoadingSpinner from "../components/LoadingSpinner";
import { pdfApi } from "../utils/api";

const Split = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [splitMode, setSplitMode] = useState("all"); // 'all' or 'specific'
  const [specificPages, setSpecificPages] = useState("");

  const handleSplit = async () => {
    if (files.length === 0) {
      toast.error("Please select a PDF file to split");
      return;
    }

    let pages = null;
    if (splitMode === "specific" && specificPages.trim()) {
      try {
        pages = specificPages
          .split(",")
          .map((p) => parseInt(p.trim()))
          .filter((p) => !isNaN(p) && p > 0);

        if (pages.length === 0) {
          toast.error("Please enter valid page numbers");
          return;
        }
      } catch (error) {
        toast.error("Invalid page numbers format");
        return;
      }
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await pdfApi.split(files[0], pages);

      if (response.success) {
        setResult(response.data);
        toast.success(response.message);
      } else {
        toast.error(response.message || "Failed to split PDF");
      }
    } catch (error) {
      console.error("Split error:", error);
      toast.error(error.response?.data?.message || "Failed to split PDF");
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
    setSpecificPages("");
    setSplitMode("all");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex p-3 rounded-full bg-green-100 mb-4">
          <SplitIcon className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Split PDF</h1>
        <p className="text-gray-600">
          Extract specific pages or split into separate files
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
                Split Options
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="splitMode"
                    value="all"
                    checked={splitMode === "all"}
                    onChange={(e) => setSplitMode(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">
                    Split all pages (each page becomes a separate PDF)
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="splitMode"
                    value="specific"
                    checked={splitMode === "specific"}
                    onChange={(e) => setSplitMode(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">
                    Extract specific pages
                  </span>
                </label>
              </div>
            </div>

            {splitMode === "specific" && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Page Numbers (comma-separated)
                </label>
                <input
                  type="text"
                  value={specificPages}
                  onChange={(e) => setSpecificPages(e.target.value)}
                  placeholder="e.g., 1, 3, 5-7, 10"
                  className="input w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter page numbers separated by commas (e.g., 1, 3, 5)
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <div>
                <p className="text-sm text-gray-600">Ready to split PDF</p>
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
                  onClick={handleSplit}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <LoadingSpinner size="small" text="Splitting..." />
                  ) : (
                    <>
                      <SplitIcon className="h-4 w-4 mr-2" />
                      Split PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="card bg-green-50 border-green-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Split Completed Successfully!
            </h3>
            <p className="text-sm text-green-700 mb-4">
              <strong>Processing Time:</strong> {result.processingTime}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-green-900">
              Generated Files ({result.pages?.length || 0})
            </h4>
            <div className="grid gap-3">
              {result.pages?.map((page, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {page.filename}
                      </p>
                      <p className="text-xs text-gray-500">{page.size}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(page.downloadUrl)}
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

      <div className="mt-8 p-6 bg-green-50 rounded-lg">
        <h3 className="text-lg font-semibold text-green-900 mb-3">
          How to Split PDFs
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-green-800">
          <li>Upload a PDF file using the upload area above</li>
          <li>Choose to split all pages or extract specific pages</li>
          <li>If extracting specific pages, enter the page numbers</li>
          <li>Click "Split PDF" to process the file</li>
          <li>Download individual PDF files when processing is complete</li>
        </ol>
        <p className="text-sm text-green-700 mt-4">
          <strong>Note:</strong> Each page will be saved as a separate PDF file.
        </p>
      </div>
    </div>
  );
};

export default Split;
