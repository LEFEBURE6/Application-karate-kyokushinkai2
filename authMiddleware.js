const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select("-password");
            return next();
        } catch (error) {
            return res.status(401).json({ message: "Token invalide" });
        }
    }

    res.status(401).json({ message: "Accès non autorisé" });
};

module.exports = protect;
if (!user.isPaid) {
    return res.status(402).json({ message: "Paiement requis pour accéder à l'application" });
}


//Vérifier le token JWT.

//Ajouter l’utilisateur dans req.user.

//Bloquer l’accès si le token est absent ou invalide.