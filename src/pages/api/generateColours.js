export const prerender = false;

import db from "../../lib/db";

import { OpenAI } from "openai";

const INFERENCE_API_KEY = import.meta.env.INFERENCE_API_KEY;
const INFERENCE_MODEL = import.meta.env.INFERENCE_MODEL ?? "google/gemma-3-27b-it:free";

// Les 8 parties personnalisables de la basket : le modèle ne doit renvoyer que ces clés
const PARTIES = ["semelle", "empeigne", "pointe", "oeillet", "bande", "languette", "lacet", "trimestre"];

export const POST = async ({ request, locals }) => {
  const {
    message,
    configuration,
    historique = [],
  } = await request.json();

  const userId = locals.user?.id;

  if (!userId) {
    return new Response(
      JSON.stringify({ error: "Non authentifié" }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    },
  );
  }

const endpoint = "generateColours";
const limite = 10;
const fenetreSecondes = 60 * 60;
const maintenant = Math.floor(Date.now() / 1000);
const debutFenetre = maintenant - fenetreSecondes;

let limiteAtteinte = false;

try {
  db.exec("BEGIN IMMEDIATE");

  const result = db
    .query(`
      SELECT COUNT(*) AS count
      FROM RATE_LIMIT_EVENTS
      WHERE user_id = ?
        AND endpoint = ?
        AND created_at >= ?
    `)
    .get(userId, endpoint, debutFenetre);

  const nombreRequetes = Number(result?.count ?? 0);

  if (nombreRequetes >= limite) {
    limiteAtteinte = true;
    db.exec("ROLLBACK");
  } else {
    db
      .query(`
        INSERT INTO RATE_LIMIT_EVENTS (user_id, endpoint, created_at)
        VALUES (?, ?, ?)
      `)
      .run(userId, endpoint, maintenant);

    db.exec("COMMIT");
  }
} catch (error) {
  try {
    db.exec("ROLLBACK");
  } catch (rollbackError) {
    console.error("Impossible d'annuler la transaction SQLite :", rollbackError);
  }

  console.error("Erreur lors du rate limiting :", error);
  throw error;
}

if (limiteAtteinte) {
  return new Response(
    JSON.stringify({
      error: "Trop de requêtes. Réessayez plus tard.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(fenetreSecondes),
      },
    },
  );
}

  const historiqueValide = historique
  .filter(
    (item) =>
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string",
  )
  .slice(-10);

  const client = new OpenAI({
    baseURL: import.meta.env.INFERENCE_URL,
    apiKey: INFERENCE_API_KEY,
  });

  const chatCompletion = await client.chat.completions.create({
    model: INFERENCE_MODEL,
    messages: [
      {
        role: "system",
        content:
          `Tu choisis les couleurs d'une paire de basket personnalisée. ` +
          `Réponds UNIQUEMENT avec un objet JSON, sans aucun texte autour, contenant exactement ces clés : ${PARTIES.join(", ")}. ` +
          `Chaque valeur doit être une couleur au format hexadécimal #rrggbb. ` +
          `Voici la configuration actuelle : ${JSON.stringify(configuration)}. ` +
          `Voici l'historique des messages : ${JSON.stringify(historiqueValide)}. ` +
          `Ne change que les parties mentionnées par l'utilisateur, garde les autres identiques.`,
      },
      { role: "user", content: message },
    ],
  });

  const content = chatCompletion.choices[0].message.content || "";
  console.log("réponse IA (couleurs) :", content);

  // On isole le premier objet JSON présent dans la réponse, au cas où le modèle ajoute du texte autour malgré la consigne
  const jsonMatch = content.match(/\{[\s\S]*\}/);

  const couleurs = {};
  try {
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    // On ne fait jamais confiance aveuglément à une réponse d'IA : on ne garde que les clés attendues,
    // avec une valeur au format hexadécimal valide
    for (const partie of PARTIES) {
      if (typeof parsed[partie] === "string" && /^#[0-9a-fA-F]{6}$/.test(parsed[partie])) {
        couleurs[partie] = parsed[partie];
      }
    }
  } catch (error) {
    console.error("Réponse IA non parsable en JSON :", error);
  }

  return new Response(JSON.stringify({ couleurs }), {
    headers: { "Content-Type": "application/json" },
  });

  
};