import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";

import "./App.css";

const Layout: React.FC = () => {
  return (
    <div className="layout">
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}></Route>
      </Routes>
    </Router>
  );
};

export default App;
