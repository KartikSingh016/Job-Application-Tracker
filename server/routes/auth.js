import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { requireAuth, signToken } from "../middleware/auth.js";

const router = Router();
const googleClient = new OAuth2Client();

// what the client is allowed to see about itself
function publicUser(user) {
  return { id: user._id, email: user.email, name: user.name, picture: user.picture };
}

// POST /api/auth/google — trade a Google ID token for one of ours.
// The client never sends us a password; Google Identity Services hands it a
// signed ID token and we verify that signature before trusting anything in it.
router.post("/google", async (req, res, next) => {
  try {
    const { credential } = req.body || {};
    if (!credential) return res.status(400).json({ error: "Missing Google credential" });

    const audience = process.env.GOOGLE_CLIENT_ID;
    if (!audience) throw new Error("GOOGLE_CLIENT_ID is not set (check your .env file)");

    let payload;
    try {
      // checks Google's signature against their rotating public keys, plus
      // the audience (our client id), the issuer, and expiry
      const ticket = await googleClient.verifyIdToken({ idToken: credential, audience });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ error: "Google sign-in failed — please try again" });
    }

    if (!payload.email_verified) {
      return res.status(403).json({ error: "This Google account has no verified email" });
    }

    // upsert keyed on the Google subject id, so a returning user keeps their data
    const user = await User.findOneAndUpdate(
      { googleId: payload.sub },
      {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ token: signToken(user._id), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — lets the client confirm a stored token is still good on boot
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ error: "Account no longer exists" });
    res.json(publicUser(user));
  } catch (err) {
    next(err);
  }
});

export default router;
