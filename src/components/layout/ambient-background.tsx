export function AmbientBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Base canvas */}
      <div className="absolute inset-0 bg-canvas" />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-40 mask-fade-bottom" />

      {/* Primary gold glow — top center */}
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[1200px] rounded-full opacity-60 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, rgba(255, 200, 55, 0.12) 0%, transparent 70%)",
        }}
      />

      {/* Secondary trust blue glow — bottom right, very subtle */}
      <div
        className="absolute bottom-0 right-0 h-[400px] w-[600px] rounded-full opacity-40 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(31, 78, 121, 0.08) 0%, transparent 70%)",
        }}
      />

      {/* Vignette — keeps focus on center content */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, rgba(10, 10, 11, 0.4) 100%)",
        }}
      />
    </div>
  );
}