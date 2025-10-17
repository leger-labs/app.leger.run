import { useState } from 'react'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Leger v0.1.0
        </h1>
        <p className="text-muted-foreground mb-8">
          Secret Management & Release Tracking
        </p>
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setCount(count - 1)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
            >
              -
            </button>
            <span className="text-2xl font-mono text-foreground min-w-[4ch] text-center">
              {count}
            </span>
            <button
              onClick={() => setCount(count + 1)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
            >
              +
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            Infrastructure setup complete. Frontend will be implemented in subsequent issues.
          </p>
        </div>
      </div>
    </div>
  )
}
