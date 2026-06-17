import React from 'react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Une erreur est survenue
            </h1>
            <p className="text-gray-600 mb-6">
              La page n&apos;a pas pu s&apos;afficher correctement. Veuillez réessayer.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 mr-3"
            >
              Recharger
            </button>
            <Link
              to="/"
              className="inline-block border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50"
            >
              Accueil
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
