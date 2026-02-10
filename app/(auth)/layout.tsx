export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100svh] flex flex-col items-center justify-center px-6 py-12 safe-area-bottom relative overflow-hidden">
      {/* Ambient gradient orb */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[500px] h-[500px]">
          <div 
            className="absolute inset-0 rounded-full opacity-20 blur-[100px] animate-breathe"
            style={{
              background: 'radial-gradient(circle, rgba(34,197,94,0.4) 0%, rgba(16,185,129,0.2) 40%, transparent 70%)',
            }}
          />
        </div>
      </div>
      
      {/* Wordmark */}
      <div className="relative z-10 mb-12">
        <h1 className="text-3xl font-light tracking-tight text-foreground/80">huuman</h1>
      </div>
      
      <div className="relative z-10 w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}

