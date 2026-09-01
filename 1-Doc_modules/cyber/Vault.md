# introduction

vault produit opensource de gestion de secret
automatiser l'acces : au secrets, aux données, aux système

permet le stockage et le controle au accès : token, psw, certificats et clé de chiffrement
peut etre utilisé : ligne de commande, API, meme UI, plateforme cloud

vault fonctionne comme un application client serveur. ou le client interagit avec le back end via une connexion tls pour acceder au stockage

quand le serv tourne utiliser un client vault pour recupéré des secret stocké en utilisant l'ip et le port du serv et un jeton vault


Les identifiants sont des données statiques 


# Vault dans Docker-compose

#### 1. Le volume vault-data
écrit ses données chiffrées sur disque, pour ne pas les perdre a chaque down


#### 2. Le service vault

*cap_add: - IPC_LOCK*  : 
cest quoi la prochaine etape

cap_add: - IPC_LOCK, expliqué depuis le début
Le problème que ça résout
Ton ordinateur a de la RAM (rapide, mais limitée) et un disque (plus lent, mais bien plus grand). Quand la RAM est pleine, le système d'exploitation (Linux) a un mécanisme appelé le swap : il prend des blocs de mémoire RAM peu utilisés, les écrit temporairement sur le disque, et libère la RAM pour autre chose. C'est totalement transparent pour les programmes — ils ne savent même pas que ça arrive.

Le souci : Vault stocke des secrets déchiffrés en RAM pendant qu'il tourne (la clé JWT privée, par exemple, une fois lue depuis son stockage chiffré sur disque). Si le système décide de swapper cette zone mémoire sur le disque, ton secret se retrouve écrit en clair dans le fichier de swap du disque — potentiellement de façon persistante, lisible par quiconque a accès au disque plus tard (y compris après extinction), même si tu penses que le secret n'a "jamais quitté la RAM".

Le mécanisme qui protège contre ça
Linux propose un appel système (syscall) appelé mlock() : un programme peut demander au noyau "cette zone de mémoire précise, ne la swap jamais, quoi qu'il arrive". Vault appelle mlock() sur les zones mémoire où il garde des secrets déchiffrés. C'est ce qu'on appelle le memory locking.

Le problème : mlock() est un privilège que Linux ne donne pas par défaut à un processus. Il faut la capability IPC_LOCK (les "capabilities" Linux sont des permissions granulaires, plus fines que "root ou pas root" — IPC_LOCK est spécifiquement celle qui autorise à verrouiller de la mémoire).

Docker, par sécurité, retire par défaut la plupart des capabilities Linux aux conteneurs (pour limiter ce qu'un conteneur compromis pourrait faire). IPC_LOCK en fait partie.

Ce que fait concrètement la ligne
yaml
cap_add:
  - IPC_LOCK
Ça redonne uniquement cette capability précise au conteneur vault (pas toutes les capabilities, pas les droits root complets — juste celle-là). Résultat : Vault peut appeler mlock() avec succès, ses secrets en mémoire ne finissent jamais sur le disque via le swap.

Sans cette ligne : Vault démarre, essaie de verrouiller sa mémoire, l'appel système échoue (permission refusée), et Vault refuse de démarrer en te renvoyant une erreur explicite (Error initializing core: Failed to lock memory: cannot allocate memory) — sauf si on lui dit explicitement de continuer sans cette protection (disable_mlock = true dans le .hcl), ce que je ne veux pas faire ici puisque ta démarche est justement de ne pas contourner ces mécanismes.

*vault-data:/vault/data* → c'est le chemin que le storage "file" du vault.hcl utilise pour écrire (voir plus bas).
*./vault/config:/vault/config* → monte ton fichier de config local dans le conteneur, en lecture. Ça te permet de modifier vault.hcl sur ta machine sans reconstruire l'image.

*environnement* : adresse que le CLI vault urilise par defaut
*entrypoint* : Remplace l'entrypoint par défaut de l'image pour forcer le démarrage en mode serveur avec configuration fichier

#### 3. Les changements sur auth

*VAULT_ADDR* = adresse vault
**VAULT_ROLE_ID:*  =pour que vault capte quel service cest


# Le fichier vault.hcl

HCL (HashiCorp Configuration Language) est le format de config natif des outils HashiCorp. Ce fichier dit à Vault : comment stocker ses données, sur quelle interface écouter, et quelques métadonnées

*storage* = ou vault va persisté, on va les mettre dans un file c'esst un choix standard

*listener* = interface resau de l'API vault