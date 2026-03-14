'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const FRUITS = [
  'apple',
  'banana',
  'cherry',
  'grape',
  'orange',
  'pineapple',
  'strawberry',
  'watermelon'
];

interface Card {
  id: number;
  fruit: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function MemoryGame() {
  const [gameState, setGameState] = useState<'login' | 'playing' | 'paused' | 'finished'>('login');
  const [userName, setUserName] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [time, setTime] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and Start Game
  const startGame = useCallback(() => {
    const gameCards: Card[] = [...FRUITS, ...FRUITS]
      .sort(() => Math.random() - 0.5)
      .map((fruit, index) => ({
        id: index,
        fruit,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(gameCards);
    setTime(0);
    setMatches(0);
    setFlippedCards([]);
    setGameState('playing');
  }, []);

  // Timer logic
  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  // Card click handler
  const handleCardClick = (index: number) => {
    if (gameState !== 'playing' || flippedCards.length === 2 || cards[index].isFlipped || cards[index].isMatched) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (cards[first].fruit === cards[second].fruit) {
        // Match found
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[first].isMatched = true;
            updated[second].isMatched = true;
            return updated;
          });
          setMatches((prev) => prev + 1);
          setFlippedCards([]);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[first].isFlipped = false;
            updated[second].isFlipped = false;
            return updated;
          });
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  // Fetch Rankings
  const fetchRankings = useCallback(async () => {
    try {
      const response = await fetch('/api/record');
      const data = await response.json();
      if (Array.isArray(data)) {
        setLeaderboard(data.slice(0, 3)); // Only top 3
      }
    } catch (error) {
      console.error('Failed to fetch rankings:', error);
    }
  }, []);

  // Save Score to Google Sheets via API Proxy
  const saveScore = useCallback(async (finalTime: number, name: string) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          finishtime: formatTime(finalTime),
          name: name,
          timestamp: new Date().toLocaleString('ko-KR'),
        }),
      });

      const data = await response.json();
      if (data.success) {
        console.log('Score saved successfully via API Proxy');
        await fetchRankings(); // Update leaderboard after saving
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to save score:', error);
      alert('기록 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsSaving(false);
    }
  }, [fetchRankings]);

  // Check win condition
  useEffect(() => {
    if (matches === FRUITS.length && cards.length > 0 && gameState === 'playing') {
      setGameState('finished');
      saveScore(time, userName);
    }
  }, [matches, cards.length, time, userName, saveScore, gameState]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Reset and Go to Login
  const goToStart = useCallback(() => {
    setUserName('');
    setCards([]);
    setTime(0);
    setMatches(0);
    setFlippedCards([]);
    setGameState('login');
  }, []);

  // 1. Landing (Login) View
  if (gameState === 'login') {
    return (
      <div className="main-container" style={{ justifyContent: 'center' }}>
        <div className="landing-card">
          <h1 className="landing-title">과일 맞추기</h1>
          <p className="landing-desc">4x4 과일 카드 짝맞추기 게임에 도전하세요!</p>

          <div style={{ textAlign: 'left' }}>
            <label className="input-label">플레이어 이름</label>
            <input
              type="text"
              placeholder="이름을 입력하세요..."
              className="input-field"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && userName && startGame()}
            />
            <button className="btn btn-restart" style={{ width: '100%' }} onClick={() => userName && startGame()} disabled={!userName}>
              게임 시작
            </button>
          </div>
          <div className="landing-fruits">
            <span>🍎</span><span>🍌</span><span>🍇</span><span>🍓</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Main Game View
  return (
    <>
      {/* Header Bar */}
      <nav className="header-bar">
        <div className="logo-area">
          <div className="icon-button" style={{ background: '#ff7675', color: 'white' }}>🍎</div>
          <span>과일 맞추기</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="icon-button">⚙️</button>
          <button className="icon-button" style={{ background: '#ffeaa7', color: '#d63031' }}>👤</button>
        </div>
      </nav>

      <main className="main-container">
        {/* Stats Info Card */}
        <div className="stats-container animate-fade-in">
          <div className="player-info">
            <div className="avatar-circle">
              🎮
              <div className="status-indicator"></div>
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{userName}님의 모험</h2>
              <p style={{ fontSize: '0.75rem', color: '#636e72', fontWeight: 600 }}>일반 모드 • 레벨 1</p>
            </div>
          </div>

          <div className="stat-group">
            <div className="stat-box">
              <span className="stat-label">시간</span>
              <span className="stat-value">{formatTime(time)}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">성공</span>
              <span className="stat-value">{matches} / 8</span>
            </div>
          </div>
        </div>

        {/* Game Board Grid */}
        <div className="game-grid animate-fade-in" style={{ opacity: gameState === 'paused' ? 0.3 : 1 }}>
          {cards.map((card, index) => (
            <div
              key={card.id}
              className={`card-container ${card.isFlipped || card.isMatched ? 'flipped' : ''} ${card.isMatched ? 'matched' : ''}`}
              onClick={() => handleCardClick(index)}
            >
              <div className="card-inner">
                <div className="card-face card-front"></div>
                <div className="card-face card-back">
                  <img src={`/fruits/${card.fruit}.png`} alt={card.fruit} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Control Buttons */}
        <div className="controls-area animate-fade-in">
          {gameState === 'playing' ? (
            <button className="btn btn-stop" onClick={() => setGameState('paused')}>
              <span style={{ fontSize: '1.2rem' }}>⏸</span> 정지
            </button>
          ) : (
            <button className="btn btn-restart" onClick={() => setGameState('playing')}>
              <span style={{ fontSize: '1.2rem' }}>▶️</span> 계속
            </button>
          )}
          <button className="btn btn-restart" onClick={startGame}>
            <span style={{ fontSize: '1.2rem' }}>🔄</span> 재시작
          </button>
          <button className="btn btn-stop" onClick={goToStart}>
            <span style={{ fontSize: '1.2rem' }}>🏠</span> 처음으로
          </button>
        </div>

        {/* Game Finished Modal & Pause Screen Overlay */}
        {(gameState === 'finished' || gameState === 'paused') && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(8px)',
            zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}>
            {gameState === 'finished' && (
              <div className="glass animate-scale-in" style={{
                background: 'white', padding: '60px 40px', borderRadius: '32px',
                textAlign: 'center', width: '100%', maxWidth: '500px',
                boxShadow: '0 40px 100px rgba(0,0,0,0.2)'
              }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)', fontStyle: 'italic', marginBottom: '8px' }}>성공!</h2>
                <p style={{ color: '#636e72', marginBottom: '32px' }}>참 잘했어요, {userName}님!</p>
                <div style={{ background: '#fffaf5', borderRadius: '20px', padding: '32px', marginBottom: '16px' }}>
                  <span className="stat-label">최종 기록</span>
                  <p style={{ fontSize: '3rem', fontWeight: 900, color: '#2d3436' }}>{formatTime(time)}</p>
                </div>

                <div style={{ marginBottom: '24px', fontSize: '0.875rem', color: isSaving ? 'var(--primary)' : 'var(--accent)', fontWeight: 600 }}>
                  {isSaving ? '⏳ 구글 시트에 기록을 저장 중입니다...' : '✅ 구글 시트에 기록이 저장되었습니다.'}
                </div>

                {/* Leaderboard TOP 3 */}
                {!isSaving && leaderboard.length > 0 && (
                  <div style={{ background: '#f8f9fa', borderRadius: '20px', padding: '20px', marginBottom: '24px', textAlign: 'left' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#2d3436', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🏆 실시간 TOP 3
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {leaderboard.map((record, i) => (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '12px 20px', background: 'white', borderRadius: '16px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                          border: i === 0 ? '1px solid #ffeaa7' : 'none'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{
                              fontWeight: 900, fontSize: '1.2rem',
                              color: i === 0 ? '#fdcb6e' : (i === 1 ? '#95a5a6' : '#cc8e35'),
                              width: '24px', textAlign: 'center'
                            }}>{i + 1}</span>
                            <span style={{ fontWeight: 700, color: '#2d3436', fontSize: '1.1rem' }}>{record.name}</span>
                          </div>
                          <span style={{
                            fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem',
                            background: '#fff0f0', padding: '4px 12px', borderRadius: '10px'
                          }}>{record.finishtime}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button className="btn btn-restart" style={{ width: '100%', padding: '20px' }} onClick={startGame} disabled={isSaving}>
                    다시 하기
                  </button>
                  <button className="btn btn-stop" style={{ width: '100%', padding: '16px' }} onClick={goToStart}>
                    처음으로 (이름 변경)
                  </button>
                </div>
              </div>
            )}

            {gameState === 'paused' && (
              <div className="glass animate-scale-in" style={{
                background: 'white', padding: '40px', borderRadius: '24px',
                textAlign: 'center', width: '100%', maxWidth: '300px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.1)'
              }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2d3436', marginBottom: '24px' }}>잠시 멈춤</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button className="btn btn-restart" style={{ width: '100%' }} onClick={() => setGameState('playing')}>
                    계속하기
                  </button>
                  <button className="btn btn-stop" style={{ width: '100%' }} onClick={goToStart}>
                    처음으로
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Decorative footer fruits from design */}
      <footer style={{
        position: 'fixed', bottom: 20, width: '100%', display: 'flex',
        justifyContent: 'center', gap: '60px', opacity: 0.1, zIndex: -1
      }}>
        <span>🍎</span><span>🍌</span><span>🍇</span><span>🍓</span><span>🍍</span><span>🍉</span>
      </footer>
    </>
  );
}