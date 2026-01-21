import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DiagnosisPage from './pages/DiagnosisPage';
import ResultPage from './pages/ResultPage';
import HistoryPage from './pages/HistoryPage';
import NotFoundPage from './pages/NotFoundPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import CertaintyInputPage from './pages/CertaintyInputPage';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import { AuthProvider } from './context/AuthContext';
import { DiagnosisProvider } from './context/DiagnosisContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <DiagnosisProvider>
          <Routes>
            <Route path="/" element={
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow">
                  <HomePage />
                </main>
                <Footer />
              </div>
            } />
            <Route path="/login" element={
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow">
                  <LoginPage />
                </main>
                <Footer />
              </div>
            } />
            <Route path="/register" element={
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow">
                  <RegisterPage />
                </main>
                <Footer />
              </div>
            } />
            <Route path="/about" element={
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow">
                  <AboutPage />
                </main>
                <Footer />
              </div>
            } />
            <Route path="/contact" element={
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow">
                  <ContactPage />
                </main>
                <Footer />
              </div>
            } />
            <Route path="/diagnosis" element={
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow">
                  <DiagnosisPage />
                </main>
                <Footer />
              </div>
            } />
            <Route path="/certainty-input" element={
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow">
                  <CertaintyInputPage />
                </main>
                <Footer />
              </div>
            } />
            <Route path="/result" element={
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow">
                  <ResultPage />
                </main>
                <Footer />
              </div>
            } />
            <Route path="/history" element={
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow">
                  <HistoryPage />
                </main>
                <Footer />
              </div>
            } />
            <Route path="*" element={
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow">
                  <NotFoundPage />
                </main>
                <Footer />
              </div>
            } />
          </Routes>
        </DiagnosisProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
