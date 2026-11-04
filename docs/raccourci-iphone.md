# Raccourci iPhone « Ajouter à Popote »

Sur iPhone, Popote n'apparaît pas dans le menu Partager d'Instagram. Ce raccourci, réglé **une seule fois**, enregistre la vidéo dans le carnet sans ouvrir l'appli : Partager, puis Ajouter à Popote, puis 2-3 mots, et c'est fini.

Durée : 5 minutes. Il faut l'app **Raccourcis** (déjà sur l'iPhone, icône carrée violette et rose).

## Avant de commencer
1. Ouvre Popote, connecte-toi, puis en bas du carnet touche **Sur iPhone : le raccourci « Ajouter à Popote »**.
2. Garde cet écran ouvert : il donne l'**adresse** et **ton jeton**, avec un bouton « Copier » pour chacun.
   Le jeton est personnel : c'est grâce à lui que la recette porte ta pastille. Ne le donne à personne.

## Créer le raccourci
1. Ouvre **Raccourcis**, onglet **Raccourcis**, puis **+** en haut à droite.
2. Touche le nom en haut (« Nouveau raccourci »), puis **Renommer** : `Ajouter à Popote`.
3. Touche **ⓘ** en bas (ou la flèche à côté du nom, puis **Détails**). Active **Afficher dans la feuille de partage**, puis **OK**.
   En haut du raccourci, une ligne « Recevoir **Tout** de **Feuille de partage** » apparaît : touche **Tout**, ne garde que **URL** et **Texte**.
   Juste en dessous, « Si aucune entrée » : choisis **Continuer**.
4. **Ajouter une action** : cherche **Demander une saisie** (en anglais « Ask for Input »).
   Touche **Invite** (ou « Question ») et écris : `2-3 mots pour la retrouver`.
5. Ajoute l'action **Obtenir le contenu de l'URL** (« Get Contents of URL »).
   - Touche **URL** : retourne dans Popote, **Copier l'adresse**, et colle-la ici.
   - Touche la petite flèche **›** pour voir plus d'options :
     - **Méthode** : `POST`
     - **Corps de la requête** : `JSON`
     - Ajoute 3 champs (**Ajouter un nouveau champ**, puis **Texte**) :

       | Clé | Valeur |
       |---|---|
       | `jeton` | colle ton jeton (Popote, **Copier le jeton**) |
       | `lien` | touche la case, puis **Sélectionner une variable**, puis **Entrée du raccourci** |
       | `mots` | touche la case, puis **Sélectionner une variable**, puis **Saisie fournie** (« Provided Input ») |
6. Ajoute l'action **Afficher le résultat** (« Show Result »). Elle doit montrer **Contenu de l'URL**.
7. Touche **OK** en haut à droite. C'est réglé.

## L'utiliser
1. Dans Instagram, sur une vidéo : **Partager** (l'avion en papier), puis **Partager via…** ou **Plus**.
2. Choisis **Ajouter à Popote**. La première fois, l'iPhone demande l'autorisation d'envoyer à supabase.co : réponds **Toujours autoriser**.
3. Écris 2-3 mots (`ravioles ricotta`), puis **OK**.
4. Le raccourci affiche « Ajoutée au carnet ✓ » ou « Déjà dans le carnet ».

Ça marche aussi depuis Safari, pour une recette d'un site web.

## Si ça ne marche pas
| Message | Que faire |
|---|---|
| « jeton faux ou effacé » | Recopie le jeton depuis Popote dans le champ `jeton` (étape 5). |
| « aucun lien trouvé » | Le champ `lien` doit être la variable **Entrée du raccourci**, pas du texte tapé. |
| « le raccourci est mal réglé » | **Corps de la requête** doit être sur **JSON**, et **Méthode** sur **POST**. |
| Rien ne s'affiche | Ajoute l'action **Afficher le résultat** (étape 6). |
| « Ajouter à Popote » absent de Partager | Étape 3 : **Afficher dans la feuille de partage** activé, avec URL et Texte. Dans le menu Partager, touche **Modifier les actions** pour l'ajouter. |

Jeton montré à quelqu'un par erreur : demande à Celia de l'effacer (commande en bas de `supabase/raccourci.sql`), puis rouvre l'écran du raccourci dans Popote pour en avoir un nouveau.
