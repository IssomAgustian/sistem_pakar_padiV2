import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="text-center">
        <h1 className="text-9xl font-bold">404</h1>
        <p className="text-2xl mb-4">Halaman tidak ditemukan</p>
        <Link to="/" className="btn btn-primary">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
