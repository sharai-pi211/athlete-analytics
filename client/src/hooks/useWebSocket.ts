import { useEffect } from "react";

interface TaskAssignedData {
  taskId: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  message: string;
}

interface WebSocketMessage {
  event: string;
  data: TaskAssignedData;
}

const useWebSocket = (
  userId: string,
  onTaskAssigned: (task: TaskAssignedData) => void,
) => {
  useEffect(() => {
    const WS_URL = "ws://localhost:5000/ws";
    const socket = new WebSocket(`${WS_URL}?userId=${userId}`);

    socket.onopen = () => {
      console.log("WebSocket connection established");
    };

    socket.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);

      if (message.event === "task_assigned") {
        console.log("New task assigned:", message.data);

        if (onTaskAssigned) {
          onTaskAssigned(message.data);
        }
      }
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      socket.close();
    };
  }, [userId, onTaskAssigned]);
};

export default useWebSocket;
