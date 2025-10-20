import { useState } from 'react'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-2xl px-4">
        {/* Brand logo from submodule */}
        <img 
          src="/brand/assets/logotype/light/leger-logo-light.svg" 
          alt="Leger" 
          className="h-16 mx-auto mb-8 dark:hidden"
        />
        <img 
          src="/brand/assets/logotype/dark/leger-logo-dark.svg" 
          alt="Leger" 
          className="h-16 mx-auto mb-8 hidden dark:block"
        />
        
        {/* Using brand typography utilities */}
        <h1 className="text-heading-48 text-foreground mb-4">
          Leger v0.1.0
        </h1>
        <p className="text-copy-20 text-muted-foreground mb-8">
          Secret Management & Release Tracking
        </p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setCount(count - 1)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all font-medium"
            >
              −
            </button>
            <span className="text-heading-32 font-mono text-foreground min-w-[4ch] text-center">
              {count}
            </span>
            <button
              onClick={() => setCount(count + 1)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all font-medium"
            >
              +
            </button>
          </div>
          
          <div className="mt-8 p-4 bg-card border border-border rounded-lg">
            <p className="text-copy-14 text-muted-foreground">
              ✅ Infrastructure setup complete<br />
              ✅ Brand kit integrated from submodule<br />
              ✅ Catppuccin Mocha color scheme active<br />
              ✅ Geist typography system loaded
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
