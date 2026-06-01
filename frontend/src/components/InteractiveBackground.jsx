export default function InteractiveBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-slate-50">
      {/* Subtle Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.3]" 
        style={{ 
          backgroundImage: `radial-gradient(#94a3b8 1.5px, transparent 1.5px)`,
          backgroundSize: '32px 32px' 
        }} 
      />

      {/* Soft background glow circles - static, no animations */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] sm:w-[600px] h-[500px] sm:h-[600px] rounded-full bg-teal-100/45 blur-[120px]" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] sm:w-[600px] h-[500px] sm:h-[600px] rounded-full bg-sky-100/45 blur-[120px]" />
    </div>
  );
}
