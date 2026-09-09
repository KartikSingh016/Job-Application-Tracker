// Runnable check for the CRUD + stats logic and per-user isolation. Requires the
// server to be running (npm run dev) against a real MongoDB connection, and the
// same JWT_SECRET it was started with. Usage: npm test
//
// Tokens are minted here rather than exposed by a test route on the server —
// signing with JWT_SECRET is exactly what the server does at sign-in, so this
// exercises the real requireAuth path without adding a backdoor to the API.
import "dotenv/config";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const BASE = process.env.API_URL || "http://localhost:5000/api";

if (!process.env.JWT_SECRET) {
  console.error("smoke test failed: JWT_SECRET is not set (check your .env file)");
  process.exit(1);
}

// a syntactically valid ObjectId, so Mongoose casts it without complaint
const newUserId = () => crypto.randomBytes(12).toString("hex");
const tokenFor = (userId) =>
  jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: "5m" });

const alice = tokenFor(newUserId());
const bob = tokenFor(newUserId());

function call(path, { token, ...options } = {}) {
  return fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

async function main() {
  // --- unauthenticated requests are rejected ---
  assert.equal((await call("/applications")).status, 401, "list requires a token");
  assert.equal((await call("/applications/stats")).status, 401, "stats requires a token");
  assert.equal(
    (await call("/applications", { token: "not-a-real-token" })).status,
    401,
    "a garbage token is rejected"
  );

  // --- create, as alice ---
  const createRes = await call("/applications", {
    token: alice,
    method: "POST",
    body: JSON.stringify({
      company: "Smoke Test Co",
      position: "QA Engineer",
      dateApplied: "2026-01-01",
    }),
  });
  assert.equal(createRes.status, 201);
  const created = await createRes.json();
  assert.equal(created.status, "Applied"); // default applied
  const id = created._id;

  // read one
  assert.equal((await call(`/applications/${id}`, { token: alice })).status, 200);

  // search finds it
  const searchResults = await (await call("/applications?search=Smoke", { token: alice })).json();
  assert.ok(searchResults.some((a) => a._id === id), "search should find the created application");

  // regex metacharacters in the search term must not blow up
  assert.equal((await call("/applications?search=c%2B%2B", { token: alice })).status, 200);

  // query params sent as objects (?search[$gt]= / ?status[$ne]=) must not crash
  // or inject a Mongo operator — they are coerced to strings and ignored
  assert.equal((await call("/applications?search[$gt]=", { token: alice })).status, 200);
  assert.equal((await call("/applications?status[$ne]=zzz", { token: alice })).status, 200);

  // a malformed id is a clean 404, never a 400 that leaks the Mongoose model
  const malformed = await call("/applications/not-a-valid-id", { token: alice });
  assert.equal(malformed.status, 404, "malformed id should 404");

  // --- isolation: bob must not see or touch alice's record ---
  const bobList = await (await call("/applications", { token: bob })).json();
  assert.ok(!bobList.some((a) => a._id === id), "another user's list must not include it");
  assert.equal(
    (await call(`/applications/${id}`, { token: bob })).status,
    404,
    "another user reading it by id gets 404"
  );
  assert.equal(
    (
      await call(`/applications/${id}`, {
        token: bob,
        method: "PUT",
        body: JSON.stringify({ status: "Offer" }),
      })
    ).status,
    404,
    "another user cannot update it"
  );
  assert.equal(
    (await call(`/applications/${id}`, { token: bob, method: "DELETE" })).status,
    404,
    "another user cannot delete it"
  );
  const bobStats = await (await call("/applications/stats", { token: bob })).json();
  assert.equal(bobStats.total, 0, "another user's stats must not count it");

  // --- update, as alice ---
  const updateRes = await call(`/applications/${id}`, {
    token: alice,
    method: "PUT",
    body: JSON.stringify({ status: "Interviewing" }),
  });
  assert.equal(updateRes.status, 200);
  assert.equal((await updateRes.json()).status, "Interviewing");

  // a client cannot hand its record to someone else by posting a userId
  const stolen = await (
    await call(`/applications/${id}`, {
      token: alice,
      method: "PUT",
      body: JSON.stringify({ userId: newUserId() }),
    })
  ).json();
  assert.equal((await call(`/applications/${id}`, { token: alice })).status, 200);
  assert.ok(stolen._id === id, "record stays put when a userId is supplied in the body");

  const filtered = await (await call("/applications?status=Applied", { token: alice })).json();
  assert.ok(
    !filtered.some((a) => a._id === id),
    "status filter should exclude the updated application"
  );

  // stats reflect the record
  const stats = await (await call("/applications/stats", { token: alice })).json();
  assert.ok(stats.total >= 1);
  assert.ok(stats.statusCounts.Interviewing >= 1);

  // delete
  assert.equal((await call(`/applications/${id}`, { token: alice, method: "DELETE" })).status, 200);
  assert.equal((await call(`/applications/${id}`, { token: alice })).status, 404);

  console.log("smoke test passed");
}

main().catch((err) => {
  console.error("smoke test failed:", err.message);
  process.exit(1);
});
