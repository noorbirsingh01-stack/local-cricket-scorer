'use client';

import React, { useState, useEffect } from 'react';
import { db, Match, Tournament } from '@/lib/db';
import { useRouter } from 'next/navigation';
import { PlusCircle, Trash2, Play, Trophy, Activity, Download } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTab, setActiveTab] = useState<'matches' | 'new'>('matches');

  // Setup Form State
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [totalOvers, setTotalOvers] = useState(5);
  const [totalWickets, setTotalWickets] = useState(10);
  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');
  const [bowler, setBowler] = useState('');
  const [selectedTournament, setSelectedTournament] = useState(''); // Links match to league

  const loadData = async () => {
    const allMatches = await db.matches.orderBy('createdAt').reverse().toArray();
    setMatches(allMatches);
    
    // Load tournaments for the dropdown selector
    const allTournaments = await db.tournaments.orderBy('createdAt').reverse().toArray();
    setTournaments(allTournaments);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamA || !teamB || !striker || !nonStriker || !bowler) {
      alert('Please fill in all required fields!');
      return;
    }

    const matchId = 'match_' + Date.now();
    const newMatch: Match = {
      id: matchId,
      tournamentId: selectedTournament || undefined, // Link to league if selected
      teamA,
      teamB,
      totalOvers: Number(totalOvers),
      totalWickets: Number(totalWickets),
      currentInning: 1,
      battingTeam: teamA,
      bowlingTeam: teamB,
      inning1Score: 0,
      inning1Wickets: 0,
      inning1Overs: 0,
      inning1Balls: 0,
      inning2Score: 0,
      inning2Wickets: 0,
      inning2Overs: 0,
      inning2Balls: 0,
      striker,
      nonStriker,
      bowler,
      isCompleted: false,
      isWaitingForNewBatter: false,
      isWaitingForNewBowler: false,
      isInningsBreak: false,
      createdAt: Date.now(),
    };

    await db.matches.put(newMatch);
    router.push(`/match/${matchId}`);
  };

  const handleDeleteMatch = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this match?')) {
      await db.matches.delete(id);
      await db.balls.where('matchId').equals(id).delete();
      loadData();
    }
  };

  const downloadReport = (match: Match, e: React.MouseEvent) => {
    e.stopPropagation();
    const reportText = `
=== GULLY CRICKET PRO: MATCH REPORT ===
${match.teamA} vs ${match.teamB}
Result: ${match.resultSummary || "Match Concluded"}
---------------------------------------
Innings 1 (${match.teamA}): ${match.inning1Score} / ${match.inning1Wickets} (${match.inning1Overs}.${match.inning1Balls} overs)
Innings 2 (${match.teamB}): ${match.inning2Score} / ${match.inning2Wickets} (${match.inning2Overs}.${match.inning2Balls} overs)
=======================================
    `.trim();

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${match.teamA}-vs-${match.teamB}-report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mobile-app-container">
      <header className="app-header">
        <div className="logo-area">
          <div className="logo-icon">🏏</div>
          <div>
            <h1>Gully Cricket Pro</h1>
            <p>Broadcast Command Center</p>
          </div>
        </div>
      </header>

      <main className="app-content">
        {activeTab === 'matches' ? (
          <div className="tab-pane">
            <button 
              className="primary-btn pulse-btn" 
              style={{ marginBottom: '20px', background: '#10B981', boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)' }}
              onClick={() => router.push('/tournaments')}
            >
              <Trophy size={18} /> League Headquarters & Standings
            </button>

            <div className="section-title">
              <h2>Recent Matches</h2>
              <span className="badge">{matches.length} Total</span>
            </div>

            {matches.length === 0 ? (
              <div className="empty-state">
                <Trophy size={48} className="empty-icon" />
                <h3>No Matches Recorded</h3>
                <p>Start a new match to begin professional scoring.</p>
                <button className="primary-btn" onClick={() => setActiveTab('new')} style={{ marginTop: '16px' }}>
                  Create Match Now
                </button>
              </div>
            ) : (
              <div className="match-list">
                {matches.map((m) => (
                  <div 
                    key={m.id} 
                    className="match-card glass-card"
                    onClick={() => router.push(`/match/${m.id}`)}
                  >
                    <div className="match-card-header">
                      <span className={`status-badge ${m.isCompleted ? 'completed' : 'live'}`}>
                        {m.isCompleted ? 'Completed' : 'LIVE'}
                      </span>
                      <button 
                        className="delete-btn" 
                        onClick={(e) => handleDeleteMatch(m.id, e)}
                        title="Delete Match"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="match-teams">
                      <h3>{m.teamA} vs {m.teamB}</h3>
                    </div>

                    <div className="match-score-summary">
                      {m.currentInning === 1 && !m.isInningsBreak ? (
                        <p>{m.battingTeam}: <strong>{m.inning1Score}/{m.inning1Wickets}</strong> ({m.inning1Overs}.{m.inning1Balls} / {m.totalOvers} ov)</p>
                      ) : m.isInningsBreak ? (
                        <p>Innings Break. Target: <strong>{m.target}</strong></p>
                      ) : (
                        <p>{m.battingTeam}: <strong>{m.inning2Score}/{m.inning2Wickets}</strong> ({m.inning2Overs}.{m.inning2Balls} / {m.totalOvers} ov)</p>
                      )}
                      {m.resultSummary && <p className="match-result">{m.resultSummary}</p>}
                    </div>

                    {/* Download Report Button (Only visible if match is completed) */}
                    {m.isCompleted && (
                      <button 
                        onClick={(e) => downloadReport(m, e)}
                        style={{ 
                          marginTop: '12px', width: '100%', padding: '10px', 
                          background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', 
                          border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', 
                          fontWeight: 600, display: 'flex', justifyContent: 'center', 
                          alignItems: 'center', gap: '8px', cursor: 'pointer' 
                        }}
                      >
                        <Download size={16} /> Download Match Report
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="tab-pane">
            <div className="section-title">
              <h2>New Match Setup</h2>
              <p>Configure teams and opening players</p>
            </div>

            <form onSubmit={handleCreateMatch} className="setup-form glass-card">
              
              {/* Optional Tournament Linker */}
              {tournaments.length > 0 && (
                <div className="input-group" style={{ marginBottom: '12px' }}>
                  <label>Link to League / Tournament (Optional)</label>
                  <select 
                    className="formal-input" 
                    value={selectedTournament} 
                    onChange={(e) => setSelectedTournament(e.target.value)}
                    style={{ appearance: 'none' }}
                  >
                    <option value="">-- Friendly Match (No Tournament) --</option>
                    {tournaments.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="input-row">
                <div className="input-group">
                  <label>Team A (Batting First)</label>
                  <input type="text" className="formal-input" placeholder="e.g. Royal XI" value={teamA} onChange={(e) => setTeamA(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Team B (Bowling First)</label>
                  <input type="text" className="formal-input" placeholder="e.g. Super Kings" value={teamB} onChange={(e) => setTeamB(e.target.value)} required />
                </div>
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label>Total Overs per Innings</label>
                  <input type="number" className="formal-input" min="1" max="50" value={totalOvers} onChange={(e) => setTotalOvers(Number(e.target.value))} required />
                </div>
                <div className="input-group">
                  <label>Wickets Limit</label>
                  <input type="number" className="formal-input" min="1" max="10" value={totalWickets} onChange={(e) => setTotalWickets(Number(e.target.value))} required />
                </div>
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label>Opening Striker</label>
                  <input type="text" className="formal-input" placeholder="Batter 1 Name" value={striker} onChange={(e) => setStriker(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Opening Non-Striker</label>
                  <input type="text" className="formal-input" placeholder="Batter 2 Name" value={nonStriker} onChange={(e) => setNonStriker(e.target.value)} required />
                </div>
              </div>

              <div className="input-group">
                <label>Opening Bowler</label>
                <input type="text" className="formal-input" placeholder="Bowler Name" value={bowler} onChange={(e) => setBowler(e.target.value)} required />
              </div>

              <button type="submit" className="primary-btn pulse-btn" style={{ marginTop: '8px' }}>
                <Play size={18} /> Launch Broadcast Match
              </button>
            </form>
          </div>
        )}
      </main>

      <nav className="bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          <Activity size={20} />
          <span>Matches</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => setActiveTab('new')}
        >
          <PlusCircle size={20} />
          <span>New Match</span>
        </button>
      </nav>
    </div>
  );
}