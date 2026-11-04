# Cahier des charges : Popote, appli recettes (Celia & Alice)

Statut : v3.2, 2026-11-04 (pastille d'initiale, liste des membres). v3.1 du 2026-11-03. Relu par le conseil (3 fois), décisions de Celia intégrées, maquette V1 « Sauge » validée par Celia et Alice. Prêt pour la construction.

## 1. Objectif

Remplacer l'Excel abandonné au bout de 2 semaines par une appli téléphone **belle** et **sans saisie inutile**.

Le moment clé : **le dimanche**, chacune prépare son menu de la semaine et ses courses. On tape « ravioles » et on retrouve tout ce qu'on a déjà fait ou enregistré.

Utilisatrices : Celia (Android) et Alice (iPhone). Personne d'autre.

**Ce qui est commun et ce qui ne l'est pas :**
- **Commun** : le carnet de recettes. Ce que l'une ajoute, l'autre le voit.
- **Propre à chacune** : le menu de la semaine, la liste de courses, le statut « déjà faite ». On ne voit pas le menu ni les courses de l'autre.

Excel a échoué pour 3 raisons. L'appli doit régler les trois :
1. C'était moche, donc l'appli doit être visuelle (cartes colorées, photos).
2. Tout se tapait à la main, donc on ne tape que le strict nécessaire.
3. Chercher était pénible, donc on retrouve une recette avec un seul champ de recherche.

**Réussite** : on l'utilise encore après **6 dimanches**.

## 2. Fonctions (version 1)

### 2.1 Enregistrer une vidéo Insta (favori avec mots-clés)
- Sur Insta : « Partager », puis l'appli. On tape 2-3 mots-clés (« ravioles ricotta »), puis on enregistre. C'est fini.
- **L'appli ne lit pas la vidéo.** Elle garde le lien et les mots-clés. Chercher « ravioles » fait ressortir la carte, et un tap ouvre la vidéo dans Insta.
- Android : l'appli apparaît dans le menu Partager (Web Share Target). Le lien peut arriver dans le champ `text` ou `url` : il faut lire les deux. Le même partage marche depuis Chrome pour une recette web (§2.2).
- iPhone : un raccourci iOS « Ajouter au carnet », installé une fois, demande les mots-clés puis envoie la recette directement au serveur, **sans ouvrir l'appli**. Si le jeton du raccourci est faux ou expiré, le raccourci affiche une erreur claire (jamais un échec silencieux).
- Le bouton **+** de l'appli ne propose pas Insta : les vidéos arrivent seulement par Partager.
- **Doublon** : si le lien est déjà dans le carnet (ex. Celia puis Alice partagent la même vidéo), pas de 2e carte. Dans l'appli : message « déjà dans le carnet » et ouverture de la carte existante. Avec le raccourci iPhone (qui n'ouvre pas l'appli) : il affiche seulement « déjà dans le carnet ».
- **Lien nettoyé avant de comparer** : Insta ajoute un traceur différent à chaque partage. On retire `?igsh=…`, les `utm_…` et le `/` final, et on ne garde que l'identifiant de la vidéo (`/reel/ABC` = `/p/ABC`). Même nettoyage pour les liens web (sans l'identifiant).

### 2.2 Ajouter avec le bouton +
Le + propose deux choix :
1. **Recette d'un site web** : coller le lien + le nom du plat. Un lien sans `https://` (« marmiton.org/crepes ») est complété tout seul. Un lien invalide ou un nom vide affiche un message clair, en orange, au lieu de ne rien faire.
2. **Recette à la main** : nom du plat (obligatoire), ingrédients écrits d'un trait dans un seul champ (« 1,5 kg patates, 20 cl crème, gruyère »), et en option les étapes (une par ligne). Le nombre de personnes des ingrédients se règle avec − / + (1 par défaut) ; ce n'est pas un champ à remplir.

**Aperçu « L'appli a compris »** : sous chaque champ d'ingrédients (ici et dans la fiche), l'appli affiche en direct comment elle a découpé le texte (« 1,5 kg patates · 20 cl crème · sel »). Un nombre **sans unité** sur un aliment qui ne se compte pas (« 1,5 patates ») est surligné en orange avec « Vérifie (ex. 1,5 kg au lieu de 1,5) ».

Le découpage doit gérer :
- la virgule décimale (« 1,5 kg ») ;
- « ½ », « 1/2 » et « 2-3 » ;
- « c. à soupe », « c. à café », « pincée », « paquet », « gousse » ;
- un ingrédient sans quantité (« sel ») ;
- une marque ou une précision après le nom (« 10 cl lait de coco Aroy-D ») : elle reste dans le nom ;
- un texte **copié-collé** depuis un site : « 20 cl de crème » et « 2 c. à soupe d'huile » (le « de / d' » disparaît du nom), « 200g » sans espace, puces et tirets en début de ligne (« - 2 œufs », « • sel »).

**Pour combien de personnes** : chaque champ d'ingrédients affiche « pour X personnes » avec − / +. Par défaut : **4** pour une vidéo Insta ou un site web (les recettes en ligne sont presque toujours pour 4), **1** pour une recette à la main. Les quantités sont ensuite ramenées à 1 personne en interne.

### 2.3 Carnet commun
- Une seule collection pour les deux.
- Trois types de cartes, chacune avec un petit logo : **vidéo Insta** (logo Insta), **site web** (globe), **à la main** (crayon).
- Chaque carte porte aussi une **pastille ronde avec l'initiale** de celle qui l'a ajoutée (C, A…), en miniature, à côté du logo de type.
- Statut **propre à chacune** : à tester / déjà faite. Celia peut avoir une recette « à tester » alors qu'Alice l'a « déjà faite ». La carte l'indique (« Alice l'a déjà faite »). La fiche montre le statut de chaque membre (ex. « Celia : déjà faite · Alice : à tester · Lise : pas encore »). Le bouton « Je l'ai faite » de la fiche change le statut de celle qui est connectée.
- Texte de la carte : « 5 ingrédients · 25 min », ou « Vidéo Insta · ingrédients à ajouter » / « Site web · ingrédients à ajouter » tant qu'il n'y a pas d'ingrédients.
- Fiche recette (on touche la carte) :
  - lien vers la vidéo ou le site ;
  - ingrédients avec un réglage **− / + personnes** qui recalcule les quantités ;
  - bouton **« + Ajouter ou modifier »** sous les ingrédients : ouvre la liste dans un champ (une ligne par ingrédient), avec l'aperçu de §2.2 ;
  - étapes, avec **« + Ajouter ou modifier une étape »** (une ligne par étape, pour noter les astuces « la prochaine fois ») ;
  - modifier le nom ou les mots-clés ;
  - boutons « Je l'ai faite » et « Mettre au menu » ;
  - **supprimer la recette**, avec confirmation. Si elle est dans un menu, les cases concernées se vident et l'appli le dit.
- Aucune miniature Insta (impossible sans passer par Facebook). Le visuel vient d'une couleur choisie automatiquement, ou d'une **photo du plat** prise avec « Ajouter une photo ». Plus tard (v2, avec Watch) : une image tirée de la vidéo.
- En haut du carnet, un bloc **« Aujourd'hui · <jour> »** : « Ce midi » et « Ce soir » d'après **mon** menu. Un tap ouvre la recette ; si rien n'est prévu (ou case Plaisir), il ouvre le menu.
- Sous la recherche, des pastilles de **catégories** : Poulet, Viande rouge, Poisson, Légumes, Pâtes & riz, Végé, Salade, Soupe, Dessert, Petit-déj. Pastilles neutres (gris-vert), en bordeaux quand elles sont choisies. La catégorie se **choisit en 1 tap** sur la fiche (facultatif, plusieurs possibles). Pas de déduction automatique en v1 : la plupart des vidéos Insta n'ont pas d'ingrédients au départ.
- Photo du plat : réduite dans le téléphone avant l'envoi (environ 1000 px, moins de 300 Ko) pour rester dans le stockage gratuit.
- Animations douces en CSS : fiche qui monte depuis le bas, cartes qui apparaissent en glissant, petit « pop » quand on coche. Coupées si le téléphone demande moins d'animations. GSAP seulement après la v1.

### 2.4 Recherche
- Un champ en haut du carnet. Il cherche dans le nom, les mots-clés et les ingrédients.
- Il ignore les accents, les majuscules et le pluriel simple (« raviole » trouve « Ravioles »).
- La recherche se fait dans le téléphone, sur toutes les recettes déjà chargées. Elle est instantanée.

### 2.5 Menu de la semaine (propre à chacune)
- Chacune a **son** menu. Pas de menu commun, pas de vue du menu de l'autre.
- Le menu est **visuel** : 7 jours × midi/soir. On choisit une recette dans la rangée de pastilles, puis **on touche les cases** où on la mange. Retoucher une case la vide. Pas de bandeau d'explication.
- Une case = **1 personne** par défaut. « Mettre au menu » depuis une fiche réglée sur 4 personnes place des cases « · 4 pers. » (amis invités).
- Le nombre de cases choisies = le nombre de portions.
- **Case « Plaisir »** : premier choix de la rangée. Pour un repas où on sort ou on improvise. Couleur beige, pas une recette, **rien dans les courses**. « Aujourd'hui » affiche « Plaisir · on improvise ».
- **Recette sans ingrédients mise au menu** (vidéo Insta, site web) : l'appli propose tout de suite le champ « ingrédients d'un trait » (pour 4 personnes par défaut) avec l'aperçu, pour que les courses soient justes. On peut passer (« plus tard »).
- « Mettre au menu » depuis une fiche place la recette dans la **semaine affichée** par l'onglet Menu (le dimanche : la semaine suivante).
- Les cases vides restent visibles, sans compteur culpabilisant.

### 2.6 Liste de courses (propre à chacune)
- Elle se calcule toute seule à partir de **mon** menu de la semaine affichée.
- Elle suit **la même semaine que l'onglet Menu** (le dimanche : la semaine suivante).
- **Règle de calcul** : les lignes calculées sont refaites à chaque changement du menu. Ce que l'utilisatrice a fait est gardé à part et n'est jamais écrasé : les coches, les articles ajoutés à la main, les corrections de quantité et les articles retirés (×). Ces informations sont rattachées au **nom mis au propre + unité** de la ligne (pour que 2 lignes du même aliment dans 2 unités restent séparées).
- Les quantités s'ajustent aux portions. Ce qui se compte est arrondi au-dessus (pas de « 1,5 œuf »).
- Regroupement par nom **après mise au propre** (mêmes règles que la recherche : accents, majuscules, pluriel ; « oignon » = « oignons »). Les unités sont converties (g/kg, ml/cl/l). En cas de doute, 2 lignes plutôt qu'un total faux.
- Triée **par rayon** (Fruits & légumes, Crèmerie, Poisson & viande, Épicerie…, « Autre »). Le rayon vient d'un **dictionnaire d'aliments** fixe (`src/lib/aliments.ts`, environ 150 aliments courants : nom, pluriel, rayon, se compte ou non). Un aliment inconnu va dans « Autre », sans alerte.
- En haut, les cartes des plats de la semaine. **Toucher un plat** ne montre que ses ingrédients ; le retoucher remet toute la liste.
- **Petite croix ×** au bout de chaque ligne : retire l'article de la liste (« j'en ai déjà » ou « pas besoin »). En bas, « 2 articles retirés · Tout remettre ». Pas de gestion de stock.
- Le sel, le poivre et l'huile ne sont pas dans la liste : une phrase en bas rappelle de vérifier le placard.
- Recettes du menu sans ingrédients : rappel « Ravioles ricotta : ingrédients non renseignés » avec un lien « Les ajouter » qui ouvre directement le champ.
- On peut ajouter un article à la main et corriger chaque ligne.
- **Au magasin sans réseau** : l'appli s'ouvre quand même et affiche la dernière liste. Le téléphone garde une copie du carnet, de mon menu et de mes ajustements. Sans réseau, on peut lire, cocher et retirer un article (×) ; ces actions attendent dans une file et partent au retour du réseau. Le reste (ajouter, modifier) demande le réseau. Sur iPhone, l'envoi se fait à la réouverture de l'appli (pas en arrière-plan).

### 2.7 D'une semaine à l'autre
- La semaine va du **lundi au dimanche**.
- **Le dimanche**, l'onglet Menu ouvre directement la **semaine suivante** (celle qu'on prépare). Une flèche permet de revenir à la semaine en cours. Le bloc « Aujourd'hui » suit toujours le jour réel.
- Le menu des semaines passées reste consultable (lecture seule), pour s'en inspirer.
- **Pas de report** : chaque semaine a sa propre liste. La liste reste visible toute la semaine ; la semaine suivante repart de son propre menu, sans reprendre les articles non cochés (décision de Celia, 2026-11-03 : on ne refait pas les mêmes plats).

### 2.8 Démarrage : le carnet ne doit pas être vide le 1er dimanche
- L'ancien Excel n'existe plus (confirmé le 2026-11-03).
- Avant le premier dimanche : une séance où Celia et Alice enregistrent une quinzaine de recettes (Partager depuis Insta + quelques recettes à la main ou web).

### 2.9 Sécurité des données et connexion
- **Sauvegarde automatique** chaque semaine : export JSON de toutes les recettes (sans les photos), écrit dans un dépôt GitHub **privé** réservé aux sauvegardes (séparé du dépôt public du code). Le jeton GitHub est rangé dans les secrets Supabase, jamais dans le code ; s'il expire, la page de dépannage dit comment le refaire. Le bouton « Exporter mes recettes » reste aussi.
- **Connexion** : code à 6 chiffres par mail, **une seule fois**. La session reste ouverte des mois et se renouvelle seule ; on ne redemande jamais de code le dimanche ou au magasin.
- **Envoi du mail** : le service de mail intégré à Supabase n'écrit qu'aux membres de l'équipe du projet, avec très peu d'envois par heure. On branche donc un service de mail gratuit (**Brevo**) dans Supabase. Le modèle de mail est modifié pour afficher le code (`{{ .Token }}`) au lieu d'un lien. À vérifier dès l'étape 1 avec la vraie adresse d'Alice.
- **Accès réservé** : les inscriptions publiques sont fermées ; seules les adresses de la liste des membres peuvent se connecter (au départ Celia et Alice). Ajouter une copine au carnet = ajouter son prénom et son adresse à cette liste, sans changer le code : aucun prénom n'est écrit en dur. Des règles d'accès dans la base (RLS) font que chacune ne lit et n'écrit que **son** menu, **ses** ajustements de courses et **son** statut ; le carnet est lisible et modifiable par tous les membres.
- **Mises à jour** : quand une nouvelle version est en ligne, l'appli se met à jour seule à la réouverture (pas de vieille version coincée en cache, surtout sur iPhone).
- L'appli doit être **installée sur l'écran d'accueil** (sinon Safari peut effacer ses données locales). La page d'installation le dit.
- Page `docs/depannage.md` : « l'appli ne marche plus, que faire », « le code n'arrive pas », « le raccourci iPhone dit erreur », avec la phrase exacte à donner à Claude Code. Elle dit aussi qui a le compte cron-job.org (Celia).

## 3. Pas prévu (v1)
- Menu commun et courses communes (décision du 2026-11-03 : chacune mange de son côté ; seul le carnet est commun).
- Lecture automatique des vidéos : **reportée à plus tard** (décision du 2026-11-03). Piste : Watch (claude-video) lancé depuis l'ordi de Celia, pour remplir les ingrédients des vidéos enregistrées.
- Appli publiée sur l'App Store ou le Play Store
- Plusieurs carnets séparés (un autre groupe d'amies avec son propre carnet). Une nouvelle membre rejoint le carnet existant.
- Calories et nutrition
- Gestion de stock (seulement la croix × pour retirer un article)
- Report des articles non achetés d'une semaine à l'autre
- Version ordinateur
- Animations GSAP (après la v1 ; animations CSS simples avant)
- Synchro en direct : les données se rechargent à l'ouverture de l'appli et quand on revient dessus
- Catégorie déduite automatiquement des ingrédients

## 4. Choix techniques

| Besoin | Choix | Pourquoi |
|---|---|---|
| Appli téléphone | Appli web installable (PWA) | Une seule appli pour Android et iPhone |
| Écrans | Vite + React + TypeScript | Standard, facile à animer ensuite avec GSAP |
| Données partagées | Supabase (gratuit) | Base de données + synchronisation entre vous deux |
| Connexion | **Code à 6 chiffres par mail** (OTP Supabase), session longue, inscriptions fermées | Le lien magique s'ouvre dans Safari, pas dans l'appli, sur iPhone |
| Envoi des mails | Brevo (gratuit) branché dans Supabase | Le mail intégré de Supabase n'écrit qu'aux membres de l'équipe |
| Hors ligne | Copie locale (IndexedDB) + file d'attente des coches | L'appli s'ouvre au magasin sans réseau |
| Ajout depuis l'iPhone | Raccourci iOS qui appelle une fonction Supabase (Edge Function) avec un jeton propre à Alice | Ne dépend pas de Safari |
| Garder Supabase éveillé + sauvegarde | **Un seul** appel quotidien gratuit via cron-job.org vers une fonction Supabase qui **lit la base** (ce qui la garde éveillée) et, le dimanche, écrit la sauvegarde JSON dans le dépôt GitHub privé des sauvegardes | Supabase gratuit s'endort après 7 jours sans activité ; le cron GitHub s'arrête après 60 jours sans activité du dépôt |
| Mises à jour | Service worker qui prend la nouvelle version à la réouverture | Pas de vieille version coincée |
| Hébergement | **GitHub Pages** (gratuit) : l'appli est un site web en `https://…github.io/…`, installé ensuite sur l'écran d'accueil | Gratuit, un compte de moins (GitHub sert déjà au code). Le dépôt du code est public, donc **aucun secret dedans** ; les sauvegardes vont dans un 2e dépôt **privé** |
| Tests | Vitest (logique) | Suffisant pour 2 utilisatrices ; test à la main sur les 2 téléphones |

**Budget : 0 €.** Seulement des offres gratuites.

## 5. Données (simplifié)
- **recette** (commune) : type (insta / web / main), nom, mots-clés, lien, lien nettoyé (unique), portions de base, ingrédients, étapes, photo, couleur, catégories, ajoutée par (membre).
- **membre** : prénom, initiale, adresse mail.
- **statut** (propre à chacune) : recette, membre, à tester / déjà faite.
- **ingrédient** : nom (avec la marque éventuelle), quantité, unité, rayon.
- **menu** (propre à chacune) : semaine (date du lundi), propriétaire.
- **case de menu** : menu, jour, midi/soir, recette **ou** « plaisir », nombre de personnes (1 par défaut).
- **ajustement de courses** (propre à chacune) : semaine, nom d'ingrédient mis au propre, unité, coché, retiré, quantité corrigée, ajouté à la main ou non.

La liste de courses n'est pas stockée : elle est calculée depuis les cases de menu, puis on applique les ajustements.

## 6. Commandes (une fois le projet créé)
```
npm install
npm run dev      # appli en local
npm run build    # version de production
npm test         # tests Vitest
```

## 7. Organisation des fichiers
```
src/                  écrans et composants
src/lib/              logique : recherche, découpage des ingrédients, courses, portions, semaines
tests/                tests Vitest
supabase/functions/   fonction d'ajout (raccourci iPhone), sauvegarde hebdo
docs/                 raccourci iPhone, installation, dépannage
```

## 8. Style de code
- TypeScript strict. Composants React en fonctions.
- Noms de code en anglais, textes de l'appli en français.
- La logique va dans `src/lib/`, en fonctions pures testées.

```ts
// src/lib/ingredients.ts — séparer sur virgule SAUF virgule décimale (« 1,5 kg »)
export function parseIngredients(text: string): Ingredient[] {
  return text.split(/\n|,(?!\d)/).map(s => s.trim()).filter(Boolean).map(parseLine);
}
```

## 9. Tests
- Tests unitaires obligatoires :
  - découpage des ingrédients (« 1,5 kg », « ½ », « 1/2 », « 2-3 », « sel », marque après le nom, « 20 cl de crème », « 200g », puces) et détection « nombre sans unité » ;
  - liste de courses : regroupement (oignon/oignons), conversions, portions (recette pour 4), case Plaisir exclue, ajustements gardés quand le menu change, aucun report d'une semaine à l'autre ;
  - semaines : le dimanche, Menu et Courses ouvrent la semaine suivante ;
  - recherche (accents, pluriel) ;
  - doublon de lien (avec `?igsh=…` différents, `/reel/` et `/p/`).
- Tests à la main, sur le vrai Android de Celia et le vrai iPhone d'Alice :
  - partage depuis Insta (et depuis Chrome sur Android) ;
  - raccourci iPhone, y compris avec un jeton faux ;
  - connexion par code avec la vraie adresse d'Alice (le mail arrive), puis réouverture une semaine plus tard sans nouveau code ;
  - une adresse inconnue ne peut pas se connecter ;
  - mode avion, appli fermée puis rouverte : la liste s'affiche, on coche, les coches partent au retour du réseau ;
  - mise à jour de l'appli installée.

## 10. Règles de travail
- **Toujours** : lancer les tests avant de dire « c'est fini », et garder la saisie au minimum.
- **Budget** : 0 €.
- **Demander d'abord** : changer de techno, ajouter un écran ou un champ obligatoire.
- **Jamais** : mettre une clé secrète dans le code, ni demander plus de 3 champs à remplir pour ajouter une recette (le nom est le seul obligatoire ; le réglage − / + des personnes n'est pas un champ).

## 11. Ordre de construction
1. **Test des risques** (avant tout le reste) :
   - partage depuis Insta sur l'Android de Celia (et format exact du lien reçu) ;
   - raccourci et connexion par code (mail via Brevo) sur l'iPhone d'Alice, fait par Alice elle-même.
2. Ajout Insta / web / à la main + carnet + recherche + fiche modifiable, **directement dans le style V1 « Sauge »** (couleurs, cartes, barre du bas). L'appli est déjà utile à ce stade.
3. Remplissage de départ du carnet (§2.8).
4. Menu de la semaine + liste de courses + passage de semaine + hors ligne.
5. Sauvegarde hebdo, page de dépannage, réveil quotidien de Supabase, mises à jour automatiques.
6. Finitions, puis animations GSAP après les 6 dimanches.

## 12. Critères de réussite (vérifiables)
1. Enregistrer une vidéo Insta prend **moins de 10 secondes** et au plus 3 mots tapés, sur Android comme sur iPhone.
2. Taper « raviole » montre la vidéo enregistrée avec ce mot-clé, en moins d'1 seconde.
3. Poser 5 recettes perso dans mon menu produit une liste de courses juste, avec les quantités ajustées aux portions ; changer le menu ensuite ne perd ni les coches ni les ajouts à la main.
4. Une recette ajoutée par l'une apparaît chez l'autre à la réouverture de l'appli. Sans réseau, l'appli s'ouvre sur la dernière liste, et les coches ne sont pas perdues.
5. L'appli marche encore après 2 semaines sans utilisation, sans redemander de code.
6. Le premier dimanche, le carnet contient au moins 15 recettes.
7. Celia et Alice l'utilisent 6 dimanches de suite.

## 13. Questions ouvertes
1. Nom de l'appli : **Popote** (choisi par Celia le 2026-11-04). Logo : à choisir.
