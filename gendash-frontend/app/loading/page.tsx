"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { generateDashboard } from "@/lib/api";

export default function LoadingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const hasCalledRef = useRef(false);
  const isGeneratingRef = useRef(false);

  useEffect(() => {
    // Use sessionStorage to prevent duplicate calls across component remounts
    const isGenerating = sessionStorage.getItem('isGeneratingDashboard');
    if (hasCalledRef.current || isGeneratingRef.current || isGenerating === 'processing') {
      return;
    }
    
    // Mark as processing in sessionStorage (survives remounts)
    sessionStorage.setItem('isGeneratingDashboard', 'processing');
    hasCalledRef.current = true;
    isGeneratingRef.current = true;

    const generateDashboardFromApi = async () => {
      try {
        // Double-check to prevent race conditions
        if (!isGeneratingRef.current) {
          return;
        }

        // Get the API URL from localStorage (set by PromptBox)
        const apiUrl = localStorage.getItem('dashboardPrompt');

        if (!apiUrl) {
          setError('No API endpoint provided');
          setTimeout(() => router.push('/'), 2000);
          isGeneratingRef.current = false;
          return;
        }

        // Step 1: Analyzing data
        setCurrentStep(1);

        // Step 2: Identifying patterns
        setTimeout(() => setCurrentStep(2), 1000);

        // Call backend to generate dashboard
        const response = await generateDashboard({ apiUrl });

        if (!response.success) {
          throw new Error(response.error || 'Failed to generate dashboard');
        }

        // Step 3: Creating visualizations
        setCurrentStep(3);
        await new Promise(resolve => setTimeout(resolve, 800));

        // Step 4: Finalizing
        setCurrentStep(4);
        await new Promise(resolve => setTimeout(resolve, 600));

        // Store the dashboard spec and data in localStorage
        localStorage.setItem('dashboardSpec', JSON.stringify(response.spec));
        localStorage.setItem('dashboardId', response.dashboardId);
        localStorage.setItem('dashboardApiUrl', apiUrl);

        // Navigate to dashboard page
        sessionStorage.removeItem('isGeneratingDashboard'); // Clear flag
        router.push(`/dashboard/${response.dashboardId}`);
        isGeneratingRef.current = false;

      } catch (err) {
        console.error('Dashboard generation error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        sessionStorage.removeItem('isGeneratingDashboard'); // Clear flag on error
        isGeneratingRef.current = false;

        // Redirect back to home after showing error
        setTimeout(() => router.push('/'), 3000);
      }
    };

    generateDashboardFromApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
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
          {/* Error icon */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-red-400">
            Generation Failed
          </h1>

          <p className="text-lg text-zinc-300 mb-4">
            {error}
          </p>

          <p className="text-sm text-zinc-400">
            Redirecting you back to the home page...
          </p>
        </div>
      </div>
    );
  }

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
          <LoadingStep active={currentStep >= 1} text="Analyzing your data source..." />
          <LoadingStep active={currentStep >= 2} text="Identifying key metrics and patterns..." />
          <LoadingStep active={currentStep >= 3} text="Creating interactive visualizations..." />
          <LoadingStep active={currentStep >= 4} text="Finalizing your dashboard..." />
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-md mx-auto h-2 bg-zinc-800/50 rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000"
            style={{
              width: `${(currentStep / 4) * 100}%`
            }}
          />
        </div>

        <p className="mt-6 text-sm text-zinc-300">
          This will only take a moment...
        </p>
      </div>
    </div>
  );
}

interface LoadingStepProps {
  active: boolean;
  text: string;
}

function LoadingStep({ active, text }: LoadingStepProps) {
  return (
    <div
      className={`flex items-center justify-center gap-3 transition-opacity duration-500 ${
        active ? 'opacity-100' : 'opacity-30'
      }`}
    >
      <div className={`w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 ${active ? 'animate-pulse' : ''}`} />
      <p className="text-base text-zinc-200">{text}</p>
    </div>
  );
}
