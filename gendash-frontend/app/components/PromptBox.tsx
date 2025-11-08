"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ExamplePrompts from "./ExamplePrompts";

interface PromptBoxProps {
  className?: string;
}

interface ApiError {
  message: string;
  details?: string;
}

export default function PromptBox({ className = "" }: PromptBoxProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [accentColor, setAccentColor] = useState({
    title: "linear-gradient(to right, #60a5fa, #c084fc, #f472b6)",
    button: "linear-gradient(to right, #3b82f6, #a855f7, #ec4899)",
    buttonHover: "linear-gradient(to right, #2563eb, #9333ea, #db2777)"
  });

  const generateRandomColor = () => {
    const brightColors = [
      {
        title: "linear-gradient(to right, #60a5fa, #c084fc, #f472b6)",
        button: "linear-gradient(to right, #3b82f6, #a855f7, #ec4899)",
        buttonHover: "linear-gradient(to right, #2563eb, #9333ea, #db2777)"
      },
      {
        title: "linear-gradient(to right, #22d3ee, #2dd4bf, #34d399)",
        button: "linear-gradient(to right, #06b6d4, #14b8a6, #10b981)",
        buttonHover: "linear-gradient(to right, #0891b2, #0d9488, #059669)"
      },
      {
        title: "linear-gradient(to right, #a78bfa, #e879f9, #f472b6)",
        button: "linear-gradient(to right, #8b5cf6, #d946ef, #ec4899)",
        buttonHover: "linear-gradient(to right, #7c3aed, #c026d3, #db2777)"
      },
      {
        title: "linear-gradient(to right, #fb923c, #f87171, #f472b6)",
        button: "linear-gradient(to right, #f97316, #ef4444, #ec4899)",
        buttonHover: "linear-gradient(to right, #ea580c, #dc2626, #db2777)"
      },
      {
        title: "linear-gradient(to right, #a3e635, #4ade80, #34d399)",
        button: "linear-gradient(to right, #84cc16, #22c55e, #10b981)",
        buttonHover: "linear-gradient(to right, #65a30d, #16a34a, #059669)"
      },
      {
        title: "linear-gradient(to right, #fb7185, #f472b6, #e879f9)",
        button: "linear-gradient(to right, #f43f5e, #ec4899, #d946ef)",
        buttonHover: "linear-gradient(to right, #e11d48, #db2777, #c026d3)"
      },
      {
        title: "linear-gradient(to right, #fbbf24, #facc15, #a3e635)",
        button: "linear-gradient(to right, #f59e0b, #eab308, #84cc16)",
        buttonHover: "linear-gradient(to right, #d97706, #ca8a04, #65a30d)"
      },
      {
        title: "linear-gradient(to right, #818cf8, #60a5fa, #22d3ee)",
        button: "linear-gradient(to right, #6366f1, #3b82f6, #06b6d4)",
        buttonHover: "linear-gradient(to right, #4f46e5, #2563eb, #0891b2)"
      },
    ];

    const randomIndex = Math.floor(Math.random() * brightColors.length);
    setAccentColor(brightColors[randomIndex]);
  };

  const handleExampleClick = (examplePrompt: string) => {
    setPrompt(examplePrompt);
    setError(null);
  };

  const validateInput = (input: string): boolean => {
    if (!input.trim()) {
      setError({ message: "Please enter an API endpoint or data query" });
      return false;
    }

    // Basic URL validation for API endpoints
    const urlPattern = /^https?:\/\/.+/i;
    const hasUrl = urlPattern.test(input);

    if (!hasUrl && input.length < 10) {
      setError({
        message: "Input too short",
        details: "Please provide a complete API endpoint or detailed query"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateInput(prompt)) {
      return;
    }

    // Prevent double submission
    const isGenerating = sessionStorage.getItem('isGeneratingDashboard');
    if (isGenerating === 'true') {
      return; // Already generating, ignore duplicate submit
    }

    // Mark as generating
    sessionStorage.setItem('isGeneratingDashboard', 'true');

    // Store the prompt in localStorage to pass to loading page
    localStorage.setItem('dashboardPrompt', prompt);

    // Navigate to loading page
    router.push('/loading');
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Color randomizer button - top right */}
      <button
        onClick={generateRandomColor}
        className="fixed top-6 right-6 z-50 p-4 rounded-2xl
          bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 backdrop-blur-sm
          border-2
          hover:scale-110
          transition-all duration-500 group
          cursor-pointer"
        style={{
          borderColor: `${accentColor.button.match(/#[a-fA-F0-9]{6}/)?.[0]}66` || '#a855f766',
          boxShadow: `0 10px 15px -3px ${accentColor.button.match(/#[a-fA-F0-9]{6}/)?.[0]}33, 0 4px 6px -4px ${accentColor.button.match(/#[a-fA-F0-9]{6}/)?.[0]}33`
        }}
        onMouseEnter={(e) => {
          const color = accentColor.button.match(/#[a-fA-F0-9]{6}/)?.[0];
          if (color) {
            e.currentTarget.style.borderColor = color;
            e.currentTarget.style.boxShadow = `0 25px 50px -12px ${color}4d`;
          }
        }}
        onMouseLeave={(e) => {
          const color = accentColor.button.match(/#[a-fA-F0-9]{6}/)?.[0];
          if (color) {
            e.currentTarget.style.borderColor = `${color}66`;
            e.currentTarget.style.boxShadow = `0 10px 15px -3px ${color}33, 0 4px 6px -4px ${color}33`;
          }
        }}
        title="Randomize colors"
      >
        <svg
          className="w-6 h-6 group-hover:rotate-180 transition-all duration-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{
            color: accentColor.button.match(/#[a-fA-F0-9]{6}/g)?.[1] || '#a855f7'
          }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      </button>

      {/* Main hero section - fills viewport */}
      <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 -mt-12">
        <div className="w-full max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 bg-clip-text text-transparent transition-all duration-500"
              style={{
                backgroundImage: accentColor.title
              }}
            >
              Gendash
            </h1>
            <p className="text-xl sm:text-2xl md:text-3xl text-zinc-100 mb-3 font-semibold">
              AI-Powered Dashboard Generator
            </p>
            <p className="text-base sm:text-lg text-zinc-300">
              Transform any API into beautiful, interactive dashboards in seconds
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="text"
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  setError(null);
                }}
                placeholder="Enter your API endpoint or describe your data source..."
                className={`w-full h-16 px-6 text-base sm:text-lg rounded-2xl border-2
                  bg-zinc-800/80 backdrop-blur-sm
                  text-zinc-100
                  placeholder:text-zinc-400
                  focus:outline-none focus:ring-4
                  transition-all duration-500`}
                style={{
                  borderColor: error ? '#f87171' : '#52525b',
                  boxShadow: error ? '0 0 0 4px rgba(248, 113, 113, 0.1)' : undefined
                }}
                onFocus={(e) => {
                  const color = accentColor.button.match(/#[a-fA-F0-9]{6}/)?.[0];
                  if (color && !error) {
                    e.currentTarget.style.borderColor = color;
                    e.currentTarget.style.boxShadow = `0 0 0 4px ${color}4d`;
                  }
                }}
                onBlur={(e) => {
                  if (!error) {
                    e.currentTarget.style.borderColor = '#52525b';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              />
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-950/40 backdrop-blur-sm border border-red-500/50">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-200">
                      {error.message}
                    </p>
                    {error.details && (
                      <p className="text-xs text-red-300 mt-1">
                        {error.details}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!prompt.trim()}
              className={`w-full py-4 px-8 text-lg font-semibold rounded-xl text-white
                ${!prompt.trim()
                  ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                  : "shadow-lg hover:shadow-xl"
                }
                transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98]
                focus:outline-none focus:ring-4 focus:ring-purple-400/50`}
              style={!prompt.trim() ? undefined : {
                backgroundImage: accentColor.button
              }}
              onMouseEnter={(e) => {
                if (prompt.trim()) {
                  e.currentTarget.style.backgroundImage = accentColor.buttonHover;
                }
              }}
              onMouseLeave={(e) => {
                if (prompt.trim()) {
                  e.currentTarget.style.backgroundImage = accentColor.button;
                }
              }}
            >
              Generate Dashboard
            </button>
          </form>
        </div>
      </div>

      {/* Examples section - below the fold */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <ExamplePrompts onExampleClick={handleExampleClick} accentColor={accentColor} />
      </div>
    </div>
  );
}
