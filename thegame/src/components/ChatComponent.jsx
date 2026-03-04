import React, { useState, useEffect } from 'react';

export function ChatComponent({
  multiplayer,
  chatSocket,
  chatRoomId,
  chatMessages,
  chatInput,
  setChatInput,
  chatView,
  setChatView,
  chatUsers,
  chatFriends,
  chatPending,
  dmTarget,
  setDmTarget,
  dmMessages,
  dmInput,
  setDmInput,
  sendChatMessage,
  sendDmMessage,
  sendFriendRequest,
  acceptFriendRequest,
  loadDmHistory
}) {
  // Only show chat panel in multiplayer mode
  if (!multiplayer) {
    return null;
  }

  return (
    <div className="chat-panel">
      <div className="chat-header">Room Chat</div>
      <div className="chat-tabs">
        <button className={chatView === "general" ? "active" : ""} onClick={() => setChatView("general")}>General</button>
        <button className={chatView === "friends" ? "active" : ""} onClick={() => setChatView("friends")}>Friends</button>
        <button className={chatView === "dm" ? "active" : ""} onClick={() => setChatView("dm")}>DM</button>
      </div>

      {chatView === "general" && (
        <>
          <div className="chat-messages">
            {chatMessages.length === 0 && (
              <div className="chat-empty">No messages yet</div>
            )}
            {chatMessages.map((msg) => (
              <div key={msg._id || `${msg.senderEmail}-${msg.createdAt}`} className="chat-message">
                <img
                  src={msg.senderAvatar}
                  alt={msg.senderNickname}
                />
                <div>
                  <div className="chat-name">{msg.senderNickname}</div>
                  <div className="chat-text">{msg.content}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
            />
            <button onClick={sendChatMessage}>Send</button>
          </div>
        </>
      )}

      {chatView === "friends" && (
        <div className="chat-friends">
          {chatPending.length > 0 && (
            <div className="chat-section">
              <div className="chat-section-title">Friend Requests</div>
              {chatPending.map((u) => (
                <div key={u.email} className="chat-user">
                  <img src={u.profileImageUrl || "/default-avatar.svg"} alt={u.nickname} />
                  <span>{u.nickname}</span>
                  <button onClick={() => acceptFriendRequest(u.email)}>Accept</button>
                </div>
              ))}
            </div>
          )}
          {chatFriends.length > 0 && (
            <div className="chat-section">
              <div className="chat-section-title">Friends</div>
              {chatFriends.map((u) => (
                <div key={u.email} className="chat-user">
                  <img src={u.profileImageUrl || "/default-avatar.svg"} alt={u.nickname} />
                  <span>{u.nickname}</span>
                  <span className={`friend-status ${u.isOnline ? "online" : "offline"}`}>
                    {u.isOnline ? "● Online" : "○ Offline"}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="chat-section">
            <div className="chat-section-title">All Users</div>
            {chatUsers.map((u) => {
              const isFriend = chatFriends.some(f => f.email === u.email);
              const hasPendingRequest = chatPending.some(p => p.email === u.email);
              if (isFriend) return null;
              return (
                <div key={u.email} className="chat-user">
                  <img src={u.profileImageUrl || "/default-avatar.svg"} alt={u.nickname} />
                  <span>{u.nickname}</span>
                  <button 
                    onClick={() => sendFriendRequest(u.email)}
                    disabled={hasPendingRequest}
                  >
                    {hasPendingRequest ? "Pending" : "Add"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {chatView === "dm" && (
        <div className="chat-dm">
          <div className="chat-dm-users">
            {chatFriends.map((u) => (
              <button key={u.email} className={dmTarget?.email === u.email ? "active" : ""} onClick={() => loadDmHistory(u)}>
                {u.nickname}
              </button>
            ))}
          </div>
          <div className="chat-messages">
            {dmMessages.length === 0 && (
              <div className="chat-empty">Select a friend to chat</div>
            )}
            {dmMessages.map((msg) => (
              <div key={msg._id || `${msg.senderEmail}-${msg.createdAt}`} className="chat-message">
                <img
                  src={msg.senderAvatar || "https://via.placeholder.com/28"}
                  alt={msg.senderNickname || msg.senderEmail}
                />
                <div>
                  <div className="chat-name">{msg.senderNickname || msg.senderEmail}</div>
                  <div className="chat-text">{msg.content}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              value={dmInput}
              onChange={(e) => setDmInput(e.target.value)}
              placeholder="Message..."
              onKeyDown={(e) => e.key === "Enter" && sendDmMessage()}
              disabled={!dmTarget}
            />
            <button onClick={sendDmMessage} disabled={!dmTarget}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
