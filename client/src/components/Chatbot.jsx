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
  
  // auto-scroll στο τελευταίο μήνυμα
  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // αποστολή μηνύματος στο backend
  const sendMessage = async () => {
    if (!input.trim()) return;

    const text = input;
    setInput("");

    const userMsg = {
      id: `user-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      from: "user",
      text: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await sendMessageToChatbot(text);

      let cleanedAiText = "";
      if (res && typeof res === "object") {
        cleanedAiText = res.reply || res.message || JSON.stringify(res);
      } else {
        cleanedAiText = res;
      }

      const aiMsg = {
        id: `ai-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        from: "ai",
        text: cleanedAiText,
      };

      setMessages((prev) => [...prev, aiMsg]);
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

  

  // Ψάχνει για ΟΛΑ τα κρυφά links στο μήνυμα του AI (πχ. {{LINK:/activities/2}}) 
  // και φτιάχνει inline κουμπιά στη σωστή θέση του κειμένου.
  const formatMessage = (msg) => {
    // Αν το μήνυμα είναι από τον χρήστη, το δείχνουμε ως έχει.
    if (msg.from !== "ai") {
      return <span>{msg.text}</span>;
    }

    // Χωρίζουμε το κείμενο χρησιμοποιώντας το regex.
    // Η παρένθεση () στο regex κρατάει και τα ίδια τα links μέσα στο array που επιστρέφεται.
    const parts = msg.text.split(/({{LINK:.*?}})/);

    return (
      <div>
        {parts.map((part, index) => {
          // Ελέγχουμε αν το τρέχον κομμάτι είναι link
          const linkMatch = part.match(/{{LINK:(.*?)}}/);

          if (linkMatch) {
            const linkUrl = linkMatch[1];
            return (
              <span key={index} style={{ display: "inline-block", margin: "2px 4px" }}>
                <Link
                  to={linkUrl}
                  style={styles.linkButton}
                  onClick={() => setIsOpen(false)}
                >
                  🚀 Δες εδώ
                </Link>
              </span>
            );
          }

          // Αν είναι απλό κείμενο, το κάνουμε render κανονικά
          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  };


  return (
    <>
      {/* Παράθυρο Chat */}
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
                {formatMessage(msg)}
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

      {/* Κουμπί (Φούσκα) κάτω δεξιά */}
      <button onClick={() => setIsOpen((v) => !v)} style={styles.toggleButton}>
        {isOpen ? "🔽" : "💬"}
      </button>
    </>
  );
}

// Inline Styles (για γρήγορο styling χωρίς εξωτερικό CSS)
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
    whiteSpace: "pre-wrap", 
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
