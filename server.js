const express = require('express');
const path = require('path');
const parentRoutes = require('./routes/parent');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api', parentRoutes);

app.listen(PORT, function () {
  console.log('Fraction Fusion running on port ' + PORT);
});
