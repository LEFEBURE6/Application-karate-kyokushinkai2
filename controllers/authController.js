const User = require('../models/User');
const generateToken = require('../util/generateToken');
const bcrypt = require('bcryptjs');
const paypal = require('@paypal/checkout-server-sdk');
const crypto = require("crypto");

/* ============================
   CONFIG PAYPAL
============================ */
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
   INSCRIPTION (CORRIGÉE)
============================ */
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Vérification des champs
    if (!email || !password) {
      return res.status(400).json({ message: "Champs requis" });
    }

    // Vérifier si utilisateur existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Utilisateur déjà inscrit" });
    }

    // Hash mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création user
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    // Token
    const token = generateToken(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token
    });

  } catch (error) {
    console.error("❌ ERREUR registerUser :", error);
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message
    });
  }
};

/* ============================
   MOT DE PASSE OUBLIÉ
============================ */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        message: "Si cet email existe, un lien a été envoyé."
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    res.status(200).json({
      message: "Lien généré",
      resetToken
    });

  } catch (error) {
    console.error(error);
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

    if (!user) {
      return res.status(400).json({ message: "Token invalide" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: "Mot de passe réinitialisé" });

  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/* ============================
   PAYPAL ORDER
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
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

/* ============================
   PAYPAL CAPTURE
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
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  createPayPalOrder,
  capturePayPalOrder,
  forgotPassword,
  resetPassword
};


