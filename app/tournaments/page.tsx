'use client';

import React, { useState, useEffect } from 'react';
import { db, Tournament, Match } from '@/lib/db';
import { generatePointsTable, TeamStats } from '@/lib/tournamentEngine';
import { ArrowLeft, Trophy, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TournamentDashboard() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [standings, setStandings] = useState<TeamStats[]>([]);
  const [newTName, setNewTName] = useState('');

  const loadTournaments = async () => {
    const t = await db.tournaments.orderBy('createdAt').reverse().toArray();
    setTournaments(t);
  };

  useEffect(() => { loadTournaments(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTName) return;
    const newT = { id: 'tour_' + Date.now(), name: newTName, createdAt: Date.now() };
    await db.tournaments.put(newT);
    setNewTName('');
    loadTournaments();
  };

  const loadStandings = async (tournament: Tournament) => {
    setActiveTournament(tournament);
    const tMatches = await db.matches.where('tournamentId').equals(tournament.id).toArray();
    const table = generatePointsTable(tMatches);
    setStandings(table);
  };

  return (
    <div className="mobile-app-container">
      <header className="app-header">
        <button className="back-btn" onClick={() => router.push('/')}><ArrowLeft size={18} /></button>
        <div className="header-title"><h2>League Headquarters</h2></div>
        <div style={{width: 34}}></div>
      </header>

      <main className="app-content mobile-scrollable">
        {!activeTournament ? (
          <>
            <form onSubmit={handleCreate} className="setup-form glass-card">
              <div className="input-group">
                <label>New Tournament Name</label>
                <input type="text" className="formal-input" placeholder="e.g., Summer Super League" value={newTName} onChange={e => setNewTName(e.target.value)} required />
              </div>
              <button type="submit" className="primary-btn"><PlusCircle size={18}/> Create League</button>
            </form>

            <div className="match-list">
              {tournaments.map(t => (
                <div key={t.id} className="match-card glass-card" onClick={() => loadStandings(t)}>
                  <div className="match-teams" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Trophy size={20} color="#8B5CF6" />
                    <h3>{t.name}</h3>
                  </div>
                  <p style={{fontSize: '0.8rem', color: '#94A3B8', marginTop: '8px'}}>Tap to view live standings & NRR</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="tab-pane">
            <button className="action-sub-btn" onClick={() => setActiveTournament(null)} style={{marginBottom: '16px'}}>
              View All Leagues
            </button>
            <div className="section-title">
              <h2>{activeTournament.name} - Points Table</h2>
            </div>
            <div className="glass-card" style={{ overflowX: 'auto', padding: '10px' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155', color: '#94A3B8' }}>
                    <th style={{ padding: '8px' }}>Team</th>
                    <th style={{ padding: '8px' }}>P</th>
                    <th style={{ padding: '8px' }}>W</th>
                    <th style={{ padding: '8px' }}>L</th>
                    <th style={{ padding: '8px', color: '#F8FAFC' }}>Pts</th>
                    <th style={{ padding: '8px' }}>NRR</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((team, idx) => (
                    <tr key={team.teamName} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>
                        <span style={{color: '#94A3B8', marginRight: '6px'}}>{idx + 1}</span> {team.teamName}
                      </td>
                      <td style={{ padding: '12px 8px' }}>{team.matchesPlayed}</td>
                      <td style={{ padding: '12px 8px', color: '#10B981' }}>{team.wins}</td>
                      <td style={{ padding: '12px 8px', color: '#EF4444' }}>{team.losses}</td>
                      <td style={{ padding: '12px 8px', color: '#F8FAFC', fontWeight: 'bold' }}>{team.points}</td>
                      <td style={{ padding: '12px 8px', color: team.nrr >= 0 ? '#10B981' : '#EF4444' }}>
                        {team.nrr > 0 ? '+' : ''}{team.nrr.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                  {standings.length === 0 && (
                    <tr><td colSpan={6} style={{padding: '20px', textAlign: 'center', color: '#94A3B8'}}>Complete a match in this league to generate standings.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}