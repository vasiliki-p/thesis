import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; 
import './App.css';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import ActivitiesPage from './pages/ActivitiesPage';
import ActivityDetailsPage from "./pages/ActivityDetailsPage";
import LoginPage from './pages/LoginPage';
import SuggestionsPage from './pages/SuggestionsPage';
import Chatbot from './components/Chatbot'; 
import UserProfilePage from "./pages/UserProfilePage";
import StatsPage from "./pages/StatsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar'; 
import Footer from './components/Footer';
import GroupSwipePage from './components/GroupSwipePage';
import LobbyRoom from './pages/LobbyRoom';
import LobbyDiscovery from './pages/LobbyDiscovery';
import MatchResultsPage from './pages/MatchResultsPage';

function App() {
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;
  const isAuthenticated = !!user; 
  
  const [theme, setTheme] = useState('morning');

  // αυτόματη αλλαγή χρώματος βάσει ώρας
  useEffect(() => {
    const hour = new Date().getHours();
    let currentTheme = 'morning';

    if (hour >= 6 && hour < 17) {
      currentTheme = 'morning';    
    } else if (hour >= 17 && hour < 20) {
      currentTheme = 'afternoon';  
    } else {
      currentTheme = 'night';      
    }

    document.body.setAttribute('data-theme', currentTheme);
    setTheme(currentTheme);
    
  }, []); 

  //  αλλαγή θέματος με το κουμπί
  const cycleTheme = () => {
    const themes = ['morning', 'afternoon', 'night'];
    const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    
    document.body.setAttribute('data-theme', nextTheme);
    setTheme(nextTheme);
  };

  return (
    <Router>
      <ScrollToTop />
      
      <Navbar />

    <Toaster 
      position="top-center" 
      toastOptions={{
        style: {
          background: 'var(--card-bg)', // Παίρνει το dark mode χρώμα σου
          color: 'var(--text-main)',
          border: '1px solid var(--card-border)',
          borderRadius: '16px',
          fontWeight: 'bold'
        },
        success: { iconTheme: { primary: 'var(--accent-color)', secondary: '#000' } },
        error: { iconTheme: { primary: '#ff4d4d', secondary: '#fff' } }
      }} 
    />
    
       <main style={{ width: '100%' }}>
        <Routes>
          {/* δημόσιες σελίδες */}
          <Route path="/" element={<HomePage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/activities/:id" element={<ActivityDetailsPage />} />
          
          <Route path="/lobbies" element={<LobbyDiscovery />} />
          
          <Route path="/login" element={ <div className="login-page-wrapper"><LoginPage /></div>}/>
          <Route path="/register" element={<div className="container mt-5"><RegisterPage /></div>} />
          
          {/* σελίδες μόνο για συνδεδεμένους */}
          <Route path="/suggestions" element={<ProtectedRoute><SuggestionsPage /></ProtectedRoute>} />
          <Route path="/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
          <Route path="/group-swipe/:sessionId" element={<ProtectedRoute><GroupSwipePage userId={user?.id} /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
          <Route path="/match-results/:sessionId" element={<ProtectedRoute><MatchResultsPage /></ProtectedRoute>} />
          
          <Route path="/lobby/:id" element={<ProtectedRoute><LobbyRoom /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        </main>

      {isAuthenticated && <Chatbot />}
      
      <Footer />

      {/* κουμπί για αλλαγή χρώματος (development) */}
      <button 
        onClick={cycleTheme}
        style={{
          position: 'fixed', bottom: '20px', left: '20px', zIndex: 99999,
          background: 'var(--accent-color)', color: '#000', border: 'none',
          padding: '10px 20px', borderRadius: '50px', fontWeight: 'bold',
          boxShadow: '0 5px 15px var(--shadow-color)', cursor: 'pointer',
          transition: 'transform 0.2s ease'
        }}
        onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
      >
        🌗 
      </button>
      
    </Router>
  );
}

export default App;