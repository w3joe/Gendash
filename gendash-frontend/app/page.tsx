import PromptBox from "./components/PromptBox";

export default function Home() {
  return (
    <div
      className="font-sans min-h-screen"
      style={{
        backgroundImage: 'linear-gradient(-45deg, #2f2f3bff, #3d2a4cff)',
        backgroundSize: '400% 400%',
        animation: 'gradient-move 15s ease infinite'
      }}
    >
      <PromptBox />
    </div>
  );
}
