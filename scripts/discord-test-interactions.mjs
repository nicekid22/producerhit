const url = "https://pmfnzenqemnonpglmjqx.supabase.co/functions/v1/discord-interactions";
const r = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ type: 1 }),
});
console.log("status", r.status);
console.log("body", await r.text());
