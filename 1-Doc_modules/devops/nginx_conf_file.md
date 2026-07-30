Nginx doit répondre à 3 besoins dans ton projet :

Servir les fichiers statiques du frontend (HTML/CSS/JS)
Rediriger /api/auth/... vers ton container auth
Rediriger /api/game/... vers ton container game (avec support WebSocket)

a - Le squelette minimal obligatoire
```
events {
    worker_connections 1024;
}
http {
    server {
        # tout le reste vient ici
    }
}
```
events {} et http {} sont structurellement obligatoires

2 - Dire à Nginx sur quel port écouter