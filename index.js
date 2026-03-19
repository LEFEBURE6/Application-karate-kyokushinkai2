require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// ✅ Connexion MongoDB
connectDB();

app.use(cors());
app.use(express.json());

// ✅ Route test serveur
app.get("/", (req, res) => {
  res.json({ message: "Backend OK avec DB 🚀" });
});

// ✅ Route TEST register (sans utiliser authRoutes)
app.post("/api/auth/register", (req, res) => {
  res.json({
    message: "Test OK avec DB",
    token: "fake-token-123"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});

