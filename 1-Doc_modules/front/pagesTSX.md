### Structure générale de page

- `<div>` : conteneur neutre, sans signification propre
- `<header>` : en-tête d'une page ou d'une section (logo, titre, nav...)
- `<main>` : contenu principal de la page (un seul par page)
- `<footer>` : pied de page ou pied de section (copyright, liens secondaires...)
- `<nav>` : bloc de liens de navigation
- `<section>` : une section thématique autonome (a souvent son propre titre)
- `<article>` : un contenu indépendant et autosuffisant (un post de blog, une carte de compagnon...)
- `<aside>` : contenu lié mais secondaire, en marge (sidebar, encart)

### Titres et texte

- `<h1>` à `<h6>` : titres hiérarchiques, `<h1>` le plus important
- `<p>` : paragraphe de texte
- `<span>` : conteneur neutre en ligne (comme `<div>` mais pour du texte, ne casse pas la ligne)
- `<strong>` : texte important (généralement affiché en gras)
- `<em>` : texte insisté/emphase (généralement affiché en italique)
- `<small>` : texte accessoire, mentions légales, petits caractères
- `<blockquote>` : citation longue, d'une autre source

### Listes

- `<ul>` : liste non ordonnée (à puces)
- `<ol>` : liste ordonnée (numérotée)
- `<li>` : un élément de liste (dans `<ul>` ou `<ol>`)
- `<dl>` / `<dt>` / `<dd>` : liste de définitions (terme + description) — rare, utile pour un glossaire

### Liens et médias

- `<a>` : lien hypertexte (`<Link>` de react-router-dom en génère un dans le DOM final)
- `<img>` : image
- `<video>` / `<audio>` : contenu vidéo/audio
- `<figure>` / `<figcaption>` : une image (ou autre média) accompagnée de sa légende

### Formulaires

- `<form>` : un formulaire, regroupe des champs liés à une soumission
- `<label>` : légende associée à un champ (accessibilité : cliquer sur le label active le champ)
- `<input>` : champ de saisie (texte, password, checkbox, date... selon `type`)
- `<textarea>` : champ de texte multi-lignes
- `<select>` / `<option>` : liste déroulante et ses choix
- `<button>` : bouton cliquable (à ne pas confondre avec `<input type="submit">`, équivalent mais plus rare aujourd'hui)
- `<fieldset>` / `<legend>` : regroupe plusieurs champs liés, avec un titre de groupe

### Tableaux

- `<table>` : tableau de données
- `<thead>` / `<tbody>` / `<tfoot>` : en-tête, corps, pied du tableau
- `<tr>` : une ligne
- `<th>` : une cellule d'en-tête (titre de colonne/ligne)
- `<td>` : une cellule de donnée normale

### Autres, utiles occasionnellement

- `<time>` : une date/heure, lisible par les machines (attribut `dateTime`)
- `<mark>` : texte surligné (mise en évidence visuelle)
- `<hr>` : séparateur horizontal thématique
- `<br>` : retour à la ligne forcé (à utiliser avec parcimonie, souvent un signe qu'on devrait plutôt utiliser du CSS)