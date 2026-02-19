"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6 text-center">
            <p className="text-2xl mb-2">💥</p>
            <p className="text-red-400 font-medium">Something went wrong</p>
            <p className="text-zinc-500 text-sm mt-1">
              {this.state.error?.message ?? "An unexpected error occurred."}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-4 px-4 py-2 text-sm rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            >
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
