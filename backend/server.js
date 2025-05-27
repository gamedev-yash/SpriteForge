const express = require('express');
const path = require('path');
require('dotenv').config();
const fs = require('fs');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');

const connectMongo = require('./utils/conn');
const User = require('./models/User');
const packRoutes = require('./routes/pack');
const historyRoutes = require('./routes/history'); 
const SpriteController = require('./controllers/spriteController');

const app = express();
const port = process.env.PORT || 3000;

const uploadsDir = process.env.UPLOADS_DIR || 'uploads';
const outputDir = process.env.OUTPUT_DIR || 'output';
const frontendDir = process.env.FRONTEND_DIR || 'frontend';

// Enable CORS if needed
app.use(cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI || 'your-mongodb-atlas-uri-here',
      collectionName: 'sessions',
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: false, // Set to true if using HTTPS (for production)
    },
  })
);

// Connect to MongoDB
connectMongo();

// Ensure directories exist
[uploadsDir, outputDir].forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '..', frontendDir)));

// Serve output files
app.use('/output', express.static(path.join(__dirname, '..', outputDir)));

// --- AUTH ROUTES ---

// Register
app.post('/register', async (req, res) => {
  console.log('[REGISTER] Request body:', req.body);
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: 'Username and password required' });

  try {
    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ message: 'User exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed });
    await user.save();
    req.session.userId = user._id;
    console.log('[REGISTER] User registered:', username);
    res.status(201).json({ message: 'Registered', username });
  } catch (err) {
    console.error('[REGISTER] Error:', err);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login
app.post('/login', async (req, res) => {
  console.log('[LOGIN] Request body:', req.body);
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: 'Username and password required' });

  try {
    const user = await User.findOne({ username });
    if (!user) {
      console.log('[LOGIN] User not found:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log('[LOGIN] Password mismatch for:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    req.session.userId = user._id;
    console.log('[LOGIN] User logged in:', username);
    res.json({ message: 'Logged in', username });
  } catch (err) {
    console.error('[LOGIN] Error:', err);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    console.log('[LOGOUT] User logged out');
    res.json({ message: 'Logged out' });
  });
});

// Auth check middleware
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    console.log('[AUTH] Unauthorized access attempt');
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

// Example protected route
app.get('/profile', requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId).select('-password');
  console.log('[PROFILE] Fetched profile for:', user?.username);
  res.json({ user });
});

// --- SPRITE PACKING ROUTES ---
app.use('/', packRoutes);

// --- HISTORY ROUTES ---
app.use('/history', historyRoutes); 

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

console.log('[DEBUG] process.cwd():', process.cwd());

// Auto-cleanup old uploads every hour
setInterval(() => {
  // SpriteController.cleanupOldUploads(60 * 1000)  // 1 minute
  SpriteController.cleanupOldUploads(24 * 60 * 60 * 1000)  // 1 day
    .then(deleted => {
      if (deleted > 0) {
        console.log(`[AutoCleanup] Deleted ${deleted} old upload(s)`);
      }
    })
    .catch(err => {
      console.error('[AutoCleanup] Error during cleanup:', err);
    });
}, 60 * 60 * 1000); // Every hour
// }, 30 * 1000); // Every 30 seconds

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});