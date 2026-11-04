# Popote ne marche plus : que faire ?

Pour chaque souci : ce qu'on voit, ce qu'on fait, et la phrase à donner à Claude Code si ça ne suffit pas.

**Qui a quoi** : tous les comptes sont à Celia (GitHub, Supabase, Brevo, cron-job.org).
- Supabase : https://supabase.com/dashboard, projet `recettes`.
- Brevo : https://app.brevo.com
- cron-job.org : https://console.cron-job.org

## L'appli ne s'ouvre plus, ou reste blanche
1. Ferme Popote complètement, puis rouvre-la.
2. Sans réseau, elle montre la dernière version gardée : c'est normal.
3. Toujours blanche : ouvre https://celiafrassier-hash.github.io/recettes/ dans le navigateur.
   - Si ça marche dans le navigateur : désinstalle l'appli et réinstalle-la (menu ⋮, « Installer l'application » ; sur iPhone : Partager, « Sur l'écran d'accueil »).
   - Si ça ne marche pas non plus : sur GitHub, dépôt `recettes`, onglet **Actions**, la dernière ligne est-elle rouge ?

> Claude Code : « Popote reste blanche, même dans le navigateur. Regarde le dernier déploiement GitHub Actions du dépôt recettes et répare. »

## « Pas de réseau : tu vois la dernière version gardée » alors qu'il y a du réseau
Supabase s'est peut-être endormi (version gratuite, après 7 jours sans activité).
1. Va sur Supabase. Si le projet est marqué **Paused**, touche **Restore project** et attends 2 minutes.
2. Puis vérifie le réveil quotidien sur cron-job.org (voir plus bas).

> Claude Code : « Popote dit Pas de réseau alors que j'ai du réseau. Vérifie Supabase et la fonction veille. »

## Le code de connexion n'arrive pas
1. Regarde dans les **spams** (le mail vient de « Popote »).
2. Attends 1 minute avant de redemander : trop d'essais bloquent quelques minutes.
3. Vérifie l'adresse : elle doit être exactement celle de la liste des membres, **points compris** (`prenom.nom@gmail.com` et `prenomnom@gmail.com` sont deux adresses différentes pour Popote).
4. Toujours rien : la clé SMTP de Brevo a sûrement expiré. Elle expire **après 90 jours sans aucun mail envoyé**, ce qui arrive vite, puisqu'on reste connectées des mois.
   - Brevo : **Paramètres**, puis **SMTP et API**, puis **Générer une nouvelle clé SMTP**.
   - Supabase : **Authentication**, puis **Emails**, puis **SMTP Settings**. Colle la nouvelle clé dans **Password**, puis **Save**.

> Claude Code : « Le code Popote n'arrive pas, même après avoir changé la clé Brevo. Aide-moi à vérifier les réglages SMTP. »

## « Ton adresse n'est pas dans la liste des membres »
L'adresse tapée n'est pas exactement celle de la table `membre`. Dans Supabase, **SQL Editor** :
`select prenom, email from membre;` et compare lettre par lettre.

## Ajouter une copine au carnet
Voir `docs/comptes.md`, étape 5 (table `membre`). Ensuite, dans **Authentication**, puis **Users**, puis **Add user**, puis **Create new user**, avec son adresse et la case **Auto Confirm User** cochée.

## Le raccourci iPhone affiche une erreur
Voir le tableau en bas de `docs/raccourci-iphone.md`.
- « la fonction n'a pas accès à la base » : relance `supabase/raccourci.sql` (les 2 lignes `grant` à la fin).

> Claude Code : « Le raccourci iPhone de Popote répond : <copie le message>. Répare. »

## La sauvegarde du dimanche
Chaque dimanche, un fichier `sauvegardes/AAAA-MM-JJ.json` apparaît dans le dépôt GitHub **privé** `popote-sauvegardes`.
- Plus de nouveau fichier : sur cron-job.org, ouvre la tâche « Popote veille », puis **History**, et lis la dernière réponse.
  - « sauvegarde refusée par GitHub (401) » : le jeton GitHub a expiré. Sur GitHub, **Settings**, puis **Developer settings**, puis **Fine-grained tokens**, puis **Regenerate**. Colle le nouveau jeton dans Supabase : **Edge Functions**, puis **Secrets**, `GITHUB_TOKEN`.
- Le bouton **Exporter mes recettes**, en bas du carnet, télécharge aussi une copie à tout moment.

> Claude Code : « La sauvegarde Popote du dimanche ne marche plus, cron-job.org dit : <copie le message>. »

## Remettre une sauvegarde
> Claude Code : « J'ai perdu des recettes dans Popote. Remets celles de la sauvegarde du <date> (dépôt popote-sauvegardes) sans effacer les nouvelles. »
