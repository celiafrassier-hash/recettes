# Étude des applis

## 1. ReciMe (recime.app), étudiée le 2026-11-03
Source : site public. Pas de compte créé, appli non installée.

**Ce qu'elle fait**
- Importe des recettes depuis Insta, TikTok, Facebook, Pinterest et YouTube. Elle sait aussi lire une capture d'écran ou une photo de recette manuscrite.
- Liste de courses automatique, triée par rayon (Épicerie, Fruits & légumes…) ou par recette, avec cases à cocher.
- Planning de la semaine : jour par jour, avec des étiquettes colorées Petit-déj / Déjeuner / Dîner / Snack.
- Carnets (« cookbooks ») pour ranger les recettes.
- Gratuit : 5 imports par semaine. Le reste est gratuit sans limite (liste de courses, planning, carnets). Disponible sur iPhone et Android.

**À reprendre pour nous**
- Courses rangées **par rayon**, avec une petite icône par ingrédient. Très lisible au magasin.
- En haut de la liste de courses, une rangée de cartes photo des recettes de la semaine.
- Planning : une liste par jour, avec des étiquettes de couleur pour le repas. Simple et visuel.
- Style : fond crème, gros titres avec une police manuscrite en couleur, illustrations de nourriture en aplats de couleur. Chaleureux, pas « appli de bureau ».

**À ne pas reprendre**
- Le mur « payant après 5 imports ».

**Scan REA** (preuve `ev_d1bd010a…`, page d'accueil publique seulement)
- Données : Firebase (Google), la même famille d'outil que Supabase.
- Mesure d'audience : Amplitude, Google Analytics, Facebook, Datadog. Chat d'aide : Intercom.
- L'appli elle-même (recettes, courses) est derrière une connexion. REA ne l'a pas vue.

- Connectée (compte de Celia, preuve `ev_25e838b4…`) : 3 onglets (Cookbooks, Meal Plan, Groceries), une recherche « Search recipes » et un compteur « 5/5 imports restants ». Aucune activité réseau observée pendant 90 s (`ev_67ed715c…`) : l'observation est à refaire pendant que Celia clique.
- 2e observation (`ev_52255cf0…`) : Celia a importé une recette, et ReciMe affiche une animation « importing » pendant l'import. Sur le web, **Meal Plan et Groceries sont bloqués** (« Coming to the web soon »). Ces deux écrans n'existent que dans l'appli téléphone. Les appels de données passent par Google (Firebase) et n'ont pas été détaillés.

**Question à se poser**
ReciMe fait déjà presque tout le cahier des charges, en gratuit pour 5 recettes par semaine. Ce qui manque à vérifier :
- partage d'un carnet entre deux comptes ;
- import Insta sur un compte gratuit ;
- interface en français.

## 2. Jow (jow.fr), scan REA du 2026-11-03
Preuves : accueil `ev_91370942…`, page recette `ev_bf77f5d8…`, JSON recette `ev_7557a420…`. Sans compte.

**Comment une recette est rangée**
- Ingrédients (`constituents`) : nom, **quantité par couvert** (`quantityPerCover`), unité avec son abréviation, et un indicateur « facultatif ».
  Exemple : `{"name":"Curry (poudre)","quantityPerCover":0.25,"unit":{"name":"Cuillère à café","abbreviations":[{"label":"càc"}]}}`, affiché « 1/4 càc ».
- Basiques du placard à part : « Assurez-vous d'avoir… huile d'olive ». Ils ne vont pas dans les courses.
- Étapes : texte et ingrédients concernés.
- Temps : préparation et cuisson séparés. Difficulté, cuisine (« Indienne »), mots-clés, régimes (végé, sans gluten…).

**À reprendre pour nous**
- Stocker les quantités **par portion**. Le menu multiplie ensuite par le nombre de cases choisies. C'est le plus simple pour notre système de portions.
- Mettre les « basiques du placard » (sel, huile) à part, hors de la liste de courses.
- Afficher les fractions en clair (1/4, 1/2).
- Fiche : ingrédients en tuiles (image + quantité + nom), étapes numérotées, section « Notes perso ».
- Accueil : réglages « Taille du foyer » et « Repas par semaine » avec boutons −/+.

Non observé (demande un compte) : menu de la semaine, liste de courses.

## 3. Samsung Food
Le robot seul est bloqué par une vérification anti-robot (Cloudflare, preuve `ev_23cab101…`). On ne la contourne pas.
Celia s'est connectée elle-même, puis REA a observé la page en lecture seule (preuve `ev_38de0902…`, page « feed »).

**Ce qu'on voit**
- Menu du bas : **Accueil / Enregistré / Planificateur / Listes**.
- **« Rechercher par ingrédients »** : une rangée de pastilles avec photo (haché de bœuf, poulet, brocoli, pomme de terre…). On tape sur un ingrédient et les recettes apparaissent. C'est exactement notre « crevettes ».
- Ajout d'une recette : un seul champ, **« Collez le lien de la recette »**.
- Cartes recette : photo, titre, puis « 7 ingrédients · 30min ». Court et lisible.
- Filtres rapides en pastilles : Moins de 30 minutes, Végétarien, Pâtes, Crevette, Facile…

**À reprendre pour nous**
- Les pastilles d'ingrédients avec photo sous la barre de recherche, construites à partir des ingrédients de **notre** carnet.
- Sous chaque carte : « X ingrédients · temps ».
- 4 onglets maximum.

## 4. Mealie (open source), scan REA + code public
Preuve `ev_2de68535…` (page de connexion de la démo seulement). Le reste vient du code source sur GitHub.

**Modèle de données à reprendre**
- Ingrédient : quantité, unité, aliment, note, et le **texte d'origine gardé** (`original_text`).
- Aliment : lié à un **rayon** (`label`). C'est ce qui permet de trier la liste de courses par rayon.
- Menu : date + type de repas (déjeuner, dîner…) + recette **ou** simple note (« restes », « resto »).
- Liste de courses : fusion de deux lignes seulement si c'est le même aliment, non coché, avec une unité identique ou convertible. Les notes sont jointes.

**À laisser** : foyers multiples, alias, parseur intelligent. Une règle simple suffit au début.
