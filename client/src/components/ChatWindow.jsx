import React, { useContext, useState } from 'react';
import { SocketContext } from '../context/SocketContext';

const ChatWindow = ({ targetId }) => {
  const { chat, sendMessage } = useContext(SocketContext);
  const [msg, setMsg] = useState('');

  const handleSend = (e) => {
      e.preventDefault();
      sendMessage(msg, targetId);
      setMsg('');
  };

  return (
    <div className="chat-container">
        <h3>Chat</h3>
        <div className="messages-list">
            {chat.map((c, i) => (
                <div key={i} className={`message ${c.type}`}>
                    <span className="msg-sender">{c.from === 'Me' ? 'Me' : c.from}</span>
                    <p>{c.msg}</p>
                </div>
            ))}
        </div>
        <form onSubmit={handleSend} className="chat-input-area">
            <input
                type="text"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="Type a message..."
            />
            <button type="submit">Send</button>
        </form>
    </div>
  );
};

export default ChatWindow;
