'use client';

import React, { useState, useEffect, use } from 'react';
import { db, Match, BallEvent } from '@/lib/db';
import { useRouter } from 'next/navigation';
import WormChart from '@/components/WormChart';
import LiveCommentary from '@/components/LiveCommentary';
import { ArrowLeft, RotateCcw, Shield, Activity, BarChart2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MatchCommandCenter({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [match, setMatch] = useState<Match | null>(null);
  const [balls, setBalls] = useState<BallEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'scorer' | 'scorecard' | 'feed'>('scorer');
  const [commentaries, setCommentaries] = useState<Array<{ id: string; text: string; timestamp: string }>>([]);

  const [newBatterName, setNewBatterName] = useState('');
  const [newBowlerName, setNewBowlerName] = useState('');

  const loadMatchData = async () => {
    const m = await db.matches.get(id);
    if (m) {
      setMatch(m);
      const b = await db.balls.where('matchId').equals(id).toArray();
      setBalls(b);
    }
  };

  useEffect(() => {
    loadMatchData();
  }, [id]);

  if (!match) {
    return <div className="loading-screen">Loading Match Command Center...</div>;
  }

  const isInn1 = match.currentInning === 1;
  const currentScore = isInn1 ? match.inning1Score : match.inning2Score;
  const currentWickets = isInn1 ? match.inning1Wickets : match.inning2Wickets;
  const currentOvers = isInn1 ? match.inning1Overs : match.inning2Overs;
  const currentBalls = isInn1 ? match.inning1Balls : match.inning2Balls;

  const recordBall = async (batsmanRuns: number, extrasRuns: number, extraType: BallEvent['extraType'], isWicket: boolean) => {
    if (match.isCompleted || match.isWaitingForNewBatter || match.isWaitingForNewBowler || match.isInningsBreak) return;

    let legalBall = extraType !== 'wide' && extraType !== 'noball';
    let nextBalls = currentBalls + (legalBall ? 1 : 0);
    let nextOvers = currentOvers;
    let overCompleted = false;

    if (nextBalls >= 6) {
      nextOvers += 1;
      nextBalls = 0;
      overCompleted = true;
    }

    const totalBallRuns = batsmanRuns + extrasRuns;
    const nextScore = currentScore + totalBallRuns;
    const nextWickets = currentWickets + (isWicket ? 1 : 0);

    const inningsEnded = nextWickets >= match.totalWickets || nextOvers >= match.totalOvers;

    let matchWon = false;
    let resultText = '';
    if (!isInn1 && match.target && nextScore >= match.target) {
      matchWon = true;
      resultText = `${match.battingTeam} won by ${match.totalWickets - nextWickets} wickets`;
    } else if (inningsEnded && isInn1) {
      // Innings 1 Concluded
    } else if (inningsEnded && !isInn1) {
      if (nextScore > (match.target! - 1)) {
        resultText = `${match.battingTeam} won by ${match.totalWickets - nextWickets} wickets`;
      } else if (nextScore === match.target! - 1) {
        resultText = `Match Tied!`;
      } else {
        resultText = `${match.bowlingTeam} won by ${(match.target! - 1) - nextScore} runs`;
      }
      matchWon = true;
    }

    let nextStriker = match.striker;
    let nextNonStriker = match.nonStriker;
    if (batsmanRuns % 2 !== 0) {
      const temp = nextStriker;
      nextStriker = nextNonStriker;
      nextNonStriker = temp;
    }

    if (overCompleted && !matchWon && !inningsEnded) {
      const temp = nextStriker;
      nextStriker = nextNonStriker;
      nextNonStriker = temp;
    }

    const newBall: BallEvent = {
      matchId: id,
      inning: match.currentInning,
      ballNumber: nextBalls === 0 ? 6 : nextBalls,
      overNumber: nextOvers,
      batsman: match.striker,
      bowler: match.bowler,
      batsmanRuns,
      extrasRuns,
      extraType,
      isWicket,
      timestamp: Date.now()
    };
    await db.balls.add(newBall);

    try {
      const res = await fetch('/api/commentary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batsman: match.striker, bowler: match.bowler, batsmanRuns, extrasRuns, extraType, isWicket })
      });
      const data = await res.json();
      const newCommentary = { id: Date.now().toString(), text: data.commentary, timestamp: `${nextOvers}.${nextBalls === 0 ? 6 : nextBalls}` };
      setCommentaries(prev => [newCommentary, ...prev]);
    } catch (e) {
      // fallback
    }

    let updatedMatchData: Partial<Match> = {
      striker: nextStriker,
      nonStriker: nextNonStriker,
    };

    if (isInn1) {
      updatedMatchData.inning1Score = nextScore;
      updatedMatchData.inning1Wickets = nextWickets;
      updatedMatchData.inning1Overs = nextOvers;
      updatedMatchData.inning1Balls = nextBalls;
    } else {
      updatedMatchData.inning2Score = nextScore;
      updatedMatchData.inning2Wickets = nextWickets;
      updatedMatchData.inning2Overs = nextOvers;
      updatedMatchData.inning2Balls = nextBalls;
    }

    if (matchWon) {
      updatedMatchData.isCompleted = true;
      updatedMatchData.resultSummary = resultText;
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } else if (inningsEnded && isInn1) {
      updatedMatchData.isInningsBreak = true;
      updatedMatchData.target = nextScore + 1;
    } else if (isWicket && nextWickets < match.totalWickets) {
      updatedMatchData.isWaitingForNewBatter = true;
    } else if (overCompleted && !matchWon) {
      updatedMatchData.isWaitingForNewBowler = true;
    }

    await db.matches.update(id, updatedMatchData);
    loadMatchData();
  };

  const handleUndo = async () => {
    if (match.isCompleted) return;
    const lastBall = await db.balls.where('matchId').equals(id).reverse().sortBy('timestamp');
    if (lastBall.length === 0) return;

    const ballToDelete = lastBall[0];
    await db.balls.delete(ballToDelete.id!);

    const totalRuns = ballToDelete.batsmanRuns + ballToDelete.extrasRuns;
    const isLegal = ballToDelete.extraType !== 'wide' && ballToDelete.extraType !== 'noball';

    let prevScore = currentScore - totalRuns;
    let prevWickets = currentWickets - (ballToDelete.isWicket ? 1 : 0);
    let prevBalls = currentBalls - (isLegal ? 1 : 0);
    let prevOvers = currentOvers;
    if (prevBalls < 0) {
      prevBalls = 5;
      prevOvers = Math.max(0, prevOvers - 1);
    }

    let updated: Partial<Match> = {};
    if (isInn1) {
      updated = { inning1Score: prevScore, inning1Wickets: prevWickets, inning1Overs: prevOvers, inning1Balls: prevBalls };
    } else {
      updated = { inning2Score: prevScore, inning2Wickets: prevWickets, inning2Overs: prevOvers, inning2Balls: prevBalls };
    }

    await db.matches.update(id, updated);
    loadMatchData();
  };

  const handleNewBatterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatterName) return;
    await db.matches.update(id, { striker: newBatterName, isWaitingForNewBatter: false });
    setNewBatterName('');
    loadMatchData();
  };

  const handleNewBowlerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBowlerName) return;
    await db.matches.update(id, { bowler: newBowlerName, isWaitingForNewBowler: false });
    setNewBowlerName('');
    loadMatchData();
  };

  const handleStartInnings2 = async (openingStriker: string, openingNonStriker: string, openingBowler: string) => {
    if (!openingStriker || !openingNonStriker || !openingBowler) {
      alert('Please fill in opening players for Innings 2');
      return;
    }
    await db.matches.update(id, {
      currentInning: 2,
      battingTeam: match.teamB,
      bowlingTeam: match.teamA,
      striker: openingStriker,
      nonStriker: openingNonStriker,
      bowler: openingBowler,
      isInningsBreak: false,
    });
    loadMatchData();
  };

  return (
    <div className="mobile-app-container">
      <header className="app-header">
        <button className="back-btn" onClick={() => router.push('/')}>
          <ArrowLeft size={18} />
        </button>
        <div className="header-title">
          <h2>{match.teamA} vs {match.teamB}</h2>
          <span className="live-pill">Inning {match.currentInning}</span>
        </div>
        <button className="undo-btn" onClick={handleUndo} title="Undo Last Ball">
          <RotateCcw size={18} />
        </button>
      </header>

      <main className="app-content mobile-scrollable">
        {activeTab === 'scorer' && (
          <div className="command-center">
            <div className="scoreboard-glass glass-card">
              <div className="score-display">
                <span className="team-name-label">{match.battingTeam}</span>
                <div className="main-score">
                  {currentScore}<span>/{currentWickets}</span>
                </div>
                <div className="match-meta-info">
                  <span>Overs: <strong>{currentOvers}.{currentBalls}</strong> / {match.totalOvers}</span>
                  {!isInn1 && match.target && <span className="target-pill">Target: {match.target}</span>}
                </div>
              </div>

              <WormChart balls={balls.filter(b => b.inning === match.currentInning)} />
            </div>

            <div className="players-grid">
              <div className="player-widget active-striker">
                <span className="p-label">Striker *</span>
                <span className="p-name">{match.striker}</span>
              </div>
              <div className="player-widget">
                <span className="p-label">Non-Striker</span>
                <span className="p-name">{match.nonStriker}</span>
              </div>
              <div className="player-widget bowler-widget">
                <span className="p-label">Bowler</span>
                <span className="p-name">{match.bowler}</span>
              </div>
            </div>

            <div className="action-pad glass-card">
              <div className="pad-grid">
                <button className="run-btn" onClick={() => recordBall(0, 0, 'none', false)}>0</button>
                <button className="run-btn" onClick={() => recordBall(1, 0, 'none', false)}>1</button>
                <button className="run-btn" onClick={() => recordBall(2, 0, 'none', false)}>2</button>
                <button className="run-btn" onClick={() => recordBall(3, 0, 'none', false)}>3</button>
                <button className="run-btn boundary" onClick={() => recordBall(4, 0, 'none', false)}>4</button>
                <button className="run-btn boundary six" onClick={() => recordBall(6, 0, 'none', false)}>6</button>
                <button className="action-sub-btn" onClick={() => recordBall(0, 1, 'wide', false)}>WD</button>
                <button className="action-sub-btn" onClick={() => recordBall(0, 1, 'noball', false)}>NB</button>
                <button className="action-sub-btn wicket-btn" onClick={() => recordBall(0, 0, 'none', true)}>WICKET</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scorecard' && (
          <div className="tab-pane">
            <h3>Match Scorecard</h3>
            <div className="glass-card scorecard-table-card">
              <h4>{match.teamA} vs {match.teamB} Summary</h4>
              <p>Innings 1 Score: <strong>{match.inning1Score}/{match.inning1Wickets}</strong> ({match.inning1Overs}.{match.inning1Balls} ov)</p>
              <p>Innings 2 Score: <strong>{match.inning2Score}/{match.inning2Wickets}</strong> ({match.inning2Overs}.{match.inning2Balls} ov)</p>
              {match.resultSummary && <p className="result-banner">{match.resultSummary}</p>}
            </div>
          </div>
        )}

        {activeTab === 'feed' && (
          <div className="tab-pane">
            <LiveCommentary commentaries={commentaries} />
          </div>
        )}
      </main>

      <nav className="bottom-nav">
        <button className={`nav-item ${activeTab === 'scorer' ? 'active' : ''}`} onClick={() => setActiveTab('scorer')}>
          <Activity size={20} />
          <span>Console</span>
        </button>
        <button className={`nav-item ${activeTab === 'scorecard' ? 'active' : ''}`} onClick={() => setActiveTab('scorecard')}>
          <BarChart2 size={20} />
          <span>Scorecard</span>
        </button>
        <button className={`nav-item ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')}>
          <Shield size={20} />
          <span>Feed</span>
        </button>
      </nav>

      {match.isWaitingForNewBatter && (
        <div className="bottom-sheet-overlay">
          <div className="bottom-sheet glass-card">
            <h3>Wicket Fallen! Enter New Batsman</h3>
            <form onSubmit={handleNewBatterSubmit}>
              <input 
                type="text" 
                className="formal-input" 
                placeholder="New Batsman Name" 
                value={newBatterName} 
                onChange={(e) => setNewBatterName(e.target.value)} 
                required 
                autoFocus 
              />
              <button type="submit" className="primary-btn">Confirm Batter</button>
            </form>
          </div>
        </div>
      )}

      {match.isWaitingForNewBowler && (
        <div className="bottom-sheet-overlay">
          <div className="bottom-sheet glass-card">
            <h3>Over Completed! Select Next Bowler</h3>
            <form onSubmit={handleNewBowlerSubmit}>
              <input 
                type="text" 
                className="formal-input" 
                placeholder="Next Bowler Name" 
                value={newBowlerName} 
                onChange={(e) => setNewBowlerName(e.target.value)} 
                required 
                autoFocus 
              />
              <button type="submit" className="primary-btn">Confirm Bowler</button>
            </form>
          </div>
        </div>
      )}

      {match.isInningsBreak && (
        <InningsBreakModal match={match} onStartInnings2={handleStartInnings2} />
      )}
    </div>
  );
}

function InningsBreakModal({ match, onStartInnings2 }: { match: Match; onStartInnings2: (s: string, ns: string, b: string) => void }) {
  const [s, setS] = useState('');
  const [ns, setNs] = useState('');
  const [b, setB] = useState('');

  return (
    <div className="bottom-sheet-overlay">
      <div className="bottom-sheet glass-card">
        <h3>Innings Break</h3>
        <p>{match.teamA} scored {match.inning1Score}. Target for {match.teamB}: <strong>{match.target}</strong></p>
        <div className="input-group">
          <label>Innings 2 Opening Striker</label>
          <input type="text" className="formal-input" placeholder="Striker Name" value={s} onChange={e => setS(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Innings 2 Opening Non-Striker</label>
          <input type="text" className="formal-input" placeholder="Non-Striker Name" value={ns} onChange={e => setNs(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Innings 2 Opening Bowler</label>
          <input type="text" className="formal-input" placeholder="Bowler Name" value={b} onChange={e => setB(e.target.value)} />
        </div>
        <button className="primary-btn" onClick={() => onStartInnings2(s, ns, b)}>Start Innings 2</button>
      </div>
    </div>
  );
}