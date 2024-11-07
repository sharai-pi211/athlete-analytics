import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/Tasks.css";
import EditTaskModal from "./EditTaskModal";
import CalendarView from "./CalendarView";
import CreateTaskModal from "./CreateTaskModal";
import KanbanBoard from "./KanbanBoard";
import { priorityTranslation, statusTranslation } from "../utils/vocabulary";

interface Task {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  creator: { name: string; avatar: string };
  assigned_to: { id: number; name: string; avatar: string } | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

const cleanText = (text: string) => {
  if (!text) return ""; // Если текст null, undefined или пустой, вернуть пустую строку
  return text
    .replace(/[#*]/g, "") // Убирает символы # и *
    .replace(/\s+/g, " ") // Убирает лишние пробелы
    .trim(); // Убирает пробелы в начале и конце строки
};

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeModal, setActiveModal] = useState<"create" | "edit" | null>(
    null
  );
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [sortField, setSortField] = useState<keyof Task>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "calendar" | "kanban">(
    "table"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage] = useState(10);
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();

  const fetchTasks = async (
    teamId: string,
    sortField: keyof Task,
    sortOrder: "asc" | "desc"
  ) => {
    const rawToken = localStorage.getItem("token");
    const token = rawToken?.replace(/^"|"$/g, "");

    try {
      const response = await fetch(
        `http://localhost:5000/tasks?teamId=${teamId}&sortField=${sortField}&sortOrder=${sortOrder}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        const mappedTasks = data.tasks.map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          creator: {
            name: `${task.creator_first_name} ${task.creator_last_name}`,
            avatar: task.creator_avatar_url,
          },
          assigned_to: task.assigned_to_name
            ? {
                id: task.assigned_to,
                name: `${task.assigned_to_name} ${task.assigned_to_last_name}`,
                avatar: task.assigned_to_avatar,
              }
            : null,
          due_date: task.due_date,
          created_at: task.created_at,
          updated_at: task.updated_at,
        }));
        setTasks(mappedTasks);
      } else {
        throw new Error("Failed to fetch tasks");
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  const updateTasks = () => {
    if (teamId) {
      fetchTasks(teamId, sortField, sortOrder);
    }
  };

  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    const rawToken = localStorage.getItem("token");
    const token = rawToken?.replace(/^"|"$/g, "");

    try {
      const response = await fetch(`http://localhost:5000/tasks/${taskId}`, {
        method: "PATCH", // Используем метод PATCH для обновления
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId ? { ...task, status: updatedTask.status } : task
          )
        );
      } else {
        console.error("Failed to update task status");
      }
    } catch (err) {
      console.error("Error updating task status:", err);
    }
  };

  useEffect(() => {
    const selectedTeamId = localStorage.getItem("selectedTeamId");

    if (!teamId && selectedTeamId) {
      navigate(`/tasks/${selectedTeamId}`);
    } else if (teamId) {
      fetchTasks(teamId, sortField, sortOrder);
    }
  }, [teamId, sortField, sortOrder, navigate]);

  const sortTasks = (field: keyof Task) => {
    const order = sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(order);
  };

  const openEditModal = (task: Task) => {
    setSelectedTask(task);
    setActiveModal("edit");
  };

  const closeModal = () => {
    setSelectedTask(null);
    setActiveModal(null);
  };

  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = tasks.slice(indexOfFirstTask, indexOfLastTask);

  const totalPages = Math.ceil(tasks.length / tasksPerPage);

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

  return (
    <div className="tasks-container">
      <h1>Задания для команды</h1>
      <div className="view-switch">
        <button
          className="view-switch-btn"
          onClick={() => setViewMode("table")}
        >
          Таблица
        </button>
        <button
          className="view-switch-btn"
          onClick={() => setViewMode("calendar")}
        >
          Календарь
        </button>
        <button
          className="view-switch-btn"
          onClick={() => setViewMode("kanban")}
        >
          Доска
        </button>
      </div>
      {viewMode === "table" ? (
        <>
          {tasks.length === 0 ? (
            <p>No tasks available for this team.</p>
          ) : (
            <>
              <table className="tasks-table">
                <thead>
                  <tr>
                    <th onClick={() => sortTasks("title")}>
                      Название{" "}
                      {sortField === "title" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th>Описание</th>
                    <th onClick={() => sortTasks("priority")}>
                      Приоритет{" "}
                      {sortField === "priority" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th onClick={() => sortTasks("status")}>
                      Статус{" "}
                      {sortField === "status" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th>Создано</th>
                    <th>Назначено</th>
                    <th onClick={() => sortTasks("due_date")}>
                      Выполнить до{" "}
                      {sortField === "due_date" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentTasks.map((task) => (
                    <tr key={task.id} onClick={() => openEditModal(task)}>
                      <td>{task.title}</td>
                      <td>{cleanText(task.description)}</td>
                      <td className={`${task.priority.toLowerCase()}`}>
                        {translatePriority(task.priority)}
                      </td>
                      <td className={`${task.status.toLowerCase()}`}>
                        {translateStatus(task.status)}
                      </td>
                      <td>
                        <div className="creator-info">
                          <img
                            src={task.creator.avatar}
                            alt={task.creator.name}
                            className="creator-avatar"
                          />
                          <span>{task.creator.name}</span>
                        </div>
                      </td>
                      <td>
                        {task.assigned_to ? (
                          <div className="creator-info">
                            <img
                              src={
                                task.assigned_to.avatar || "/default-avatar.png"
                              }
                              alt={task.assigned_to.name}
                              className="creator-avatar"
                            />
                            <span>{task.assigned_to.name}</span>
                          </div>
                        ) : (
                          "Никому не назначено"
                        )}
                      </td>
                      <td>
                        {task.due_date
                          ? new Date(task.due_date).toLocaleDateString()
                          : "Не указано"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="pagination">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="view-switch-btn"
                >
                  Предыдущая
                </button>
                <span>
                  Страница {currentPage} из {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="view-switch-btn"
                >
                  Следующая
                </button>
              </div>
            </>
          )}
          <button
            className="create-task-button"
            onClick={() => setActiveModal("create")}
          >
            +
          </button>
        </>
      ) : viewMode === "calendar" ? (
        <>
          <CalendarView
            tasks={tasks.map((task) => ({
              id: task.id,
              title: task.title,
              status: task.status,
              priority: task.priority,
              due_date: task.due_date,
            }))}
            onTaskClick={(task) => {
              const fullTask = tasks.find((t) => t.id === task.id);
              if (fullTask) {
                openEditModal(fullTask);
              }
            }}
          />
          <button
            className="create-task-button"
            onClick={() => setActiveModal("create")}
          >
            +
          </button>
        </>
      ) : (
        <>
          <KanbanBoard
            tasks={tasks}
            onTaskClick={(task) => {
              const fullTask = tasks.find((t) => t.id === task.id);
              if (fullTask) {
                openEditModal(fullTask);
              }
            }}
            onTaskStatusChange={updateTaskStatus}
          />
          <button
            className="create-task-button"
            onClick={() => setActiveModal("create")}
          >
            +
          </button>
        </>
      )}
      {activeModal === "create" && (
        <CreateTaskModal
          teamId={teamId!}
          onClose={closeModal}
          onTaskUpdated={updateTasks}
        />
      )}
      {activeModal === "edit" && selectedTask && (
        <EditTaskModal
          teamId={teamId!}
          taskId={selectedTask.id}
          taskData={{
            title: selectedTask.title,
            description: selectedTask.description,
            priority: selectedTask.priority,
            status: selectedTask.status,
            assigned_to: selectedTask.assigned_to
              ? selectedTask.assigned_to.id
              : null,
            due_date: selectedTask.due_date,
          }}
          onClose={closeModal}
          onTaskUpdated={updateTasks}
        />
      )}
    </div>
  );
};

export default Tasks;
