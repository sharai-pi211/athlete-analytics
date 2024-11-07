import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import ReactMde from "react-mde";
import "react-mde/lib/styles/css/react-mde-all.css";
import "../styles/CreateTaskModal.css";

interface CreateTaskModalProps {
  teamId: string;
  onClose: () => void;
  onTaskUpdated: () => void;
}

interface TeamMember {
  id: number;
  username: string;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  teamId,
  onClose,
  onTaskUpdated,
}) => {
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "normal",
    status: "todo",
    assigned_to: "",
    due_date: "",
  });
  const [selectedTab, setSelectedTab] = useState<"write" | "preview">("write");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

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

  const handleNewTaskChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewTask({ ...newTask, [name]: value });
  };

  const handleMarkdownChange = (value: string) => {
    setNewTask({ ...newTask, description: value });
  };

  const createTask = async () => {
    const rawToken = localStorage.getItem("token");
    const token = rawToken?.replace(/^"|"$/g, "");

    try {
      const response = await fetch(
        `http://localhost:5000/tasks/${teamId}/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: newTask.title,
            description: newTask.description,
            priority: newTask.priority,
            status: newTask.status,
            due_date: newTask.due_date,
            assigned_to: newTask.assigned_to || null,
          }),
        }
      );

      if (response.ok) {
        onTaskUpdated();
        onClose();
      } else {
        throw new Error("Failed to create task");
      }
    } catch (err) {
      console.error("Error creating task:", err);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="header-modal">
          <h2>Новое задание</h2>
          <button onClick={onClose} className="close-btn">
            &times;
          </button>
        </div>
        <div className="modal-cont">
          <div className="left-modal">
            <strong>Название:</strong>
            <input
              type="text"
              name="title"
              placeholder="Название"
              value={newTask.title}
              onChange={handleNewTaskChange}
              required
            />
            <strong>Описание:</strong>
            <div className="mde-cont">
            <ReactMde
              value={newTask.description}
              onChange={handleMarkdownChange}
              selectedTab={selectedTab}
              onTabChange={setSelectedTab}
              generateMarkdownPreview={(markdown) =>
                Promise.resolve(<ReactMarkdown>{markdown}</ReactMarkdown>)
              }
              l18n={{
                write: "Редактирование", // Новый текст для вкладки "Write"
                preview: "Просмотр",     // Новый текст для вкладки "Preview"
                uploadingImage: "Загрузка изображения...", // Дополнительный текст
                pasteDropSelect: "Перетащите изображение или вставьте ссылку" // Если требуется
              }}
            />
            </div>
          </div>
          <div className="right-modal">
            <strong>Приоритет:</strong>
            <select
              name="priority"
              value={newTask.priority}
              onChange={handleNewTaskChange}
            >
              <option value="low">Низкий</option>
              <option value="normal">Нормальный</option>
              <option value="high">Высокий</option>
            </select>
            <strong>Статус:</strong>
            <select
              name="status"
              value={newTask.status}
              onChange={handleNewTaskChange}
            >
              <option value="todo">Сделать</option>
              <option value="in progress">В процессе</option>
              <option value="completed">Выполнено</option>
            </select>
            <strong>Назначить:</strong>
            <select
              name="assigned_to"
              value={newTask.assigned_to}
              onChange={handleNewTaskChange}
            >
              <option value="">Никому не назначено</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.username}
                </option>
              ))}
            </select>
            <strong>Срок сдачи:</strong>
            <input
              type="date"
              name="due_date"
              value={newTask.due_date}
              onChange={handleNewTaskChange}
            />
            <button onClick={createTask} className="create-task-btn">Создать</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal;
