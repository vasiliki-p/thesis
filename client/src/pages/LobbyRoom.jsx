import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { ArrowLeft, SendFill } from "react-bootstrap-icons";
import axios from "axios";

const socket = io("http://localhost:5000");

export default function LobbyRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [participants, setParticipants] = useState([]);
  const [activity, setActivity] = useState(null);
  
  const hasJoined = useRef(false);
  const chatContainerRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const displayName = user.username || "Guest"; 
  
  // Παίρνουμε το Token
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Α. Φόρτωση του Τίτλου (Activity ή Lobby)
    if (isNaN(id)) {
        // ΕΔΩ θέλει token γιατί τα group routes είναι πλέον κλειδωμένα!
        axios.get(`http://localhost:5000/api/group/info/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setActivity(res.data))
        .catch(() => setActivity({ title: "Δημόσιο Chat Room 💬" }));
    } else {
        axios.get(`http://localhost:5000/api/activities/${id}`)
        .then(res => setActivity(res.data))
        .catch(() => setActivity({ title: "Live Chat Δραστηριότητας" }));
    }
    
    // Β. Φόρτωση των Παλιών Μηνυμάτων (Αυτό έλειπε!)
    axios.get(`http://localhost:5000/api/lobby/messages/${id}`)
    .then(res => {
        const formattedMessages = res.data.map(msg => ({
            id: msg.id || Date.now() + Math.random(),
            activityId: id,
            userId: msg.userId,
            user: msg.user,
            text: msg.text,
            time: new Date(msg.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }));
        setMessages(formattedMessages);
    })
    .catch(err => console.error("Σφάλμα φόρτωσης μηνυμάτων:", err));


    // Γ. Σύνδεση στα WebSockets
    if (user.id && !hasJoined.current) {
        socket.emit("join-lobby", { activityId: id, userId: user.id, userName: displayName });
        hasJoined.current = true;
    }
    
    const handleLobbyUpdate = (data) => {
        if (data.activityId === id) {
            const unique = data.members.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
            setParticipants(unique);
        }
    };

    socket.on("lobby-updated", handleLobbyUpdate);
    socket.on("receive-message", (msg) => {
        if (msg.userId !== user.id) { setMessages(prev => [...prev, msg]); }
    });

    return () => {
        socket.off("lobby-updated", handleLobbyUpdate);
        socket.off("receive-message");
    };
  }, [id, user.id, displayName]);

  useEffect(() => {
    return () => {
        if (user.id) {
            socket.emit("leave-lobby", { activityId: id, userId: user.id });
            hasJoined.current = false;
        }
    };
  }, []);

  const sendMessage = () => {
    if (!input.trim()) return;
    const msgData = { 
        id: Date.now(), 
        activityId: id, 
        userId: user.id, 
        user: displayName, 
        text: input, 
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
    };
    socket.emit("send-message", msgData);
    setMessages(prev => [...prev, msgData]);
    setInput("");
  };


useEffect(() => {
    if (chatContainerRef.current) {
        // Κάνει scroll ΜΟΝΟ τον εαυτό του, όχι όλη τη σελίδα!
        chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: "smooth"
        });
    }
}, [messages]);

  return (
    <div className="container" style={{ paddingTop: "30px", paddingBottom: "100px", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 px-2">
       <div className="d-flex align-items-center gap-3">
          {/* 1. Απλό, κυκλικό κουμπί Πίσω */}
          <button 
            className="btn rounded-circle shadow-sm transition-btn d-flex align-items-center justify-content-center" 
            style={{ width: "42px", height: "42px", background: "var(--card-bg)", border: "1px solid var(--card-border)", color: 'var(--text-main)' }} 
            onClick={() => navigate(-1)} 
            title="Πίσω"
          >
            <ArrowLeft size={20} />
          </button>
          
          {/* Τίτλος Lobby */}
          <h2 className="m-0 fw-bold text-truncate" style={{ color: 'var(--text-main)', letterSpacing: "-1px", maxWidth: "200px" }}>
            {activity?.title || "Lobby"}
          </h2>
          
          {/* 2. Ξεκάθαρο κόκκινο κουμπί Αποχώρησης */}
          <button 
            className="btn rounded-pill px-3 py-1 fw-bold shadow-sm transition-btn ms-2 d-none d-md-block" 
            style={{ background: "#fee2e2", border: "1px solid #f87171", color: '#dc2626', fontSize: "0.85rem" }} 
            onClick={() => navigate('/lobbies')}
          >
            Αποχώρηση
          </button>
        </div>
        <div className="d-flex align-items-center">
          <div className="d-flex me-3">
            {participants.map((p, index) => (
              <img key={`av-${p.id}-${index}`} src={`https://ui-avatars.com/api/?name=${p.name}&background=random&color=fff&rounded=true&bold=true`}  title={p.name} alt={p.name} className="rounded-circle shadow-sm" style={{ width: "36px", height: "36px", border: "2px solid var(--bg-color)", marginLeft: index !== 0 ? "-12px" : "0", objectFit: "cover" }} />
            ))}
          </div>
          <span className="small fw-bold" style={{ color: 'var(--text-muted)' }}>{participants.length} online</span>
        </div>
      </div>

      <div className="card shadow-lg border-0 overflow-hidden" style={{ height: "75vh", background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '28px' }}>
        <div className="p-4 d-flex align-items-center justify-content-between" style={{ borderBottom: '1px solid var(--card-border)' }}>
          <div className="d-flex align-items-center gap-2"><span className="pulse-dot-live"></span><span className="fw-bold small text-uppercase" style={{ color: "var(--text-main)", letterSpacing: '1px' }}>Live Lobby Chat</span></div>
        </div>
      <div ref={chatContainerRef} className="flex-grow-1 p-4 d-flex flex-column gap-3" style={{ background: "rgba(0,0,0,0.01)", overflowY: "auto" }}>
          {messages.map((msg, index) => {
            const isMe = msg.user === displayName; 
            return (
              <div key={msg.id || index} className={`d-flex flex-column ${isMe ? "align-items-end" : "align-items-start"}`}>
                <small className="mb-1 fw-bold px-2" style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{msg.user}</small>
                <div className="p-3 shadow-sm" style={{ maxWidth: "70%", fontSize: "0.95rem", fontWeight: "500", lineHeight: "1.5", background: isMe ? '#d97706' : 'var(--bg-color)', color: isMe ? '#fff' : 'var(--text-main)', borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px', border: isMe ? 'none' : '1px solid var(--card-border)' }}>
                  {msg.text}
                  <div className="text-end mt-1" style={{ fontSize: "0.65rem", opacity: 0.7, color: isMe ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>{msg.time}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-4" style={{ borderTop: '1px solid var(--card-border)' }}>
          <div className="d-flex gap-3 align-items-center p-2" style={{ background: 'var(--bg-color)', border: '1px solid var(--card-border)', borderRadius: "100px" }}>
            <input type="text" className="form-control border-0 bg-transparent px-3" placeholder="Γράψτε ένα μήνυμα..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} style={{ boxShadow: "none", fontWeight: "500", color: 'var(--text-main)' }} />
            <button className="btn d-flex align-items-center justify-content-center transition-btn" style={{ width: "44px", height: "44px", minWidth: "44px", background: '#d97706', color: '#fff', borderRadius: '50%', border: 'none' }} onClick={sendMessage}><SendFill size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}