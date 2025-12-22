import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container py-16 text-center">
      <h1 className="text-4xl font-bold mb-4">404 — Page introuvable</h1>
      <Link to="/" className="text-indigo-600">Retour à l'accueil</Link>
    </div>
  );
}
