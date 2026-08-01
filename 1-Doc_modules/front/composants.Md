Un composant React comme Home est une fonction qui ne prend aujourd'hui aucun paramètre. Une prop (abréviation de property), c'est simplement un paramètre qu'on passe à un composant, exactement comme un argument de fonction classique — sauf que la syntaxe ressemble à des attributs HTML.

L'idée : au lieu d'avoir deux <article> presque identiques avec juste le titre et la description qui changent, on écrit un seul composant DestinyCard, et on lui donne à chaque utilisation les données qui varient (titre, description). Le composant, lui, ne change jamais — seules les données qu'on lui envoie changent.

ex : Destinycard 
interface DestinyCardProps { title: string; description: string }
C'est du TypeScript pur, pas du React. On définit la forme que doivent avoir les props : un objet avec exactement deux champs, title et description, tous deux de type string. Si demain tu essaies d'utiliser <DestinyCard title={5} /> (un nombre au lieu d'un texte), TypeScript te hurlera dessus avant même d'exécuter le code. C'est tout l'intérêt : attraper les erreurs à l'écriture plutôt qu'en testant dans le navigateur.

function DestinyCard({ title, description }: DestinyCardProps) {
Voici le point le plus déroutant au premier abord. En React, un composant reçoit toujours un seul argument : un objet contenant toutes ses props. Donc techniquement, l'argument complet serait props, et on accéderait à props.title, props.description. Mais ici, on utilise la déstructuration ({ title, description }) — une syntaxe JavaScript qui extrait directement les champs qu'on veut depuis cet objet, en une seule ligne. C'est purement une question de confort d'écriture : ça évite d'écrire props. devant chaque variable dans tout le composant.

Le : DestinyCardProps juste après dit à TypeScript "cet objet doit respecter la forme qu'on a définie juste au-dessus".

<h2>{title}</h2>
Nouveauté importante : les accolades { } en plein milieu de JSX. Elles servent à insérer une valeur JavaScript dans du HTML. Sans elles, <h2>title</h2> afficherait littéralement le mot "title" à l'écran. Avec {title}, JSX comprend "remplace ça par la valeur de la variable title". C'est valable pour n'importe quelle expression JavaScript, pas seulement des variables simples : {title.toUpperCase()} ou {2 + 2} fonctionneraient aussi.

export default DestinyCard
Comme pour Home et App : on rend ce composant disponible pour d'autres fichiers.

Utiliser DestinyCard dans Home.tsx