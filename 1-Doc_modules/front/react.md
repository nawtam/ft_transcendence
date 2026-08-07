# Table des matières

1. [Introduction](#introduction)
2. [Prérequis](#prérequis)
.Les fonctions
. [Connexion](#Connexion)

















## Les fonctions 

### UseState()
*ex : const [pseudo, setPseudo] = useState('').*

Le premier élément (pseudo) est la valeur actuelle du state
*ici une string, parce qu'on l'a initialisé avec '' (une chaîne vide). Si tu avais fait useState(0), ce serait un nombre à la place.*
Le deuxième élément *(setPseudo)* est toujours une fonction, quel que soit le type de la donnée stockée, c'est la fonction qui permet de remplacer la valeur.

### useNavigate()
*ex : const navigate = useNavigate().*
Quand on l'appelle avec un chemin, 
*ex : navigate('/Home')*, elle change immédiatement l'URL affichée par l'app.

## Connexion

La fonction onChange vas recuperer ce qui est mis dans les inputs a chaque changement.
Vont etre stocker dans des constantes appeler State, qui ont deux varibles une qui sera la string et un autre qui sera le fonction ?. (useState).
Quand on clique sur "Entrer", onSubmit déclenche notre fonction gererSoumission : elle empêche le rechargement de la page pour ne pas perdre les valeurs (preventDefault), puis nous redirige vers l'accueil (navigate).