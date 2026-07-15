// Paramètres de sécurité partagés côté serveur.

// Coût (rounds) du hachage bcrypt. 12 est la valeur recommandée par l'OWASP
// (Password Storage Cheat Sheet) : assez lent pour freiner le brute-force,
// assez rapide pour ne pas dégrader l'expérience de connexion.
export const BCRYPT_ROUNDS = 12
