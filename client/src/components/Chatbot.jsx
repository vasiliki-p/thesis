import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { sendMessageToChatbot } from "../api";

function Chatbot() {
  const [messages, setMessages] = useState([
    { id: "ai-welcome", from: "ai", text: "Γεια σου 👋 Πώς μπορώ να βοηθήσω;" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [isOpen, setIsOpen] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");

    const userMsgObj = {
      id: `user-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      from: "user",
      text: userMessage,
    };

    setMessages((prev) => [...prev, userMsgObj]);
    setLoading(true);

    try {
      const res = await sendMessageToChatbot(userMessage);

      const aiMsgObj = {
        id: `ai-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        from: "ai",
        text: res.reply,
      };

      setMessages((prev) => [...prev, aiMsgObj]);
    } catch (err) {
      console.error("Chatbot request failed:", err);

      setMessages((prev) => [
        ...prev,
        { id: `ai-error-${Date.now()}`, from: "ai", text: "⚠️ Σφάλμα σύνδεσης." },
      ]);
    } finally {
      setLoading(false);
    }
  };

 // --- Η ΚΑΡΔΙΑ ΤΗΣ ΕΞΥΠΝΗΣ ΛΕΙΤΟΥΡΓΙΑΣ (ΔΙΟΡΘΩΜΕΝΗ ΓΙΑ ΠΟΛΛΑΠΛΑ LINKS) ---
  const showBubble = (msg) => {
    // 1. Βρίσκουμε ΟΛΑ τα links με Global Regex (/g)
    const linkRegex = /{{LINK:(.*?)}}/g;
    const links = [];
    let match;

    while ((match = linkRegex.exec(msg.text)) !== null) {
      links.push(match[1]);
    }

    // 2. Αφαιρούμε ΟΛΑ τα tags από το κείμενο που θα διαβάσει ο χρήστης
    const cleanText = msg.text.replace(linkRegex, "").trim();

    return (
      <div>
        {cleanText}
        {msg.from === "ai" && links.length > 0 && (
          <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {/* 3. Φτιάχνουμε ένα κουμπί για ΚΑΘΕ link που βρήκαμε */}
            {links.map((url, index) => (
              <Link
                key={index}
                to={url}
                style={styles.linkButton}
                onClick={() => setIsOpen(false)}
              >
                🚀 Δες την πρόταση {links.length > 1 ? `#${index + 1}` : ""}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };
  return (
    <>
      {isOpen && (
        <div style={styles.chatWindow}>
          <div style={styles.header}>
            <span style={{ marginLeft: 10 }}>💬 Βοηθός</span>
            <button onClick={() => setIsOpen(false)} style={styles.closeButton}>
              ✖
            </button>
          </div>

          <div style={styles.messages}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  ...styles.message,
                  alignSelf: msg.from === "user" ? "flex-end" : "flex-start",
                  background: msg.from === "user" ? "#0d6efd" : "#e9ecef",
                  color: msg.from === "user" ? "white" : "#212529",
                }}
              >
                {showBubble(msg)}
              </div>
            ))}

            {loading && (
              <div style={{ ...styles.message, background: "#e9ecef" }}>...</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={styles.inputArea}>
            <input
              style={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Γράψε..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button style={styles.sendButton} onClick={sendMessage}>
              ➤
            </button>
          </div>
        </div>
      )}

      <button onClick={() => setIsOpen((v) => !v)} style={styles.toggleButton}>
        {isOpen ? "🔽" : "💬"}
      </button>
    </>
  );
}

const styles = {
  toggleButton: {
    position: "fixed",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: "50%",
    background: "#0d6efd",
    color: "white",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    zIndex: 9999,
  },
  chatWindow: {
    position: "fixed",
    bottom: 90,
    right: 20,
    width: 320,
    height: 450,
    background: "white",
    border: "1px solid #ccc",
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    zIndex: 9999,
    overflow: "hidden",
    boxShadow: "0 5px 20px rgba(0,0,0,0.2)",
  },
  header: {
    padding: "10px",
    background: "#0d6efd",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: "bold",
  },
  closeButton: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "18px",
    cursor: "pointer",
  },
  messages: {
    flex: 1,
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    overflowY: "auto",
    background: "#f8f9fa",
  },
  message: {
    maxWidth: "85%",
    padding: "10px 12px",
    borderRadius: 12,
    fontSize: 14,
    lineHeight: "1.5",
    wordWrap: "break-word",
  },
  inputArea: {
    display: "flex",
    borderTop: "1px solid #ddd",
    background: "white",
    padding: 5,
  },
  input: { flex: 1, border: "none", padding: 12, outline: "none", fontSize: 14 },
  sendButton: {
    border: "none",
    background: "#0d6efd",
    color: "white",
    padding: "0 20px",
    cursor: "pointer",
    borderRadius: 8,
    margin: "5px",
  },
  linkButton: {
    display: "inline-block",
    marginTop: "5px",
    padding: "6px 12px",
    backgroundColor: "white",
    color: "#0d6efd",
    border: "1px solid #0d6efd",
    borderRadius: "20px",
    textDecoration: "none",
    fontWeight: "bold",
    fontSize: "12px",
    cursor: "pointer",
  },
};

export default Chatbot;
