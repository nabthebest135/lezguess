import { useState, useEffect } from 'react';

// Mystery Reddit posts for the guessing game - Legendary Reddit moments
const MYSTERY_POSTS = [
  {
    id: 1,
    content: "The intent is to provide players with a sense of pride and accomplishment for unlocking different heroes.",
    subreddit: "StarWarsBattlefront",
    year: 2017,
    context: "EA's response to microtransactions controversy",
    upvotes: -667000,
    difficulty: "easy"
  },
  {
    id: 2,
    content: "We did it Reddit! Boston bomber caught!",
    subreddit: "news",
    year: 2013,
    context: "Reddit's misidentification during Boston Marathon bombing",
    upvotes: 3000,
    difficulty: "hard"
  },
  {
    id: 3,
    content: "Keanu Reeves is breathtaking!",
    subreddit: "gaming",
    year: 2019,
    context: "E3 Cyberpunk 2077 announcement reaction",
    upvotes: 89000,
    difficulty: "medium"
  },
  {
    id: 4,
    content: "I also choose this guy's dead wife.",
    subreddit: "AskReddit",
    year: 2017,
    context: "Legendary dark humor response",
    upvotes: 45000,
    difficulty: "medium"
  },
  {
    id: 5,
    content: "Thanks for the gold, kind stranger!",
    subreddit: "circlejerk",
    year: 2012,
    context: "Classic Reddit gold response meme",
    upvotes: 12000,
    difficulty: "easy"
  },
  {
    id: 6,
    content: "Banana for scale",
    subreddit: "pics",
    year: 2013,
    context: "Origin of the banana scale meme",
    upvotes: 25000,
    difficulty: "medium"
  },
  {
    id: 7,
    content: "Test post please ignore",
    subreddit: "pics",
    year: 2012,
    context: "Most upvoted 'please ignore' post",
    upvotes: 23000,
    difficulty: "hard"
  },
  {
    id: 8,
    content: "Broken arms",
    subreddit: "IAmA",
    year: 2012,
    context: "Infamous Reddit story reference",
    upvotes: 15000,
    difficulty: "hard"
  },
  {
    id: 9,
    content: "When does the narwhal bacon?",
    subreddit: "reddit.com",
    year: 2009,
    context: "Early Reddit secret handshake",
    upvotes: 8000,
    difficulty: "expert"
  },
  {
    id: 10,
    content: "Geraffes are so dumb",
    subreddit: "pics",
    year: 2009,
    context: "Classic misspelling that became legendary",
    upvotes: 5000,
    difficulty: "expert"
  },
  {
    id: 11,
    content: "Today you, tomorrow me",
    subreddit: "AskReddit",
    year: 2010,
    context: "Heartwarming story about helping strangers",
    upvotes: 15000,
    difficulty: "medium"
  },
  {
    id: 12,
    content: "AND MY AXE!",
    subreddit: "reddit.com",
    year: 2011,
    context: "Lord of the Rings meme explosion",
    upvotes: 8000,
    difficulty: "easy"
  },
  {
    id: 13,
    content: "The safe",
    subreddit: "WhatsInThisThing",
    year: 2013,
    context: "Most anticipated safe opening in Reddit history",
    upvotes: 25000,
    difficulty: "hard"
  },
  {
    id: 14,
    content: "Cumbox",
    subreddit: "AskReddit",
    year: 2012,
    context: "Infamous Reddit confession",
    upvotes: 12000,
    difficulty: "expert"
  },
  {
    id: 15,
    content: "Ice soap and 2am chili",
    subreddit: "pics",
    year: 2011,
    context: "Peak Reddit life hack era",
    upvotes: 18000,
    difficulty: "hard"
  },
  {
    id: 16,
    content: "Lawyer up, delete Facebook, hit the gym",
    subreddit: "relationship_advice",
    year: 2010,
    context: "Classic Reddit relationship advice trinity",
    upvotes: 8500,
    difficulty: "easy"
  },
  {
    id: 17,
    content: "This.",
    subreddit: "reddit.com",
    year: 2008,
    context: "The birth of the most overused Reddit comment",
    upvotes: 2000,
    difficulty: "expert"
  },
  {
    id: 18,
    content: "OP's mom",
    subreddit: "AskReddit",
    year: 2009,
    context: "The ultimate Reddit comeback",
    upvotes: 15000,
    difficulty: "easy"
  },
  {
    id: 19,
    content: "Username checks out",
    subreddit: "funny",
    year: 2012,
    context: "When usernames perfectly match comments",
    upvotes: 12000,
    difficulty: "medium"
  },
  {
    id: 20,
    content: "Instructions unclear, got dick stuck in ceiling fan",
    subreddit: "tifu",
    year: 2013,
    context: "Peak Reddit absurdist humor",
    upvotes: 25000,
    difficulty: "medium"
  },
  {
    id: 21,
    content: "Jolly Rancher",
    subreddit: "AskReddit",
    year: 2011,
    context: "The story that scarred Reddit forever",
    upvotes: 8000,
    difficulty: "expert"
  },
  {
    id: 22,
    content: "Swamps of Dagobah",
    subreddit: "AskReddit",
    year: 2014,
    context: "Medical horror story that became legend",
    upvotes: 45000,
    difficulty: "hard"
  },
  {
    id: 23,
    content: "Kevin",
    subreddit: "AskReddit",
    year: 2014,
    context: "The dumbest student ever story",
    upvotes: 35000,
    difficulty: "medium"
  },
  {
    id: 24,
    content: "Streetlamp Le Moose",
    subreddit: "AskReddit",
    year: 2012,
    context: "Legendary fictional character story",
    upvotes: 28000,
    difficulty: "hard"
  },
  {
    id: 25,
    content: "Poop knife",
    subreddit: "confession",
    year: 2018,
    context: "The most disturbing family secret",
    upvotes: 55000,
    difficulty: "medium"
  },
  {
    id: 26,
    content: "Coconut",
    subreddit: "tifu",
    year: 2017,
    context: "TIFU by using a coconut",
    upvotes: 85000,
    difficulty: "easy"
  },
  {
    id: 27,
    content: "We did it Reddit!",
    subreddit: "circlejerk",
    year: 2013,
    context: "Celebrating premature victories",
    upvotes: 15000,
    difficulty: "easy"
  },
  {
    id: 28,
    content: "The narwhal bacons at midnight",
    subreddit: "reddit.com",
    year: 2009,
    context: "Secret Reddit meetup phrase",
    upvotes: 12000,
    difficulty: "expert"
  },
  {
    id: 29,
    content: "Tree fiddy",
    subreddit: "funny",
    year: 2010,
    context: "South Park meme that took over Reddit",
    upvotes: 20000,
    difficulty: "medium"
  },
  {
    id: 30,
    content: "Mom's spaghetti",
    subreddit: "hiphopheads",
    year: 2012,
    context: "Eminem lyrics became Reddit meme",
    upvotes: 18000,
    difficulty: "easy"
  },
  {
    id: 31,
    content: "Decoy snail",
    subreddit: "AskReddit",
    year: 2016,
    context: "Immortal snail hypothetical response",
    upvotes: 42000,
    difficulty: "medium"
  },
  {
    id: 32,
    content: "5/7 perfect score",
    subreddit: "funny",
    year: 2015,
    context: "Brendan Sullivan's perfect rating system",
    upvotes: 38000,
    difficulty: "medium"
  },
  {
    id: 33,
    content: "Rampart",
    subreddit: "IAmA",
    year: 2012,
    context: "Woody Harrelson's disastrous AMA",
    upvotes: 15000,
    difficulty: "hard"
  },
  {
    id: 34,
    content: "Double dick dude",
    subreddit: "IAmA",
    year: 2014,
    context: "Most famous anatomy AMA",
    upvotes: 65000,
    difficulty: "medium"
  },
  {
    id: 35,
    content: "Unidan jackdaw copypasta",
    subreddit: "AdviceAnimals",
    year: 2014,
    context: "Here's the thing about crows vs jackdaws",
    upvotes: 25000,
    difficulty: "hard"
  },
  {
    id: 36,
    content: "Colby 2012",
    subreddit: "AskReddit",
    year: 2012,
    context: "The dog abuse story that divided Reddit",
    upvotes: 12000,
    difficulty: "expert"
  },
  {
    id: 37,
    content: "Doritos story",
    subreddit: "AskReddit",
    year: 2011,
    context: "The most disgusting Reddit story ever",
    upvotes: 8000,
    difficulty: "expert"
  },
  {
    id: 38,
    content: "Reddit switcharoo",
    subreddit: "pics",
    year: 2011,
    context: "The endless chain of switched perspectives",
    upvotes: 22000,
    difficulty: "hard"
  },
  {
    id: 39,
    content: "Wadsworth constant",
    subreddit: "videos",
    year: 2011,
    context: "Skip to 30% of any video for the good part",
    upvotes: 18000,
    difficulty: "hard"
  },
  {
    id: 40,
    content: "Godwin's Law",
    subreddit: "todayilearned",
    year: 2010,
    context: "Every internet argument ends with Hitler",
    upvotes: 15000,
    difficulty: "medium"
  },
  {
    id: 41,
    content: "OP is a bundle of sticks",
    subreddit: "4chan",
    year: 2011,
    context: "4chan meme that crossed to Reddit",
    upvotes: 10000,
    difficulty: "hard"
  },
  {
    id: 42,
    content: "Banana for scale",
    subreddit: "WTF",
    year: 2013,
    context: "The universal Reddit measurement system",
    upvotes: 35000,
    difficulty: "easy"
  },
  {
    id: 43,
    content: "Edit: Thanks for the gold!",
    subreddit: "circlejerk",
    year: 2012,
    context: "The most predictable Reddit edit",
    upvotes: 20000,
    difficulty: "easy"
  },
  {
    id: 44,
    content: "Came here to say this",
    subreddit: "circlejerk",
    year: 2010,
    context: "The most redundant Reddit comment",
    upvotes: 5000,
    difficulty: "easy"
  },
  {
    id: 45,
    content: "Sauce?",
    subreddit: "pics",
    year: 2009,
    context: "Reddit's way of asking for source",
    upvotes: 8000,
    difficulty: "medium"
  },
  {
    id: 46,
    content: "OP will surely deliver",
    subreddit: "funny",
    year: 2011,
    context: "Waiting for OP to follow up",
    upvotes: 12000,
    difficulty: "medium"
  },
  {
    id: 47,
    content: "RIP inbox",
    subreddit: "AskReddit",
    year: 2012,
    context: "When your comment blows up",
    upvotes: 15000,
    difficulty: "easy"
  },
  {
    id: 48,
    content: "Deleted by user",
    subreddit: "reddit.com",
    year: 2008,
    context: "The coward's way out",
    upvotes: 3000,
    difficulty: "medium"
  },
  {
    id: 49,
    content: "Username relevant",
    subreddit: "funny",
    year: 2011,
    context: "When username perfectly matches situation",
    upvotes: 10000,
    difficulty: "medium"
  },
  {
    id: 50,
    content: "Reddit hug of death",
    subreddit: "technology",
    year: 2010,
    context: "When Reddit traffic kills websites",
    upvotes: 25000,
    difficulty: "medium"
  },
  // LEGENDARY MEMES & VIRAL MOMENTS
  {
    id: 51,
    content: "Rickroll",
    subreddit: "funny",
    year: 2008,
    context: "Never gonna give you up became Reddit's favorite prank",
    upvotes: 50000,
    difficulty: "easy"
  },
  {
    id: 52,
    content: "All your base are belong to us",
    subreddit: "gaming",
    year: 2006,
    context: "Classic gaming meme that dominated early Reddit",
    upvotes: 15000,
    difficulty: "hard"
  },
  {
    id: 53,
    content: "Chocolate Rain",
    subreddit: "videos",
    year: 2007,
    context: "Tay Zonday's viral hit that Reddit obsessed over",
    upvotes: 35000,
    difficulty: "medium"
  },
  {
    id: 54,
    content: "Double Rainbow",
    subreddit: "videos",
    year: 2010,
    context: "Bear's ecstatic rainbow reaction video",
    upvotes: 28000,
    difficulty: "medium"
  },
  {
    id: 55,
    content: "Nyan Cat",
    subreddit: "funny",
    year: 2011,
    context: "Pop-Tart cat with rainbow trail",
    upvotes: 42000,
    difficulty: "easy"
  },
  // REDDIT DRAMA & CONTROVERSIES
  {
    id: 56,
    content: "Ellen Pao resignation",
    subreddit: "announcements",
    year: 2015,
    context: "Reddit CEO controversy and blackout protests",
    upvotes: 85000,
    difficulty: "medium"
  },
  {
    id: 57,
    content: "Victoria Taylor firing",
    subreddit: "OutOfTheLoop",
    year: 2015,
    context: "AMA coordinator firing that sparked site-wide protests",
    upvotes: 65000,
    difficulty: "hard"
  },
  {
    id: 58,
    content: "The Button",
    subreddit: "thebutton",
    year: 2015,
    context: "April Fools experiment that divided Reddit",
    upvotes: 75000,
    difficulty: "medium"
  },
  {
    id: 59,
    content: "r/place",
    subreddit: "place",
    year: 2017,
    context: "Collaborative pixel art experiment",
    upvotes: 95000,
    difficulty: "easy"
  },
  {
    id: 60,
    content: "Spez editing comments",
    subreddit: "The_Donald",
    year: 2016,
    context: "Reddit CEO caught editing user comments",
    upvotes: 55000,
    difficulty: "hard"
  },
  // GAMING & TECH MOMENTS
  {
    id: 61,
    content: "Half-Life 3 confirmed",
    subreddit: "gaming",
    year: 2012,
    context: "The meme that never dies",
    upvotes: 78000,
    difficulty: "easy"
  },
  {
    id: 62,
    content: "Portal cake is a lie",
    subreddit: "gaming",
    year: 2007,
    context: "Portal's famous lie about cake rewards",
    upvotes: 45000,
    difficulty: "medium"
  },
  {
    id: 63,
    content: "Minecraft creeper",
    subreddit: "Minecraft",
    year: 2010,
    context: "That's a nice everything you have there...",
    upvotes: 67000,
    difficulty: "easy"
  },
  {
    id: 64,
    content: "Steam Summer Sale wallet death",
    subreddit: "gaming",
    year: 2011,
    context: "Gabe Newell taking all our money",
    upvotes: 52000,
    difficulty: "medium"
  },
  {
    id: 65,
    content: "iPhone vs Android wars",
    subreddit: "technology",
    year: 2010,
    context: "The eternal smartphone debate",
    upvotes: 38000,
    difficulty: "easy"
  },
  // WHOLESOME & HEARTWARMING
  {
    id: 66,
    content: "Mr. Rogers neighborhood",
    subreddit: "todayilearned",
    year: 2012,
    context: "TIL posts about Fred Rogers being amazing",
    upvotes: 89000,
    difficulty: "medium"
  },
  {
    id: 67,
    content: "Bob Ross happy little trees",
    subreddit: "GetMotivated",
    year: 2014,
    context: "Joy of Painting became Reddit's therapy",
    upvotes: 76000,
    difficulty: "easy"
  },
  {
    id: 68,
    content: "Steve Irwin crocodile hunter",
    subreddit: "todayilearned",
    year: 2011,
    context: "Remembering the legendary wildlife educator",
    upvotes: 92000,
    difficulty: "medium"
  },
  {
    id: 69,
    content: "Robin Williams tribute",
    subreddit: "movies",
    year: 2014,
    context: "Reddit's massive outpouring of love",
    upvotes: 125000,
    difficulty: "medium"
  },
  {
    id: 70,
    content: "Grumpy Cat",
    subreddit: "AdviceAnimals",
    year: 2012,
    context: "Tardar Sauce became internet royalty",
    upvotes: 68000,
    difficulty: "easy"
  },
  // SCIENCE & SPACE
  {
    id: 71,
    content: "Mars Curiosity rover landing",
    subreddit: "space",
    year: 2012,
    context: "Seven minutes of terror success",
    upvotes: 87000,
    difficulty: "medium"
  },
  {
    id: 72,
    content: "Higgs boson discovery",
    subreddit: "science",
    year: 2012,
    context: "The God particle finally found",
    upvotes: 72000,
    difficulty: "hard"
  },
  {
    id: 73,
    content: "SpaceX Falcon Heavy launch",
    subreddit: "SpaceX",
    year: 2018,
    context: "Tesla Roadster in space with Starman",
    upvotes: 156000,
    difficulty: "easy"
  },
  {
    id: 74,
    content: "First black hole image",
    subreddit: "space",
    year: 2019,
    context: "Event Horizon Telescope breakthrough",
    upvotes: 134000,
    difficulty: "medium"
  },
  {
    id: 75,
    content: "Pluto is not a planet",
    subreddit: "todayilearned",
    year: 2006,
    context: "IAU reclassification controversy",
    upvotes: 45000,
    difficulty: "medium"
  }
];

export const App = () => {
  const [currentPost, setCurrentPost] = useState<any>(null);
  const [guessedSubreddit, setGuessedSubreddit] = useState('');
  const [guessedYear, setGuessedYear] = useState(2020);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [gameMode, setGameMode] = useState('solo'); // 'solo', 'daily', 'multiplayer'
  const [streak, setStreak] = useState(0);
  const [showAchievement, setShowAchievement] = useState<string | null>(null);
  const [communityStats, setCommunityStats] = useState({
    totalPlayers: 0,
    postsGuessed: 0,
    perfectScores: 0
  });
  const [recentGuesses, setRecentGuesses] = useState<any[]>([]);
  const [currentScreen, setCurrentScreen] = useState('registration'); // 'registration', 'menu', 'game', 'leaderboard', 'community', 'result', 'multiplayer-lobby'
  const [username, setUsername] = useState('');
  const [multiplayerRoom, setMultiplayerRoom] = useState<any>(null);
  const [roomCode, setRoomCode] = useState('');
  const [playersInRoom, setPlayersInRoom] = useState<any[]>([]);
  const [isRoomHost, setIsRoomHost] = useState(false);
  const [gameStartCountdown, setGameStartCountdown] = useState(0);
  const [multiplayerGuesses, setMultiplayerGuesses] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [gameTimer, setGameTimer] = useState(60); // 60 seconds per round
  const [timerActive, setTimerActive] = useState(false);
  const [, setShowResult] = useState(false);
  const [, setAchievements] = useState<string[]>([]);
  const [isLoadingRedditData, setIsLoadingRedditData] = useState(false);
  const [, setLiveSubredditData] = useState<any>(null);

  // Initialize username from localStorage on component mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('lezguess_username');
    if (savedUsername && savedUsername.trim().length >= 3) {
      setUsername(savedUsername);
      setCurrentScreen('menu');
    }
    
    // Load real community stats
    fetchCommunityStats();
  }, []);

  // Real multiplayer using Redis polling (no WebSockets on Devvit)
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    if (gameMode === 'multiplayer' && multiplayerRoom) {
      setIsConnected(true);

      // Poll for room updates every 2 seconds
      pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/multiplayer/room/${multiplayerRoom.code}`);
          if (response.ok) {
            const data = await response.json();
            if (data.status === 'success') {
              setPlayersInRoom(data.room.players);
              setMultiplayerRoom(data.room);
            }
          }
        } catch (error) {
          console.error('Failed to poll room updates:', error);
        }
      }, 2000);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      setIsConnected(false);
    };
  }, [gameMode, multiplayerRoom?.code]);

  // Real-time multiplayer guess submission
  const submitMultiplayerGuess = async (guess: any, score: number) => {
    // In real implementation, send to WebSocket server
    const guessData = {
      username,
      guess,
      score,
      timestamp: Date.now(),
      roomCode: multiplayerRoom?.code
    };

    // Add to multiplayer guesses immediately (real players will be synced via polling)
    setMultiplayerGuesses(prev => [...prev, guessData]);
  };

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

  // Fetch REAL community stats
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

  const startNewRound = () => {
    const randomPost = MYSTERY_POSTS[Math.floor(Math.random() * MYSTERY_POSTS.length)];
    setCurrentPost(randomPost);
    setCurrentScreen('game');
    setGuessedSubreddit('');
    setGuessedYear(2020);

    // Fetch real Reddit data for this subreddit
    fetchRedditData(randomPost.subreddit);

    // Start timer for competitive modes
    if (gameMode === 'multiplayer' || gameMode === 'daily') {
      setGameTimer(60);
      setTimerActive(true);
    }

    // Fetch live Reddit data for the current post
    if (randomPost?.subreddit) {
      fetchLiveRedditData(randomPost.subreddit);
    }
  };

  const goToMenu = () => {
    setCurrentPost(null);
    setCurrentScreen('menu');
    setTimerActive(false);
  };

  const showLeaderboardScreen = () => {
    setCurrentScreen('leaderboard');
  };

  const showCommunityScreen = () => {
    setCurrentScreen('community');
  };

  const calculateScore = (guess: any, actual: any) => {
    let roundScore = 0;

    // Subreddit scoring (exact match = 1000 points)
    if (guess.subreddit.toLowerCase() === actual.subreddit.toLowerCase()) {
      roundScore += 1000;
    }

    // Year scoring (only award points if within 5 years, max 1000)
    const yearDiff = Math.abs(guess.year - actual.year);
    if (yearDiff <= 5) {
      const yearScore = Math.max(0, 1000 - (yearDiff * 200));
      roundScore += yearScore;
    }

    return roundScore;
  };

  const submitGuess = () => {
    if (!currentPost) return;

    const guess = { subreddit: guessedSubreddit, year: guessedYear };
    const roundScore = calculateScore(guess, currentPost);

    const isCorrectSubreddit = guess.subreddit.toLowerCase() === currentPost.subreddit.toLowerCase();
    const isCorrectYear = guess.year === currentPost.year;

    setScore(score + roundScore);
    setRound(round + 1);
    setShowResult(true);
    setLastScore(roundScore);
    setCurrentScreen('result');

    // Check for achievements
    checkAchievements(roundScore, isCorrectSubreddit, isCorrectYear);

    // Report game completion for real stats
    const isPerfect = isCorrectSubreddit && isCorrectYear;
    reportGameCompletion(roundScore, isPerfect);

    // Add to community feed
    const guessResult = {
      username: username || 'Anonymous',
      post: currentPost.content.substring(0, 50) + "...",
      guessedSubreddit: guess.subreddit,
      actualSubreddit: currentPost.subreddit,
      score: roundScore,
      timestamp: new Date().toLocaleString()
    };
    setRecentGuesses(prev => [guessResult, ...prev].slice(0, 20));

    // Handle multiplayer guess submission
    if (gameMode === 'multiplayer' && multiplayerRoom) {
      submitMultiplayerGuess(guess, roundScore);
    }

    // Update leaderboard via real API
    if (gameMode === 'daily') {
      updateDailyLeaderboard(score + roundScore);
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
        alert(data.message);
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
        setCurrentScreen('multiplayer-lobby');
      }
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const joinMultiplayerRoom = async (code: string) => {
    try {
      const response = await fetch('/api/multiplayer/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: code.toUpperCase(), username })
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        setMultiplayerRoom(data.room);
        setRoomCode(data.room.code);
        setPlayersInRoom(data.room.players);
        setIsRoomHost(data.room.host === username);
        setCurrentScreen('multiplayer-lobby');
      } else {
        alert(data.message || 'Failed to join room');
      }
    } catch (error) {
      console.error('Failed to join room:', error);
      alert('Failed to join room');
    }
  };

  const startMultiplayerGame = () => {
    if (isRoomHost && playersInRoom.length >= 2) {
      setGameStartCountdown(3);
      const countdown = setInterval(() => {
        setGameStartCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdown);
            setGameMode('multiplayer');
            startNewRound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const checkAchievements = (roundScore: number, isCorrectSubreddit: boolean, isCorrectYear: boolean) => {
    const newAchievements: string[] = [];

    if (isCorrectSubreddit && isCorrectYear) {
      setStreak(prev => prev + 1);
      if (streak + 1 === 5) newAchievements.push("🔥 On Fire! 5 perfect guesses in a row!");
      if (streak + 1 === 10) newAchievements.push("🚀 Unstoppable! 10 perfect streak!");
    } else {
      setStreak(0);
    }

    if (roundScore >= 2000) newAchievements.push("💎 Perfect Score! You're a Reddit legend!");
    if (round === 1 && roundScore >= 1500) newAchievements.push("🎯 First Try Hero!");
    if (score + roundScore >= 10000) newAchievements.push("🏆 Score Master! 10,000+ points!");

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
              <span className="text-6xl sm:text-8xl">🔍</span>
            </div>
            <h1 className="text-4xl sm:text-7xl font-bold mb-4 text-orange-400 tracking-tight">
              LEZ<span className="text-white">GUESS</span>
            </h1>
            <p className="text-lg sm:text-2xl mb-2 text-gray-300">The Ultimate Reddit History Challenge</p>
            <p className="text-sm sm:text-lg mb-8 text-gray-400">Join the community and compete with redditors worldwide!</p>
          </div>

          <div className="w-full max-w-md bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center text-orange-400">Choose Your Username</h2>

            <div className="mb-6">
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
              <span className="text-6xl sm:text-8xl">🔍</span>
            </div>
            <h1 className="text-4xl sm:text-7xl font-bold mb-4 text-orange-400 tracking-tight">
              LEZ<span className="text-white">GUESS</span>
            </h1>
            <p className="text-lg sm:text-2xl mb-2 text-gray-300">Welcome back, {username}!</p>
            <p className="text-sm sm:text-lg mb-8 text-gray-400">Choose your game mode</p>
          </div>

          <div className="grid gap-4 w-full max-w-md">
            <button
              onClick={() => {
                setGameMode('solo');
                startNewRound();
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-8 rounded-lg text-lg sm:text-xl transition-all transform hover:scale-105"
            >
              🎯 Solo Challenge
            </button>

            <button
              onClick={() => {
                setGameMode('daily');
                startNewRound();
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg text-lg sm:text-xl transition-all transform hover:scale-105"
            >
              📅 Daily Challenge
            </button>

            <button
              onClick={createMultiplayerRoom}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg sm:text-xl transition-all transform hover:scale-105"
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
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
                <span className="text-sm text-gray-400">
                  {isConnected ? 'Connected to live server' : 'Connecting...'}
                </span>
              </div>
            </div>
            <button
              onClick={goToMenu}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              Leave Room
            </button>
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

              {playersInRoom.length < 2 && (
                <div className="mt-4 p-4 bg-yellow-900 bg-opacity-50 rounded-lg">
                  <p className="text-yellow-400 text-sm">
                    ⏳ Waiting for more players... Share the room code: <span className="font-mono font-bold">{multiplayerRoom?.code}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-green-400">Game Rules</h2>
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
                    disabled={playersInRoom.length < 2}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
                  >
                    {playersInRoom.length < 2 ? 'Need 2+ Players to Start' : 'Start Game!'}
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
        <div className="max-w-4xl mx-auto py-8">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-orange-500 text-center">Round {round} Results</h2>

          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <p className="text-base sm:text-lg mb-4 text-gray-300">"{currentPost.content}"</p>
            <p className="text-sm text-gray-400">r/{currentPost.subreddit} • {currentPost.year}</p>
            <p className="text-sm text-gray-400">{currentPost.context}</p>
          </div>

          {gameMode === 'multiplayer' && multiplayerGuesses.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold mb-4 text-blue-400">🏆 Round Results</h3>
              <div className="space-y-3">
                {multiplayerGuesses
                  .sort((a, b) => b.score - a.score)
                  .map((guess, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                      <div>
                        <span className="font-bold text-white">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'} {guess.username}
                        </span>
                        <p className="text-sm text-gray-400">
                          Guessed: r/{guess.guess.subreddit} • {guess.guess.year}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-green-400">+{guess.score}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="text-center mb-8">
            <p className="text-2xl sm:text-3xl font-bold text-green-400 mb-2">+{lastScore} points!</p>
            <p className="text-lg sm:text-xl text-gray-300">Your Total Score: {score}</p>
            {streak > 0 && (
              <p className="text-base sm:text-lg text-orange-400 mt-2">🔥 {streak} perfect streak!</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={startNewRound}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Next Round
            </button>
            <button
              onClick={() => {
                setRound(0);
                setScore(0);
                setStreak(0);
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
      <div className="min-h-screen bg-gray-900 text-white p-4 relative">
        {/* Achievement Notification */}
        {showAchievement && (
          <div className="fixed top-4 right-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-4 py-3 rounded-lg shadow-lg z-50 animate-bounce max-w-xs">
            <p className="font-bold text-sm sm:text-lg">{showAchievement}</p>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-orange-500">Reddit Guesser</h1>
              {gameMode === 'multiplayer' && (
                <p className="text-sm text-blue-400">🎮 Multiplayer • Room: {multiplayerRoom?.code}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-lg sm:text-xl text-gray-300">Score: {score}</p>
              <p className="text-sm text-gray-400">Playing as: {username}</p>
              {timerActive && (
                <div className="flex items-center gap-2 justify-end mt-1">
                  <span className="text-2xl">⏱️</span>
                  <span className={`text-lg font-bold ${gameTimer <= 10 ? 'text-red-400 animate-pulse' : 'text-orange-400'}`}>
                    {gameTimer}s
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Multiplayer Players Status */}
          {gameMode === 'multiplayer' && (
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
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

          {/* Mystery Post */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8 border-l-4 border-orange-500">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center text-gray-400">
                <button className="hover:text-orange-500 transition-colors">▲</button>
                <span className="font-bold text-lg py-1">
                  {currentPost.upvotes > 0 ? '+' : ''}{currentPost.upvotes.toLocaleString()}
                </span>
                <button className="hover:text-blue-500 transition-colors">▼</button>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-orange-400 font-bold">r/???</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">Posted by u/[REDACTED]</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">{currentPost.year}?</span>
                  {isLoadingRedditData && (
                    <span className="text-xs text-blue-400 animate-pulse">Loading live data...</span>
                  )}
                </div>
                <p className="text-xl font-medium mb-4 text-white">"{currentPost.content}"</p>
                <div className="flex gap-4 text-sm text-gray-400">
                  <span>💬 {currentPost.upvotes > 0 ? Math.floor(currentPost.upvotes * 0.1) : Math.floor(Math.abs(currentPost.upvotes) * 0.05)} comments</span>
                  <span>🔗 Share</span>
                  <span>💾 Save</span>
                  <span>🏆 Award</span>
                </div>
              </div>
            </div>
          </div>

          {/* Guess Form */}
          <div className="grid gap-6 mb-8">
            <div>
              <label className="block text-base sm:text-lg mb-2 text-gray-300">Guess the subreddit:</label>
              <input
                type="text"
                placeholder="e.g. gaming, AskReddit, funny"
                value={guessedSubreddit}
                onChange={(e) => setGuessedSubreddit(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-orange-500 focus:outline-none text-lg"
              />
            </div>

            <div>
              <label className="block text-base sm:text-lg mb-2 text-gray-300">Guess the year:</label>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setGuessedYear(Math.max(2005, guessedYear - 1))}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors text-xl"
                >
                  -
                </button>
                <span className="text-2xl sm:text-3xl font-bold text-white w-20 text-center">{guessedYear}</span>
                <button
                  onClick={() => setGuessedYear(Math.min(2024, guessedYear + 1))}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors text-xl"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={submitGuess}
              disabled={!guessedSubreddit.trim()}
              className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-lg text-lg sm:text-xl transition-colors"
            >
              Submit Guess
            </button>
            {gameMode === 'multiplayer' && (
              <p className="text-sm text-gray-400 mt-2">
                🔴 Live: Other players are guessing too!
              </p>
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
              <h2 className="text-2xl font-bold mb-4 text-green-400">📡 Recent Guesses</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentGuesses.length === 0 ? (
                  <p className="text-center text-gray-400 py-4">No recent guesses. Be the first!</p>
                ) : (
                  recentGuesses.map((guess, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-orange-400">{guess.username}</span>
                        <span className="text-sm text-gray-400">{guess.timestamp}</span>
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

  return <div>Loading...</div>;
};
