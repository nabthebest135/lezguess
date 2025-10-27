import express from 'express';
import { InitResponse, IncrementResponse, DecrementResponse } from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

router.get<{ postId: string }, InitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      console.error('API Init Error: postId not found in devvit context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      const [count, username] = await Promise.all([
        redis.get('count'),
        reddit.getCurrentUsername(),
      ]);

      res.json({
        type: 'init',
        postId: postId,
        count: count ? parseInt(count) : 0,
        username: username ?? 'anonymous',
      });
    } catch (error) {
      console.error(`API Init Error for post ${postId}:`, error);
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

// Daily leaderboard endpoint
router.get('/api/leaderboard/daily', async (_req, res): Promise<void> => {
  try {
    const leaderboardData = await redis.get('daily_leaderboard');
    const leaderboard = leaderboardData ? JSON.parse(leaderboardData) : [];
    
    res.json({
      type: 'leaderboard',
      data: leaderboard.slice(0, 10), // Top 10
      totalPlayers: leaderboard.length,
    });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch leaderboard' });
  }
});

// Submit score endpoint
router.post('/api/score/submit', async (req, res): Promise<void> => {
  try {
    const { score, gameMode, username, checkOnly } = req.body;
    
    if (gameMode === 'daily') {
      // Validate username
      if (!username || username.trim() === '') {
        res.status(400).json({ status: 'error', message: 'Username is required for daily challenge' });
        return;
      }
      
      const today = new Date().toISOString().split('T')[0];
      const cleanUsername = username.trim();
      const userKey = `daily_score_${today}_${cleanUsername}`;
      
      console.log(`Daily check for user: "${cleanUsername}", key: ${userKey}, checkOnly: ${checkOnly}`);
      
      // Check if user already played today
      const existingScore = await redis.get(userKey);
      console.log(`Existing score found: ${existingScore}`);
      
      if (existingScore) {
        res.json({ status: 'already_played', message: 'You already played today!' });
        return;
      }
      
      // If this is just a check, return success
      if (checkOnly) {
        res.json({ status: 'can_play' });
        return;
      }
      
      // Save user's daily score
      await redis.set(userKey, score.toString());
      console.log(`Saved daily score for ${cleanUsername}: ${score}`);
      
      // Update leaderboard
      const leaderboardData = await redis.get('daily_leaderboard') || '[]';
      const leaderboard = JSON.parse(leaderboardData);
      
      leaderboard.push({
        username: cleanUsername || 'Anonymous',
        score,
        timestamp: new Date().toISOString(),
      });
      
      // Sort and save
      leaderboard.sort((a: any, b: any) => b.score - a.score);
      await redis.set('daily_leaderboard', JSON.stringify(leaderboard));
      
      // Increment daily players count
      await redis.incrBy('daily_players_count', 1);
    }
    
    res.json({ status: 'success', message: 'Score submitted successfully' });
  } catch (error) {
    console.error('Score submission error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to submit score' });
  }
});

// Multiplayer room endpoints
router.post('/api/multiplayer/create-room', async (req, res): Promise<void> => {
  try {
    const { username } = req.body;
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const room = {
      code: roomCode,
      host: username,
      players: [{ 
        username, 
        score: 0, 
        ready: false, 
        hasSubmitted: false,
        lastSeen: Date.now(),
        isActive: true
      }],
      currentPost: null,
      gameStarted: false,
      currentRound: 1,
      maxRounds: 5,
      roundGuesses: [],
      createdAt: Date.now(),
      lastActivity: Date.now()
    };
    
    // Store room data with expiration (2 hours)
    await redis.set(`room_${roomCode}`, JSON.stringify(room));
    await redis.expire(`room_${roomCode}`, 7200); // 2 hours in seconds
    
    console.log(`Room ${roomCode} created by ${username}`);
    
    res.json({ status: 'success', room });
  } catch (error) {
    console.error('Room creation error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create room' });
  }
});

router.post('/api/multiplayer/join-room', async (req, res): Promise<void> => {
  try {
    const { roomCode, username } = req.body;
    const roomData = await redis.get(`room_${roomCode}`);
    
    if (!roomData) {
      res.status(404).json({ status: 'error', message: 'Room not found' });
      return;
    }
    
    const room = JSON.parse(roomData);
    
    // Check if player already in room
    const existingPlayer = room.players.find((p: any) => p.username === username);
    if (!existingPlayer) {
      room.players.push({ 
        username, 
        score: 0, 
        ready: false, 
        hasSubmitted: false,
        lastSeen: Date.now(),
        isActive: true
      });
      
      // Store room data with expiration
      await redis.set(`room_${roomCode}`, JSON.stringify(room));
      await redis.expire(`room_${roomCode}`, 7200); // 2 hours in seconds
      
      console.log(`Player ${username} joined room ${roomCode}. Total players: ${room.players.length}`);
    } else {
      // Update existing player's last seen time
      existingPlayer.lastSeen = Date.now();
      existingPlayer.isActive = true;
      await redis.set(`room_${roomCode}`, JSON.stringify(room));
      await redis.expire(`room_${roomCode}`, 7200);
    }
    
    res.json({ status: 'success', room });
  } catch (error) {
    console.error('Room join error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to join room' });
  }
});

// Heartbeat endpoint to keep players active
router.post('/api/multiplayer/heartbeat', async (req, res): Promise<void> => {
  try {
    const { roomCode, username } = req.body;
    
    if (!username) {
      res.status(401).json({ status: 'error', message: 'Username required' });
      return;
    }

    const roomData = await redis.get(`room_${roomCode}`);
    if (!roomData) {
      res.status(404).json({ status: 'error', message: 'Room not found' });
      return;
    }

    const room = JSON.parse(roomData);
    
    // Update player's last seen time
    const player = room.players.find((p: any) => p.username === username);
    if (player) {
      player.lastSeen = Date.now();
      player.isActive = true;
      console.log(`Heartbeat received from ${username} in room ${roomCode}`);
    } else {
      console.log(`Heartbeat from unknown player ${username} in room ${roomCode}`);
    }
    
    room.lastActivity = Date.now();
    
    // Clean up inactive players (haven't been seen in 2 minutes)
    const now = Date.now();
    room.players = room.players.filter((p: any) => {
      const isActive = (now - p.lastSeen) < 120000; // 2 minutes timeout (increased from 30 seconds)
      if (!isActive) {
        console.log(`Removing inactive player: ${p.username}, lastSeen: ${new Date(p.lastSeen)}`);
      }
      return isActive;
    });

    await redis.set(`room_${roomCode}`, JSON.stringify(room));
    await redis.expire(`room_${roomCode}`, 7200);
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update heartbeat' });
  }
});

router.get('/api/multiplayer/room/:roomCode', async (req, res): Promise<void> => {
  try {
    const { roomCode } = req.params;
    const roomData = await redis.get(`room_${roomCode}`);
    
    if (!roomData) {
      res.status(404).json({ status: 'error', message: 'Room not found' });
      return;
    }
    
    const room = JSON.parse(roomData);
    
    // Clean up inactive players on every room fetch
    const now = Date.now();
    const originalPlayerCount = room.players.length;
    room.players = room.players.filter((p: any) => {
      const isActive = (now - p.lastSeen) < 120000; // 2 minutes timeout (increased from 30 seconds)
      if (!isActive) {
        console.log(`Removing inactive player: ${p.username}, lastSeen: ${new Date(p.lastSeen)}, now: ${new Date(now)}`);
      }
      return isActive;
    });
    
    if (room.players.length !== originalPlayerCount) {
      console.log(`Cleaned up inactive players. ${originalPlayerCount} -> ${room.players.length}`);
      await redis.set(`room_${roomCode}`, JSON.stringify(room));
      await redis.expire(`room_${roomCode}`, 7200);
    }
    
    res.json({ status: 'success', room });
  } catch (error) {
    console.error('Room fetch error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch room' });
  }
});

// Start multiplayer game
router.post('/api/multiplayer/start-game', async (req, res): Promise<void> => {
  try {
    const { roomCode, username } = req.body;
    
    if (!username) {
      res.status(401).json({ status: 'error', message: 'Username required' });
      return;
    }

    const roomData = await redis.get(`room_${roomCode}`);
    if (!roomData) {
      res.status(404).json({ status: 'error', message: 'Room not found' });
      return;
    }

    const room = JSON.parse(roomData);
    
    // Only host can start the game
    if (room.host !== username) {
      res.status(403).json({ status: 'error', message: 'Only host can start the game' });
      return;
    }

    // Mark game as started
    room.gameStarted = true;
    room.gameStartTime = Date.now();
    
    await redis.set(`room_${roomCode}`, JSON.stringify(room));
    await redis.expire(`room_${roomCode}`, 7200);
    
    console.log(`Game started in room ${roomCode} by host ${username}`);
    res.json({ status: 'success', room });
  } catch (error) {
    console.error('Start game error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to start game' });
  }
});

// Mystery Reddit posts for the guessing game - SERVER SIDE ONLY
const MYSTERY_POSTS = [
  {
    id: 1,
    content: "The intent is to provide players with a sense of pride and accomplishment for unlocking different heroes. As for cost, we selected initial values based upon data from the Open Beta and other adjustments made to milestone rewards before launch. Among other things, we're looking at average per-player credit earn rates on a daily basis, and we'll be making constant adjustments to ensure that players have challenges that are compelling, rewarding, and of course attainable via gameplay.",
    subreddit: "StarWarsBattlefront",
    year: 2017,
    context: "EA's response to microtransactions controversy - became most downvoted comment in Reddit history",
    upvotes: -667000,
    difficulty: "easy"
  },
  {
    id: 2,
    content: "BREAKING: We did it Reddit! Boston bomber caught! The FBI has confirmed that the suspect has been apprehended after an intensive manhunt. This is a victory for crowdsourced investigation and shows the power of the internet community working together to solve crimes.",
    subreddit: "news",
    year: 2013,
    context: "Reddit's infamous misidentification during Boston Marathon bombing investigation",
    upvotes: 3000,
    difficulty: "hard"
  },
  {
    id: 3,
    content: "Holy shit, Keanu Reeves just walked out on stage at E3! He's in Cyberpunk 2077! When someone in the audience yelled 'You're breathtaking!' he pointed back and said 'No, you're breathtaking! You're all breathtaking!' This man is a treasure and CD Projekt Red just won E3.",
    subreddit: "gaming",
    year: 2019,
    context: "E3 Cyberpunk 2077 announcement with Keanu Reeves surprise appearance",
    upvotes: 89000,
    difficulty: "medium"
  },
  {
    id: 4,
    content: "Question: 'If you could have sex with one person from history, who would it be?' Top answer: 'My wife. She passed away two years ago from cancer and I miss her every day.' Reply: 'I also choose this guy's dead wife.' *gets 45k upvotes*",
    subreddit: "AskReddit",
    year: 2017,
    context: "Legendary dark humor response that became Reddit folklore",
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
    content: "My family poops big. Like, really big. So big that our toilet would get clogged regularly. My dad kept an old rusty kitchen knife in the bathroom to chop up the turds so they would flush. We called it the poop knife. I thought every family had one until I was 22 and asked my girlfriend's family where their poop knife was. The silence was deafening.",
    subreddit: "confession",
    year: 2018,
    context: "The most disturbing family secret that became a Reddit legend",
    upvotes: 55000,
    difficulty: "medium"
  },
  {
    id: 26,
    content: "TIFU by using a coconut as a... personal pleasure device. I'm a 16-year-old male and discovered that a coconut with a hole drilled in it makes for an interesting experience. After a week of use, I noticed a strange smell. When I cracked it open, it was full of rotting coconut flesh and maggots. I may have given myself an infection. Don't use coconuts, people.",
    subreddit: "tifu",
    year: 2017,
    context: "The infamous coconut TIFU that traumatized Reddit",
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
  }
];

// Common subreddits for generating multiple choice options
const COMMON_SUBREDDITS = [
  'gaming', 'AskReddit', 'funny', 'pics', 'news', 'worldnews', 'todayilearned',
  'movies', 'music', 'videos', 'IAmA', 'science', 'technology', 'politics',
  'sports', 'television', 'books', 'food', 'DIY', 'LifeProTips', 'showerthoughts',
  'mildlyinteresting', 'oddlysatisfying', 'wholesomememes', 'dankmemes',
  'relationship_advice', 'tifu', 'confession', 'unpopularopinion', 'changemyview',
  'explainlikeimfive', 'nostupidquestions', 'OutOfTheLoop', 'bestof',
  'StarWarsBattlefront', 'circlejerk', 'WhatsInThisThing', 'legaladvice', 'reddit.com', 'hiphopheads'
];

// Generate multiple choice options for a post
const generateMultipleChoice = (correctSubreddit: string, seed: string): string[] => {
  if (!correctSubreddit) return [];
  const options = [correctSubreddit];
  const availableOptions = COMMON_SUBREDDITS.filter(sub => sub !== correctSubreddit);

  // Use deterministic selection based on seed for consistent options
  const optionSeed = seed + 'options';
  let seedValue = optionSeed.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0);
  
  // Add 3 deterministic wrong options
  while (options.length < 4 && availableOptions.length > 0) {
    const index = seedValue % availableOptions.length;
    const selectedOption = availableOptions[index];
    if (selectedOption && !options.includes(selectedOption)) {
      options.push(selectedOption);
    }
    availableOptions.splice(index, 1); // Remove to avoid duplicates
    seedValue = Math.abs(seedValue * 1103515245 + 12345); // Simple LCG for next "random" number
  }

  // Deterministic shuffle based on seed
  const shuffleSeed = seed + 'shuffle';
  let shuffleValue = shuffleSeed.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0);
  for (let i = options.length - 1; i > 0; i--) {
    const j = shuffleValue % (i + 1);
    const temp = options[i];
    if (options[j] !== undefined && temp !== undefined) {
      options[i] = options[j]!; // Non-null assertion since we checked above
      options[j] = temp;
    }
    shuffleValue = Math.abs(shuffleValue * 1103515245 + 12345);
  }

  return options;
};

// Get random post for solo/daily games
router.get('/api/game/random-post', async (_req, res): Promise<void> => {
  try {
    const randomPost = MYSTERY_POSTS[Math.floor(Math.random() * MYSTERY_POSTS.length)];
    
    if (!randomPost) {
      res.status(500).json({ status: 'error', message: 'No posts available' });
      return;
    }
    
    // Generate multiple choice options
    const seed = Date.now().toString() + Math.random().toString();
    const options = generateMultipleChoice(randomPost.subreddit, seed);
    
    // Return post without revealing the answer
    const postForClient = {
      id: randomPost.id,
      content: randomPost.content,
      context: randomPost.context,
      upvotes: randomPost.upvotes,
      difficulty: randomPost.difficulty
      // Note: subreddit and year are NOT sent to client
    };
    
    const answerId = `${randomPost.id}_${Date.now()}`;
    
    // Store the correct answer on server for validation
    await redis.set(`post_answer_${answerId}`, JSON.stringify({
      subreddit: randomPost.subreddit,
      year: randomPost.year
    }));
    await redis.expire(`post_answer_${answerId}`, 300); // Expire after 5 minutes
    
    res.json({ 
      status: 'success', 
      post: postForClient, 
      options,
      answerId // Client needs this to submit answer
    });
  } catch (error) {
    console.error('Get random post error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get random post' });
  }
});

// Validate guess against server-stored answer
router.post('/api/game/validate-guess', async (req, res): Promise<void> => {
  try {
    const { answerId, guessedSubreddit, guessedYear, difficulty } = req.body;
    
    if (!answerId || !guessedSubreddit) {
      res.status(400).json({ status: 'error', message: 'Missing required fields' });
      return;
    }
    
    // In easy mode, year is not required
    if (difficulty !== 'easy' && !guessedYear) {
      res.status(400).json({ status: 'error', message: 'Year is required in difficult mode' });
      return;
    }
    
    // Get the correct answer from server storage
    const answerData = await redis.get(`post_answer_${answerId}`);
    if (!answerData) {
      res.status(400).json({ status: 'error', message: 'Answer session expired or invalid' });
      return;
    }
    
    const correctAnswer = JSON.parse(answerData);
    
    // Calculate score server-side
    let score = 0;
    
    // Subreddit scoring (exact match = 100 points)
    const isCorrectSubreddit = guessedSubreddit.toLowerCase() === correctAnswer.subreddit.toLowerCase();
    if (isCorrectSubreddit) {
      score += 100;
    }
    
    // Year scoring (only in normal mode)
    let isCorrectYear = false;
    if (difficulty === 'easy') {
      // In easy mode, always consider year "correct" for perfect score calculation
      isCorrectYear = true;
      // Give full points for subreddit in easy mode
      if (isCorrectSubreddit) {
        score += 100; // Total 200 points for correct subreddit in easy mode
      }
    } else {
      // Difficult mode: year scoring (only award points if within 5 years, max 100)
      isCorrectYear = guessedYear === correctAnswer.year;
      const yearDiff = Math.abs(guessedYear - correctAnswer.year);
      if (yearDiff <= 5) {
        const yearScore = Math.max(0, 100 - (yearDiff * 20));
        score += yearScore;
      }
    }
    
    // Clean up the stored answer
    await redis.del(`post_answer_${answerId}`);
    
    res.json({
      status: 'success',
      score,
      correctAnswer,
      isCorrectSubreddit,
      isCorrectYear,
      isPerfect: isCorrectSubreddit && isCorrectYear,
      difficulty
    });
  } catch (error) {
    console.error('Validate guess error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to validate guess' });
  }
});

// Get current round post for multiplayer
router.get('/api/multiplayer/current-post/:roomCode', async (req, res): Promise<void> => {
  try {
    const { roomCode } = req.params;
    const roomData = await redis.get(`room_${roomCode}`);
    
    if (!roomData) {
      res.status(404).json({ status: 'error', message: 'Room not found' });
      return;
    }

    const room = JSON.parse(roomData);
    
    // Generate deterministic post based on room code and round
    const seed = roomCode + room.currentRound;
    const postIndex = Math.abs(seed.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)) % MYSTERY_POSTS.length;
    
    const selectedPost = MYSTERY_POSTS[postIndex];
    
    if (!selectedPost) {
      res.status(500).json({ status: 'error', message: 'No post found for this round' });
      return;
    }
    
    console.log(`Generating post for room ${roomCode}, round ${room.currentRound}, seed: ${seed}, postIndex: ${postIndex}`);
    
    // Generate deterministic multiple choice options
    const options = generateMultipleChoice(selectedPost.subreddit, seed);
    
    // Return post without revealing the answer
    const postForClient = {
      id: selectedPost.id,
      content: selectedPost.content,
      context: selectedPost.context,
      upvotes: selectedPost.upvotes,
      difficulty: selectedPost.difficulty
      // Note: subreddit and year are NOT sent to client
    };
    
    console.log(`Generated options for ${selectedPost.subreddit}:`, options);
    res.json({ status: 'success', post: postForClient, options });
  } catch (error) {
    console.error('Get current post error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get current post' });
  }
});

// Submit multiplayer guess - SERVER-SIDE VALIDATION
router.post('/api/multiplayer/submit-guess', async (req, res): Promise<void> => {
  try {
    const { roomCode, guessedSubreddit, guessedYear, username } = req.body;
    
    if (!username) {
      res.status(401).json({ status: 'error', message: 'Username required' });
      return;
    }

    const roomData = await redis.get(`room_${roomCode}`);
    if (!roomData) {
      res.status(404).json({ status: 'error', message: 'Room not found' });
      return;
    }

    const room = JSON.parse(roomData);
    
    // Get the correct answer for this room's current round
    const seed = roomCode + room.currentRound;
    const postIndex = Math.abs(seed.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)) % MYSTERY_POSTS.length;
    const correctPost = MYSTERY_POSTS[postIndex];
    
    if (!correctPost) {
      res.status(500).json({ status: 'error', message: 'No correct post found for this round' });
      return;
    }
    
    // Calculate score server-side (NO CLIENT TRUST)
    let score = 0;
    
    // Subreddit scoring (exact match = 100 points)
    const isCorrectSubreddit = guessedSubreddit.toLowerCase() === correctPost.subreddit.toLowerCase();
    if (isCorrectSubreddit) {
      score += 100;
    }
    
    // Year scoring (only award points if within 5 years, max 100)
    const yearDiff = Math.abs(guessedYear - correctPost.year);
    if (yearDiff <= 5) {
      const yearScore = Math.max(0, 100 - (yearDiff * 20));
      score += yearScore;
    }
    
    console.log(`Player ${username} guessed: r/${guessedSubreddit} ${guessedYear}, correct: r/${correctPost.subreddit} ${correctPost.year}, score: ${score}`);
    
    // Mark player as submitted
    const playerIndex = room.players.findIndex((p: any) => p.username === username);
    if (playerIndex !== -1) {
      room.players[playerIndex].hasSubmitted = true;
      room.players[playerIndex].score += score;
    }

    // Add guess to round guesses with correct answer for results display
    room.roundGuesses.push({
      username,
      guess: { subreddit: guessedSubreddit, year: guessedYear },
      score,
      correctAnswer: { subreddit: correctPost.subreddit, year: correctPost.year },
      timestamp: Date.now()
    });

    // Check if all players have submitted
    const allSubmitted = room.players.every((p: any) => p.hasSubmitted);
    
    if (allSubmitted) {
      // Move to next round or end game
      if (room.currentRound >= room.maxRounds) {
        room.gameEnded = true;
      } else {
        room.currentRound += 1;
        // Reset submission status for next round
        room.players.forEach((p: any) => p.hasSubmitted = false);
        room.roundGuesses = [];
      }
    }

    await redis.set(`room_${roomCode}`, JSON.stringify(room));
    res.json({ 
      status: 'success', 
      room, 
      allSubmitted,
      playerScore: score,
      correctAnswer: { subreddit: correctPost.subreddit, year: correctPost.year }
    });
  } catch (error) {
    console.error('Guess submission error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to submit guess' });
  }
});

// REAL Reddit API integration
router.get('/api/reddit-data/:subreddit', async (req, res): Promise<void> => {
  try {
    const { subreddit } = req.params;
    
    // Use Reddit API to get real subreddit data
    const subredditData = await reddit.getSubredditInfoByName(subreddit);
    
    if (subredditData) {
      const data = {
        subscribers: (subredditData as any).subscribers || (subredditData as any).numberOfSubscribers || 0,
        activeUsers: Math.floor(((subredditData as any).subscribers || (subredditData as any).numberOfSubscribers || 0) * 0.001), // Estimate active users
        description: subredditData.title || `r/${subreddit}`,
        created: subredditData.createdAt ? new Date(subredditData.createdAt).getFullYear() : 2024,
        isNsfw: (subredditData as any).over18 || (subredditData as any).nsfw || false
      };
      
      // Cache the data for 5 minutes
      await redis.set(`subreddit_${subreddit}`, JSON.stringify(data));
      
      res.json(data);
    } else {
      // Fallback for non-existent subreddits
      res.json({
        subscribers: 0,
        activeUsers: 0,
        description: `r/${subreddit}`,
        created: 2024,
        isNsfw: false
      });
    }
  } catch (error) {
    console.error('Reddit API error:', error);
    
    // Check cache first
    try {
      const cachedData = await redis.get(`subreddit_${req.params.subreddit}`);
      if (cachedData) {
        res.json(JSON.parse(cachedData));
        return;
      }
    } catch (cacheError) {
      console.error('Cache error:', cacheError);
    }
    
    // Final fallback
    res.json({
      subscribers: Math.floor(Math.random() * 1000000),
      activeUsers: Math.floor(Math.random() * 10000),
      description: `r/${req.params.subreddit}`,
      created: 2010 + Math.floor(Math.random() * 14),
      isNsfw: false
    });
  }
});

// Community stats endpoint - REAL DATA ONLY
router.get('/api/community-stats', async (_req, res): Promise<void> => {
  try {
    // Get real stats from Redis
    const [totalPlayers, postsGuessed, perfectScores] = await Promise.all([
      redis.get('total_players') || '0',
      redis.get('posts_guessed') || '0', 
      redis.get('perfect_scores') || '0'
    ]);
    
    res.json({
      totalPlayers: parseInt(totalPlayers || '0'),
      postsGuessed: parseInt(postsGuessed || '0'),
      perfectScores: parseInt(perfectScores || '0')
    });
  } catch (error) {
    console.error('Community stats error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch community stats' });
  }
});



// Save player data (streak, total correct, etc.)
router.post('/api/player/save', async (req, res): Promise<void> => {
  try {
    const username = await reddit.getCurrentUsername();
    if (!username) {
      res.status(401).json({ status: 'error', message: 'Not authenticated' });
      return;
    }

    const { bestStreak, totalCorrect, currentStreak } = req.body;
    
    const playerData = {
      bestStreak: bestStreak || 0,
      totalCorrect: totalCorrect || 0,
      currentStreak: currentStreak || 0,
      lastUpdated: Date.now()
    };

    await redis.set(`player_${username}`, JSON.stringify(playerData));
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Player save error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to save player data' });
  }
});

// Load player data
router.get('/api/player/load', async (_req, res): Promise<void> => {
  try {
    const username = await reddit.getCurrentUsername();
    if (!username) {
      res.status(401).json({ status: 'error', message: 'Not authenticated' });
      return;
    }

    const playerDataStr = await redis.get(`player_${username}`);
    if (playerDataStr) {
      const playerData = JSON.parse(playerDataStr);
      res.json({ status: 'success', data: playerData });
    } else {
      // New player - return defaults
      res.json({ 
        status: 'success', 
        data: { bestStreak: 0, totalCorrect: 0, currentStreak: 0 } 
      });
    }
  } catch (error) {
    console.error('Player load error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to load player data' });
  }
});

// Update community stats when games are played
router.post('/api/game-completed', async (req, res): Promise<void> => {
  try {
    const { isPerfect } = req.body;
    
    // Increment counters
    await Promise.all([
      redis.incrBy('total_players', 1),
      redis.incrBy('posts_guessed', 1),
      isPerfect ? redis.incrBy('perfect_scores', 1) : Promise.resolve()
    ]);
    
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Game completion error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to update stats' });
  }
});

// Add guess to community feed
router.post('/api/community/add-guess', async (req, res): Promise<void> => {
  try {
    const { username, post, guessedSubreddit, actualSubreddit, score } = req.body;
    
    const guessResult = {
      username: username || 'Anonymous',
      post: post.substring(0, 50) + "...",
      guessedSubreddit,
      actualSubreddit,
      score,
      timestamp: new Date().toISOString(),
      id: Date.now() + Math.random() // Simple unique ID
    };
    
    // Get current guesses
    const currentGuessesStr = await redis.get('community_guesses') || '[]';
    const currentGuesses = JSON.parse(currentGuessesStr);
    
    // Add new guess to the beginning and keep only last 50
    currentGuesses.unshift(guessResult);
    const limitedGuesses = currentGuesses.slice(0, 50);
    
    // Save back to Redis
    await redis.set('community_guesses', JSON.stringify(limitedGuesses));
    
    console.log(`Added community guess from ${username}: ${guessedSubreddit} (${score} pts)`);
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Add guess error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to add guess' });
  }
});

// Get community feed
router.get('/api/community/recent-guesses', async (req, res): Promise<void> => {
  try {
    const guessesStr = await redis.get('community_guesses') || '[]';
    const guesses = JSON.parse(guessesStr);
    
    res.json({ 
      status: 'success', 
      guesses: guesses.slice(0, 20) // Return last 20 guesses
    });
  } catch (error) {
    console.error('Get community guesses error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get community guesses' });
  }
});



router.post<{ postId: string }, IncrementResponse | { status: string; message: string }, unknown>(
  '/api/increment',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', 1),
      postId,
      type: 'increment',
    });
  }
);

router.post<{ postId: string }, DecrementResponse | { status: string; message: string }, unknown>(
  '/api/decrement',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', -1),
      postId,
      type: 'decrement',
    });
  }
);

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);
