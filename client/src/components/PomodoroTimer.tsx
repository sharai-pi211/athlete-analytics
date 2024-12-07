import React, { useState, useEffect } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import "../styles/PomodoroTimer.css";

const PomodoroTimer: React.FC = () => {
  const [workInterval, setWorkInterval] = useState(60);
  const [breakInterval, setBreakInterval] = useState(20);
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const savedTime = localStorage.getItem("timeLeft");
    return savedTime ? parseInt(savedTime, 10) : 25 * 60;
  });
  const [isRunning, setIsRunning] = useState<boolean>(() => {
    const savedRunning = localStorage.getItem("isRunning");
    return savedRunning === "true";
  });
  const [startTime, setStartTime] = useState<number | null>(() => {
    const savedStartTime = localStorage.getItem("startTime");
    return savedStartTime ? parseInt(savedStartTime, 10) : null;
  });
  const [isWorkInterval, setIsWorkInterval] = useState<boolean>(() => {
    const savedWorkState = localStorage.getItem("isWorkInterval");
    return savedWorkState !== "false";
  });

  let interval: ReturnType<typeof setInterval> | null = null;

  useEffect(() => {
    if (isRunning && startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const totalInterval = isWorkInterval
          ? workInterval * 60
          : breakInterval * 60;
        const remainingTime = Math.max(0, totalInterval - elapsed);

        setTimeLeft(remainingTime);
        localStorage.setItem("timeLeft", remainingTime.toString());

        if (remainingTime === 0) {
          clearInterval(interval as NodeJS.Timeout);
          handleIntervalEnd();
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, startTime, workInterval, breakInterval, isWorkInterval]);

  useEffect(() => {
    localStorage.setItem("timeLeft", timeLeft.toString());
    localStorage.setItem("isRunning", isRunning.toString());
    localStorage.setItem("isWorkInterval", isWorkInterval.toString());
    if (startTime) {
      localStorage.setItem("startTime", startTime.toString());
    } else {
      localStorage.removeItem("startTime");
    }
  }, [timeLeft, isRunning, startTime, isWorkInterval]);

  const handleStartPause = () => {
    if (isRunning) {
      setIsRunning(false);
      setStartTime(null);
      localStorage.setItem("timeLeft", timeLeft.toString());
    } else {
      const totalInterval = isWorkInterval
        ? workInterval * 60
        : breakInterval * 60;
      setIsRunning(true);
      setStartTime(Date.now() - (totalInterval - timeLeft) * 1000);
      localStorage.setItem("startTime", Date.now().toString());
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsWorkInterval(true);
    setTimeLeft(workInterval * 60);
    setStartTime(null);
    localStorage.removeItem("timeLeft");
    localStorage.removeItem("isRunning");
    localStorage.removeItem("startTime");
    localStorage.removeItem("isWorkInterval");
  };

  const handleIntervalEnd = () => {
    setIsRunning(false);
    setStartTime(null);
    setIsWorkInterval(!isWorkInterval);
    const nextInterval = isWorkInterval
      ? breakInterval * 60
      : workInterval * 60;
    setTimeLeft(nextInterval);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const totalInterval = isWorkInterval ? workInterval * 60 : breakInterval * 60;
  const progress = (1 - timeLeft / totalInterval) * 100;

  return (
    <div className="pomodoro-cont">
      <div className="pomodoro-timer">
        <h1>Помодоро таймер</h1>
        <div className="settings">
          <label>
            Интервал работы (мин):
            <input
              className="pom-input"
              type="number"
              value={workInterval}
              onChange={(e) => {
                const newWorkInterval = parseInt(e.target.value, 10) || 25;
                setWorkInterval(newWorkInterval);
                if (isWorkInterval && !isRunning) {
                  setTimeLeft(newWorkInterval * 60);
                  localStorage.setItem(
                    "timeLeft",
                    (newWorkInterval * 60).toString(),
                  );
                }
              }}
            />
          </label>
          <label>
            Интервал отдыха (мин):
            <input
              className="pom-input"
              type="number"
              value={breakInterval}
              onChange={(e) => {
                const newBreakInterval = parseInt(e.target.value, 10) || 5;
                setBreakInterval(newBreakInterval);
                if (!isWorkInterval && !isRunning) {
                  setTimeLeft(newBreakInterval * 60);
                  localStorage.setItem(
                    "timeLeft",
                    (newBreakInterval * 60).toString(),
                  );
                }
              }}
            />
          </label>
        </div>
        <div className="progress-container">
          <CircularProgressbar
            value={progress}
            text={formatTime(timeLeft)}
            styles={buildStyles({
              textColor: "#333",
              pathColor: isWorkInterval ? "#4d7358" : "#8174A0",
              trailColor: "#d6d6d6",
            })}
          />
        </div>
        <div className="controls">
          <button onClick={handleStartPause}>
            {isRunning ? "Пауза" : "Начать"}
          </button>
          <button onClick={handleReset}>Сбросить</button>
        </div>
        <div className="status">
          <p>Текущий интервал: {isWorkInterval ? "работа" : "отдых"}</p>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;
