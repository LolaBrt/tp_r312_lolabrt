import db from "../../lib/db.js";

export const POST = async ({ request, locals }) => {
  const userId = locals.user?.id;

  if (!userId) {
    return new Response(JSON.stringify({ error: "Non authentifié" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json();
  const theme = body?.theme;

  if (theme !== "light" && theme !== "dark") {
    return new Response(JSON.stringify({ error: "Thème invalide" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  db.query(`
    INSERT INTO USER_PREFERENCES (user_id, theme)
    VALUES (?, ?)
    ON CONFLICT(user_id) DO UPDATE SET theme = excluded.theme
  `).run(userId, theme);

  return new Response(JSON.stringify({ theme }), {
    headers: { "Content-Type": "application/json" },
  });
};
