'use client'

interface StepIndicatorProps {
  steps: string[]
  currentStep: number
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        
        return (
          <div key={step} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all"
                style={{
                  background: isCompleted ? 'var(--accent)' : isCurrent ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                  color: isCompleted ? 'var(--bg-primary)' : isCurrent ? 'var(--accent)' : 'var(--text-tertiary)',
                  border: isCurrent ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                }}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              <span
                className="text-sm font-medium hidden sm:inline"
                style={{
                  color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className="w-8 h-0.5 mx-2 hidden sm:block"
                style={{
                  background: isCompleted ? 'var(--accent)' : 'var(--border-subtle)',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
