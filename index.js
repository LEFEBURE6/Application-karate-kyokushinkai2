

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Route test principale
app.get("/", (req, res) => {
  res.json({ message: "Backend OK 🚀" });
});

// ✅ Route TEST register (sans MongoDB)
app.post("/api/auth/register", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Champs manquants" });
  }

  res.json({
    message: "Inscription test réussie",
    token: "fake-token-123"
  });
});

// ✅ Route test login (optionnel)
app.post("/api/auth/login", (req, res) => {
  res.json({
    message: "Login OK",
    token: "fake-token-123"
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});


