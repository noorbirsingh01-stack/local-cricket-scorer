"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { Home, PlusCircle, ChevronRight, Trash2, Shield } from 'lucide-react';

export default function HomeDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'setup'>('dashboard');
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [totalOvers, setTotalOvers] = useState(10);
  const [wicketsLimit, setWicketsLimit] = useState(10);
  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');
  const [bowler, setBowler] = useState('');
  const router = useRouter();

  const allMatches = useLiveQuery(() => db.matches.reverse().sortBy('id'));

  const startMatch = async () => {
    if (!teamA || !teamB || !striker || !nonStriker || !bowler || !totalOvers || !wicketsLimit) {
      return alert("Please fill out all configuration fields to start the match.");
    }

    const matchId = await db.matches.add({
      teamA,
      teamB,
      totalOvers: Number(totalOvers),
      wicketsLimit: Number(wicketsLimit),
      status: 'in_progress',
      innings: 1,
      target: null,
      currentStriker: striker,
      currentNonStriker: nonStriker,
      currentBowler: bowler,
      isWaitingForNewBatter: false,
      isWaitingForNewBowler: false,
      isWaitingForInningsBreak: false
    });

    router.push(`/match/${matchId}`);
  };

  const deleteMatch = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to permanently delete this match and its data?")) {
      await db.matches.delete(id);
      await db.balls.where('matchId').equals(id).delete();
    }
  };

  return (
    <div className="stadium-background">
      <div className="app-shell glass-overlay">
        
        <div className="app-header">
          <div className="header-brand">
            <Shield size={24} className="brand-icon" />
            <div className="brand-text">
              <span className="brand-title">Gully Cricket Pro</span>
              <span className="brand-subtitle">Match Operations</span>
            </div>
          </div>
        </div>

        <div className="scroll-content">
          {activeTab === 'dashboard' && (
            <div className="dashboard-container animate-fade-in">
              <h2 className="formal-heading">Recent Matches</h2>
              
              <div className="matches-list">
                {!allMatches || allMatches.length === 0 ? (
                  <div className="empty-state">
                    <p>No matches found in your history.</p>
                    <p className="sub-text">Tap '+' to configure a new match.</p>
                  </div>
                ) : (
                  allMatches.map((match) => (
                    <div key={match.id} className="match-card glass-panel" onClick={() => router.push(`/match/${match.id}`)}>
                      <div className="card-top">
                        <span className={`status-badge ${match.status}`}>
                          {match.status === 'completed' ? 'Completed' : 'In Progress'}
                        </span>
                        <div className="card-actions">
                          <span className="overs-info">{match.totalOvers} Overs</span>
                          <button className="icon-btn delete-btn" onClick={(e) => deleteMatch(e, match.id!)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="card-teams">
                        <div className="team-name">{match.teamA}</div>
                        <div className="vs-text">vs</div>
                        <div className="team-name">{match.teamB}</div>
                      </div>
                      
                      <div className="card-bottom">
                        <span className="enter-link">View Match <ChevronRight size={14} /></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'setup' && (
            <div className="setup-container animate-fade-in">
              <div className="glass-panel form-panel">
                <h2 className="formal-heading">Configure New Match</h2>
                
                <div className="input-group">
                  <label>Team 1 (Batting First)</label>
                  <input type="text" className="formal-input" placeholder="Enter team name" value={teamA} onChange={(e) => setTeamA(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Team 2 (Bowling First)</label>
                  <input type="text" className="formal-input" placeholder="Enter team name" value={teamB} onChange={(e) => setTeamB(e.target.value)} />
                </div>

                <div className="input-row">
                  <div className="input-group">
                    <label>Match Overs</label>
                    <input type="number" className="formal-input" min="1" max="50" value={totalOvers} onChange={(e) => setTotalOvers(Number(e.target.value))} />
                  </div>
                  <div className="input-group">
                    <label>Wickets Limit</label>
                    <input type="number" className="formal-input" min="1" max="11" value={wicketsLimit} onChange={(e) => setWicketsLimit(Number(e.target.value))} />
                  </div>
                </div>

                <div className="input-row">
                  <div className="input-group">
                    <label>Opening Striker</label>
                    <input type="text" className="formal-input" placeholder="Batter 1" value={striker} onChange={(e) => setStriker(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Non-Striker</label>
                    <input type="text" className="formal-input" placeholder="Batter 2" value={nonStriker} onChange={(e) => setNonStriker(e.target.value)} />
                  </div>
                </div>

                <div className="input-group">
                  <label>Opening Bowler</label>
                  <input type="text" className="formal-input" placeholder="Bowler Name" value={bowler} onChange={(e) => setBowler(e.target.value)} />
                </div>

                <button className="btn-solid" onClick={startMatch}>Start Scoring</button>
              </div>
            </div>
          )}
        </div>

        <div className="bottom-nav-bar">
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <Home size={20} />
            <span>Home</span>
          </button>
          <button className={`nav-item ${activeTab === 'setup' ? 'active' : ''}`} onClick={() => setActiveTab('setup')}>
            <PlusCircle size={20} />
            <span>New Match</span>
          </button>
        </div>
      </div>
    </div>
  );
}