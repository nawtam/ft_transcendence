État (useState) :

Points de vie — probablement pv et pvMax séparés, vu que ta maquette affiche "84/100". Pareil pour le mana : mana et manaMax.
inventaire — un tableau d'objets. Chaque objet a besoin d'un identifiant, d'un nom (Bâton de Cristal, Potion de Soin...), et d'une quantité si tu veux gérer les stacks ("Potion de Soin x3" par exemple).
objetSelectionne — quel objet de l'inventaire est actuellement mis en avant (le Bâton de Cristal est surligné sur ta capture). Ça peut être l'id de l'objet, ou null si rien n'est sélectionné.
choixNarratif — le choix déjà fait parmi les options proposées ("Écouter le chant des étoiles", etc.), ou null/undefined si aucun choix n'a encore été fait pour la scène en cours.
messages — le chat de la scène (le "MJ :" et "Elyndra :" que tu vois dans le panneau de droite). Même structure que pour lobbyContext : identifiant, auteur, texte.
groupe — les joueurs présents sur les lieux, chacun avec un pseudo, une classe (Mage, Druide, Paladin, Rôdeur...), et ses PV actuels — c'est ce qui alimente les barres de vie individuelles du panneau "Sur les lieux".

Fonctions exposées :

une pour envoyer un message dans le chat de scène (même logique que envoyerMessage dans lobbyContext)
une pour sélectionner un objet de l'inventaire
une pour valider un choix narratif (enregistre le choix fait)
une ou deux pour faire évoluer les PV/mana (subir des dégâts, se soigner, dépenser du mana) — c'est ce qui fera bouger les barres en haut