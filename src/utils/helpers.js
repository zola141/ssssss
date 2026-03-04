export const checkAndUnlockAchievements = (user, trigger) => {
  const achievementsList = [
    { id: 'first-win', name: 'First Win!', icon: '🎉', condition: () => trigger === 'win' && user.wins === 1 },
    { id: 'ten-wins', name: 'Victorious', icon: '⚔️', condition: () => user.wins >= 10 },
    { id: 'hundred-wins', name: 'Champion', icon: '👑', condition: () => user.wins >= 100 },
    { id: 'draw-king', name: 'Balanced', icon: '⚖️', condition: () => user.draws >= 5 },
    { id: 'matches-10', name: 'Veteran', icon: '🛡️', condition: () => user.matches >= 10 },
    { id: 'matches-50', name: 'Legend', icon: '🏆', condition: () => user.matches >= 50 },
    { id: 'win-rate-80', name: 'Dominator', icon: '🚀', condition: () => user.matches >= 10 && (user.wins / user.matches) >= 0.8 }
  ];

  achievementsList.forEach(ach => {
    const hasAchievement = user.achievements.some(a => a.id === ach.id);
    if (!hasAchievement && ach.condition()) {
      user.achievements.push({
        id: ach.id,
        name: ach.name,
        description: `Unlocked: ${ach.name}`,
        icon: ach.icon,
        unlockedAt: new Date()
      });
    }
  });
};

export const markUserOnline = (onlineUsers, email) => {
  if (!email) return;
  onlineUsers.set(email, (onlineUsers.get(email) || 0) + 1);
};

export const markUserOffline = (onlineUsers, email) => {
  if (!email) return;
  const current = onlineUsers.get(email) || 0;
  if (current <= 1) {
    onlineUsers.delete(email);
  } else {
    onlineUsers.set(email, current - 1);
  }
};

export const isUserOnline = (onlineUsers, email) => (onlineUsers.get(email) || 0) > 0;
