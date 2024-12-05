import React, { useState, useEffect } from "react";
import { useWebSocket } from "./WebSocketContext";
import "../styles/Chat.css";

interface Message {
  id: number;
  content: string;
  sender: string;
  created_at: string;
}

const TeamChat: React.FC = () => {
  const teamId = localStorage.getItem("selectedTeamId");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const ws = useWebSocket();

  const user = localStorage.getItem("user");
  const currentUser = user ? JSON.parse(user) : null;

  useEffect(() => {
    const fetchMessages = async () => {
      const rawToken = localStorage.getItem("token");
      const token = rawToken?.replace(/^"|"$/g, "");

      try {
        const response = await fetch(`http://localhost:5000/chat/${teamId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log(data);
          setMessages(data.messages);
        } else {
          console.error("Failed to fetch messages");
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessages();
  }, [teamId]);

  useEffect(() => {
    if (!ws) return;
  
    ws.onmessage = (event) => {
      const { event: eventType, data } = JSON.parse(event.data);
  
      if (eventType === "new_message" && data.teamId === teamId) {
        setMessages((prev) => [...prev, data]);
      }
    };
  
    return () => {
      if (ws) ws.onmessage = null;
    };
  }, [ws, teamId]);
  

  const sendMessage = () => {
    if (!ws || !input.trim() || !teamId) return;
  
    const messageData = {
      event: "send_message",
      data: {
        teamId,
        content: input,
      },
    };
  
    ws.send(JSON.stringify(messageData));
  
    setInput("");
  };  

  return (
    <div className="chat-cont">
      <h2>Чат команды</h2>
      <div className="chat-mess">
        {messages.map((msg) => {
const isCurrentUser = 
msg.sender === String(currentUser?.id) || msg.sender === currentUser?.email;
const messageClass = isCurrentUser ? "m-right" : "m-left";

return (
<div key={msg.id} className={`message ${messageClass}`}>
  {!isCurrentUser && <div><strong>{msg.sender}</strong></div>} 
  <div>{msg.content}</div>
  <div className="m-date">
    {new Date(msg.created_at).toLocaleTimeString()}
  </div>
</div>
);

        })}
      </div>
      <div className="send-cont">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Сообщение"
        />
        <button onClick={sendMessage}  className="send-btn">
        <img src="/send.svg" alt="Send" className="send-ing" />
        </button>
      </div>
    </div>
  );
};

export default TeamChat;