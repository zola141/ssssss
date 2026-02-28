# 💬 ANAS - Real-Time Chat & Frontend Integration

## 📍 Your Responsibility
- Real-time chat system
- WebSocket communication for chat
- Frontend-backend linking
- Chat UI components
- Message broadcasting

---

## 📁 Your Code Locations

### Chat Components
```
thegame/src/components/
├── ChatBot.jsx          # Chat bot component
├── ChatPanel.jsx        # Main chat panel
└── ChatMessage.jsx      # Individual message display
```

### Chat Styles
```
thegame/src/styles/
└── Chat.css             # Chat styling
```

### Chat HTML
```
public/
├── login.html           # Login (you maintain UI)
├── register.html        # Register (you maintain UI)
└── profile.html         # Profile (you maintain UI)
```

---

## 🔌 Packages You Use

```json
{
  "socket.io-client": "^4.8.3",  // Real-time communication
  "react": "^18.x",              // Frontend framework
  "react-router": "^6.x"         // Page routing (may use)
}
```

### Key Dependencies (installed in root)
- **socket.io** - Backend WebSocket server
- **express** - HTTP server

---

## 📡 WebSocket Events You Handle

### Chat Events (Broadcasting)

#### Sending Messages
```javascript
socket.emit('chat-message', {
  email: userEmail,
  message: messageText,
  roomId: gameRoomId,
  timestamp: Date.now()
});
```

#### Receiving Messages
```javascript
socket.on('chat-message', (data) => {
  // data: { email, message, roomId, timestamp }
  // Add to UI
});
```

#### Message History
```javascript
socket.on('chat-history', (messages) => {
  // Receive past messages for room
  setChatMessages(messages);
});
```

---

## 🔗 Integration Points

### Linking Frontend to Backend

1. **Room Chat Loading**
   - When player joins game room → Request chat history
   - Get past messages from backend
   - Display in ChatPanel

2. **Real-time Updates**
   - New message arrives via socket
   - Update UI immediately
   - Broadcast to all room players

3. **User Authentication**
   - Use token from URL query param
   - Authenticate user with backend
   - Connect to socket with auth

### Code Example
```javascript
// In Game.jsx (Soumya's component)
const [chatMessages, setChatMessages] = useState([]);
const [chatSocket, setChatSocket] = useState(null);

// Connect chat socket
useEffect(() => {
  const cs = io('http://localhost:3000', { auth: { token } });
  
  // Listen for messages
  cs.on('chat-message', (msg) => {
    setChatMessages(prev => [...prev, msg]);
  });
  
  setChatSocket(cs);
}, [token]);

// Send message
const sendMessage = (text) => {
  chatSocket.emit('chat-message', {
    email: userEmail,
    message: text,
    roomId: currentRoom.id
  });
};
```

---

## 📝 Files to Maintain

| File | What to Check |
|------|---------------|
| ChatPanel.jsx | Message display, input field |
| ChatBot.jsx | Bot responses (if needed) |
| Game.jsx | Socket setup for chat (lines 556+) |
| app.js | Chat socket handlers (check your handlers) |

---

## 🔄 Backend Chat Handlers (app.js)

You should coordinate with backend developer to ensure these exist:

```javascript
// In app.js - chat handlers
socket.on('chat-message', ({ email, message, roomId }) => {
  io.to(roomId).emit('chat-message', {
    email,
    message,
    timestamp: Date.now()
  });
});

socket.on('chat-history', ({ roomId }) => {
  // Get past messages from database
  socket.emit('chat-history', messages);
});
```

---

## ✅ Checklist for Maintenance

- [ ] Chat messages send and receive in real-time
- [ ] Messages display in correct room only
- [ ] User authentication works with socket
- [ ] Chat history loads when joining room
- [ ] UI is responsive and clean
- [ ] Message timestamps show correctly
- [ ] User emails/names display in messages

---

## 🚨 Common Issues & Fixes

**Problem**: Messages not sending
- Check socket connection status
- Verify room ID is correct
- Ensure token is valid

**Problem**: Messages show in wrong room
- Verify socket.to(roomId).emit() used correctly
- Check room ID matches on frontend

**Problem**: Chat doesn't load on join
- Request chat-history on room join
- Ensure backend sends historical messages

---

## 📚 Files to Read & Understand

1. **thegame/src/pages/Game.jsx** (lines 550-650)
   - Chat socket initialization
   - Message handling

2. **thegame/src/components/ChatPanel.jsx**
   - Chat UI logic
   - Message rendering

3. **app.js** (socket.io handlers)
   - Backend chat event handlers
   - Message broadcasting

4. **public/login.html, register.html**
   - User authentication UI

---

## 🎯 Current Status

✅ Chat socket connected
✅ Basic message sending/receiving works
⚠️ Need to verify: Message history on room join
⚠️ Need to verify: UI styling and responsiveness

---

**Last Updated**: Feb 24, 2026
**Contact**: Coordinate with backend developer (You) for socket handler fixes
