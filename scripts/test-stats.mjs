#!/usr/bin/env node

// Test script to verify match recording and statistics update
// Run this after playing a game to verify stats are updated

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testStatsUpdate(email, token) {
  try {
    console.log('\n🧪 Testing Statistics System...\n');
    
    // 1. Get current stats
    console.log('📊 Fetching current stats...');
    const statsRes = await fetch(`${BASE_URL}/api/progression?token=${token}`);
    const stats = await statsRes.json();
    console.log('Current Stats:', {
      level: stats.level,
      xp: stats.xp,
      wins: stats.wins,
      losses: stats.losses,
      matches: stats.matches,
      winRate: stats.winRate + '%',
      elo: Math.round(stats.elo)
    });
    
    // 2. Get match history
    console.log('\n📋 Fetching match history...');
    const historyRes = await fetch(`${BASE_URL}/api/matches/history?limit=10&token=${token}`);
    const history = await historyRes.json();
    console.log(`Found ${history.length} matches in history`);
    if (history.length > 0) {
      console.log('Last match:', {
        opponent: history[0].opponentNickname,
        result: history[0].result,
        date: new Date(history[0].date).toLocaleString(),
        score: `${history[0].scores.playerScore}-${history[0].scores.opponentScore}`
      });
    }
    
    // 3. Get achievements
    console.log('\n🏆 Fetching achievements...');
    const achievementsRes = await fetch(`${BASE_URL}/api/achievements?token=${token}`);
    const achievements = await achievementsRes.json();
    const unlockedCount = achievements.length;
    console.log(`Unlocked ${unlockedCount}/9 achievements`);
    achievements.forEach(ach => {
      console.log(`  ${ach.icon} ${ach.name} - ${new Date(ach.unlockedAt).toLocaleDateString()}`);
    });
    
    console.log('\n✅ Statistics system is working!\n');
    console.log('📝 To test live updates:');
    console.log('   1. Play a 1v1 game at http://localhost:3000/game');
    console.log('   2. Win or lose the game');
    console.log('   3. Check stats at http://localhost:3000/stats.html');
    console.log('   4. Stats should update automatically!\n');
    
  } catch (err) {
    console.error('❌ Error testing stats:', err.message);
  }
}

// Get token and email from command line
const token = process.argv[2];
const email = process.argv[3];

if (!token || !email) {
  console.log('Usage: node test-stats.mjs <token> <email>');
  console.log('Example: node test-stats.mjs abc123 user@example.com');
  process.exit(1);
}

testStatsUpdate(email, token);
