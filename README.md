# ISFAD Project

Bienvenue sur le dépôt du projet ISFAD. Il s'agit d'une application web de gestion complète, développée avec un backend Laravel et un frontend React moderne.

## 🚀 Fonctionnalités Principales

- **Authentification Sécurisée** : Connexion, changement de mot de passe et protection des routes.
- **Tableau de Bord (Dashboard)** : Vue d'ensemble avec des graphiques interactifs (Recharts).
- **Gestion des Projets** : Liste des projets et détails approfondis de chaque projet.
- **Gestion des Réunions** : Planification et suivi des réunions.
- **Administration** : 
  - Gestion des utilisateurs.
  - Journal d'audit (Audit logs) pour suivre les actions sur la plateforme.

## 🛠️ Stack Technique

### Backend
- **Framework** : Laravel (PHP 8.3+)
- **Base de données** : SQLite (par défaut, configurable via `.env`)

### Frontend
- **Bibliothèque** : React 19
- **Routage** : React Router DOM
- **Stylisation** : Tailwind CSS v4
- **Composants UI / Icônes** : Lucide React
- **Graphiques** : Recharts
- **Build Tool** : Vite

## ⚙️ Prérequis

Assurez-vous d'avoir installé les éléments suivants sur votre machine :
- [PHP](https://www.php.net/) >= 8.3
- [Composer](https://getcomposer.org/)
- [Node.js](https://nodejs.org/) & NPM (ou Yarn/Bun)
- Git

## 📦 Installation et Configuration

Suivez ces étapes pour configurer le projet localement :

1. **Cloner le dépôt**
   ```bash
   git clone <url-du-depot>
   cd isfad_project-
   ```

2. **Installer les dépendances PHP (Backend)**
   ```bash
   composer install
   ```

3. **Installer les dépendances Node.js (Frontend)**
   ```bash
   npm install
   ```

4. **Configuration de l'environnement**
   Copiez le fichier d'exemple `.env.example` pour créer votre propre fichier `.env`.
   ```bash
   cp .env.example .env
   ```

5. **Générer la clé d'application Laravel**
   ```bash
   php artisan key:generate
   ```

6. **Créer et migrer la base de données**
   Assurez-vous que votre base de données est configurée dans le fichier `.env` (par défaut, une base SQLite est utilisée).
   ```bash
   php artisan migrate --seed
   ```

7. **Lancer les serveurs de développement**

   Il est recommandé d'utiliser deux terminaux :

   *Terminal 1 (Backend Laravel) :*
   ```bash
   php artisan serve
   ```

   *Terminal 2 (Frontend Vite) :*
   ```bash
   npm run dev
   ```

   Vous pouvez maintenant accéder à l'application via `http://localhost:8000`.

## 📂 Structure du projet

- `/app` : Logique métier du backend (Contrôleurs, Modèles, etc.)
- `/routes` : Définition des routes API et Web Laravel.
- `/resources/js` : Contient toute l'application React.
  - `/pages` : Vues principales de l'application (Login, Dashboard, Projets, Admin, etc.)
  - `/components` : Composants React réutilisables.
  - `/layouts` : Mises en page (DashboardLayout, etc.)
  - `router.jsx` : Configuration des routes frontend.
- `/database` : Migrations et Seeders de la base de données.

## 🤝 Contribution

1. Forkez le projet.
2. Créez votre branche de fonctionnalité (`git checkout -b feature/AmazingFeature`).
3. Commitez vos changements (`git commit -m 'Add some AmazingFeature'`).
4. Poussez vers la branche (`git push origin feature/AmazingFeature`).
5. Ouvrez une Pull Request.

## 📄 Licence

Ce projet est sous licence MIT.
