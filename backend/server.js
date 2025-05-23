const express = require('express');
const path = require('path');
const fs = require('fs');
const packRoutes = require('./routes/pack');
const app = express();
const port = 3000;

// Ensure directories exist
['uploads', 'output'].forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

app.use(express.static('frontend'));
app.use('/output', express.static('output'));
app.use('/', packRoutes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});