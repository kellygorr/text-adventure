import React from 'react';

import './App.scss';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Intro } from './Intro/Intro';
import { Adventure } from './Adventure/Adventure';
import { PageType } from './utlities/context/site-context';

const App: React.FC = () => {
  return (
    <div className="root">
      <Router>
        <Routes>
          <Route path="/" element={<Intro />} />
          <Route path={`/${PageType.Adventure}`} element={<Adventure />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
