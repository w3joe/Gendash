"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoadingPage() {
  const router = useRouter();

  useEffect(() => {
    // Simulate dashboard generation time (3 seconds)
    const timer = setTimeout(() => {
      // Generate a random dashboard ID
      const dashboardId = Math.random().toString(36).substring(2, 15);
      router.push(`/dashboard/${dashboardId}`);
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        backgroundImage: 'linear-gradient(-45deg, #2f2f3bff, #3d2a4cff)',
        backgroundSize: '400% 400%',
        animation: 'gradient-move 15s ease infinite'
      }}
    >
      <div className="text-center max-w-2xl">
        {/* Animated loader */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          {/* Outer spinning ring */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 animate-spin" />

          {/* Middle spinning ring */}
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-500 border-r-pink-500 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />

          {/* Inner pulsing circle */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 animate-pulse" />

          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-zinc-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>

        {/* Loading text */}
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
          Generating Your Dashboard
        </h1>

        <div className="space-y-3 mb-8">
          <LoadingStep delay={0} text="Analyzing your data source..." />
          <LoadingStep delay={800} text="Identifying key metrics and patterns..." />
          <LoadingStep delay={1600} text="Creating interactive visualizations..." />
          <LoadingStep delay={2400} text="Finalizing your dashboard..." />
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-md mx-auto h-2 bg-zinc-800/50 rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-progress"
            style={{
              animation: 'progress 3s ease-in-out forwards'
            }}
          />
        </div>

        <p className="mt-6 text-sm text-zinc-300">
          This will only take a moment...
        </p>
      </div>

      <style jsx>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

interface LoadingStepProps {
  delay: number;
  text: string;
}

function LoadingStep({ delay, text }: LoadingStepProps) {
  return (
    <div
      className="flex items-center justify-center gap-3 opacity-0 animate-fadeIn"
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards',
        animationDuration: '500ms'
      }}
    >
      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse" />
      <p className="text-base text-zinc-200">{text}</p>
    </div>
  );
}
