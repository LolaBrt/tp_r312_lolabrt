export const prerender = false;

import { OpenAI } from "openai";

const INFERENCE_API_KEY = import.meta.env.INFERENCE_API_KEY;
const INFERENCE_MODEL = import.meta.env.INFERENCE_MODEL ?? "google/gemma-3-27b-it:free";

// Les 8 parties personnalisables de la basket : le modèle ne doit renvoyer que ces clés
const PARTIES = ["semelle", "empeigne", "pointe", "oeillet", "bande", "languette", "lacet", "trimestre"];

export const POST = async ({ request }) => {
  const {
    message,
    configuration,
    historique = [],
  } = await request.json();

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