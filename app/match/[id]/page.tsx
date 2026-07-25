"use client";
import { useParams, useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import { db, BallEvent } from '../../../lib/db';
import WormChart from '../../../components/WormChart';
import LiveCommentary from '../../../components/LiveCommentary';
import { Activity, LayoutList, MessageSquare, Download, ChevronLeft, UserCircle, Target, Undo2 } from 'lucide-react';

export default function PremiumProScorer() {
  const params = useParams();
  const router = useRouter();
  const matchId = Number(params.id);
  const summaryCardRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState<'scorer' | 'scorecard' | 'commentary' | 'summary'>('scorer');
  const [newBatsmanName, setNewBatsmanName] = useState('');
  const [newBowlerName, setNewBowlerName] = useState('');
  const [innings1Striker, setInnings1Striker] = useState('');
  const [innings1NonStriker, setInnings1NonStriker] = useState('');
  const [innings1Bowler, setInnings1Bowler] = useState('');
  const [pendingWicketBall, setPendingWicketBall] = useState<any>(null);
  const [commentaryFeed, setCommentaryFeed] = useState<any[]>([]);

  const match = useLiveQuery(() => db.matches.get(matchId), [matchId]);
  const balls = useLiveQuery(() => db.balls.where('matchId').equals(matchId).toArray(), [matchId]);

  useEffect(() => {
    if (match?.status === 'completed') {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#3B82F6', '#F8FAFC']
      });
    }
  }, [match?.status]);

  if (!match || !balls) return <div className="loading-screen">Loading Match Details...</div>;

  const currentInningsBalls = balls.filter(b => b.innings === match.innings);
  const totalRuns = currentInningsBalls.reduce((sum, b) => sum + b.batsmanRuns + b.extrasRuns, 0);
  const totalWickets = currentInningsBalls.filter(b => b.isWicket).length;
  const legalBalls = currentInningsBalls.filter(b => b.isLegalDelivery);
  const completedOvers = Math.floor(legalBalls.length / 6);
  const currentBallsInOver = legalBalls.length % 6;

  const isAllOut = totalWickets >= match.wicketsLimit;
  const isOversFinished = completedOvers >= match.totalOvers;
  const isInnFinished = isOversFinished || isAllOut;
  const target = match.target;
  const isTargetChased = target !== null && totalRuns >= target;

  let matchResultText = "";
  let inn1ScoreStr = "";
  let inn2ScoreStr = "";

  const inn1Balls = balls.filter(b => b.innings === 1);
  const inn2Balls = balls.filter(b => b.innings === 2);
  const inn1Runs = inn1Balls.reduce((sum, b) => sum + b.batsmanRuns + b.extrasRuns, 0);
  const inn1Wickets = inn1Balls.filter(b => b.isWicket).length;
  const inn1LegalBalls = inn1Balls.filter(b => b.isLegalDelivery).length;
  const inn1Overs = `${Math.floor(inn1LegalBalls / 6)}.${inn1LegalBalls % 6}`;
  inn1ScoreStr = `${inn1Runs}/${inn1Wickets} (${inn1Overs})`;

  const inn2Runs = inn2Balls.reduce((sum, b) => sum + b.batsmanRuns + b.extrasRuns, 0);
  const inn2Wickets = inn2Balls.filter(b => b.isWicket).length;
  const inn2LegalBalls = inn2Balls.filter(b => b.isLegalDelivery).length;
  const inn2Overs = `${Math.floor(inn2LegalBalls / 6)}.${inn2LegalBalls % 6}`;
  if (match.status === 'completed' || match.innings === 2) {
      inn2ScoreStr = `${inn2Runs}/${inn2Wickets} (${inn2Overs})`;
  }

  if (match.status === 'completed') {
    if (inn2Runs >= inn1Runs && inn1Runs > 0) { 
      const wicketsLeft = match.wicketsLimit - inn2Wickets;
      matchResultText = `${match.teamB} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}`;
    } else if (inn1Runs > inn2Runs) { 
      const runsDiff = inn1Runs - inn2Runs;
      matchResultText = `${match.teamA} won by ${runsDiff} run${runsDiff !== 1 ? 's' : ''}`;
    } else {
      matchResultText = "Match Tied";
    }
  }

  const batsmenStats: { [name: string]: { runs: number; balls: number; fours: number; sixes: number; dismissal: string } } = {};
  const bowlerStats: { [name: string]: { legalBallsCount: number; runsConceded: number; wickets: number } } = {};

  [match.currentStriker, match.currentNonStriker].forEach(name => {
    if (name) batsmenStats[name] = { runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: 'not out' };
  });

  currentInningsBalls.forEach(ball => {
    if (ball.batterName) {
      if (!batsmenStats[ball.batterName]) batsmenStats[ball.batterName] = { runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: 'not out' };
      if (ball.extraType !== 'wide') batsmenStats[ball.batterName].balls += 1;
      batsmenStats[ball.batterName].runs += ball.batsmanRuns;
      if (ball.batsmanRuns === 4) batsmenStats[ball.batterName].fours += 1;
      if (ball.batsmanRuns === 6) batsmenStats[ball.batterName].sixes += 1;
      if (ball.isWicket) batsmenStats[ball.batterName].dismissal = `b ${ball.bowlerName}`;
    }
    if (ball.bowlerName) {
      if (!bowlerStats[ball.bowlerName]) bowlerStats[ball.bowlerName] = { legalBallsCount: 0, runsConceded: 0, wickets: 0 };
      bowlerStats[ball.bowlerName].runsConceded += (ball.batsmanRuns + ball.extrasRuns);
      if (ball.isLegalDelivery) bowlerStats[ball.bowlerName].legalBallsCount += 1;
      if (ball.isWicket) bowlerStats[ball.bowlerName].wickets += 1;
    }
  });

  const strikerStat = batsmenStats[match.currentStriker] || { runs: 0, balls: 0 };
  const nonStrikerStat = batsmenStats[match.currentNonStriker] || { runs: 0, balls: 0 };
  const bowlerStat = bowlerStats[match.currentBowler] || { legalBallsCount: 0, runsConceded: 0, wickets: 0 };
  const bowlerOversFormatted = `${Math.floor(bowlerStat.legalBallsCount / 6)}.${bowlerStat.legalBallsCount % 6}`;

  const undoLastBall = async () => {
    if (match.status === 'completed' || match.status === 'innings_break') {
      alert("Match phase has concluded. Cannot undo past this point.");
      return;
    }
    if (currentInningsBalls.length === 0) return;

    const lastBall = currentInningsBalls[currentInningsBalls.length - 1];
    await db.balls.delete(lastBall.id!);
    
    await db.matches.update(matchId, {
      currentStriker: lastBall.batterName,
      currentBowler: lastBall.bowlerName,
      isWaitingForNewBatter: false,
      isWaitingForNewBowler: false
    });
    setPendingWicketBall(null);
  };

  const recordDelivery = async (batsmanRuns: number, extrasRuns: number, extraType: BallEvent['extraType'], isWicket: boolean) => {
    if (isInnFinished || isTargetChased || match.status === 'completed') return;

    if (isWicket) {
      setPendingWicketBall({ batsmanRuns, extrasRuns, extraType, isWicket });
      if (totalWickets + 1 >= match.wicketsLimit) {
         await executeBallCommit(batsmanRuns, extrasRuns, extraType, true, match.currentStriker, true);
      } else {
         await db.matches.update(matchId, { isWaitingForNewBatter: true });
      }
      return;
    }
    await executeBallCommit(batsmanRuns, extrasRuns, extraType, false, match.currentStriker, false);
  };

  const executeBallCommit = async (batsmanRuns: number, extrasRuns: number, extraType: BallEvent['extraType'], isWicket: boolean, strikerToRecord: string, isForcedAllOut: boolean) => {
    const isLegalDelivery = extraType !== 'wide' && extraType !== 'noball';

    const newBall: BallEvent = {
      matchId,
      innings: match.innings,
      overNumber: completedOvers,
      ballNumber: currentBallsInOver + 1,
      batsmanRuns,
      extrasRuns,
      extraType,
      isWicket,
      isLegalDelivery,
      batterName: strikerToRecord,
      bowlerName: match.currentBowler,
      timestamp: Date.now()
    };

    await db.balls.add(newBall);

    fetch('/api/commentary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ball: newBall, match })
    }).then(res => res.json()).then(data => {
      if (data.success) {
        setCommentaryFeed(prev => [{ id: Date.now().toString(), over: `${completedOvers}.${currentBallsInOver + 1}`, text: data.commentary, time: data.timestamp }, ...prev]);
      }
    }).catch(e => console.error(e));

    let nextStriker = match.currentStriker;
    let nextNonStriker = match.currentNonStriker;
    let isOverComplete = false;

    if (isWicket && !isForcedAllOut) {
      nextStriker = newBatsmanName.trim();
    } else if (!isWicket) {
      const totalRunsThisBall = batsmanRuns + extrasRuns;
      if (totalRunsThisBall % 2 !== 0) {
        nextStriker = match.currentNonStriker;
        nextNonStriker = match.currentStriker;
      }
    }

    if (isLegalDelivery && (currentBallsInOver + 1) === 6 && !isWicket) {
      const temp = nextStriker;
      nextStriker = nextNonStriker;
      nextNonStriker = temp;
      isOverComplete = true;
    }

    const updatedLegalBallsCount = legalBalls.length + (isLegalDelivery ? 1 : 0);
    const updatedCompletedOvers = Math.floor(updatedLegalBallsCount / 6);
    const updatedTotalWickets = totalWickets + (isWicket ? 1 : 0);
    
    const innFinishedNow = updatedCompletedOvers >= match.totalOvers || updatedTotalWickets >= match.wicketsLimit;
    const currentInnBallsAll = [...currentInningsBalls, newBall];
    const updatedTotalRuns = currentInnBallsAll.reduce((sum, b) => sum + b.batsmanRuns + b.extrasRuns, 0);
    const targetAchieved = match.innings === 2 && match.target !== null && updatedTotalRuns >= match.target;

    let newStatus = match.status;
    let waitingForBreak = false;

    if ((innFinishedNow || targetAchieved) && match.innings === 1) {
      newStatus = 'innings_break';
      waitingForBreak = true;
    } else if ((innFinishedNow || targetAchieved) && match.innings === 2) {
      newStatus = 'completed';
    }

    await db.matches.update(matchId, {
      currentStriker: nextStriker,
      currentNonStriker: nextNonStriker,
      isWaitingForNewBatter: false,
      isWaitingForNewBowler: isOverComplete && !innFinishedNow && !targetAchieved,
      isWaitingForInningsBreak: waitingForBreak,
      status: newStatus
    });

    setNewBatsmanName('');
    setPendingWicketBall(null);
  };

  const confirmNewBowler = async () => {
    if (!newBowlerName.trim()) return;
    await db.matches.update(matchId, {
      currentBowler: newBowlerName.trim(),
      isWaitingForNewBowler: false
    });
    setNewBowlerName('');
  };

  const startSecondInnings = async () => {
    if (!innings1Striker.trim() || !innings1NonStriker.trim() || !innings1Bowler.trim()) {
      return alert("Please enter opening batters and bowler for Innings 2.");
    }
    const targetScore = totalRuns + 1;
    await db.matches.update(matchId, {
      innings: 2,
      target: targetScore,
      currentStriker: innings1Striker.trim(),
      currentNonStriker: innings1NonStriker.trim(),
      currentBowler: innings1Bowler.trim(),
      status: 'in_progress',
      isWaitingForInningsBreak: false
    });
  };

  const downloadViralSummary = async () => {
    if (!summaryCardRef.current) return;
    try {
      const canvas = await html2canvas(summaryCardRef.current, { backgroundColor: '#0F172A', scale: 2 });
      const link = document.createElement('a');
      link.download = `${match.teamA}_vs_${match.teamB}_Summary.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Failed to generate card", err);
    }
  };

  const battingTeam = match.innings === 1 ? match.teamA : match.teamB;

  return (
    <div className="stadium-background">
      <div className="app-shell glass-overlay">
        
        <div className="app-header">
          <button onClick={() => router.push('/')} className="back-btn">
            <ChevronLeft size={20} /> Back
          </button>
          <span className="header-title">Match Center</span>
          <div style={{ width: 60 }}></div> 
        </div>

        <div className="scroll-content padding-bottom-large">
          {activeTab === 'scorer' && (
            <div className="animate-fade-in">
              <div className="glass-panel main-score-panel">
                <div className="match-status-row">
                  <span className="match-innings">{match.status === 'completed' ? 'Final Result' : `Innings ${match.innings}`}</span>
                  <span className="match-teams-head">{match.teamA} vs {match.teamB}</span>
                </div>
                
                <div className="score-display">
                  <div className="score-main">
                    {totalRuns}<span className="score-divider">/</span>{totalWickets}
                  </div>
                  <div className="overs-target-col">
                    <div className="overs-text">Overs {completedOvers}.{currentBallsInOver} <span className="text-muted">/ {match.totalOvers}</span></div>
                    {match.target !== null && <div className="target-text">Target: {match.target}</div>}
                  </div>
                </div>

                <WormChart balls={balls} innings={match.innings} />
              </div>

              <div className="glass-panel players-panel">
                <div className="player-row active-striker">
                  <div className="player-info">
                    <UserCircle size={16} className="icon-blue" />
                    <span className="player-name">{match.currentStriker}</span>
                  </div>
                  <div className="player-stats">{strikerStat.runs} <span className="text-muted">({strikerStat.balls})</span></div>
                </div>
                <div className="player-row">
                  <div className="player-info">
                    <span className="player-name indent">{match.currentNonStriker}</span>
                  </div>
                  <div className="player-stats">{nonStrikerStat.runs} <span className="text-muted">({nonStrikerStat.balls})</span></div>
                </div>
                <div className="divider-line"></div>
                <div className="player-row">
                  <div className="player-info">
                    <Target size={16} className="text-muted" />
                    <span className="player-name text-muted">{match.currentBowler}</span>
                  </div>
                  <div className="player-stats">{bowlerStat.wickets}-{bowlerStat.runsConceded} <span className="text-muted">({bowlerOversFormatted})</span></div>
                </div>
              </div>

              {match.status === 'completed' || isTargetChased || match.status === 'innings_break' ? (
                <div className="glass-panel info-panel">
                  <h3 className="formal-heading">{match.status === 'completed' || isTargetChased ? 'Match Complete' : 'Innings Complete'}</h3>
                  <p className="formal-subtext">
                    {match.status === 'completed' || isTargetChased
                      ? matchResultText 
                      : `Target for ${match.teamB} is ${totalRuns + 1} runs.`}
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {activeTab === 'scorecard' && (
            <div className="scorecard-wrapper animate-fade-in">
              <h2 className="formal-heading">Batting - {battingTeam}</h2>
              <div className="glass-panel table-panel">
                <table className="data-table">
                  <thead>
                    <tr><th>Batter</th><th className="align-right">R</th><th className="align-right">B</th><th className="align-right">4s</th><th className="align-right">6s</th><th className="align-right">SR</th></tr>
                  </thead>
                  <tbody>
                    {Object.entries(batsmenStats).map(([name, stat]) => (
                      <tr key={name}>
                        <td>
                          <div className="td-name">{name}</div>
                          <div className="td-sub">{stat.dismissal}</div>
                        </td>
                        <td className="align-right fw-600">{stat.runs}</td>
                        <td className="align-right text-muted">{stat.balls}</td>
                        <td className="align-right text-muted">{stat.fours}</td>
                        <td className="align-right text-muted">{stat.sixes}</td>
                        <td className="align-right text-muted">{stat.balls > 0 ? ((stat.runs / stat.balls) * 100).toFixed(1) : "0.0"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 className="formal-heading" style={{ marginTop: '1.5rem' }}>Bowling</h2>
              <div className="glass-panel table-panel">
                <table className="data-table">
                  <thead>
                    <tr><th>Bowler</th><th className="align-right">O</th><th className="align-right">R</th><th className="align-right">W</th><th className="align-right">ECO</th></tr>
                  </thead>
                  <tbody>
                    {Object.entries(bowlerStats).map(([name, stat]) => {
                      const overs = `${Math.floor(stat.legalBallsCount / 6)}.${stat.legalBallsCount % 6}`;
                      const eco = stat.legalBallsCount > 0 ? (stat.runsConceded / (stat.legalBallsCount / 6)).toFixed(1) : "0.0";
                      return (
                        <tr key={name}>
                          <td><div className="td-name">{name}</div></td>
                          <td className="align-right text-muted">{overs}</td>
                          <td className="align-right text-muted">{stat.runsConceded}</td>
                          <td className="align-right fw-600">{stat.wickets}</td>
                          <td className="align-right text-muted">{eco}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'commentary' && (
            <div className="animate-fade-in padding-top">
              <LiveCommentary feed={commentaryFeed} />
            </div>
          )}

          {activeTab === 'summary' && match.status === 'completed' && (
            <div className="animate-fade-in padding-top">
              <div className="viral-card" ref={summaryCardRef}>
                <div className="viral-header">Match Summary</div>
                <h2 className="viral-title">{match.teamA} vs {match.teamB}</h2>
                <div className="viral-result">{matchResultText}</div>
                
                <div className="viral-scores">
                  <div className="viral-box">
                    <span className="viral-label">{match.teamA}</span>
                    <span className="viral-score">{inn1ScoreStr}</span>
                  </div>
                  <div className="viral-box">
                    <span className="viral-label">{match.teamB}</span>
                    <span className="viral-score">{inn2ScoreStr || 'DNB'}</span>
                  </div>
                </div>
                <div className="viral-footer">Generated by Gully Cricket Pro</div>
              </div>
              
              <button className="btn-solid" onClick={downloadViralSummary} style={{ marginTop: '1.5rem' }}>
                Download Graphic
              </button>
            </div>
          )}
        </div>

        {/* Undo Button */}
        {activeTab === 'scorer' && match.status !== 'completed' && match.status !== 'innings_break' && currentInningsBalls.length > 0 && (
          <button className="floating-undo-btn" onClick={undoLastBall}>
            <Undo2 size={16} /> Undo
          </button>
        )}

        {/* Action Pad */}
        {activeTab === 'scorer' && match.status !== 'completed' && match.status !== 'innings_break' && !isTargetChased && !isAllOut && (
          <div className="mobile-action-pad">
            <button className="action-btn dot" onClick={() => recordDelivery(0, 0, 'none', false)}>0</button>
            <button className="action-btn run" onClick={() => recordDelivery(1, 0, 'none', false)}>1</button>
            <button className="action-btn run" onClick={() => recordDelivery(2, 0, 'none', false)}>2</button>
            <button className="action-btn run" onClick={() => recordDelivery(3, 0, 'none', false)}>3</button>
            <button className="action-btn run" onClick={() => recordDelivery(4, 0, 'none', false)}>4</button>
            <button className="action-btn run" onClick={() => recordDelivery(6, 0, 'none', false)}>6</button>
            <button className="action-btn extra" onClick={() => recordDelivery(0, 1, 'wide', false)}>WD</button>
            <button className="action-btn extra" onClick={() => recordDelivery(0, 1, 'noball', false)}>NB</button>
            <button className="action-btn wicket" onClick={() => recordDelivery(0, 0, 'none', true)}>W</button>
          </div>
        )}

        {/* Bottom Nav */}
        {!(activeTab === 'scorer' && match.status === 'in_progress' && !isTargetChased && !isAllOut) && (
          <div className="bottom-nav-bar">
            <button className={`nav-item ${activeTab === 'scorer' ? 'active' : ''}`} onClick={() => setActiveTab('scorer')}>
              <Activity size={20} /><span>Live</span>
            </button>
            <button className={`nav-item ${activeTab === 'scorecard' ? 'active' : ''}`} onClick={() => setActiveTab('scorecard')}>
              <LayoutList size={20} /><span>Data</span>
            </button>
            <button className={`nav-item ${activeTab === 'commentary' ? 'active' : ''}`} onClick={() => setActiveTab('commentary')}>
              <MessageSquare size={20} /><span>Feed</span>
            </button>
            {match.status === 'completed' && (
              <button className={`nav-item ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
                <Download size={20} /><span>Export</span>
              </button>
            )}
          </div>
        )}

        {/* Bottom Sheets */}
        {match.isWaitingForNewBatter && (
          <div className="bottom-sheet-backdrop">
            <div className="bottom-sheet">
              <div className="sheet-handle"></div>
              <h3 className="modal-title">Batter Dismissed</h3>
              <p className="modal-desc">Please enter the name of the incoming batter.</p>
              <input type="text" className="formal-input mb-15" placeholder="Batter Name" value={newBatsmanName} onChange={(e) => setNewBatsmanName(e.target.value)} autoFocus />
              <button className="btn-solid" disabled={!newBatsmanName.trim()} onClick={() => executeBallCommit(pendingWicketBall.batsmanRuns, pendingWicketBall.extrasRuns, pendingWicketBall.extraType, true, match.currentStriker, false)}>
                Confirm Batter
              </button>
            </div>
          </div>
        )}

        {match.isWaitingForNewBowler && (
          <div className="bottom-sheet-backdrop">
            <div className="bottom-sheet">
              <div className="sheet-handle"></div>
              <h3 className="modal-title">Over Completed</h3>
              <p className="modal-desc">Please enter the name of the next bowler.</p>
              <input type="text" className="formal-input mb-15" placeholder="Bowler Name" value={newBowlerName} onChange={(e) => setNewBowlerName(e.target.value)} autoFocus />
              <button className="btn-solid" disabled={!newBowlerName.trim()} onClick={confirmNewBowler}>
                Confirm Bowler
              </button>
            </div>
          </div>
        )}

        {(match.status === 'innings_break' || match.isWaitingForInningsBreak) && (
          <div className="bottom-sheet-backdrop">
            <div className="bottom-sheet">
              <div className="sheet-handle"></div>
              <h3 className="modal-title">Innings Break</h3>
              <p className="modal-desc">Target for {match.teamB} is <strong>{totalRuns + 1}</strong>.</p>
              <div className="modal-form-stack">
                <input type="text" className="formal-input" placeholder={`${match.teamB} Striker`} value={innings1Striker} onChange={(e) => setInnings1Striker(e.target.value)} />
                <input type="text" className="formal-input" placeholder={`${match.teamB} Non-Striker`} value={innings1NonStriker} onChange={(e) => setInnings1NonStriker(e.target.value)} />
                <input type="text" className="formal-input" placeholder={`${match.teamA} Bowler`} value={innings1Bowler} onChange={(e) => setInnings1Bowler(e.target.value)} />
              </div>
              <button className="btn-solid mt-15" onClick={startSecondInnings}>Begin Run Chase</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}