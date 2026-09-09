import "dotenv/config";
import app from "../app.js";

// The Express app is itself a (req, res) handler. Connecting to Mongo now
// happens inside the app as middleware (after cors), so preflight OPTIONS no
// longer wait on the database.
export default app;
