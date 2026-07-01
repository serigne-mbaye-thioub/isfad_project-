<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="ISFAD-Gouvernance — Plateforme de gestion de projets de l'Institut Supérieur de Formation à Distance, Université Cheikh Anta Diop de Dakar.">
    <title>ISFAD-Gouvernance | UCAD — Plateforme de Gestion de Projets</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet">

    <style>
        /* ── Variables UCAD ─────────────────────────────────────── */
        :root {
            --ucad-blue:        #1A5C8A;
            --ucad-blue-dark:   #0D3D5C;
            --ucad-blue-deep:   #071F2E;
            --ucad-teal:        #1D7A8A;
            --ucad-gold:        #C9A84C;
            --ucad-gold-light:  #F0D080;
            --ucad-white:       #FFFFFF;
            --ucad-light:       #EEF4FA;
            --ucad-text:        #1A2B3C;
            --ucad-muted:       #5A7A8A;
            --success:          #22C55E;
            --error:            #EF4444;
            --warning:          #F59E0B;
            --radius:           12px;
            --shadow-card:      0 4px 24px rgba(13, 61, 92, 0.12);
            --shadow-lg:        0 8px 48px rgba(13, 61, 92, 0.20);
        }

        /* ── Reset & Base ────────────────────────────────────────── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html { scroll-behavior: smooth; }

        body {
            font-family: 'Inter', sans-serif;
            background: var(--ucad-blue-deep);
            color: var(--ucad-white);
            min-height: 100vh;
            overflow-x: hidden;
        }

        /* ── Animated Background ─────────────────────────────────── */
        .bg-animated {
            position: fixed; inset: 0; z-index: 0;
            background: linear-gradient(135deg, var(--ucad-blue-deep) 0%, #0A2F45 40%, #0D3D5C 70%, #071F2E 100%);
            overflow: hidden;
        }
        .bg-animated::before, .bg-animated::after {
            content: '';
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            opacity: 0.15;
            animation: orb-float 12s ease-in-out infinite;
        }
        .bg-animated::before {
            width: 600px; height: 600px;
            background: var(--ucad-teal);
            top: -150px; right: -100px;
        }
        .bg-animated::after {
            width: 500px; height: 500px;
            background: var(--ucad-gold);
            bottom: -100px; left: -80px;
            animation-delay: -6s;
        }
        @keyframes orb-float {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(30px, 30px) scale(1.05); }
        }

        /* Grid background overlay */
        .bg-grid {
            position: fixed; inset: 0; z-index: 0;
            background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
            background-size: 60px 60px;
        }

        /* ── Layout ──────────────────────────────────────────────── */
        .page-wrapper {
            position: relative; z-index: 1;
            min-height: 100vh;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 24px;
        }

        /* ── Header / Navigation ─────────────────────────────────── */
        .header {
            padding: 20px 0;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            backdrop-filter: blur(12px);
            background: rgba(7, 31, 46, 0.7);
            position: sticky; top: 0; z-index: 100;
        }
        .header .container {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .logo-group {
            display: flex;
            align-items: center;
            gap: 14px;
        }
        .logo-emblem {
            width: 48px; height: 48px;
            border-radius: 50%;
            border: 2px solid var(--ucad-gold);
            padding: 3px;
            object-fit: cover;
            box-shadow: 0 0 16px rgba(201,168,76,0.3);
        }
        .logo-text {
            display: flex;
            flex-direction: column;
        }
        .logo-text .title {
            font-size: 18px;
            font-weight: 800;
            color: var(--ucad-white);
            letter-spacing: 0.5px;
        }
        .logo-text .subtitle {
            font-size: 11px;
            color: var(--ucad-gold);
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .nav-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 14px;
            background: rgba(201,168,76,0.1);
            border: 1px solid rgba(201,168,76,0.3);
            border-radius: 20px;
            font-size: 12px;
            color: var(--ucad-gold-light);
        }
        .nav-badge .dot {
            width: 8px; height: 8px;
            background: var(--success);
            border-radius: 50%;
            animation: pulse-green 2s infinite;
        }
        @keyframes pulse-green {
            0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
            50% { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }

        /* ── Hero Section ────────────────────────────────────────── */
        .hero {
            padding: 80px 0 60px;
            text-align: center;
        }
        .hero-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 20px;
            background: rgba(201,168,76,0.12);
            border: 1px solid rgba(201,168,76,0.35);
            border-radius: 30px;
            font-size: 12px;
            color: var(--ucad-gold-light);
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin-bottom: 28px;
            font-weight: 600;
        }
        .hero h1 {
            font-family: 'Playfair Display', serif;
            font-size: clamp(32px, 5vw, 60px);
            font-weight: 800;
            line-height: 1.15;
            margin-bottom: 12px;
            background: linear-gradient(135deg, #FFFFFF 0%, #B0D4EC 50%, var(--ucad-gold-light) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .hero-sub {
            font-size: clamp(14px, 2vw, 17px);
            color: rgba(255,255,255,0.55);
            margin-bottom: 8px;
            letter-spacing: 2px;
            text-transform: uppercase;
            font-weight: 500;
        }
        .hero-motto {
            font-size: 13px;
            color: var(--ucad-gold);
            letter-spacing: 3px;
            text-transform: uppercase;
            margin-bottom: 36px;
            font-style: italic;
        }
        .hero-desc {
            font-size: 17px;
            color: rgba(255,255,255,0.65);
            max-width: 600px;
            margin: 0 auto 48px;
            line-height: 1.7;
        }

        /* ── Stats Bar ───────────────────────────────────────────── */
        .stats-bar {
            display: flex;
            justify-content: center;
            gap: 0;
            margin-bottom: 64px;
        }
        .stat-item {
            padding: 20px 36px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.04);
            backdrop-filter: blur(8px);
            text-align: center;
        }
        .stat-item:first-child { border-radius: var(--radius) 0 0 var(--radius); }
        .stat-item:last-child  { border-radius: 0 var(--radius) var(--radius) 0; }
        .stat-value {
            font-size: 28px;
            font-weight: 800;
            color: var(--ucad-gold-light);
            display: block;
        }
        .stat-label {
            font-size: 12px;
            color: rgba(255,255,255,0.45);
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* ── Features Grid ───────────────────────────────────────── */
        .section-title {
            text-align: center;
            margin-bottom: 48px;
        }
        .section-title h2 {
            font-family: 'Playfair Display', serif;
            font-size: 32px;
            color: var(--ucad-white);
            margin-bottom: 10px;
        }
        .section-title p {
            font-size: 15px;
            color: rgba(255,255,255,0.45);
        }
        .section-divider {
            width: 60px; height: 3px;
            background: linear-gradient(90deg, var(--ucad-gold), var(--ucad-teal));
            border-radius: 2px;
            margin: 12px auto 0;
        }

        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 80px;
        }
        .feature-card {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: var(--radius);
            padding: 28px;
            transition: all 0.3s ease;
            cursor: default;
        }
        .feature-card:hover {
            background: rgba(255,255,255,0.07);
            border-color: rgba(201,168,76,0.3);
            transform: translateY(-4px);
            box-shadow: var(--shadow-lg);
        }
        .feature-icon {
            width: 48px; height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            margin-bottom: 18px;
        }
        .feature-icon.blue { background: rgba(26,92,138,0.3); }
        .feature-icon.teal { background: rgba(29,122,138,0.3); }
        .feature-icon.gold { background: rgba(201,168,76,0.2); }
        .feature-card h3 {
            font-size: 16px;
            font-weight: 700;
            color: var(--ucad-white);
            margin-bottom: 8px;
        }
        .feature-card p {
            font-size: 13.5px;
            color: rgba(255,255,255,0.5);
            line-height: 1.6;
        }

        /* ── Footer ──────────────────────────────────────────────── */
        .footer {
            text-align: center;
            padding: 40px 0;
            border-top: 1px solid rgba(255,255,255,0.06);
            color: rgba(255,255,255,0.3);
            font-size: 13px;
        }
        .footer .footer-logo {
            font-size: 15px;
            font-weight: 700;
            color: rgba(255,255,255,0.5);
            margin-bottom: 8px;
        }
        .footer .footer-motto {
            color: var(--ucad-gold);
            font-style: italic;
            letter-spacing: 2px;
            font-size: 12px;
        }

        /* ── Responsive ──────────────────────────────────────────── */
        @media(max-width: 640px) {
            .stats-bar { flex-direction: column; gap: 0; }
            .stat-item:first-child { border-radius: var(--radius) var(--radius) 0 0; }
            .stat-item:last-child  { border-radius: 0 0 var(--radius) var(--radius); }
            .stat-item:not(:first-child):not(:last-child) { border-radius: 0; }
        }
    </style>
</head>
<body>

<div class="bg-animated"></div>
<div class="bg-grid"></div>

<div class="page-wrapper">

    <!-- ── HEADER ── -->
    <header class="header">
        <div class="container">
            <div class="logo-group">
                <img src="/ucad_emblem.png" alt="UCAD Emblème" class="logo-emblem">
                <div class="logo-text">
                    <span class="title">ISFAD-Gouvernance</span>
                    <span class="subtitle">Université Cheikh Anta Diop · Dakar</span>
                </div>
            </div>
            <div class="nav-badge">
                <span class="dot"></span>
                API v1 Opérationnelle
            </div>
        </div>
    </header>

    <!-- ── HERO ── -->
    <section class="hero">
        <div class="container">
            <div class="hero-badge">
                🎓 Institut Supérieur de Formation à Distance
            </div>
            <h1>Plateforme de<br>Gouvernance des Projets</h1>
            <p class="hero-sub">Université Cheikh Anta Diop de Dakar</p>
            <p class="hero-motto">✦ Lux Mea Lex ✦</p>
            <p class="hero-desc">
                Système intégré de gestion de projets institutionnels — planification, suivi des phases,
                gestion budgétaire, RACI et reporting en temps réel.
            </p>

            <div class="stats-bar">
                <div class="stat-item">
                    <span class="stat-value">16</span>
                    <span class="stat-label">Entités Métier</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">6</span>
                    <span class="stat-label">Endpoints API</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">5</span>
                    <span class="stat-label">Rôles Utilisateurs</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">100%</span>
                    <span class="stat-label">Sécurisé</span>
                </div>
            </div>
        </div>
    </section>

    <!-- ── FEATURES ── -->
    <section style="padding-bottom: 0;">
        <div class="container">
            <div class="section-title">
                <h2>Fonctionnalités Clés</h2>
                <p>Un système de gouvernance complet pour les projets académiques</p>
                <div class="section-divider"></div>
            </div>
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon blue">📋</div>
                    <h3>Gestion de Projets</h3>
                    <p>Suivi complet du cycle de vie : phases, activités, tâches et jalons avec avancement en temps réel.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon teal">👥</div>
                    <h3>Matrice RACI</h3>
                    <p>Responsable, Approbateur, Consulté, Informé — chaque tâche a des rôles clairement définis.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon gold">💰</div>
                    <h3>Suivi Budgétaire</h3>
                    <p>Budget unique par projet avec suivi des dépenses, taux de consommation et alertes de dépassement.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon blue">🔔</div>
                    <h3>Notifications</h3>
                    <p>Système de notifications interne avec gestion des destinataires et traçabilité de lecture.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon teal">📊</div>
                    <h3>Rapports & Exports</h3>
                    <p>Génération de rapports d'avancement, budgétaires et de performance exportables en PDF.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon gold">🔐</div>
                    <h3>Authentification Sanctum</h3>
                    <p>API sécurisée avec jetons Bearer, limitation de débit, protection brute-force et gestion des sessions.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- ── FOOTER ── -->
    <footer class="footer">
        <div class="container">
            <div class="footer-logo">ISFAD-Gouvernance</div>
            <div class="footer-motto">✦ Lux Mea Lex ✦</div>
            <p style="margin-top:12px">Université Cheikh Anta Diop de Dakar · Institut Supérieur de Formation à Distance</p>
            <p style="margin-top:6px">Laravel {{ Illuminate\Foundation\Application::VERSION }} · PHP {{ PHP_VERSION }} · Sanctum · PostgreSQL</p>
        </div>
    </footer>

</div><!-- .page-wrapper -->

</body>
</html>
