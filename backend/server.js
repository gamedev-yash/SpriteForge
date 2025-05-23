const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const packRoutes = require('./routes/pack');
const app = express();
const port = 3000;

// Enable CORS
app.use(cors());

// Ensure directories exist
['uploads', 'output'].forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve output files
app.use('/output', express.static(path.join(__dirname, '../output')));

// Use routes
app.use('/', packRoutes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});