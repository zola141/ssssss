import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { analyticsAPI } from '../utils/api';
import { socket } from '../utils/socket';
import { format, subDays } from 'date-fns';
import '../styles/Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface PlayerStats {
  user_id: string;
  username: string;
  total_wins: number;
  total_losses: number;
}

interface FilterOptions {
  startDate: Date;
  endDate: Date;
  userId?: string;
}

interface PlayerProfile {
  userId?: string;
  name: string;
  nickname: string;
  email: string;
  age: string;
  gender: string;
  country: string;
  wins: number;
  losses: number;
  draws: number;
  matches: number;
  elo: number;
}

export const AnalyticsDashboard: React.FC = () => {
  const [filters, setFilters] = useState<FilterOptions>({
    startDate: subDays(new Date(), 7),
    endDate: new Date(),
  });

  const [allPlayers, setAllPlayers] = useState<PlayerStats[]>([]);
  const [matchData, setMatchData] = useState<any>(null);
  const [activityData, setActivityData] = useState<any>(null);
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  const isFetchingRef = useRef(false);
  const lastFetchAtRef = useRef(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId') || '';
    const email = params.get('email') || '';
    const nickname = params.get('nickname') || '';
    const wins = Number(params.get('wins') || 0);
    const losses = Number(params.get('losses') || 0);
    const draws = Number(params.get('draws') || 0);
    const matches = Number(params.get('matches') || (wins + losses + draws));
    const eloFromParams = Number(params.get('elo') || 0);
    const calculatedElo = Math.max(100, 1000 + (wins * 30) - (losses * 15));

    const profile: PlayerProfile = {
      userId: userId || undefined,
      name: params.get('name') || nickname || 'Player',
      nickname: nickname || 'N/A',
      email: email || 'N/A',
      age: params.get('age') || 'N/A',
      gender: params.get('gender') || 'N/A',
      country: params.get('country') || 'N/A',
      wins,
      losses,
      draws,
      matches,
      elo: eloFromParams > 0 ? eloFromParams : calculatedElo,
    };

    const hasDirectProfile = (
      nickname.length > 0 ||
      email.length > 0 ||
      wins > 0 ||
      losses > 0 ||
      draws > 0 ||
      matches > 0
    );

    if (hasDirectProfile) {
      setPlayerProfile(profile);
      return;
    }

    const localProfileRaw = window.localStorage.getItem('playerProfileData');
    if (localProfileRaw) {
      try {
        const localProfile = JSON.parse(localProfileRaw) as PlayerProfile;
        if (localProfile?.nickname || localProfile?.email) {
          setPlayerProfile(localProfile);
          return;
        }
      } catch (_error) {
      }
    }

    const resolveFromApi = async () => {
      try {
        if (email) {
          const userRes = await fetch(`/api/users/me?email=${encodeURIComponent(email)}`);
          if (userRes.ok) {
            const user = await userRes.json();
            const userWins = Number(user.wins || 0);
            const userLosses = Number(user.losses || 0);
            const userDraws = Number(user.draws || 0);
            const userMatches = Number(user.matches || (userWins + userLosses + userDraws));
            const userElo = Math.max(100, 1000 + (userWins * 30) - (userLosses * 15));

            setPlayerProfile({
              userId: String(user.id || ''),
              name: user.name || user.nickname || 'Player',
              nickname: user.nickname || 'N/A',
              email: user.email || email,
              age: String(user.age || 'N/A'),
              gender: user.gender || 'N/A',
              country: user.country || 'N/A',
              wins: userWins,
              losses: userLosses,
              draws: userDraws,
              matches: userMatches,
              elo: userElo,
            });
          }
        }

        if (userId) {
          const statsRes = await analyticsAPI.getStats(userId);
          const rows: PlayerStats[] = statsRes?.data || [];
          if (rows.length > 0) {
            const row = rows[0];
            const rowWins = Number(row.total_wins || 0);
            const rowLosses = Number(row.total_losses || 0);
            const rowMatches = rowWins + rowLosses;
            const rowElo = Math.max(100, 1000 + (rowWins * 30) - (rowLosses * 15));

            setPlayerProfile({
              userId,
              name: row.username || 'Player',
              nickname: row.username || 'N/A',
              email: 'N/A',
              age: 'N/A',
              gender: 'N/A',
              country: 'N/A',
              wins: rowWins,
              losses: rowLosses,
              draws: 0,
              matches: rowMatches,
              elo: rowElo,
            });
          }
        }
      } catch (error) {
        console.error('Error resolving player profile:', error);
      }
    };

    resolveFromApi();
  }, []);

  const fetchDashboardData = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force) {
      if (isFetchingRef.current) return;
      if (now - lastFetchAtRef.current < 1000) return;
    }

    isFetchingRef.current = true;
    lastFetchAtRef.current = now;
    setLoading(true);
    try {
      let statsArray: PlayerStats[] = [];

      try {
        const merged = await analyticsAPI.getMergedStats();
        if (Array.isArray(merged.data)) {
          statsArray = merged.data as PlayerStats[];
        } else if (Array.isArray(merged.data?.stats)) {
          statsArray = merged.data.stats as PlayerStats[];
        } else if (Array.isArray(merged.data?.data?.stats)) {
          statsArray = merged.data.data.stats as PlayerStats[];
        }
      } catch (_mergedError) {
      }

      if (statsArray.length === 0) {
        try {
          const statsRes = await analyticsAPI.getStats();
          if (Array.isArray(statsRes.data)) {
            statsArray = statsRes.data as PlayerStats[];
          } else if (Array.isArray(statsRes.data?.stats)) {
            statsArray = statsRes.data.stats as PlayerStats[];
          }
        } catch (_statsError) {
        }
      }

      setAllPlayers(statsArray);

      const totalWins = statsArray.reduce((sum: number, p: PlayerStats) => sum + (p.total_wins || 0), 0);
      const totalLosses = statsArray.reduce((sum: number, p: PlayerStats) => sum + (p.total_losses || 0), 0);

      const hasDistributionData = totalWins > 0 || totalLosses > 0;
      setStatsData(
        hasDistributionData
          ? {
              labels: ['Wins', 'Losses'],
              datasets: [
                {
                  data: [totalWins, totalLosses],
                  backgroundColor: [
                    'rgba(16, 185, 129, 0.6)',
                    'rgba(239, 68, 68, 0.6)',
                  ],
                  borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(239, 68, 68, 1)',
                  ],
                  borderWidth: 1,
                },
              ],
            }
          : {
              labels: ['No Data Yet'],
              datasets: [
                {
                  data: [1],
                  backgroundColor: ['rgba(148, 163, 184, 0.35)'],
                  borderColor: ['rgba(148, 163, 184, 0.7)'],
                  borderWidth: 1,
                },
              ],
            }
      );

      // Build chart from total games per player
      const sortedByMatches = [...statsArray]
        .sort((a, b) => ((b.total_wins + b.total_losses) - (a.total_wins + a.total_losses)))
        .slice(0, 8);

      setMatchData({
        labels: sortedByMatches.length > 0 ? sortedByMatches.map((p) => p.username) : ['No data'],
        datasets: [
          {
            label: 'Matches per Player',
            data: sortedByMatches.length > 0
              ? sortedByMatches.map((p) => (p.total_wins || 0) + (p.total_losses || 0))
              : [0],
            backgroundColor: 'rgba(139, 92, 246, 0.6)',
            borderColor: 'rgba(139, 92, 246, 1)',
            borderWidth: 1,
          },
        ],
      });

      // Build activity-like trend using total matches distribution
      const sortedByMatchesTrend = [...statsArray]
        .sort((a, b) => ((b.total_wins + b.total_losses) - (a.total_wins + a.total_losses)))
        .slice(0, 8);

      setActivityData({
        labels: sortedByMatchesTrend.length > 0 ? sortedByMatchesTrend.map((p) => p.username) : ['No data'],
        datasets: [
          {
            label: 'Matches by Player',
            data: sortedByMatchesTrend.length > 0
              ? sortedByMatchesTrend.map((p) => (p.total_wins || 0) + (p.total_losses || 0))
              : [0],
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            tension: 0.4,
          },
        ],
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, []);

  const syncFromMainBackend = async () => {
    setSyncing(true);
    try {
      await analyticsAPI.syncMergedStats();
      await fetchDashboardData(true);
    } catch (error) {
      console.error('Error syncing merged stats JSON:', error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);

    // Listen for real-time updates
    const handleUpdate = () => {
      fetchDashboardData();
    };

    socket.on('dashboard-update', handleUpdate);

    return () => {
      socket.off('dashboard-update', handleUpdate);
    };
  }, [fetchDashboardData]);

  const handleDateChange = (key: keyof FilterOptions, value: Date) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleExport = (exportFormat: 'pdf' | 'csv') => {
    analyticsAPI.exportData(exportFormat).then((response: any) => {
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics_export.${exportFormat === 'pdf' ? 'json' : exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const getShortId = (id: string) => id ? id.substring(0, 8) : '—';

  const cartesianChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    resizeDelay: 200,
    animation: {
      duration: 0,
    },
  }), []);

  const pieChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    resizeDelay: 200,
    animation: {
      duration: 0,
    },
  }), []);

  return (
    <div className="analytics-dashboard">
      <h1>Analytics Dashboard</h1>

      {loading ? (
        <div className="loading">Loading data...</div>
      ) : (
        <>
          {playerProfile && (
            <div className="player-stats-section" style={{ marginBottom: 16 }}>
              <h2>Player Profile</h2>
              <div className="players-table-wrapper" style={{ padding: 12 }}>
                <table className="players-table">
                  <tbody>
                    <tr>
                      <td><strong>Name</strong></td>
                      <td>{playerProfile.name}</td>
                      <td><strong>Nickname</strong></td>
                      <td>{playerProfile.nickname}</td>
                      <td><strong>Email</strong></td>
                      <td>{playerProfile.email}</td>
                    </tr>
                    <tr>
                      <td><strong>Age</strong></td>
                      <td>{playerProfile.age}</td>
                      <td><strong>Gender</strong></td>
                      <td>{playerProfile.gender}</td>
                      <td><strong>Country</strong></td>
                      <td>{playerProfile.country}</td>
                    </tr>
                    <tr>
                      <td><strong>Wins</strong></td>
                      <td>{playerProfile.wins}</td>
                      <td><strong>Losses</strong></td>
                      <td>{playerProfile.losses}</td>
                      <td><strong>Draws</strong></td>
                      <td>{playerProfile.draws}</td>
                    </tr>
                    <tr>
                      <td><strong>Matches</strong></td>
                      <td>{playerProfile.matches}</td>
                      <td><strong>ELO</strong></td>
                      <td>{playerProfile.elo}</td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* All Players Stats Section */}
          {allPlayers.length > 0 && (
            <div className="player-stats-section">
              <h2>Player Standings ({allPlayers.length} players)</h2>
              <div className="players-table-wrapper players-table-scroll">
                <table className="players-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Player</th>
                      <th>Wins</th>
                      <th>Losses</th>
                      <th>Matches</th>
                      <th>Win Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPlayers
                      .slice()
                      .sort((a, b) => b.total_wins - a.total_wins)
                      .map((player, index) => {
                        const total = (player.total_wins || 0) + (player.total_losses || 0);
                        const winRate = total > 0 ? Math.round((player.total_wins / total) * 100) : 0;
                        return (
                          <tr key={player.user_id} className={index === 0 ? 'top-player' : ''}>
                            <td>{index + 1}</td>
                            <td className="player-id">{player.username || getShortId(player.user_id)}</td>
                            <td className="wins">{player.total_wins || 0}</td>
                            <td className="losses">{player.total_losses || 0}</td>
                            <td>{total}</td>
                            <td>{winRate}%</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="filters">
            <div className="filter-group">
              <label>Start Date:</label>
              <input
                type="date"
                value={format(filters.startDate, 'yyyy-MM-dd')}
                onChange={(e) =>
                  handleDateChange('startDate', new Date(e.target.value))
                }
              />
            </div>

            <div className="filter-group">
              <label>End Date:</label>
              <input
                type="date"
                value={format(filters.endDate, 'yyyy-MM-dd')}
                onChange={(e) => handleDateChange('endDate', new Date(e.target.value))}
              />
            </div>

            <div className="export-buttons">
              <button onClick={syncFromMainBackend} disabled={syncing}>
                {syncing ? 'Syncing...' : 'Sync JSON from Main Backend'}
              </button>
              <button onClick={() => handleExport('pdf')}>Export JSON</button>
              <button onClick={() => handleExport('csv')}>Export CSV</button>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-container">
              <h3>Matches per Day</h3>
              {matchData && <Bar data={matchData} height={220} options={cartesianChartOptions} />}
            </div>

            <div className="chart-container">
              <h3>User Activity Trends</h3>
              {activityData && (
                <Line data={activityData} height={220} options={cartesianChartOptions} />
              )}
            </div>

            <div className="chart-container">
              <h3>Overall Win/Loss Distribution</h3>
              {statsData && <Pie data={statsData} height={220} options={pieChartOptions} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
