'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '@/components/ui/SharedComponents';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950 p-4">
          <Card className="max-w-md w-full p-6 text-center border-red-500/20 bg-slate-900/50 backdrop-blur-md">
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-full">
                <AlertTriangle size={48} className="text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-white">Something went wrong!</h2>
              <p className="text-slate-400">{this.state.error?.message || 'An unexpected error occurred.'}</p>
              <button 
                className="mt-4 flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium" 
                onClick={this.handleRetry}
              >
                <RefreshCcw size={16} /> Reload Application
              </button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
