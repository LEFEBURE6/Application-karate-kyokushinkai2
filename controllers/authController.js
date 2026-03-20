const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../util/sendEmail');
const generateToken = require('../util/generateToken');

// PAYPAL SDK
const paypal = require('@paypal/checkout-server-sdk');

const environment = process.env.PAYPAL_MODE === 'live'
  ? new paypal.core.LiveEnvironment(
      process.env.PAYPAL_CLIENT_ID,
      process.env.PAYPAL_CLIENT_SECRET
    )
  : new paypal.core.SandboxEnvironment(
      process.env.PAYPAL_CLIENT_ID,
      process.env.PAYPAL_CLIENT_SECRET
    );

const client = new paypal.core.PayPalHttpClient(environment);

/* ============================
   INSCRIPTION
============================ */
const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Champs requis" });

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "Utilisateur déjà inscrit" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      isPaid: false
    });

    const token = generateToken(user._id);

    res.status(201).json({
      _id: user._id,
      email: user.email,
      isPaid: user.isPaid,
      token
    });

  } catch (error) {
    console.error("❌ ERREUR registerUser :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/* ============================
   CONNEXION
============================ */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Email ou mot de passe incorrect" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Email ou mot de passe incorrect" });

    const token = generateToken(user._id);

    res.json({
      _id: user._id,
      email: user.email,
      isPaid: user.isPaid,
      token
    });

  } catch (error) {
    console.error("❌ ERREUR loginUser :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/* ============================
   MOT DE PASSE OUBLIÉ (EMAIL)
============================ */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Toujours répondre OK pour éviter de révéler si un email existe
    if (!user)
      return res.status(200).json({ message: "Si cet email existe, un lien a été envoyé." });

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetURL = `https://application-karate-kyokushinkai2.onrender.com/reset-password.html?token=${resetToken}`;

    const html = `
      <h2>Réinitialisation de votre mot de passe</h2>
      <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
      <p>Cliquez sur le lien ci-dessous :</p>
      <a href="${resetURL}" style="padding:10px 20px;background:#0070ba;color:white;text-decoration:none;border-radius:5px;">
        Réinitialiser mon mot de passe
      </a>
      <p>Ce lien expire dans 15 minutes.</p>
    `;

    await sendEmail(email, "Réinitialisation de votre mot de passe", html);

    res.status(200).json({ message: "Email envoyé." });

  } catch (error) {
    console.error("❌ ERREUR forgotPassword :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/* ============================
   RESET PASSWORD
============================ */
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user)
      return res.status(400).json({ message: "Token invalide ou expiré" });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: "Mot de passe réinitialisé avec succès" });

  } catch (error) {
    console.error("❌ ERREUR resetPassword :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/* ============================
   PAYPAL - CREATE ORDER
============================ */
const createPayPalOrder = async (req, res) => {
  try {
    const request = new paypal.orders.OrdersCreateRequest();

    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'EUR',
            value: '10.00'
          }
        }
      ]
    });

    const order = await client.execute(request);

    res.json({ id: order.result.id });

  } catch (error) {
    console.error("❌ ERREUR createPayPalOrder :", error);
    res.status(500).json({ message: error.message });
  }
};

/* ============================
   PAYPAL - CAPTURE ORDER
============================ */
const capturePayPalOrder = async (req, res) => {
  try {
    const { orderID } = req.body;

    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    const capture = await client.execute(request);

    if (capture.result.status === 'COMPLETED') {
      const user = await User.findById(req.user._id);
      user.isPaid = true;
      await user.save();

      return res.json({ message: "Paiement réussi", user });
    }

    res.status(400).json({ message: "Paiement non validé" });

  } catch (error) {
    console.error("❌ ERREUR capturePayPalOrder :", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  createPayPalOrder,
  capturePayPalOrder
};




