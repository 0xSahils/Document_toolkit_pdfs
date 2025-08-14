import { useState } from "react";
import { toast } from "react-hot-toast";
import { Download, Merge as MergeIcon } from "lucide-react";
import FileUpload from "../components/FileUpload";
import LoadingSpinner from "../components/LoadingSpinner";
import { pdfApi } from "../utils/api";

const Merge = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleMerge = async () => {
    if (files.length < 2) {
      toast.error("Please select at least 2 PDF files to merge");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await pdfApi.merge(files);

      if (response.success) {
        setResult(response.data);
        toast.success(response.message);
      } else {
        toast.error(response.message || "Failed to merge PDFs");
      }
    } catch (error) {
      console.error("Merge error:", error);
      toast.error(error.response?.data?.message || "Failed to merge PDFs");
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
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex p-3 rounded-full bg-blue-100 mb-4">
          <MergeIcon className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Merge PDFs</h1>
        <p className="text-gray-600">
          Combine multiple PDF files into a single document
        </p>
      </div>

      <div className="card mb-8">
        <FileUpload
          files={files}
          setFiles={setFiles}
          multiple={true}
          maxFiles={10}
        />

        {files.length >= 2 && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Ready to merge {files.length} files
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
                  onClick={handleMerge}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <LoadingSpinner size="small" text="Merging..." />
                  ) : (
                    <>
                      <MergeIcon className="h-4 w-4 mr-2" />
                      Merge PDFs
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
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Merge Completed Successfully!
              </h3>
              <div className="space-y-1 text-sm text-green-700">
                <p>
                  <strong>File:</strong> {result.filename}
                </p>
                <p>
                  <strong>Size:</strong> {result.size}
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

      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          How to Merge PDFs
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>Upload 2 or more PDF files using the upload area above</li>
          <li>The files will be merged in the order they appear</li>
          <li>Click "Merge PDFs" to combine them into a single file</li>
          <li>Download your merged PDF when processing is complete</li>
        </ol>
        <p className="text-sm text-blue-700 mt-4">
          <strong>Note:</strong> Files are automatically deleted from our
          servers after processing for your privacy and security.
        </p>
      </div>
    </div>
  );
};

export default Merge;
