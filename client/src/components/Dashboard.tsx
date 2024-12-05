import React, { useEffect, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import "../styles/Dashboard.css";
import Loading from "./Loading";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

const chartOptions = {
  plugins: {
    legend: {
      display: false, 
    },
  },
};


const Dashboard: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      const teamId = localStorage.getItem("selectedTeamId");
      const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");

      if (!teamId || !token) {
        setError("No team selected or token missing");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5000/tasks/${teamId}/tasks`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setTasks(data.tasks);
        } else {
          throw new Error("Failed to fetch tasks");
        }
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError("Failed to fetch tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const getStatusData = () => {
    const todo = tasks.filter((task) => task.status === "todo").length;
    const inProgress = tasks.filter(
      (task) => task.status === "in progress"
    ).length;
    const completed = tasks.filter(
      (task) => task.status === "completed"
    ).length;

    return {
      labels: ["Выполнить", "В процессе", "Выполнено"],
      datasets: [
        {
          data: [todo, inProgress, completed],
          backgroundColor: ["#A888B5", "#e8d174", "#9ed670"],
          // hoverBackgroundColor: ["#A888B5", "#36a2eb", "#4caf50"],
        },
      ],
    };
  };

  const getTasksByUserData = () => {
    const users: Record<string, number> = {};
    const colors = [
      "#EFB6C8", // pink
      "#8174A0", // purple-c
      "#A888B5", // purple-w
      "#4d7358", // green
      "#9ed670", // green-l
      "#d64d4d", // red
      "#e39e54", // orange
      "#e8d174", // yellow
    ];

    tasks.forEach((task) => {
      if (task.assigned_to && task.assigned_to.name) {
        const userName = task.assigned_to.name;
        users[userName] = (users[userName] || 0) + 1;
      }
    });

    // Map users to colors
    const userLabels = Object.keys(users);
    const backgroundColors = userLabels.map(
      (_, index) => colors[index % colors.length]
    );

    return {
      labels: userLabels,
      datasets: [
        {
          label: "Назначенные задания",
          data: Object.values(users),
          backgroundColor: backgroundColors,
        },
      ],
    };
  };

  const getOverdueTasksData = () => {
    const overdue = tasks.filter(
      (task) =>
        task.due_date &&
        new Date(task.due_date) < new Date() &&
        task.status !== "completed"
    ).length;

    const onTime = tasks.length - overdue;

    return {
      labels: ["Вовремя", "Просрочено"],
      datasets: [
        {
          data: [onTime, overdue],
          backgroundColor: ["#9ed670", "#e39e54"],
        },
      ],
    };
  };

  const getPriorityData = () => {
    const low = tasks.filter((task) => task.priority === "low").length;
    const normal = tasks.filter((task) => task.priority === "normal").length;
    const high = tasks.filter((task) => task.priority === "high").length;

    return {
      labels: ["Низкий", "Нормальный", "Высокий"],
      datasets: [
        {
          label: "Задачи",
          data: [low, normal, high],
          backgroundColor: ["#e8d174", "#4d7358", "#d64d4d"],
        },
      ],
    };
  };

  if (loading) return <Loading/>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="dashboard-container">
      <h1>Статистика</h1>
      <div className="top-cont">
        <div className="v-cont">
          <div className="dashboard-cards">
            <div className="card">
              <h3>Все задания</h3>
              <p>{tasks.length}</p>
            </div>
            <div className="card">
              <h3>Выполнены</h3>
              <p>
                {tasks.filter((task) => task.status === "completed").length}
              </p>
            </div>
            <div className="card">
              <h3>В процессе</h3>
              <p>
                {tasks.filter((task) => task.status === "in progress").length}
              </p>
            </div>
            <div className="card">
              <h3>Выполнить</h3>
              <p>{tasks.filter((task) => task.status === "todo").length}</p>
            </div>
          </div>
          <div className="chart">
            <h3>Соотвествие срокам</h3>
            <Bar
              data={getOverdueTasksData()}
              options={{
                indexAxis: "y", // Преобразует гистограмму в горизонтальную
                responsive: true,
                plugins: {
                  legend: {
                    display: false,
                    position: "top", // Позиция легенды
                  },
                  title: {
                    display: true,
                    text: "Overdue Tasks Distribution", // Заголовок графика
                  },
                },
              }}
            />
          </div>
        </div>
        <div className="chart">
          <h3>Приоритет</h3>
          <Bar data={getPriorityData()} options={chartOptions}/>
        </div>
      </div>

      <div className="charts">
        <div className="chart chart-by-user">
          <h3>Назначенные участникам</h3>
          <Bar data={getTasksByUserData()} options={chartOptions} />
        </div>
        <div className="chart">
          <h3>Статус</h3>
          <Doughnut data={getStatusData()} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
