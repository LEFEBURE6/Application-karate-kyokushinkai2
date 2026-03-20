const express = require('express');
const router = express.Router();

const { 
    registerUser, 
    loginUser,
    createPayPalOrder, 
    capturePayPalOrder,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');

const { protect } = require('../controllers/authMiddleware');

// 🔹 Inscription
router.post('/register', registerUser);

// 🔹 Connexion
router.post('/login', loginUser);

// 🔹 Mot de passe oublié (envoi email)
router.post('/forgot-password', forgotPassword);

// 🔹 Réinitialisation du mot de passe
router.post('/reset-password/:token', resetPassword);

// 🔹 Création d'une commande PayPal (protégé)
router.post('/paypal/order', protect, createPayPalOrder);

// 🔹 Capture du paiement PayPal (protégé)
router.post('/paypal/capture', protect, capturePayPalOrder);

module.exports = router;





