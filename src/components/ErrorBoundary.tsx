import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * PRODUCTION ERROR BOUNDARY
 *
 * Prevents React from completely unmounting the DOM tree and leaving
 * a blank screen if any runtime exception occurs in any child component.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#0A120C',
            color: '#F2F9F5',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'Inter, sans-serif',
            zIndex: 99999,
          }}
        >
          <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#D4932A' }}>
            The Pride of Spices
          </h1>
          <p style={{ color: 'rgba(242,249,245,0.7)', maxWidth: '480px', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
            We encountered an unexpected visual issue while rendering the experience.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              background: '#018039',
              color: '#fff',
              border: 'none',
              padding: '0.65rem 1.4rem',
              borderRadius: '4px',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
          >
            Reload Experience
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
