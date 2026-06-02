import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css'; 
import './index.css';
import './App.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <App />
);

const path = require('path');

// Αν το περιβάλλον είναι παραγωγής (Render)
if (process.env.NODE_ENV === 'production') {
  // Σέρβιρε τα στατικά αρχεία από το φάκελο build του client
  app.use(express.static(path.join(__dirname, 'client/build')));

  // Για οποιοδήποτε άλλο route, στείλε το index.html της React
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}