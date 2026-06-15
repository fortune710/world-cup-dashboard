interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = "Something went wrong.", onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="text-sm text-destructive font-medium">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-md border border-input px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
        >
          Try again
        </button>
      )}
    </div>
  );
}
