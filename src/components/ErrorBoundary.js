import React from 'react';

/**
 * Error Boundary Komponente für das Abfangen von React-Fehlern
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to the console for debugging
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Store error details in state
        this.setState({
            error,
            errorInfo
        });

        // You can also log the error to an error reporting service here
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'exception', {
                description: error.toString(),
                fatal: false
            });
        }
    }

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            return (
                <div className="error-boundary">
                    <div className="error-boundary-content">
                        <h2>Etwas ist schiefgelaufen</h2>
                        <p>
                            Ein unerwarteter Fehler ist aufgetreten. Bitte laden Sie die Seite neu oder
                            versuchen Sie es später erneut.
                        </p>

                        {process.env.NODE_ENV === 'development' && (
                            <details className="error-details">
                                <summary>Technische Details (nur in Entwicklungsumgebung)</summary>
                                <pre className="error-stack">
                                    {this.state.error && this.state.error.toString()}
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}

                        <div className="error-actions">
                            <button
                                onClick={this.handleRetry}
                                className="btn btn-primary"
                            >
                                Erneut versuchen
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="btn btn-secondary"
                            >
                                Seite neu laden
                            </button>
                        </div>
                    </div>

                    <style jsx>{`
            .error-boundary {
              min-height: 400px;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 2rem;
              background-color: #f8f9fa;
              border-radius: 8px;
              margin: 2rem;
            }

            .error-boundary-content {
              text-align: center;
              max-width: 600px;
            }

            .error-boundary-content h2 {
              color: #dc3545;
              margin-bottom: 1rem;
            }

            .error-boundary-content p {
              color: #6c757d;
              margin-bottom: 2rem;
              line-height: 1.6;
            }

            .error-details {
              text-align: left;
              margin: 1rem 0;
              padding: 1rem;
              background-color: #fff;
              border: 1px solid #dee2e6;
              border-radius: 4px;
            }

            .error-details summary {
              cursor: pointer;
              font-weight: bold;
              margin-bottom: 0.5rem;
            }

            .error-stack {
              background-color: #f8f9fa;
              padding: 1rem;
              border-radius: 4px;
              overflow-x: auto;
              font-size: 0.875rem;
              margin-top: 0.5rem;
            }

            .error-actions {
              display: flex;
              gap: 1rem;
              justify-content: center;
            }

            .btn {
              padding: 0.75rem 1.5rem;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 1rem;
              transition: background-color 0.2s;
            }

            .btn-primary {
              background-color: #007bff;
              color: white;
            }

            .btn-primary:hover {
              background-color: #0056b3;
            }

            .btn-secondary {
              background-color: #6c757d;
              color: white;
            }

            .btn-secondary:hover {
              background-color: #545b62;
            }
          `}</style>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
