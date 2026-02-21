require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5501;

// Connexion à MongoDB
connectDB();

// Lancement du serveur
app.listen(PORT, () => {
    console.log("Serveur lancé sur le port " + PORT);
});


 