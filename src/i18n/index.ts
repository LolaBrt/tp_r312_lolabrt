import fr from "./fr";
import en from "./en";

export const translations = {
  fr,
  en,
};

export type Locale = keyof typeof translations;

export function getTranslations(locale: Locale) {
  return translations[locale];
}