const express = require('express');
const path = require('path');
const packRoutes = require('./routes/pack');
const app = express();
const port = 3000;

app.use(express.static('frontend'));
app.use('/output', express.static('output'));
app.use('/', packRoutes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});