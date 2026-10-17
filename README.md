# ISFAD-Gouvernance

Application web de **gouvernance et gestion de projets institutionnels**, développée avec un backend Laravel (API REST) et un frontend React moderne (SPA).

## 🚀 Fonctionnalités

### Authentification & Sécurité
- Connexion sécurisée avec **Laravel Sanctum** (tokens + cookies SPA)
- Changement de mot de passe obligatoire à la première connexion
- Protection anti brute-force (rate limiting : 5 tentatives/min)
- Déconnexion par appareil ou sur tous les appareils
- Récupération de mot de passe par email

### Tableau de Bord
- KPIs dynamiques selon le rôle de l'utilisateur
- Graphiques interactifs (Recharts) : répartition par statut, avancement global
- Vue consolidée des projets, tâches et réunions

### Gestion des Projets
- Cycle de vie complet : Initiation → Planification → Exécution → Clôture → Archivage
- Décomposition en **Phases → Activités → Tâches**
- Calcul automatique de la progression en cascade (tâche → activité → phase → projet)
- Jalons de suivi

### Gestion des Tâches & RACI
- Création et affectation de tâches avec matrice **RACI** (Responsable, Approbateur, Consulté, Informé)
- Vue **Kanban** (à faire, en cours, terminé)
- Commentaires privés entre responsable et approbateur
- Vue personnelle « Mes tâches »

### Gestion des Équipes
- Affectation de membres à un projet avec rôle spécifique
- Réaffectation de responsable de tâche

### Budget & Dépenses
- Définition du budget par projet
- Suivi des dépenses avec validation

### Demandes de Changement
- Soumission de demandes liées à un projet
- Workflow de validation (approuvé / rejeté)

### Réunions
- Planification avec sélection des participants
- Notifications automatiques par email et in-app
- Validation des demandes de réunion

### Rapports
- Génération de rapports par projet
- Système de commentaires sur les rapports

### Calendrier
- Vue calendrier global regroupant réunions et jalons

### Notifications
- Notifications in-app avec marquage lu/non lu
- Notifications email (réunions planifiées, mots de passe temporaires)

### Administration
- Gestion des utilisateurs (création, activation/désactivation)
- Provisionnement avec mot de passe temporaire
- Journal d'audit : traçabilité automatique de toutes les opérations CRUD
- Configuration globale de la plateforme

### Autres
- Profil utilisateur avec photo
- Page de personnalisation
- Page d'aide

## 🛠️ Stack Technique

### Backend
- **Framework** : Laravel 13 (PHP 8.3+)
- **Authentification** : Laravel Sanctum 4 (tokens Bearer + cookies SPA stateful)
- **Base de données** : SQLite par défaut (MySQL 8+ et PostgreSQL 15+ supportés)
- **Queue** : Database driver (emails en arrière-plan)
- **Audit** : Trait `Auditable` personnalisé (log automatique dans `journal_audits`)

### Frontend
- **Bibliothèque** : React 19
- **Routage** : React Router DOM 7
- **Stylisation** : Tailwind CSS v4
- **Icônes** : Lucide React
- **Graphiques** : Recharts
- **HTTP** : Axios
- **Build Tool** : Vite 8

## ⚙️ Prérequis

- [PHP](https://www.php.net/) >= 8.3 avec les extensions : `pdo`, `mbstring`, `xml`, `curl`, `bcmath`, `fileinfo`, `tokenizer`
- [Composer](https://getcomposer.org/) 2.x
- [Node.js](https://nodejs.org/) >= 20 LTS & npm >= 10
- Git

## 📦 Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/serigne-mbaye-thioub/isfad_project-.git
cd isfad_project-

# 2. Installer les dépendances PHP
composer install

# 3. Installer les dépendances frontend
npm install

# 4. Configurer l'environnement
cp .env.example .env
php artisan key:generate

# 5. Créer la base de données SQLite et exécuter les migrations
# (Sur Windows, créer le fichier manuellement : New-Item database/database.sqlite)
touch database/database.sqlite
php artisan migrate --seed
```

> Le seeder par défaut crée un compte administrateur. Pour charger un jeu de données de démonstration complet (projets, tâches, réunions…), exécutez :
> ```bash
> php artisan db:seed --class=DemoSeeder
> ```

## ▶️ Lancement

### Méthode rapide (un seul terminal)

```bash
composer dev
```

Cette commande lance simultanément : le serveur Laravel, le worker de queue, les logs en temps réel, et le serveur Vite.

### Méthode manuelle (deux terminaux)

*Terminal 1 — Backend :*
```bash
php artisan serve
```

*Terminal 2 — Frontend :*
```bash
npm run dev
```

L'application est accessible sur `http://localhost:8000`.

## 🔑 Comptes par défaut

### Compte administrateur (créé par le seeder principal)

| Email | Mot de passe | Rôle |
|---|---|---|
| `admin@isfad.sn` | `password` | Administrateur système |

> ⚠️ Ce compte a `premiere_connexion = true` : un changement de mot de passe sera demandé à la première connexion.

### Comptes de test (créés par `TestAccountsSeeder`)

Pour créer des comptes pour chaque rôle :
```bash
php artisan db:seed --class=TestAccountsSeeder
```

| Email | Mot de passe | Rôle |
|---|---|---|
| `admin@isfad.sn` | `passer123` | Administrateur |
| `superviseur@isfad.sn` | `passer123` | Superviseur |
| `chef@isfad.sn` | `passer123` | Chef de projet |
| `gestionnaire@isfad.sn` | `passer123` | Gestionnaire de projet |
| `architecte@isfad.sn` | `passer123` | Architecte de projet |
| `membre@isfad.sn` | `passer123` | Membre d'équipe |
| `partenaire@isfad.sn` | `passer123` | Partenaire |

## 📂 Structure du projet

```
isfad_project-/
├── app/
│   ├── Http/
│   │   ├── Controllers/       # 22 contrôleurs API REST
│   │   └── Middleware/        # AdminMiddleware (protection routes admin)
│   ├── Mail/                  # Templates email (réunions, identifiants, reset)
│   ├── Models/                # 21 modèles Eloquent
│   ├── Services/              # AvancementService (calcul progression en cascade)
│   └── Traits/                # Auditable (journalisation automatique)
├── database/
│   ├── migrations/            # 37 migrations (schéma complet)
│   └── seeders/               # DatabaseSeeder, DemoSeeder, TestAccountsSeeder
├── resources/js/
│   ├── components/            # 10 composants réutilisables (Kanban, modales, formulaires)
│   ├── layouts/               # DashboardLayout (sidebar + header)
│   ├── pages/
│   │   ├── Admin/             # UtilisateursAdmin, JournalAudit
│   │   ├── Calendrier/        # Vue calendrier global
│   │   ├── Demandes/          # Demandes de changement
│   │   ├── Projets/           # Liste, détail, avancement, budget, rapports
│   │   └── Reunions/          # Planification et suivi des réunions
│   └── router.jsx             # Configuration des routes SPA
├── routes/
│   └── api.php                # ~55 endpoints API (Sanctum + rate limiting)
└── .env.example               # Template de configuration
```
