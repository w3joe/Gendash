"use client";

interface ExamplePromptsProps {
  onExampleClick: (prompt: string) => void;
  accentColor: {
    title: string;
    button: string;
    buttonHover: string;
  };
}

const examples = [
  {
    title: "Earthquake Monitor",
    prompt: "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2020-01-01&endtime=2020-01-02",
    description: "Track global seismic activity and earthquake data",
    icon: "🌍",
  },
  {
    title: "Security Breaches",
    prompt: "https://haveibeenpwned.com/api/v2/breaches",
    description: "Monitor data breach incidents and security alerts",
    icon: "🔒",
  },
  {
    title: "E-commerce Products",
    prompt: "https://fakestoreapi.com/products/",
    description: "Analyze product catalog and pricing trends",
    icon: "🛍️",
  },
  {
    title: "City Bike Networks",
    prompt: "http://api.citybik.es/v2/networks",
    description: "Explore bike-sharing systems worldwide",
    icon: "🚴",
  },
  {
    title: "Game Deals Tracker",
    prompt: "https://www.cheapshark.com/api/1.0/deals?storeID=1&upperPrice=15",
    description: "Find the best video game deals and discounts",
    icon: "🎮",
  },
];

export default function ExamplePrompts({ onExampleClick, accentColor }: ExamplePromptsProps) {
  const primaryColor = accentColor.button.match(/#[a-fA-F0-9]{6}/g)?.[0] || '#3b82f6';
  const secondaryColor = accentColor.button.match(/#[a-fA-F0-9]{6}/g)?.[1] || '#a855f7';

  const handleExampleClick = (prompt: string) => {
    onExampleClick(prompt);
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="mt-12">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-zinc-100 mb-2">
          Try an Example
        </h2>
        <p className="text-base text-zinc-300">
          Click any example to get started quickly
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {examples.map((example, index) => (
          <button
            key={index}
            onClick={() => handleExampleClick(example.prompt)}
            className="group p-8 rounded-2xl border-2
              bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 backdrop-blur-sm
              hover:from-zinc-700/90 hover:to-zinc-800/90
              hover:scale-[1.03]
              transition-all duration-500
              text-left cursor-pointer
              focus:outline-none focus:ring-4
              active:scale-[0.97]
              shadow-lg"
            style={{
              borderColor: `${primaryColor}66`,
              boxShadow: `0 10px 15px -3px ${primaryColor}1a, 0 4px 6px -4px ${primaryColor}1a`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = primaryColor;
              e.currentTarget.style.boxShadow = `0 25px 50px -12px ${primaryColor}4d, 0 10px 10px -5px ${primaryColor}33`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = `${primaryColor}66`;
              e.currentTarget.style.boxShadow = `0 10px 15px -3px ${primaryColor}1a, 0 4px 6px -4px ${primaryColor}1a`;
            }}
          >
            <div className="flex items-start gap-5">
              <span className="text-5xl flex-shrink-0 group-hover:scale-125 transition-transform duration-300">
                {example.icon}
              </span>
              <div className="flex-1 min-w-0">
                <h3
                  className="text-xl font-bold text-zinc-100 mb-2 transition-colors duration-300"
                  style={{
                    color: 'rgb(244, 244, 245)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = primaryColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgb(244, 244, 245)';
                  }}
                >
                  {example.title}
                </h3>
                <p className="text-sm text-zinc-300 mb-3">
                  {example.description}
                </p>
                <p
                  className="text-xs font-mono bg-zinc-900/60 px-3 py-1.5 rounded-lg truncate transition-colors duration-300"
                  style={{
                    color: primaryColor
                  }}
                >
                  {example.prompt}
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between">
              <div
                className="flex items-center gap-2 text-sm font-bold transition-colors duration-300"
                style={{
                  color: primaryColor
                }}
              >
                <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span>Click to use</span>
              </div>
              <div
                className="px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-300"
                style={{
                  backgroundColor: `${primaryColor}33`,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: `${primaryColor}4d`,
                  color: primaryColor
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${primaryColor}4d`;
                  e.currentTarget.style.borderColor = `${primaryColor}80`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${primaryColor}33`;
                  e.currentTarget.style.borderColor = `${primaryColor}4d`;
                }}
              >
                Try it
              </div>
            </div>
          </button>
        ))}
      </div>

      <div
        className="mt-8 p-6 rounded-xl backdrop-blur-sm transition-all duration-500"
        style={{
          backgroundImage: `linear-gradient(to right, ${primaryColor}26, ${secondaryColor}26)`,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: `${primaryColor}4d`
        }}
      >
        <h3 className="font-bold text-zinc-100 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 transition-colors duration-500" fill="currentColor" viewBox="0 0 20 20" style={{ color: primaryColor }}>
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Tips for Best Results
        </h3>
        <ul className="space-y-2 text-sm text-zinc-200">
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 transition-colors duration-500" style={{ color: primaryColor }}>•</span>
            <span>Provide publicly accessible API endpoints or include authentication details</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 transition-colors duration-500" style={{ color: primaryColor }}>•</span>
            <span>Ensure your API returns JSON data for optimal visualization</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 transition-colors duration-500" style={{ color: primaryColor }}>•</span>
            <span>Include query parameters if you need specific data filters</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 transition-colors duration-500" style={{ color: primaryColor }}>•</span>
            <span>You can describe your data needs and we'll help create the perfect visualization</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
