// Runnable check for the CRUD + stats logic. Requires the server to be running
// (npm run dev) against a real MongoDB connection. Usage: npm test
import assert from "node:assert/strict";

const BASE = process.env.API_URL || "http://localhost:5000/api";

async function json(res) {
  return res.json();
}

async function main() {
  // create
  const createRes = await fetch(`${BASE}/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company: "Smoke Test Co",
      position: "QA Engineer",
      dateApplied: "2026-01-01",
    }),
  });
  assert.equal(createRes.status, 201);
  const created = await json(createRes);
  assert.equal(created.status, "Applied"); // default applied
  const id = created._id;

  // read one
  const getRes = await fetch(`${BASE}/applications/${id}`);
  assert.equal(getRes.status, 200);

  // search finds it
  const searchRes = await fetch(`${BASE}/applications?search=Smoke`);
  const searchResults = await json(searchRes);
  assert.ok(searchResults.some((a) => a._id === id), "search should find the created application");

  // status filter excludes it once no longer Applied
  const updateRes = await fetch(`${BASE}/applications/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "Interviewing" }),
  });
  assert.equal(updateRes.status, 200);
  const updated = await json(updateRes);
  assert.equal(updated.status, "Interviewing");

  const filteredRes = await fetch(`${BASE}/applications?status=Applied`);
  const filtered = await json(filteredRes);
  assert.ok(!filtered.some((a) => a._id === id), "status filter should exclude the updated application");

  // stats reflect the record
  const statsRes = await fetch(`${BASE}/applications/stats`);
  const stats = await json(statsRes);
  assert.ok(stats.total >= 1);
  assert.ok(stats.statusCounts.Interviewing >= 1);

  // delete
  const deleteRes = await fetch(`${BASE}/applications/${id}`, { method: "DELETE" });
  assert.equal(deleteRes.status, 200);

  const goneRes = await fetch(`${BASE}/applications/${id}`);
  assert.equal(goneRes.status, 404);

  console.log("smoke test passed");
}

main().catch((err) => {
  console.error("smoke test failed:", err.message);
  process.exit(1);
});
