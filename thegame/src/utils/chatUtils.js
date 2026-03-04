import { io } from 'socket.io-client';

/**
 * Initialize chat socket connection
 */
export function initializeChatSocketConnection(token) {
  const newChatSocket = io('http://localhost:3000', {
    auth: { token },
    transports: ["websocket"]
  });

  return newChatSocket;
}

/**
 * Fetch chat rooms
 */
export async function fetchChatRooms(token) {
  try {
    const response = await fetch(`/api/chat/rooms?token=${encodeURIComponent(token)}`);
    const rooms = await response.json();
    if (!Array.isArray(rooms)) return null;
    const general = rooms.find((r) => r.name === "general") || rooms[0];
    return general;
  } catch (error) {
    console.error("Error fetching chat rooms:", error);
    return null;
  }
}

/**
 * Fetch all users
 */
export async function fetchChatUsers(token) {
  try {
    const response = await fetch(`/api/chat/users?token=${encodeURIComponent(token)}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

/**
 * Fetch friends list
 */
export async function fetchChatFriends(token) {
  try {
    const response = await fetch(`/api/chat/friends?token=${encodeURIComponent(token)}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching friends:", error);
    return [];
  }
}

/**
 * Fetch pending friend requests
 */
export async function fetchPendingFriendRequests(token) {
  try {
    const response = await fetch(`/api/chat/friends/pending?token=${encodeURIComponent(token)}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    return [];
  }
}

/**
 * Fetch DM history with a user
 */
export async function fetchDmHistory(token, userEmail) {
  try {
    const response = await fetch(`/api/chat/dm/${encodeURIComponent(userEmail)}?token=${encodeURIComponent(token)}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching DM history:", error);
    return [];
  }
}

/**
 * Send friend request
 */
export async function sendFriendRequestAPI(token, email) {
  try {
    const response = await fetch(
      `/api/chat/friends/request/${encodeURIComponent(email)}?token=${encodeURIComponent(token)}`,
      { method: "POST" }
    );
    return response.ok;
  } catch (error) {
    console.error("Error sending friend request:", error);
    return false;
  }
}

/**
 * Accept friend request
 */
export async function acceptFriendRequestAPI(token, email) {
  try {
    const response = await fetch(
      `/api/chat/friends/accept/${encodeURIComponent(email)}?token=${encodeURIComponent(token)}`,
      { method: "POST" }
    );
    return response.ok;
  } catch (error) {
    console.error("Error accepting friend request:", error);
    return false;
  }
}

/**
 * Emit chat message via socket
 */
export function emitChatMessage(chatSocket, chatRoomId, token, content) {
  if (!chatSocket || !chatRoomId) return;
  chatSocket.emit("chat-message", { roomId: chatRoomId, token, content });
}

/**
 * Emit DM message via socket
 */
export function emitDmMessage(chatSocket, token, toEmail, content) {
  if (!chatSocket) return;
  chatSocket.emit("dm-message", { token, toEmail, content });
}

/**
 * Join chat room
 */
export function joinChatRoom(chatSocket, chatRoomId, token) {
  if (!chatSocket || !chatRoomId) return;
  chatSocket.emit("chat-join", { roomId: chatRoomId, token });
}

/**
 * Setup chat message listeners
 */
export function setupChatListeners(chatSocket, onChatHistory, onChatMessage) {
  if (!chatSocket) return () => {};

  const handleHistory = (messages) => {
    if (Array.isArray(messages)) {
      onChatHistory(messages);
    }
  };

  const handleMessage = (message) => {
    onChatMessage(message);
  };

  chatSocket.on("chat-history", handleHistory);
  chatSocket.on("chat-message", handleMessage);

  return () => {
    chatSocket.off("chat-history", handleHistory);
    chatSocket.off("chat-message", handleMessage);
  };
}

/**
 * Setup DM listeners
 */
export function setupDmListener(chatSocket, onDmMessage) {
  if (!chatSocket) return () => {};

  const handleDm = (dm) => {
    onDmMessage(dm);
  };

  chatSocket.on("dm-message", handleDm);

  return () => {
    chatSocket.off("dm-message", handleDm);
  };
}
