"use client";

interface LoadingStateProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export default function LoadingState({
  size = "md",
  text,
  className = ""
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className="relative">
        {/* Outer spinning ring */}
        <div
          className={`${sizeClasses[size]} rounded-full border-4 border-zinc-200 dark:border-zinc-800 border-t-blue-600 animate-spin`}
        />

        {/* Inner pulsing dot */}
        <div
          className={`absolute inset-0 flex items-center justify-center`}
        >
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
        </div>
      </div>

      {text && (
        <p className={`${textSizeClasses[size]} text-zinc-600 dark:text-zinc-400 font-medium animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );
}
