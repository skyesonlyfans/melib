import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SearchPage from './SearchPage';
import ReaderPage from './ReaderPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background font-sans">
        <Routes>
          {/* The main route '/' will render the search page */}
          <Route path="/" element={<SearchPage />} />
          {/* The '/read' route is for the book viewer */}
          <Route path="/read" element={<ReaderPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

