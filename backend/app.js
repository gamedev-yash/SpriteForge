const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
require('dotenv').config();
const connectMongo = require('./utils/conn');
const User = require('./models/User');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes

// Register
app.post('/register', async (req, res) => {
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
    res.status(201).json({ message: 'Registered', username });
  } catch (err) {
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: 'Username and password required' });

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    req.session.userId = user._id;
    res.json({ message: 'Logged in', username });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});

// Auth check middleware
function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ message: 'Unauthorized' });
  next();
}

// Example protected route
app.get('/profile', requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId).select('-password');
  res.json({ user });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});