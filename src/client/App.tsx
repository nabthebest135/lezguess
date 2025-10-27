import { useState, useEffect } from 'react';

// Add custom CSS for the year slider and screen shake
const sliderStyles = `
  .slider {
    -webkit-appearance: none;
    appearance: none;
    height: 8px;
    border-radius: 5px;
    background: #374151;
    outline: none;
    opacity: 0.7;
    transition: opacity 0.2s;
  }
  
  .slider:hover {
    opacity: 1;
  }
  
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #f97316;
    cursor: pointer;
  }
  
  .slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #f97316;
    cursor: pointer;
    border: none;
  }
  
  @keyframes shake-correct {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
    20%, 40%, 60%, 80% { transform: translateX(3px); }
  }
  
  @keyframes shake-partial {
    0%, 100% { transform: translateX(0); }
    25%, 75% { transform: translateX(-2px); }
    50% { transform: translateX(2px); }
  }
  
  .shake-correct {
    animation: shake-correct 0.6s ease-in-out;
  }
  
  .shake-partial {
    animation: shake-partial 0.4s ease-in-out;
  }
`;

// CSS will be injected in useEffect

// CLIENT-SIDE STATE - NO ANSWERS STORED HERE

export const App = () => {
  const [currentPost, setCurrentPost] = useState<any>(null);
  const [guessedSubreddit, setGuessedSubreddit] = useState('');
  const [subredditOptions, setSubredditOptions] = useState<string[]>([]);
  const [guessedYear, setGuessedYear] = useState(2020);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [gameMode, setGameMode] = useState('solo'); // 'solo', 'daily', 'multiplayer'

  const [showAchievement, setShowAchievement] = useState<string | null>(null);
  const [communityStats, setCommunityStats] = useState({
    totalPlayers: 0,
    postsGuessed: 0,
    perfectScores: 0
  });
  const [recentGuesses, setRecentGuesses] = useState<any[]>([]);
  const [currentScreen, setCurrentScreen] = useState('registration'); // 'registration', 'menu', 'game', 'leaderboard', 'community', 'result', 'multiplayer-lobby', 'tutorial'
  const [username, setUsername] = useState('');
  const [multiplayerRoom, setMultiplayerRoom] = useState<any>(null);
  const [roomCode, setRoomCode] = useState('');
  const [playersInRoom, setPlayersInRoom] = useState<any[]>([]);
  const [isRoomHost, setIsRoomHost] = useState(false);
  const [gameStartCountdown, setGameStartCountdown] = useState(0);
  const [multiplayerGuesses, setMultiplayerGuesses] = useState<any[]>([]);
  const [multiplayerRound, setMultiplayerRound] = useState(1);
  const [waitingForOthers, setWaitingForOthers] = useState(false);
  const [allPlayersSubmitted, setAllPlayersSubmitted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [gameTimer, setGameTimer] = useState(60); // 60 seconds per round
  const [timerActive, setTimerActive] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [, setShowResult] = useState(false);
  const [, setAchievements] = useState<string[]>([]);
  const [isLoadingRedditData, setIsLoadingRedditData] = useState(false);
  const [, setLiveSubredditData] = useState<any>(null);
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);
  const [lastGuessCorrect, setLastGuessCorrect] = useState<boolean | null>(null);
  const [lastGuessPartial, setLastGuessPartial] = useState(false);
  const [screenShake, setScreenShake] = useState<string | null>(null);
  const [currentAnswerId, setCurrentAnswerId] = useState<string | null>(null);
  const [revealedAnswer, setRevealedAnswer] = useState<{ subreddit: string, year: number } | null>(null);

  const [difficulty, setDifficulty] = useState('difficult'); // 'easy', 'difficult'

  // Load player data from server
  const loadPlayerData = async () => {
    try {
      const response = await fetch('/api/player/load');
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          setBestStreak(result.data.bestStreak);
          setTotalCorrect(result.data.totalCorrect);
          setCurrentStreak(result.data.currentStreak);
        }
      }
    } catch (error) {
      console.error('Failed to load player data:', error);
    }
  };

  // Save player data to server
  const savePlayerData = async () => {
    try {
      await fetch('/api/player/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bestStreak,
          totalCorrect,
          currentStreak
        })
      });
    } catch (error) {
      console.error('Failed to save player data:', error);
    }
  };



  // Initialize app and load player data
  useEffect(() => {
    // Inject CSS styles
    if (typeof document !== 'undefined' && document.head) {
      const styleSheet = document.createElement('style');
      styleSheet.textContent = sliderStyles;
      document.head.appendChild(styleSheet);
    }

    // Initialize with Reddit username and load player data
    const initializeApp = async () => {
      try {
        const response = await fetch('/api/init');
        if (response.ok) {
          const data = await response.json();
          if (data.username && data.username !== 'anonymous') {
            setUsername(data.username);
            setCurrentScreen('menu');
            // Load player data from server
            await loadPlayerData();
          } else {
            // Fallback to localStorage for username
            const savedUsername = localStorage.getItem('lezguess_username');
            if (savedUsername && savedUsername.trim().length >= 3) {
              setUsername(savedUsername);
              setCurrentScreen('menu');
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Fallback to localStorage
        const savedUsername = localStorage.getItem('lezguess_username');
        if (savedUsername && savedUsername.trim().length >= 3) {
          setUsername(savedUsername);
          setCurrentScreen('menu');
        }
      }
    };

    initializeApp();
    fetchCommunityStats();
  }, []);

  // Real multiplayer using faster Redis polling with heartbeat
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let heartbeatInterval: NodeJS.Timeout;

    if (multiplayerRoom) {
      setIsConnected(true);

      // Send heartbeat every 5 seconds to keep player active
      heartbeatInterval = setInterval(async () => {
        try {
          await fetch('/api/multiplayer/heartbeat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomCode: multiplayerRoom.code, username })
          });
        } catch (error) {
          console.error('Heartbeat failed:', error);
        }
      }, 5000);

      // Poll for room updates every 500ms for better sync
      pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/multiplayer/room/${multiplayerRoom.code}`);
          if (response.ok) {
            const data = await response.json();
            if (data.status === 'success') {
              // Force update if player list changed
              const currentPlayerCount = playersInRoom.length;
              const newPlayerCount = data.room.players.length;

              if (currentPlayerCount !== newPlayerCount) {
                console.log(`Player count changed: ${currentPlayerCount} -> ${newPlayerCount}`);
              }

              setPlayersInRoom(data.room.players);

              // Check for round progression
              const currentRoomRound = multiplayerRoom?.currentRound || 1;
              const newRoomRound = data.room.currentRound || 1;

              setMultiplayerRoom(data.room);

              // Check if game state changed (initial start)
              if (data.room.gameStarted && currentScreen === 'multiplayer-lobby' && !gameStarted) {
                console.log('Game starting - switching to game screen');
                setGameStarted(true);
                setCurrentScreen('game');
                startNewRound();
              }

              // Check for round progression (during game)
              if (data.room.gameStarted && currentScreen === 'result' && newRoomRound > currentRoomRound) {
                console.log(`Round progressed: ${currentRoomRound} -> ${newRoomRound}`);
                setMultiplayerRound(newRoomRound);
                setWaitingForOthers(false);
                setAllPlayersSubmitted(false);

                if (data.room.gameEnded) {
                  setCurrentScreen('multiplayer-final');
                } else {
                  startNewRound();
                }
              }
            }
          }
        } catch (error) {
          console.error('Failed to poll room updates:', error);
          setIsConnected(false);
        }
      }, 500); // Much faster polling - 500ms instead of 2000ms
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      setIsConnected(false);
    };
  }, [multiplayerRoom?.code, playersInRoom.length, currentScreen]);

  // REMOVED: submitMultiplayerGuess - now handled in submitGuess with server-side validation

  // Fetch live Reddit data for enhanced experience
  const fetchLiveRedditData = async (subreddit: string) => {
    setIsLoadingRedditData(true);
    try {
      const response = await fetch(`/api/reddit-data/${subreddit}`);
      if (response.ok) {
        const data = await response.json();
        setLiveSubredditData((prev: any) => ({
          ...prev,
          [subreddit]: data
        }));
      }
    } catch (error) {
      console.error('Failed to fetch Reddit data:', error);
    } finally {
      setIsLoadingRedditData(false);
    }
  };

  // Fetch real community stats
  const fetchCommunityStats = async () => {
    try {
      const response = await fetch('/api/community-stats');
      if (response.ok) {
        const stats = await response.json();
        setCommunityStats(stats);
      }
    } catch (error) {
      console.error('Failed to fetch community stats:', error);
    }
  };

  // Fetch real community guesses
  const fetchCommunityGuesses = async () => {
    try {
      const response = await fetch('/api/community/recent-guesses');
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setRecentGuesses(data.guesses);
        }
      }
    } catch (error) {
      console.error('Failed to fetch community guesses:', error);
    }
  };

  const fetchRedditData = async (subreddit: string) => {
    setIsLoadingRedditData(true);
    try {
      const response = await fetch(`/api/reddit-data/${subreddit}`);
      if (response.ok) {
        const data = await response.json();
        setLiveSubredditData(data);
      }
    } catch (error) {
      console.error('Failed to fetch Reddit data:', error);
    } finally {
      setIsLoadingRedditData(false);
    }
  };

  // Report game completion to update real stats
  const reportGameCompletion = async (score: number, isPerfect: boolean) => {
    try {
      await fetch('/api/game-completed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, isPerfect })
      });
      // Refresh stats after reporting
      fetchCommunityStats();
    } catch (error) {
      console.error('Failed to report game completion:', error);
    }
  };

  // Fetch real community stats on mount and periodically
  useEffect(() => {
    fetchCommunityStats(); // Initial fetch
    const interval = setInterval(fetchCommunityStats, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  // Poll community guesses when on community screen
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (currentScreen === 'community') {
      fetchCommunityGuesses(); // Initial fetch
      interval = setInterval(fetchCommunityGuesses, 10000); // Every 10 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentScreen]);

  // Game timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && gameTimer > 0) {
      interval = setInterval(() => {
        setGameTimer(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            // Auto-submit when timer runs out
            if (currentScreen === 'game') {
              submitGuess();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, gameTimer, currentScreen]);

  const startNewRound = async () => {
    // For daily challenge, only allow one round per day
    if (gameMode === 'daily' && dailyCompleted) {
      setCurrentScreen('daily-complete');
      return;
    }

    let postData;
    let multiplayerOptions: string[] = [];

    // In multiplayer, get the post from server to ensure all players see the same question
    if (multiplayerRoom) {
      try {
        const response = await fetch(`/api/multiplayer/current-post/${multiplayerRoom.code}`);
        if (response.ok) {
          const data = await response.json();
          postData = data.post;
          multiplayerOptions = data.options || [];
        } else {
          console.error('Failed to fetch multiplayer post');
          return;
        }
      } catch (error) {
        console.error('Failed to fetch multiplayer post:', error);
        return;
      }
    } else {
      // Solo/daily mode - get random post from server (NO ANSWERS SENT TO CLIENT)
      try {
        const response = await fetch('/api/game/random-post');
        if (response.ok) {
          const data = await response.json();
          postData = data.post;
          multiplayerOptions = data.options || [];
          setCurrentAnswerId(data.answerId); // Store answer ID for validation
        } else {
          console.error('Failed to fetch random post');
          return;
        }
      } catch (error) {
        console.error('Failed to fetch random post:', error);
        return;
      }
    }

    setCurrentPost(postData);
    setCurrentScreen('game');
    setGuessedSubreddit('');
    setGuessedYear(2020);
    setRevealedAnswer(null); // Clear previous answer

    // Use server-provided options
    setSubredditOptions(multiplayerOptions);

    // Start timer for all game modes to add pressure
    setGameTimer(60);
    setTimerActive(true);
  };

  const goToMenu = () => {
    setCurrentPost(null);
    setCurrentScreen('menu');
    setTimerActive(false);
    // Reset multiplayer state when going to menu
    setGameMode('solo');
    setMultiplayerRoom(null);
    setGameStarted(false);
    setWaitingForOthers(false);
  };

  const showLeaderboardScreen = () => {
    setCurrentScreen('leaderboard');
  };

  const showCommunityScreen = () => {
    setCurrentScreen('community');
    fetchCommunityGuesses(); // Load real data when showing community screen
  };

  // REMOVED: calculateScore - now done server-side for security

  const submitGuess = async () => {
    if (!currentPost) return;

    let validationResult;

    // Handle multiplayer vs solo/daily differently
    if (gameMode === 'multiplayer' && multiplayerRoom) {
      // Multiplayer: submit to multiplayer endpoint
      try {
        setWaitingForOthers(true);
        const response = await fetch('/api/multiplayer/submit-guess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode: multiplayerRoom.code,
            guessedSubreddit,
            guessedYear,
            username
          })
        });

        if (response.ok) {
          const data = await response.json();
          validationResult = {
            score: data.playerScore,
            correctAnswer: data.correctAnswer,
            isCorrectSubreddit: guessedSubreddit.toLowerCase() === data.correctAnswer.subreddit.toLowerCase(),
            isCorrectYear: guessedYear === data.correctAnswer.year,
            isPerfect: guessedSubreddit.toLowerCase() === data.correctAnswer.subreddit.toLowerCase() && guessedYear === data.correctAnswer.year
          };

          if (data.allSubmitted) {
            setAllPlayersSubmitted(true);
            setMultiplayerGuesses(data.room.roundGuesses);
            setMultiplayerRoom(data.room);
            setWaitingForOthers(false);
          }
        } else {
          console.error('Failed to submit multiplayer guess');
          setWaitingForOthers(false);
          return;
        }
      } catch (error) {
        console.error('Failed to submit multiplayer guess:', error);
        setWaitingForOthers(false);
        return;
      }
    } else {
      // Solo/Daily: validate with server
      if (!currentAnswerId) {
        console.error('No answer ID available');
        return;
      }

      try {
        const response = await fetch('/api/game/validate-guess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answerId: currentAnswerId,
            guessedSubreddit,
            guessedYear: difficulty === 'easy' ? null : guessedYear, // Don't send year in easy mode
            difficulty
          })
        });

        if (response.ok) {
          const data = await response.json();
          validationResult = data;
        } else {
          console.error('Failed to validate guess');
          return;
        }
      } catch (error) {
        console.error('Failed to validate guess:', error);
        return;
      }
    }

    // Store correct answer separately for display (not in currentPost to avoid exposure)
    const correctAnswer = validationResult.correctAnswer;
    setRevealedAnswer(correctAnswer);

    const roundScore = validationResult.score;
    const isPerfectGuess = validationResult.isPerfect;

    // STREAK SYSTEM - The dopamine mechanic!
    if (isPerfectGuess) {
      // CORRECT! Increase streak and total
      const newStreak = currentStreak + 1;
      const newTotal = totalCorrect + 1;

      setCurrentStreak(newStreak);
      setTotalCorrect(newTotal);
      setLastGuessCorrect(true);
      setLastGuessPartial(false);
      setShowStreakAnimation(true);
      
      // Screen shake for perfect answer!
      setScreenShake('shake-correct');
      setTimeout(() => setScreenShake(null), 600);

      // Update best streak
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
      }

      // Save progress to server
      setTimeout(() => savePlayerData(), 100);

      // Add score for perfect guess
      setScore(score + roundScore);

      // Show streak animation
      setTimeout(() => setShowStreakAnimation(false), 2000);
    } else {
      // NOT PERFECT! Reset current streak but keep total correct
      setCurrentStreak(0);

      // Check if it's partial (some points) or completely wrong (0 points)
      if (roundScore > 0) {
        setLastGuessCorrect(null); // Neither true nor false - it's partial
        setLastGuessPartial(true);
        
        // Screen shake for partial answer
        setScreenShake('shake-partial');
        setTimeout(() => setScreenShake(null), 400);
      } else {
        setLastGuessCorrect(false); // Completely wrong
        setLastGuessPartial(false);
      }

      // In solo mode: reset total score but still show round score
      // In daily/multiplayer: accumulate all points
      if (gameMode === 'solo') {
        setScore(0); // Reset total score on non-perfect guess (streak system)
      } else {
        setScore(score + roundScore); // Keep accumulating points for competitive modes
      }

      // Save updated data to server
      setTimeout(() => savePlayerData(), 100);
    }

    setRound(round + 1);
    setShowResult(true);
    setLastScore(roundScore);

    setCurrentScreen('result');

    // Check for achievements
    checkAchievements();

    // Report game completion for real stats
    reportGameCompletion(roundScore, isPerfectGuess);

    // Add to community feed via API
    try {
      await fetch('/api/community/add-guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username || 'Anonymous',
          post: currentPost.content,
          guessedSubreddit,
          actualSubreddit: validationResult.correctAnswer.subreddit,
          score: roundScore
        })
      });
    } catch (error) {
      console.error('Failed to add guess to community feed:', error);
    }

    // Update leaderboard via real API
    if (gameMode === 'daily') {
      updateDailyLeaderboard(score + roundScore);
      setDailyCompleted(true); // Mark daily as completed after first submission
    }
  };

  const updateDailyLeaderboard = async (finalScore: number) => {
    try {
      // Submit score to backend
      const response = await fetch('/api/score/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: finalScore,
          gameMode,
          username: username || 'Anonymous'
        })
      });
      const data = await response.json();

      if (data.status === 'success') {
        // Fetch updated leaderboard
        const leaderboardResponse = await fetch('/api/leaderboard/daily');
        const leaderboardData = await leaderboardResponse.json();
        setLeaderboard(leaderboardData.data || []);
      } else if (data.status === 'already_played') {
        // Show message in UI instead of alert (which is blocked)
        setCurrentScreen('daily-complete');
      }
    } catch (error) {
      console.error('Failed to update leaderboard:', error);
    }
  };

  const registerUser = () => {
    if (username.trim().length >= 3) {
      setCurrentScreen('menu');
      // Store username in localStorage for persistence
      localStorage.setItem('lezguess_username', username.trim());
    }
  };

  const createMultiplayerRoom = async () => {
    try {
      const response = await fetch('/api/multiplayer/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const data = await response.json();

      if (data.status === 'success') {
        setMultiplayerRoom(data.room);
        setRoomCode(data.room.code);
        setPlayersInRoom(data.room.players);
        setIsRoomHost(true);
        setGameStarted(false);
        setGameMode('multiplayer'); // Set gameMode when creating room
        setCurrentScreen('multiplayer-lobby');
      }
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const joinMultiplayerRoom = async (code: string) => {
    try {
      console.log(`Attempting to join room: ${code.toUpperCase()}`);

      const response = await fetch('/api/multiplayer/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: code.toUpperCase(), username })
      });
      const data = await response.json();

      console.log('Join room response:', data);

      if (data.status === 'success') {
        setMultiplayerRoom(data.room);
        setRoomCode(data.room.code);
        setPlayersInRoom(data.room.players);
        setIsRoomHost(data.room.host === username);
        setGameStarted(false);
        setGameMode('multiplayer'); // Set gameMode when joining room
        setCurrentScreen('multiplayer-lobby');

        console.log(`Successfully joined room ${code}. Players: ${data.room.players.length}`);
      } else {
        console.error('Join room failed:', data.message);
        alert(data.message || 'Failed to join room');
      }
    } catch (error) {
      console.error('Failed to join room:', error);
      alert('Network error: Failed to join room');
    }
  };

  const startMultiplayerGame = async () => {
    if (isRoomHost && playersInRoom.length >= 1) {
      try {
        // Signal server to start the game
        const response = await fetch('/api/multiplayer/start-game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomCode: multiplayerRoom?.code, username })
        });

        if (response.ok) {
          setGameStartCountdown(3);
          const countdown = setInterval(() => {
            setGameStartCountdown(prev => {
              if (prev <= 1) {
                clearInterval(countdown);
                setGameMode('multiplayer');
                // Don't call startNewRound here - let the polling detection handle it
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      } catch (error) {
        console.error('Failed to start multiplayer game:', error);
      }
    }
  };

  const checkAchievements = () => {
    const newAchievements: string[] = [];

    // Streak-based achievements
    if (currentStreak === 5) newAchievements.push("🔥 On Fire! 5 in a row!");
    if (currentStreak === 10) newAchievements.push("🚀 Unstoppable! 10 streak!");
    if (currentStreak === 25) newAchievements.push("🏆 LEGENDARY! 25 streak!");
    if (currentStreak === 50) newAchievements.push("👑 REDDIT GOD! 50 streak!");

    // Total correct achievements
    if (totalCorrect === 10) newAchievements.push("🎯 Getting Good! 10 total correct!");
    if (totalCorrect === 50) newAchievements.push("� Reddit  Scholar! 50 total correct!");
    if (totalCorrect === 100) newAchievements.push("🧠 Reddit Historian! 100 total correct!");

    if (newAchievements.length > 0) {
      setAchievements((prev: string[]) => [...prev, ...newAchievements]);
      setShowAchievement(newAchievements[0] || null);
      setTimeout(() => setShowAchievement(null), 3000);
    }
  };

  // Registration screen
  if (currentScreen === 'registration') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-900 via-gray-900 to-red-900 text-white p-4">
        <div className="flex flex-col justify-center items-center min-h-screen">
          <div className="text-center mb-8">
            <div className="mb-6">
              <img 
                src="/splash-art.svg" 
                alt="LezGuess - Reddit History Challenge" 
                className="w-32 h-32 sm:w-40 sm:h-40 mx-auto drop-shadow-2xl"
              />
            </div>
            <p className="text-base sm:text-xl mb-2 text-gray-300">The Ultimate Reddit History Challenge</p>
            <p className="text-sm sm:text-base mb-4 text-gray-400">Join the community and compete with redditors worldwide!</p>

            {/* Game explanation for demo */}
            <div className="bg-gray-800 rounded-lg p-4 mb-4 max-w-2xl mx-auto">
              <h3 className="text-lg font-bold text-orange-400 mb-3">🎮 How to Play</h3>
              <div className="text-left space-y-2 text-sm text-gray-300">
                <p>• <strong>Guess legendary Reddit posts</strong> from 2005-2024</p>
                <p>• <strong>Identify the subreddit and year</strong> of iconic moments</p>
                <p>• <strong>Compete in real-time multiplayer</strong> or daily challenges</p>
                <p>• <strong>Build streaks</strong> and climb the leaderboards</p>
                <p>• <strong>50 curated posts</strong> including EA's downvoted comment, Boston bomber, Keanu memes, and more!</p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-md bg-gray-800 rounded-lg p-4 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-center text-orange-400">Choose Your Username</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Username (3-20 characters)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.slice(0, 20))}
                placeholder="Enter your username..."
                className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-orange-500 focus:outline-none text-lg"
                maxLength={20}
                onKeyPress={(e) => e.key === 'Enter' && registerUser()}
              />
              <p className="text-xs text-gray-400 mt-2">
                {username.length}/20 characters • No email or password required
              </p>
            </div>

            <button
              onClick={registerUser}
              disabled={username.trim().length < 3}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
            >
              {username.trim().length < 3 ? 'Enter Username (min 3 chars)' : 'Start Playing!'}
            </button>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                🔒 Privacy-first: No personal data collected<br />
                🎮 Just pick a name and start playing!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Start screen with game mode selection
  if (currentScreen === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-900 via-gray-900 to-red-900 text-white p-4">
        <div className="flex flex-col justify-center items-center min-h-screen">
          <div className="text-center mb-8">
            <div className="mb-6">
              <img 
                src="/splash-art.svg" 
                alt="LezGuess - Reddit History Challenge" 
                className="w-24 h-24 sm:w-32 sm:h-32 mx-auto drop-shadow-xl"
              />
            </div>
            <p className="text-base sm:text-xl mb-2 text-gray-300">Welcome back, {username}!</p>

            {/* Player Stats Display */}
            <div className="flex justify-center gap-4 sm:gap-6 mb-4">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-400">{totalCorrect}</div>
                <div className="text-xs text-gray-400">Total Correct</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-purple-400">{bestStreak}</div>
                <div className="text-xs text-gray-400">Best Streak</div>
              </div>
            </div>

            <p className="text-sm sm:text-base mb-4 text-gray-400">
              {bestStreak > 0 ? `Beat your streak of ${bestStreak}!` : 'Start your winning streak!'}
            </p>

            {/* Difficulty Selection */}
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-bold text-orange-400 mb-3">🎚️ Difficulty Level</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDifficulty('easy')}
                  className={`p-3 rounded-lg font-bold transition-colors ${
                    difficulty === 'easy' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  🟢 Easy
                  <div className="text-xs mt-1 opacity-75">Subreddit only</div>
                </button>
                <button
                  onClick={() => setDifficulty('difficult')}
                  className={`p-3 rounded-lg font-bold transition-colors ${
                    difficulty === 'difficult' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  🔴 Difficult
                  <div className="text-xs mt-1 opacity-75">Subreddit + Year</div>
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 w-full max-w-md">
            <button
              onClick={() => {
                setGameMode('solo');
                startNewRound();
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg text-base transition-colors"
            >
              🎯 Solo Challenge
            </button>

            <button
              onClick={async () => {
                setGameMode('daily');
                // Check if already played today before starting
                try {
                  const response = await fetch('/api/score/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      score: 0,
                      gameMode: 'daily',
                      username: username || 'Anonymous',
                      checkOnly: true
                    })
                  });
                  const data = await response.json();

                  if (data.status === 'already_played') {
                    setCurrentScreen('daily-complete');
                  } else {
                    startNewRound();
                  }
                } catch (error) {
                  startNewRound(); // Fallback to allow play
                }
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-base transition-colors"
            >
              📅 Daily Challenge
            </button>

            <button
              onClick={createMultiplayerRoom}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-base transition-colors"
            >
              👥 Create Multiplayer Room
            </button>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Room Code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="flex-1 p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none text-center font-mono"
                maxLength={6}
              />
              <button
                onClick={() => joinMultiplayerRoom(roomCode)}
                disabled={roomCode.length !== 6}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Join
              </button>
            </div>

            <button
              onClick={showLeaderboardScreen}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all"
            >
              🏆 Leaderboard
            </button>

            <button
              onClick={showCommunityScreen}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all"
            >
              🌍 Live Community Feed
            </button>

            <button
              onClick={() => setCurrentScreen('tutorial')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all"
            >
              📚 How to Play
            </button>


          </div>

          <div className="mt-8 text-center text-gray-400">
            <p className="text-xs sm:text-sm">Playing as: <span className="text-orange-400 font-bold">{username}</span></p>
          </div>
        </div>
      </div>
    );
  }

  // Multiplayer lobby screen
  if (currentScreen === 'multiplayer-lobby') {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-blue-500">👥 Multiplayer Lobby</h1>
              <p className="text-gray-400">Room Code: <span className="text-blue-400 font-mono text-lg">{multiplayerRoom?.code}</span></p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
                <span className="text-sm text-gray-400">
                  {isConnected ? `Live sync • ${playersInRoom.length} players` : 'Reconnecting...'}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  // Force refresh room state
                  try {
                    const response = await fetch(`/api/multiplayer/room/${multiplayerRoom?.code}`);
                    if (response.ok) {
                      const data = await response.json();
                      if (data.status === 'success') {
                        setPlayersInRoom(data.room.players);
                        setMultiplayerRoom(data.room);
                        console.log('Room state refreshed:', data.room);
                      }
                    }
                  } catch (error) {
                    console.error('Failed to refresh room:', error);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
              >
                🔄 Refresh
              </button>
              <button
                onClick={goToMenu}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
              >
                Leave Room
              </button>
            </div>
          </div>

          {gameStartCountdown > 0 && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
              <div className="text-center">
                <h2 className="text-6xl font-bold text-orange-400 mb-4">Game Starting...</h2>
                <p className="text-8xl font-bold text-white">{gameStartCountdown}</p>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-orange-400">
                Players ({playersInRoom.length}/8)
              </h2>
              <div className="space-y-3">
                {playersInRoom.map((player, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {player.username === multiplayerRoom?.host ? '👑' : '👤'}
                      </span>
                      <span className="font-bold text-white">{player.username}</span>
                      {player.username === username && (
                        <span className="text-orange-400 text-sm">(You)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Score: {player.score}</span>
                      <span className={`w-3 h-3 rounded-full ${player.ready ? 'bg-green-400' : 'bg-red-400'}`}></span>
                    </div>
                  </div>
                ))}
              </div>

              {playersInRoom.length < 1 && (
                <div className="mt-4 p-4 bg-yellow-900 bg-opacity-50 rounded-lg">
                  <p className="text-yellow-400 text-sm">
                    ⏳ Waiting for players... Share the room code: <span className="font-mono font-bold">{multiplayerRoom?.code}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-green-400">Game Rules</h2>

              {/* Debug info for troubleshooting */}
              <div className="mb-4 p-2 bg-gray-700 rounded text-xs">
                <p className="text-yellow-400">Debug Info:</p>
                <p>Room: {multiplayerRoom?.code}</p>
                <p>Players: {playersInRoom.length}</p>
                <p>Host: {multiplayerRoom?.host}</p>
                <p>You: {username}</p>
                <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
                <p>Last Update: {new Date().toLocaleTimeString()}</p>
              </div>
              <div className="space-y-3 text-gray-300">
                <div className="flex items-start gap-3">
                  <span className="text-orange-400">🎯</span>
                  <p>All players see the same Reddit post</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-orange-400">⏱️</span>
                  <p>60 seconds to guess subreddit and year</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-orange-400">🏆</span>
                  <p>Points based on accuracy and speed</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-orange-400">👑</span>
                  <p>Highest total score wins the round</p>
                </div>
              </div>

              {isRoomHost ? (
                <div className="mt-6">
                  <button
                    onClick={startMultiplayerGame}
                    disabled={playersInRoom.length < 1}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
                  >
                    {playersInRoom.length < 1 ? 'Need 1+ Players to Start' : 'Start Game!'}
                  </button>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    You are the host - only you can start the game
                  </p>
                </div>
              ) : (
                <div className="mt-6 text-center">
                  <p className="text-gray-400">Waiting for host to start the game...</p>
                  <div className="flex justify-center mt-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-400"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Result screen
  if (currentScreen === 'result' && currentPost) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-4xl mx-auto py-4">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-orange-500 text-center">Round {round} Results</h2>

          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <p className="text-base sm:text-lg mb-3 text-gray-300">"{currentPost.content}"</p>
            <p className="text-sm text-gray-400">r/{revealedAnswer?.subreddit || '???'} • {revealedAnswer?.year || '????'}</p>
            <p className="text-sm text-gray-400">{currentPost.context}</p>
          </div>

          {gameMode === 'multiplayer' && multiplayerGuesses.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <h3 className="text-xl font-bold mb-4 text-blue-400">🏆 Round Results</h3>
              <div className="space-y-3">
                {multiplayerGuesses
                  .sort((a, b) => b.score - a.score)
                  .map((guess, index) => (
                    <div key={index} className="p-4 bg-gray-700 rounded-lg border-l-4 border-blue-500">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                          </span>
                          <span className="font-bold text-white text-lg">{guess.username}</span>
                          {guess.username === username && (
                            <span className="text-orange-400 text-sm">(You)</span>
                          )}
                        </div>
                        <span className="text-xl font-bold text-green-400">+{guess.score} pts</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Subreddit:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white">r/{guess.guess.subreddit}</span>
                            {guess.guess.subreddit.toLowerCase() === revealedAnswer?.subreddit.toLowerCase() ? (
                              <span className="text-green-400">✓</span>
                            ) : (
                              <span className="text-red-400">✗</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Year:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white">{guess.guess.year}</span>
                            {guess.guess.year === revealedAnswer?.year ? (
                              <span className="text-green-400">✓</span>
                            ) : (
                              <span className="text-red-400">✗ ({revealedAnswer?.year})</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {guess.score === 200 && (
                        <div className="mt-2 text-center">
                          <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                            🎯 PERFECT SCORE!
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-400">
                  Correct answer: <span className="text-orange-400 font-bold">r/{revealedAnswer?.subreddit}</span> • <span className="text-orange-400 font-bold">{revealedAnswer?.year}</span>
                </p>
              </div>
            </div>
          )}

          <div className="text-center mb-8">
            {lastGuessCorrect === true ? (
              <div className="mb-4">
                <div className="text-5xl mb-3">✅</div>
                <p className="text-3xl sm:text-4xl font-bold text-green-400 mb-2">PERFECT!</p>
                <p className="text-xl sm:text-2xl text-green-300 mb-2">+{lastScore} points! 🔥 Streak: {currentStreak}</p>

                {/* Score breakdown */}
                <div className="bg-gray-700 rounded-lg p-4 mt-4 text-left max-w-md mx-auto">
                  <p className="text-sm font-bold text-gray-300 mb-2">
                    {difficulty === 'easy' ? 'Easy Mode Score:' : 'Perfect Score Breakdown:'}
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subreddit ({guessedSubreddit}):</span>
                      <span className="text-green-400">{difficulty === 'easy' ? '+200' : '+100'}</span>
                    </div>
                    {difficulty === 'difficult' && (
                      <div className="flex justify-between">
                        <span>Year ({guessedYear}):</span>
                        <span className="text-green-400">+100</span>
                      </div>
                    )}
                    {difficulty === 'easy' && (
                      <div className="flex justify-between text-green-300">
                        <span>Easy Mode Bonus:</span>
                        <span className="text-green-400">Double points!</span>
                      </div>
                    )}
                    <div className="border-t border-gray-600 pt-1 flex justify-between font-bold">
                      <span>Total:</span>
                      <span className="text-green-400">+{lastScore}</span>
                    </div>
                  </div>
                </div>

                <p className="text-lg text-blue-300 mt-3">🎯 Total Correct: {totalCorrect}</p>
                {currentStreak > bestStreak - 1 && currentStreak > 1 && (
                  <p className="text-lg text-purple-400 mt-2">👑 NEW BEST STREAK!</p>
                )}
              </div>
            ) : lastGuessPartial ? (
              <div className="mb-4">
                <div className="text-5xl mb-3">🔶</div>
                <p className="text-3xl sm:text-4xl font-bold text-orange-400 mb-2">PARTIAL!</p>
                <p className="text-xl text-orange-300 mb-2">+{lastScore} points, but streak reset 💔</p>

                {/* Score breakdown */}
                <div className="bg-gray-700 rounded-lg p-4 mt-4 text-left max-w-md mx-auto">
                  <p className="text-sm font-bold text-gray-300 mb-2">Score Breakdown:</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subreddit ({guessedSubreddit}):</span>
                      <span className={guessedSubreddit.toLowerCase() === revealedAnswer?.subreddit.toLowerCase() ? 'text-green-400' : 'text-red-400'}>
                        {guessedSubreddit.toLowerCase() === revealedAnswer?.subreddit.toLowerCase() ? 
                          (difficulty === 'easy' ? '+200' : '+100') : '+0'}
                      </span>
                    </div>
                    {difficulty === 'difficult' && (
                      <div className="flex justify-between">
                        <span>Year ({guessedYear}):</span>
                        <span className={guessedYear === revealedAnswer?.year ? 'text-green-400' : 'text-orange-400'}>
                          {revealedAnswer ? `+${Math.max(0, 100 - (Math.abs(guessedYear - revealedAnswer.year) * 20))}` : '+0'}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-gray-600 pt-1 flex justify-between font-bold">
                      <span>Total:</span>
                      <span className="text-orange-400">+{lastScore}</span>
                    </div>
                  </div>
                </div>

                <p className="text-lg text-gray-400 mt-3">{gameMode === 'solo' ? 'Score Reset to 0' : `Total Score: ${score}`}</p>
                <p className="text-lg text-blue-300 mt-2">🎯 Total Correct: {totalCorrect}</p>
              </div>
            ) : lastGuessCorrect === false ? (
              <div className="mb-4">
                <div className="text-5xl mb-3">❌</div>
                <p className="text-3xl sm:text-4xl font-bold text-red-400 mb-2">WRONG!</p>
                <p className="text-xl text-red-300 mb-2">Streak Reset 💔</p>

                {/* Score breakdown */}
                <div className="bg-gray-700 rounded-lg p-4 mt-4 text-left max-w-md mx-auto">
                  <p className="text-sm font-bold text-gray-300 mb-2">Score Breakdown:</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subreddit ({guessedSubreddit}):</span>
                      <span className="text-red-400">+0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Year ({guessedYear}):</span>
                      <span className="text-red-400">+0</span>
                    </div>
                    <div className="border-t border-gray-600 pt-1 flex justify-between font-bold">
                      <span>Total:</span>
                      <span className="text-red-400">+0</span>
                    </div>
                  </div>
                </div>

                <p className="text-lg text-gray-400 mt-3">{gameMode === 'solo' ? 'Score Reset to 0' : `Total Score: ${score}`}</p>
                <p className="text-lg text-blue-300 mt-2">🎯 Total Correct: {totalCorrect}</p>
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-2xl sm:text-3xl font-bold text-green-400 mb-2">+{lastScore} points!</p>
                <p className="text-lg sm:text-xl text-gray-300">Your Total Score: {score}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {gameMode === 'solo' && (
              <>
                {lastGuessCorrect === true ? (
                  <button
                    onClick={startNewRound}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg transition-colors text-xl"
                  >
                    🔥 Keep the Streak Going!
                  </button>
                ) : lastGuessCorrect === false ? (
                  <button
                    onClick={() => {
                      // Reset for new attempt
                      setCurrentStreak(0);
                      setScore(0);
                      startNewRound();
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg transition-colors text-xl"
                  >
                    💪 Try Again! Beat {bestStreak}!
                  </button>
                ) : (
                  <button
                    onClick={startNewRound}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    Next Round
                  </button>
                )}
              </>
            )}
            {gameMode === 'daily' && (
              <button
                onClick={() => setCurrentScreen('leaderboard')}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                🏆 View Leaderboard
              </button>
            )}
            {gameMode === 'multiplayer' && (
              <div className="text-center">
                {waitingForOthers ? (
                  <div>
                    <div className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg mb-4">
                      ⏳ Waiting for Other Players...
                    </div>

                    {/* Show submission status */}
                    <div className="bg-gray-800 rounded-lg p-4 mb-4">
                      <h4 className="text-lg font-bold text-blue-400 mb-3">Submission Status</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {playersInRoom.map((player, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                            <span className="text-white">{player.username}</span>
                            {player.hasSubmitted ? (
                              <span className="text-green-400">✅ Submitted</span>
                            ) : (
                              <span className="text-yellow-400">⏳ Thinking...</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="text-sm text-gray-400">
                      Results will be shown when everyone submits
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg mb-2">
                      ✅ Round Complete!
                    </div>
                    <p className="text-sm text-gray-400">
                      Advancing to next round automatically...
                    </p>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => {
                setRound(0);
                setScore(0);
                setCurrentStreak(0);
                setMultiplayerGuesses([]);
                goToMenu();
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              End Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game screen
  if (currentScreen === 'game' && currentPost) {
    return (
      <div className={`min-h-screen bg-gray-900 text-white p-4 relative ${screenShake || ''}`}>
        {/* Achievement Notification */}
        {showAchievement && (
          <div className="fixed top-4 right-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-4 py-3 rounded-lg shadow-lg z-50 max-w-xs">
            <p className="font-bold text-sm sm:text-lg">{showAchievement}</p>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          {/* Mobile-First Header */}
          <div className="mb-4">
            {/* Title and Timer Row */}
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={goToMenu}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Back to Menu"
                >
                  ← Back
                </button>
                <h1 className="text-lg font-bold text-orange-500">Reddit Guesser</h1>
              </div>
              {timerActive && (
                <div className="flex items-center gap-1">
                  <span className="text-lg">⏱️</span>
                  <span className={`text-base font-bold ${gameTimer <= 10 ? 'text-red-400' : 'text-orange-400'}`}>
                    {gameTimer}s
                  </span>
                </div>
              )}
            </div>

            {/* Multiplayer Info */}
            {gameMode === 'multiplayer' && (
              <div className="text-xs text-blue-400 mb-2">
                🎮 Room: {multiplayerRoom?.code} • Round {multiplayerRound}/5
              </div>
            )}

            {/* Stats Row - Compact for Mobile */}
            <div className="flex justify-between items-center text-center">
              <div className="flex-1">
                <div className={`text-lg font-bold ${currentStreak > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                  🔥 {currentStreak}
                </div>
                <p className="text-xs text-gray-400">Streak</p>
              </div>
              <div className="flex-1">
                <div className="text-lg font-bold text-blue-400">
                  🎯 {totalCorrect}
                </div>
                <p className="text-xs text-gray-400">Correct</p>
              </div>
              <div className="flex-1">
                <div className="text-lg font-bold text-purple-400">
                  👑 {bestStreak}
                </div>
                <p className="text-xs text-gray-400">Best</p>
              </div>
            </div>
          </div>

          {/* Removed distracting streak animation overlay */}

          {/* Multiplayer Players Status */}
          {gameMode === 'multiplayer' && (
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-bold text-blue-400 mb-3">Live Players</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {playersInRoom.map((player, index) => (
                  <div key={index} className="bg-gray-700 rounded p-2 text-center">
                    <p className="text-sm font-bold text-white truncate">{player.username}</p>
                    <p className="text-xs text-green-400">{player.score} pts</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mystery Post - Mobile Optimized */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4 border-l-4 border-orange-500">
            {/* Post Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-orange-400 font-bold text-sm">r/???</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400 text-xs">u/[REDACTED]</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="text-sm">▲</span>
                <span className="text-sm font-bold">
                  {currentPost.upvotes > 0 ? '+' : ''}{Math.abs(currentPost.upvotes || 0) > 1000 ?
                    `${Math.round((currentPost.upvotes || 0) / 1000)}k` :
                    (currentPost.upvotes || 0).toLocaleString()}
                </span>
                <span className="text-sm">▼</span>
              </div>
            </div>

            {/* Post Content */}
            <p className="text-base font-medium mb-3 text-white leading-relaxed">"{currentPost.content}"</p>

            {/* Context Box */}
            <div className="bg-gray-700 rounded p-3 mb-3">
              <p className="text-sm text-gray-300 mb-2">💡 {currentPost.context || 'No context available'}</p>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">
                  Mode: <span className={`font-bold ${difficulty === 'easy' ? 'text-green-400' : 'text-red-400'}`}>
                    {difficulty === 'easy' ? '🟢 EASY' : '🔴 DIFFICULT'}
                  </span>
                </span>
                <span className="text-blue-400">
                  {currentPost.year >= 2020 ? '🆕 Recent' :
                    currentPost.year >= 2015 ? '📱 Smartphone Era' :
                      currentPost.year >= 2010 ? '🌐 Social Media Boom' :
                        '🏛️ Early Internet'}
                </span>
              </div>
            </div>

            {/* Post Actions */}
            <div className="flex justify-between text-xs text-gray-400">
              <span>💬 {(currentPost.upvotes || 0) > 0 ? Math.floor((currentPost.upvotes || 0) * 0.1) : Math.floor(Math.abs(currentPost.upvotes || 0) * 0.05)}</span>
              <span>🔗 Share</span>
              <span>💾 Save</span>
              <span>🏆 Award</span>
            </div>
          </div>

          {/* Guess Form */}
          <div className="grid gap-4 mb-6">
            <div>
              <label className="block text-base mb-3 text-gray-300">Guess the subreddit:</label>
              {subredditOptions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {subredditOptions.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => setGuessedSubreddit(option)}
                      className={`p-3 rounded-lg text-base font-medium transition-colors ${guessedSubreddit === option
                        ? 'bg-orange-600 text-white border-2 border-orange-400'
                        : 'bg-gray-700 text-gray-300 border-2 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
                        }`}
                    >
                      r/{option}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 p-4">
                  Loading options...
                </div>
              )}
            </div>

            {/* Year Selection - Hidden in Easy Mode */}
            {difficulty === 'difficult' && (
              <div>
                <label className="block text-base mb-3 text-gray-300">Guess the year:</label>
                <div className="flex items-center justify-center gap-3 mb-3">
                  <button
                    onClick={() => setGuessedYear(Math.max(2005, guessedYear - 1))}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded transition-colors text-lg"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold text-white w-16 text-center">{guessedYear}</span>
                  <button
                    onClick={() => setGuessedYear(Math.min(2024, guessedYear + 1))}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded transition-colors text-lg"
                  >
                    +
                  </button>
                </div>
                <div className="text-center">
                  <input
                    type="range"
                    min="2005"
                    max="2024"
                    value={guessedYear}
                    onChange={(e) => setGuessedYear(parseInt(e.target.value, 10))}
                    className="w-full slider"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>2005</span>
                    <span>2015</span>
                    <span>2024</span>
                  </div>
                </div>
              </div>
            )}

            {/* Easy Mode Indicator */}
            {difficulty === 'easy' && (
              <div className="bg-green-900 bg-opacity-50 rounded-lg p-4 border border-green-600">
                <div className="text-center">
                  <span className="text-green-400 font-bold">🟢 Easy Mode</span>
                  <p className="text-green-300 text-sm mt-1">Just guess the subreddit - no year required!</p>
                </div>
              </div>
            )}
          </div>

          <div className="text-center">
            {waitingForOthers ? (
              <div>
                <button
                  disabled
                  className="w-full sm:w-auto bg-gray-600 cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg text-base"
                >
                  Waiting for Others...
                </button>
                <p className="text-sm text-yellow-400 mt-2">
                  ⏳ Waiting for other players to submit their guesses
                </p>
              </div>
            ) : (
              <div>
                <button
                  onClick={submitGuess}
                  disabled={!guessedSubreddit.trim()}
                  className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg text-base transition-colors"
                >
                  Submit Guess
                </button>
                {gameMode === 'multiplayer' && (
                  <p className="text-sm text-gray-400 mt-2">
                    🔴 Live: Round {multiplayerRound}/5
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Community Feed screen
  if (currentScreen === 'community') {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-green-500">🌍 Live Community Feed</h1>
            <button
              onClick={goToMenu}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              Back
            </button>
          </div>

          <div className="grid gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-orange-400">🔥 Community Stats</h2>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-blue-400">{communityStats.totalPlayers.toLocaleString()}</p>
                  <p className="text-gray-400">Players Today</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-400">{communityStats.postsGuessed.toLocaleString()}</p>
                  <p className="text-gray-400">Posts Guessed</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-400">{communityStats.perfectScores}</p>
                  <p className="text-gray-400">Perfect Scores</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-green-400">📡 Recent Guesses</h2>
                <button
                  onClick={fetchCommunityGuesses}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm py-1 px-3 rounded transition-colors"
                >
                  🔄 Refresh
                </button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentGuesses.length === 0 ? (
                  <p className="text-center text-gray-400 py-4">No recent guesses. Be the first!</p>
                ) : (
                  recentGuesses.map((guess, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-orange-400">{guess.username}</span>
                        <span className="text-sm text-gray-400">
                          {new Date(guess.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">"{guess.post}"</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">
                          Guessed: <span className="text-blue-400">r/{guess.guessedSubreddit}</span>
                          {guess.guessedSubreddit.toLowerCase() === guess.actualSubreddit.toLowerCase() ?
                            <span className="text-green-400 ml-2">✓ Correct!</span> :
                            <span className="text-red-400 ml-2">✗ (r/{guess.actualSubreddit})</span>
                          }
                        </span>
                        <span className="text-lg font-bold text-green-400">+{guess.score}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Leaderboard screen
  if (currentScreen === 'leaderboard') {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-orange-500">🏆 Daily Leaderboard</h1>
            <button
              onClick={goToMenu}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              Back
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="grid gap-4">
              {leaderboard.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No scores yet today. Be the first!</p>
              ) : (
                leaderboard.map((entry, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-orange-400">#{index + 1}</span>
                      <span className="text-lg">{entry.username}</span>
                    </div>
                    <span className="text-xl font-bold text-green-400">{entry.score}</span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setGameMode('daily');
                  startNewRound();
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
              >
                Play Daily Challenge
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Daily Challenge Complete Screen
  if (currentScreen === 'daily-complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-blue-900 text-white p-4">
        <div className="flex flex-col justify-center items-center min-h-screen">
          <div className="text-center mb-8">
            <div className="mb-6">
              <span className="text-8xl">🎯</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold mb-4 text-purple-400">
              Daily Challenge Complete!
            </h1>
            <p className="text-lg sm:text-xl mb-4 text-gray-300">
              You've already played today's challenge.
            </p>
            <p className="text-sm sm:text-lg mb-8 text-gray-400">
              Come back tomorrow for a new daily challenge!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setCurrentScreen('leaderboard')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
            >
              🏆 View Leaderboard
            </button>
            <button
              onClick={() => {
                setGameMode('solo');
                setCurrentScreen('menu');
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
            >
              🎮 Play Solo Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Multiplayer final results screen
  if (currentScreen === 'multiplayer-final' && multiplayerRoom) {
    const sortedPlayers = [...multiplayerRoom.players].sort((a, b) => b.score - a.score);

    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-4xl mx-auto py-8">
          <h2 className="text-4xl font-bold mb-6 text-center text-gold-500">🏆 Game Over!</h2>

          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h3 className="text-2xl font-bold mb-4 text-center text-orange-400">Final Leaderboard</h3>
            <div className="space-y-3">
              {sortedPlayers.map((player, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                    </span>
                    <span className="font-bold text-white">{player.username}</span>
                    {player.username === username && (
                      <span className="text-orange-400 text-sm">(You)</span>
                    )}
                  </div>
                  <span className="text-xl font-bold text-green-400">{player.score} pts</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => {
                setCurrentScreen('menu');
                setMultiplayerRoom(null);
                setMultiplayerRound(1);
                setWaitingForOthers(false);
                setAllPlayersSubmitted(false);
                setGameStarted(false);
                setGameMode('solo'); // Reset to solo when leaving multiplayer
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tutorial/How to Play screen
  if (currentScreen === 'tutorial') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-blue-900 text-white p-4">
        <div className="max-w-4xl mx-auto py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-purple-400">📚 How to Play LezGuess</h1>
            <button
              onClick={() => setCurrentScreen('menu')}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              Back to Menu
            </button>
          </div>

          <div className="space-y-8">
            {/* Game Overview */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-orange-400 mb-4">🎯 What is LezGuess?</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-lg text-gray-300 mb-4">
                    <strong>LezGuess</strong> is the ultimate Reddit history challenge! Test your knowledge of legendary Reddit posts that shaped internet culture from 2005 to 2024.
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li>• <strong>50 Curated Posts:</strong> EA's downvoted comment, Boston bomber, Keanu memes, and more!</li>
                    <li>• <strong>Real Reddit Data:</strong> Live subreddit stats via Reddit API</li>
                    <li>• <strong>Multiple Game Modes:</strong> Solo, Daily Challenge, Multiplayer</li>
                    <li>• <strong>Achievement System:</strong> Build streaks and climb leaderboards</li>
                  </ul>
                </div>
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-blue-400 mb-2">🏆 Sample Post</h3>
                  <div className="bg-gray-900 rounded p-3 text-sm">
                    <p className="text-orange-400 mb-1">r/??? • Posted by u/[REDACTED] • Year: ????</p>
                    <p className="text-white mb-2">"This is an example of a legendary Reddit post that shaped internet culture..."</p>
                    <p className="text-gray-400 text-xs">💬 ??? upvotes • Famous internet moment</p>
                  </div>
                  <p className="text-green-400 text-sm mt-2">Answer: r/ExampleSubreddit (This is just a demo)</p>
                </div>
              </div>
            </div>

            {/* How to Play */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-green-400 mb-4">🎮 How to Play</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl mb-2">1️⃣</div>
                  <h3 className="text-lg font-bold text-blue-400 mb-2">Read the Post</h3>
                  <p className="text-gray-300 text-sm">
                    You'll see a legendary Reddit post with the subreddit hidden. Read the content and context clues.
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-2">2️⃣</div>
                  <h3 className="text-lg font-bold text-blue-400 mb-2">Make Your Guess</h3>
                  <p className="text-gray-300 text-sm">
                    Choose the subreddit from multiple choice options and guess the year (2005-2024).
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-2">3️⃣</div>
                  <h3 className="text-lg font-bold text-blue-400 mb-2">Score Points</h3>
                  <p className="text-gray-300 text-sm">
                    Perfect guess = 200 points! Partial credit for close years. Build streaks for achievements.
                  </p>
                </div>
              </div>
            </div>

            {/* Game Modes */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-blue-400 mb-4">🎯 Game Modes</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-orange-700 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-white mb-2">🎯 Solo Challenge</h3>
                  <p className="text-orange-100 text-sm">
                    Practice mode with unlimited rounds. Build your streak and master Reddit history!
                  </p>
                </div>
                <div className="bg-purple-700 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-white mb-2">📅 Daily Challenge</h3>
                  <p className="text-purple-100 text-sm">
                    One chance per day! Compete on the global leaderboard with other players.
                  </p>
                </div>
                <div className="bg-blue-700 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-white mb-2">👥 Multiplayer</h3>
                  <p className="text-blue-100 text-sm">
                    Real-time multiplayer rooms! Create or join rooms with friends for live competition.
                  </p>
                </div>
              </div>
            </div>

            {/* Technical Features */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">⚡ Technical Features</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-green-400 mb-2">🔗 Real Reddit Integration</h3>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• Live subreddit data via Reddit API</li>
                    <li>• Authentic Reddit post styling</li>
                    <li>• Real subscriber counts and stats</li>
                    <li>• Cached for performance</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-400 mb-2">🚀 Advanced Multiplayer</h3>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• Real-time rooms using Redis polling</li>
                    <li>• Synchronized questions and answers</li>
                    <li>• Live player status updates</li>
                    <li>• Platform-compliant (no WebSockets)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Kiro Development */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-red-400 mb-4">🛠️ Built with Kiro Automation</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-orange-400 mb-2">6 Advanced Hooks Created</h3>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• Auto-testing on every save</li>
                    <li>• Content validation for Reddit posts</li>
                    <li>• Performance monitoring</li>
                    <li>• Real-time multiplayer management</li>
                    <li>• Code quality enforcement</li>
                    <li>• Deployment automation</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-purple-400 mb-2">Developer Experience</h3>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• Saved hours of manual testing</li>
                    <li>• Ensured consistent code quality</li>
                    <li>• Automated complex workflows</li>
                    <li>• Creative solutions for platform limits</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center bg-gradient-to-r from-orange-600 to-purple-600 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Ready to Test Your Reddit Knowledge? 🚀</h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    setGameMode('solo');
                    startNewRound();
                  }}
                  className="bg-white text-orange-600 font-bold py-3 px-6 rounded-lg text-lg hover:bg-gray-100 transition-colors"
                >
                  🎯 Start Solo Challenge
                </button>
                <button
                  onClick={() => setCurrentScreen('menu')}
                  className="bg-transparent border-2 border-white text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-white hover:text-purple-600 transition-colors"
                >
                  📋 Back to Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }



  return <div>Loading...</div>;
};
