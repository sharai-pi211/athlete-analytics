import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "../styles/CreateTaskModal.css";
import ReactMde from "react-mde";
import "react-mde/lib/styles/css/react-mde-all.css";
import { priorityTranslation, statusTranslation } from "../utils/vocabulary";

interface EditTaskModalProps {
  teamId: string;
  taskId: number;
  onClose: () => void;
  onTaskUpdated: () => void;
  taskData: {
    title: string;
    description: string;
    priority: string;
    status: string;
    assigned_to: number | null;
    due_date: string | null;
  };
}

interface TeamMember {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
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


const EditTaskModal: React.FC<EditTaskModalProps> = ({
  teamId,
  taskId,
  onClose,
  onTaskUpdated,
  taskData,
}) => {
  const [updatedTask, setUpdatedTask] = useState(taskData);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"write" | "preview">("write"); // Состояние для вкладок

  useEffect(() => {
    const fetchTeamMembers = async () => {
      const rawToken = localStorage.getItem("token");
      const token = rawToken?.replace(/^"|"$/g, "");

      try {
        const response = await fetch(
          `http://localhost:5000/team/${teamId}/members`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const members = data.members.map((member: any) => ({
            id: member.id,
            username: member.username,
          }));
          setTeamMembers(members);
        } else {
          throw new Error("Failed to fetch team members");
        }
      } catch (err) {
        console.error("Error fetching team members:", err);
      }
    };

    fetchTeamMembers();
  }, [teamId]);

  const handleTaskChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setUpdatedTask({ ...updatedTask, [name]: value });
  };

  const handleMarkdownChange = (value: string) => {
    setUpdatedTask({ ...updatedTask, description: value });
  };

  function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return "Не указано";
  
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
  
    return `${day}.${month}.${year}`; // Формат "22.12.2024"
  }

  const saveTask = async () => {
    const rawToken = localStorage.getItem("token");
    const token = rawToken?.replace(/^"|"$/g, "");

    try {
      const response = await fetch(
        `http://localhost:5000/tasks/${teamId}/tasks/${taskId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...updatedTask,
            assigned_to: updatedTask.assigned_to || null,
          }),
        }
      );

      if (response.ok) {
        onTaskUpdated();
        onClose();
      } else {
        throw new Error("Failed to update task");
      }
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  const deleteTask = async () => {
    const rawToken = localStorage.getItem("token");
    const token = rawToken?.replace(/^"|"$/g, "");

    try {
      const response = await fetch(
        `http://localhost:5000/tasks/${teamId}/tasks/${taskId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        onTaskUpdated();
        onClose();
      } else {
        throw new Error("Failed to delete task");
      }
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  return (
    <div className="modal">
      <div
        className={`modal-content ${isEditMode ? "edit-mode" : "watch-mode"}`}
      >
        <div className="header-modal">
          <h2>{isEditMode ? "Редактирование задачи" : "Просмотр задачи"}</h2>
          <div className="btns-cont">
            {!isEditMode ? (
              <button
                onClick={() => setIsEditMode(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <img src="/edit.svg" alt="Edit" className="edit-btn" />
              </button>
            ) : (
              <button
                onClick={() => setIsEditMode(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <img
                  src="/cancel-edit.svg"
                  alt="Cancel Edit"
                  className="edit-btn"
                />
              </button>
            )}
            <button onClick={onClose} className="close-btn">
              <img src="/close.svg" alt="Close" className="close-img" />
            </button>
          </div>
        </div>

        {isEditMode ? (
          <div className="modal-cont">
            <div className="left-modal">
            <strong>Название:</strong>
            <input
              type="text"
              name="title"
              placeholder="Title"
              value={updatedTask.title}
              onChange={handleTaskChange}
              required
            />
            <strong>Описание:</strong>
            <ReactMde
              value={updatedTask.description || ""}
              onChange={handleMarkdownChange}
              onTabChange={setSelectedTab} // Добавляем обработчик переключения вкладок
              selectedTab={selectedTab} // Передаем текущую вкладку
              generateMarkdownPreview={(markdown) =>
                Promise.resolve(<ReactMarkdown>{markdown}</ReactMarkdown>)
              }
              l18n={{
                write: "Редактирование", // Новый текст для вкладки "Write"
                preview: "Просмотр", // Новый текст для вкладки "Preview"
                uploadingImage: "Загрузка изображения...", // Дополнительный текст
                pasteDropSelect: "Перетащите изображение или вставьте ссылку", // Если требуется
              }}
            />
                        </div>
                        <div className="right-modal">
            <strong>Приоритет:</strong>
            <select
              name="priority"
              value={updatedTask.priority}
              onChange={handleTaskChange}
            >
              <option value="low">Низкий</option>
              <option value="normal">Нормальный</option>
              <option value="high">Высокий</option>
            </select>
            <strong>Статус:</strong>
            <select
              name="status"
              value={updatedTask.status}
              onChange={handleTaskChange}
            >
              <option value="todo">Выполнить</option>
              <option value="in progress">В процессе</option>
              <option value="completed">Выполнено</option>
            </select>
            <strong>Кому назначено:</strong>
            <select
              name="assigned_to"
              value={updatedTask.assigned_to || ""}
              onChange={handleTaskChange}
            >
              <option value="">Никому не назначено</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.username}
                </option>
              ))}
            </select>
            <strong>Сделать до:</strong>
            <input
              type="date"
              name="due_date"
              value={updatedTask.due_date || ""}
              onChange={handleTaskChange}
            />
            <div className="edit-buttons">
              <button onClick={saveTask}>Сохранить</button>
              <button onClick={deleteTask} className="delete-btn">
                Удалить
              </button>
            </div>
            </div>
          </div>
        ) : (
                    <div className="modal-cont">
                    <div className="left-modal">
            <p className="column">
              <strong>Название:</strong> 
              <h3>{updatedTask.title}</h3>
            </p>
            <p className="column">
              <strong>Описание:</strong>
              {updatedTask.description ? (
                <div className="description">
                  <ReactMarkdown>{updatedTask.description}</ReactMarkdown>
                </div>
              ) : (
                "нет описания"
              )}
            </p>
            </div>
            <div className="right-modal">
            <p className="column">
              <strong>Приоритет:</strong> 
              <div className={`${updatedTask.priority.toLowerCase()}`}> {translatePriority(updatedTask.priority)}</div>
            </p>
            <p className="column">
              <strong>Статус:</strong> 
              <div className={`${updatedTask.status.toLowerCase()}`}> {translateStatus(updatedTask.status)}</div>
              
            </p>
            <p className="column">
              <strong>Назначено:</strong>{" "}
              {updatedTask.assigned_to
                ? teamMembers.find(
                    (member) => member.id === updatedTask.assigned_to
                  )?.username || "Неизвестный пользователь"
                : "Никому не назначено"}
            </p>

            <p className="column">
              <strong>Сделать до:</strong>{" "}
              {formatDate(updatedTask.due_date)}
            </p>
            </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default EditTaskModal;
