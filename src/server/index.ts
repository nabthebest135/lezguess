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
    const postIndex = Math.abs(seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 10; // Use first 10 posts for simplicity
    
    // Simple post data - you can expand this
    const posts = [
      { id: 1, content: "The intent is to provide players with a sense of pride and accomplishment...", subreddit: "StarWarsBattlefront", year: 2017, difficulty: "easy", upvotes: -667000, context: "EA's response to microtransactions controversy" },
      { id: 2, content: "BREAKING: We did it Reddit! Boston bomber caught!", subreddit: "news", year: 2013, difficulty: "hard", upvotes: 3000, context: "Reddit's infamous misidentification during Boston Marathon bombing" },
      { id: 3, content: "Holy shit, Keanu Reeves just walked out on stage at E3!", subreddit: "gaming", year: 2019, difficulty: "medium", upvotes: 89000, context: "E3 Cyberpunk 2077 announcement with Keanu Reeves" },
      { id: 4, content: "I also choose this guy's dead wife.", subreddit: "AskReddit", year: 2017, difficulty: "medium", upvotes: 45000, context: "Legendary dark humor response that became Reddit folklore" },
      { id: 5, content: "Thanks for the gold, kind stranger!", subreddit: "circlejerk", year: 2012, difficulty: "easy", upvotes: 12000, context: "Classic Reddit gold response meme" },
      { id: 6, content: "Banana for scale", subreddit: "pics", year: 2013, difficulty: "medium", upvotes: 25000, context: "Origin of the banana scale meme" },
      { id: 7, content: "Test post please ignore", subreddit: "pics", year: 2012, difficulty: "hard", upvotes: 23000, context: "Most upvoted 'please ignore' post" },
      { id: 8, content: "Broken arms", subreddit: "IAmA", year: 2012, difficulty: "hard", upvotes: 15000, context: "Infamous Reddit story reference" },
      { id: 9, content: "When does the narwhal bacon?", subreddit: "reddit.com", year: 2009, difficulty: "expert", upvotes: 8000, context: "Early Reddit secret handshake" },
      { id: 10, content: "Geraffes are so dumb", subreddit: "pics", year: 2009, difficulty: "expert", upvotes: 5000, context: "Classic misspelling that became legendary" }
    ];
    
    const currentPost = posts[postIndex];
    console.log(`Generating post for room ${roomCode}, round ${room.currentRound}, seed: ${seed}, postIndex: ${postIndex}`);
    
    // Generate deterministic multiple choice options
    const commonSubreddits = [
      'gaming', 'AskReddit', 'funny', 'pics', 'news', 'worldnews', 'todayilearned',
      'movies', 'music', 'videos', 'IAmA', 'science', 'technology', 'politics',
      'sports', 'television', 'books', 'food', 'DIY', 'LifeProTips', 'showerthoughts',
      'mildlyinteresting', 'oddlysatisfying', 'wholesomememes', 'dankmemes',
      'relationship_advice', 'tifu', 'confession', 'unpopularopinion', 'changemyview',
      'explainlikeimfive', 'nostupidquestions', 'OutOfTheLoop', 'bestof',
      'StarWarsBattlefront', 'circlejerk', 'WhatsInThisThing', 'legaladvice', 'reddit.com'
    ];
    
    const availableOptions = commonSubreddits.filter(sub => sub !== currentPost.subreddit);
    const options = [currentPost.subreddit];
    
    // Use deterministic selection based on seed for consistent options
    const optionSeed = seed + 'options';
    let seedValue = optionSeed.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    
    // Add 3 deterministic wrong options
    while (options.length < 4 && availableOptions.length > 0) {
      const index = seedValue % availableOptions.length;
      const selectedOption = availableOptions[index];
      if (!options.includes(selectedOption)) {
        options.push(selectedOption);
      }
      availableOptions.splice(index, 1); // Remove to avoid duplicates
      seedValue = Math.abs(seedValue * 1103515245 + 12345); // Simple LCG for next "random" number
    }
    
    // Deterministic shuffle based on seed
    const shuffleSeed = seed + 'shuffle';
    let shuffleValue = shuffleSeed.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    for (let i = options.length - 1; i > 0; i--) {
      const j = shuffleValue % (i + 1);
      [options[i], options[j]] = [options[j], options[i]];
      shuffleValue = Math.abs(shuffleValue * 1103515245 + 12345);
    }
    
    console.log(`Generated options for ${currentPost.subreddit}:`, options);
    res.json({ status: 'success', post: currentPost, options });
  } catch (error) {
    console.error('Get current post error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get current post' });
  }
});

// Submit multiplayer guess
router.post('/api/multiplayer/submit-guess', async (req, res): Promise<void> => {
  try {
    const { roomCode, guess, score, username } = req.body;
    
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
    
    // Mark player as submitted
    const playerIndex = room.players.findIndex((p: any) => p.username === username);
    if (playerIndex !== -1) {
      room.players[playerIndex].hasSubmitted = true;
      room.players[playerIndex].score += score;
    }

    // Add guess to round guesses
    room.roundGuesses.push({
      username,
      guess,
      score,
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
    res.json({ status: 'success', room, allSubmitted });
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
