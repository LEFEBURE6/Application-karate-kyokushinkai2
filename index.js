require('dotenv').config();
const express = require('express');
const cors = require('cors'); // ✅
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

connectDB();

const app = express();

app.use(cors()); // ✅ IMPORTANT
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Backend opérationnel ✔️" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));


