import { Loader2 } from "lucide-react";

const LoadingSpinner = ({ size = "default", text = "Processing..." }) => {
  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-6 w-6",
    large: "h-8 w-8",
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <Loader2
        className={`${sizeClasses[size]} animate-spin text-primary-600`}
      />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;
