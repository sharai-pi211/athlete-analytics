import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import Me from "./components/Me";
import Teams from "./components/Teams";
import Tasks from "./components/Tasks";
import Navbar from "./components/Navbar";
import PomodoroTimer from "./components/PomodoroTimer";
import Notifications from "./components/Notifications";

import "./App.css";
import { WebSocketProvider } from "./components/WebSocketContext";

const Layout: React.FC = () => {
  return (
    <div className="layout">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;
    const userId = user?.id ? String(user.id) : null;
    setUserId(userId);
  }, []);

  return (
    <WebSocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="me" element={<Me />} />
            <Route path="pomodoro" element={<PomodoroTimer />} />
            <Route path="teams" element={<Teams />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="/tasks/:teamId" element={<Tasks />} />

          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </Router>
    </WebSocketProvider>
  );
};

export default App;
