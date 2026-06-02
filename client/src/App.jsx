import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; 
import './App.css';
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

  const [currentTheme, setCurrentTheme] = useState('morning');

  useEffect(() => {
    const hour = new Date().getHours();
    let calculatedTheme = 'morning';

    if (hour >= 6 && hour < 17) {
      calculatedTheme = 'morning';    
    } else if (hour >= 17 && hour < 20) {
      calculatedTheme = 'afternoon';  
    } else {
      calculatedTheme = 'night';      
    }

    document.body.setAttribute('data-theme', calculatedTheme);
    setCurrentTheme(calculatedTheme);
    
  }, []); 

  const cycleThemeForTesting = () => {
    const themes = ['morning', 'afternoon', 'night'];
    const nextIndex = (themes.indexOf(currentTheme) + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    
    document.body.setAttribute('data-theme', nextTheme);
    setCurrentTheme(nextTheme);
  };

  return (
    <Router>
      <ScrollToTop />
      
      {/* Το Navbar είναι ΟΡΑΤΟ ΣΕ ΟΛΟΥΣ */}
      <Navbar />

       <main style={{ width: '100%' }}>
        <Routes>
          {/* 🔓 ΕΛΕΥΘΕΡΗ ΠΡΟΣΒΑΣΗ (Public Routes) */}
          <Route path="/" element={<HomePage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/activities/:id" element={<ActivityDetailsPage />} />
          
          {/* ΤΑ LOBBIES ΦΑΙΝΟΝΤΑΙ ΕΛΕΥΘΕΡΑ */}
          <Route path="/lobbies" element={<LobbyDiscovery />} />
          
          <Route path="/login" element={ <div className="login-page-wrapper"><LoginPage /></div>}/>
          <Route path="/register" element={<div className="container mt-5"><RegisterPage /></div>} />
          
          {/* 🔒 ΠΡΟΣΤΑΤΕΥΜΕΝΗ ΠΡΟΣΒΑΣΗ (Protected Routes) */}
          <Route path="/suggestions" element={<ProtectedRoute><SuggestionsPage /></ProtectedRoute>} />
          <Route path="/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
          <Route path="/group-swipe/:sessionId" element={<ProtectedRoute><GroupSwipePage userId={user?.id} /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
          <Route path="/match-results/:sessionId" element={<ProtectedRoute><MatchResultsPage /></ProtectedRoute>} />
          
          {/* Το μέσα δωμάτιο (Chat) είναι κλειδωμένο! */}
          <Route path="/lobby/:id" element={<ProtectedRoute><LobbyRoom /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        </main>

      {isAuthenticated && <Chatbot />}
      
      {/* Το Footer είναι ορατό σε όλους */}
      <Footer />

      {/* Developer Κουμπί για Αλλαγή Ώρας */}
      <button 
        onClick={cycleThemeForTesting}
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