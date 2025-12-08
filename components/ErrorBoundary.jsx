import React from 'react';

/**
 * ErrorBoundary component to catch and handle React runtime errors.
 * 
 * This prevents the white screen of death by displaying a friendly error message
 * when something goes wrong in the component tree.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', fontFamily: 'sans-serif' }}>
          <h1>Algo deu errado.</h1>
          <p>Por favor, recarregue a página.</p>
          <pre style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
