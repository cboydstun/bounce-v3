import React from "react";

/**
 * Loading skeleton for step components during dynamic imports
 */
const StepSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse space-y-6">
      {/* Title skeleton */}
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4"></div>
      
      {/* Form fields skeleton */}
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-5/6"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-4/6"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
      </div>
      
      {/* Button skeleton */}
      <div className="flex justify-end">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md w-32"></div>
      </div>
    </div>
  );
};

export default StepSkeleton;
