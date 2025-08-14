import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  History as HistoryIcon,
  Merge,
  Split,
  Minimize2,
  Image,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import { pdfApi } from "../utils/api";

const History = () => {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const operationIcons = {
    merge: Merge,
    split: Split,
    compress: Minimize2,
    convert: Image,
  };

  const operationColors = {
    merge: "text-blue-600 bg-blue-100",
    split: "text-green-600 bg-green-100",
    compress: "text-purple-600 bg-purple-100",
    convert: "text-orange-600 bg-orange-100",
  };

  const statusIcons = {
    completed: CheckCircle,
    failed: XCircle,
    processing: Loader2,
  };

  const statusColors = {
    completed: "text-green-600",
    failed: "text-red-600",
    processing: "text-blue-600",
  };

  const fetchHistory = async (page = 1, operation = null) => {
    try {
      setLoading(true);
      const response = await pdfApi.getHistory(
        page,
        10,
        operation === "all" ? null : operation
      );

      if (response.success) {
        setOperations(response.data || []);
        setPagination(response.pagination || {});
      } else {
        toast.error("Failed to load history");
      }
    } catch (error) {
      console.error("History error:", error);
      if (error.response?.status !== 500) {
        toast.error("Failed to load history");
      }
      setOperations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1, filter);
  }, [filter]);

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    fetchHistory(newPage, filter);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading && operations.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-full bg-gray-100 mb-4">
            <HistoryIcon className="h-8 w-8 text-gray-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Operation History
          </h1>
          <p className="text-gray-600">View your recent PDF operations</p>
        </div>
        <div className="card">
          <LoadingSpinner text="Loading history..." />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex p-3 rounded-full bg-gray-100 mb-4">
          <HistoryIcon className="h-8 w-8 text-gray-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Operation History
        </h1>
        <p className="text-gray-600">View your recent PDF operations</p>
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Filter Operations
          </h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="all">All Operations</option>
            <option value="merge">Merge</option>
            <option value="split">Split</option>
            <option value="compress">Compress</option>
            <option value="convert">Convert</option>
          </select>
        </div>

        {operations.length === 0 ? (
          <div className="text-center py-8">
            <HistoryIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No operations found</p>
            <p className="text-sm text-gray-400 mt-1">
              Operations will appear here after you use the PDF tools
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {operations.map((operation) => {
              const OperationIcon = operationIcons[operation.operation];
              const StatusIcon = statusIcons[operation.status];

              return (
                <div
                  key={operation._id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div
                        className={`p-2 rounded-full ${
                          operationColors[operation.operation]
                        }`}
                      >
                        <OperationIcon className="h-5 w-5" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-gray-900 capitalize">
                            {operation.operation} PDF
                          </h3>
                          <div
                            className={`flex items-center space-x-1 ${
                              statusColors[operation.status]
                            }`}
                          >
                            <StatusIcon
                              className={`h-4 w-4 ${
                                operation.status === "processing"
                                  ? "animate-spin"
                                  : ""
                              }`}
                            />
                            <span className="text-sm capitalize">
                              {operation.status}
                            </span>
                          </div>
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <Clock className="h-4 w-4 inline mr-1" />
                            {formatDate(operation.createdAt)}
                          </p>

                          {operation.originalFiles &&
                            operation.originalFiles.length > 0 && (
                              <p>
                                <strong>Files:</strong>{" "}
                                {operation.originalFiles.length} file(s)
                                {operation.originalFiles.length === 1 && (
                                  <span>
                                    {" "}
                                    (
                                    {formatFileSize(
                                      operation.originalFiles[0].size
                                    )}
                                    )
                                  </span>
                                )}
                              </p>
                            )}

                          {operation.processingTime && (
                            <p>
                              <strong>Processing Time:</strong>{" "}
                              {operation.processingTime}ms
                            </p>
                          )}

                          {operation.resultFile && (
                            <p>
                              <strong>Result:</strong>{" "}
                              {formatFileSize(operation.resultFile.size)}
                            </p>
                          )}

                          {operation.errorMessage && (
                            <p className="text-red-600">
                              <strong>Error:</strong> {operation.errorMessage}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <p className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} operations
            </p>

            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="btn btn-outline btn-sm"
              >
                Previous
              </button>

              <span className="flex items-center px-3 py-1 text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="btn btn-outline btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          About Operation History
        </h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            This page shows your recent PDF operations when database is
            connected. Operations are automatically logged for tracking and
            analytics.
          </p>
          <p>
            <strong>Note:</strong> If no database is configured, this page will
            show empty results. All file processing still works normally without
            database connection.
          </p>
        </div>
      </div>
    </div>
  );
};

export default History;
