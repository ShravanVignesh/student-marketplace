const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('✅ Node + Express + GitHub Desktop are all working!');
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
