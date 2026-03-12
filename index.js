require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

connectDB();

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);

// ➜ Route GET pour tester ton backend
app.get("/", (req, res) => {
  res.send("Backend opérationnel ✔️");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));


