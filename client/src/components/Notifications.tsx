import React, { useEffect, useState } from "react";
import useWebSocket from "../hooks/useWebSocket";
import "../styles/Notifications.css";
import { priorityTranslation, statusTranslation } from "../utils/vocabulary";

interface TaskAssignedData {
  taskId: number;
  title: string;
  description: string; // Описание задачи
  status: string; // Статус задачи
  priority: string; // Приоритет задачи
  message: string;
  source: "fetch" | "websocket";
}


interface Task {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  assigned_to: number | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

const translateStatus = (status: string): string => {
  return status in statusTranslation
    ? statusTranslation[status as keyof typeof statusTranslation]
    : "Неизвестный статус";
};

const translatePriority = (priority: string): string => {
  return priority in priorityTranslation
    ? priorityTranslation[priority as keyof typeof priorityTranslation]
    : "Неизвестный приоритет";
};

const sanitizeMarkdown = (text: string): string => {
  return text
    .replace(/(^\s*#.*$)/gm, "") // Убирает строки с заголовками Markdown (#)
    .replace(/^\s*\*.*$/gm, "") // Убирает строки со списками Markdown (*)
    .replace(/^\s+/gm, "") // Убирает начальные пробелы
    .replace(/\*\*(.*?)\*\*/g, "$1") // Убирает жирный шрифт (**text**)
    .replace(/\*(.*?)\*/g, "$1") // Убирает курсив (*text*)
    .trim(); // Убирает лишние пробелы в начале и конце
};


const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<TaskAssignedData[]>([]);
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;
  const userId = user && user.id ? String(user.id) : "";
  const teamId = localStorage.getItem("selectedTeamId");

  useEffect(() => {
    const abortController = new AbortController(); // Создаем новый AbortController
    const { signal } = abortController;

    const loadAssignedTasks = async () => {
      if (!teamId) {
        console.error("No team ID found in localStorage");
        return;
      }

      const rawToken = localStorage.getItem("token");
      const token = rawToken?.replace(/^"|"$/g, "");

      try {
        const response = await fetch(
          `http://localhost:5000/tasks/${teamId}/assigned`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            signal, // Передаем сигнал AbortController в запрос
          }
        );

        if (response.ok) {
          const data = await response.json();
          const tasks: Task[] = data.tasks;

          setNotifications((prev: TaskAssignedData[]) => [
            ...prev,
            ...tasks.map((task): TaskAssignedData => ({
              taskId: task.id,
              title: task.title,
              description: sanitizeMarkdown(task.description || ""),
              status: task.status,
              priority: task.priority,
              message: "Вам было назначено задание:",
              source: "fetch",
            })),
          ]);
        } else {
          console.error("Failed to fetch assigned tasks");
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
            console.log("Fetch aborted");
          } else {
            console.error("Error fetching assigned tasks:", err);
          }
      }
    };

    loadAssignedTasks();

    return () => {
      abortController.abort(); // Отменяем предыдущий запрос при размонтировании или повторном вызове
    };
  }, [teamId]);

  useWebSocket(userId, (newTask) => {
    setNotifications((prev: TaskAssignedData[]) => [
      ...prev,
      { 
        taskId: newTask.taskId,
        title: newTask.title,
        description: newTask.description || "Описание не указано",
        status: newTask.status || "Статус не указан",
        priority: newTask.priority || "Приоритет не указан",
        message: "Вам было назначено задание:",
        source: "websocket" 
      },
    ]);
  });
  

  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.source === "websocket" && b.source === "fetch") return -1;
    if (a.source === "fetch" && b.source === "websocket") return 1;
    return 0;
  });

  return (
    <div className="notif-cont">
      <h2>Уведомления</h2>
      {sortedNotifications.length === 0 ? (
        <p>No new notifications.</p>
      ) : (
        <>
        <h3>Вам были назначены следующие задания: </h3>
        <ul>
          {sortedNotifications.map((notif) => (
            <li
            className="notif-li"
              key={notif.taskId}
              style={{
                color: notif.source === "websocket" ? "red" : "black",
              }}
            >
              <div>
              <strong> {notif.title}</strong>
              <p> {notif.description}</p>
              </div>
              <div className="not-statuses">
              <p className={`${notif.status.toLowerCase()}`}> {translateStatus(notif.status)}</p>
              <p className={`${notif.priority.toLowerCase()}`}> {translatePriority(notif.priority)}</p>
              </div>
            </li>
          ))}
        </ul>
        </>
      )}
    </div>
  );
};

export default Notifications;
