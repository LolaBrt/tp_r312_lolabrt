// @ts-expect-error bun:sqlite est fourni par le runtime Bun, TypeScript ne le connaît pas forcément
import { Database } from "bun:sqlite";

// new URL(..., import.meta.url) ancre le chemin sur ce fichier : la base utilisée
// est toujours la même, quel que soit le répertoire depuis lequel le process démarre.
const db = new Database(new URL("../../data/db.sqlite", import.meta.url).pathname, { create: true });
db.exec("PRAGMA journal_mode = WAL;");

export interface Basket {
  id: number;
  user_id: number;
  description: string;
  semelle: string;
  empeigne: string;
  pointe: string;
  oeillet: string;
  bande: string;
  languette: string;
  lacet: string;
  trimestre: string;
}

db.run(`CREATE TABLE IF NOT EXISTS BASKETS (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  description TEXT,
  semelle TEXT DEFAULT '#ffffff',
  empeigne TEXT DEFAULT '#ffffff',
  pointe TEXT DEFAULT '#ffffff',
  oeillet TEXT DEFAULT '#ffffff',
  bande TEXT DEFAULT '#ffffff',
  languette TEXT DEFAULT '#ffffff',
  lacet TEXT DEFAULT '#ffffff',
  trimestre TEXT DEFAULT '#ffffff'
)`);

export default db;

db.query("SELECT * FROM BASKETS").all();
