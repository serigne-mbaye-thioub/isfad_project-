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

        /* ── API Tester ──────────────────────────────────────────── */
        .api-tester-section {
            margin-bottom: 80px;
        }
        .api-tester {
            background: rgba(255,255,255,0.035);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: var(--shadow-lg);
        }
        .api-tester-header {
            background: rgba(13,61,92,0.6);
            padding: 20px 28px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .api-tester-header h3 {
            font-size: 16px;
            font-weight: 700;
            color: var(--ucad-white);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .terminal-dots {
            display: flex;
            gap: 6px;
        }
        .terminal-dots span {
            width: 12px; height: 12px;
            border-radius: 50%;
        }
        .dot-red   { background: #FF5F57; }
        .dot-yellow{ background: #FEBC2E; }
        .dot-green { background: #28C840; }

        .api-tester-body {
            display: grid;
            grid-template-columns: 1fr 1fr;
            min-height: 460px;
        }
        @media(max-width:768px) {
            .api-tester-body { grid-template-columns: 1fr; }
        }

        /* Left panel — Form */
        .api-form-panel {
            padding: 28px;
            border-right: 1px solid rgba(255,255,255,0.06);
        }
        .tab-group {
            display: flex;
            gap: 4px;
            margin-bottom: 24px;
            background: rgba(0,0,0,0.2);
            padding: 4px;
            border-radius: 10px;
        }
        .tab-btn {
            flex: 1;
            padding: 8px 12px;
            border: none;
            background: transparent;
            color: rgba(255,255,255,0.45);
            font-size: 13px;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            font-family: 'Inter', sans-serif;
        }
        .tab-btn.active {
            background: var(--ucad-blue);
            color: var(--ucad-white);
            box-shadow: 0 2px 8px rgba(26,92,138,0.4);
        }
        .tab-btn:not(.active):hover {
            color: rgba(255,255,255,0.75);
            background: rgba(255,255,255,0.05);
        }

        .form-group {
            margin-bottom: 16px;
        }
        .form-group label {
            display: block;
            font-size: 12px;
            font-weight: 600;
            color: rgba(255,255,255,0.5);
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .form-group input {
            width: 100%;
            padding: 11px 14px;
            background: rgba(0,0,0,0.25);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            color: var(--ucad-white);
            font-size: 14px;
            font-family: 'Inter', sans-serif;
            transition: border-color 0.2s, box-shadow 0.2s;
            outline: none;
        }
        .form-group input:focus {
            border-color: var(--ucad-blue);
            box-shadow: 0 0 0 3px rgba(26,92,138,0.25);
        }
        .form-group input::placeholder { color: rgba(255,255,255,0.2); }

        .btn-primary {
            width: 100%;
            padding: 13px;
            background: linear-gradient(135deg, var(--ucad-blue), var(--ucad-teal));
            border: none;
            border-radius: 10px;
            color: var(--ucad-white);
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.25s;
            font-family: 'Inter', sans-serif;
            margin-top: 4px;
            position: relative;
            overflow: hidden;
        }
        .btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 24px rgba(26,92,138,0.45);
        }
        .btn-primary:active:not(:disabled) { transform: translateY(0); }
        .btn-primary:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        .btn-primary .spinner {
            display: none;
            width: 16px; height: 16px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
            margin: 0 auto;
        }
        .btn-primary.loading .spinner { display: block; }
        .btn-primary.loading .btn-text { display: none; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Token display */
        .token-display {
            margin-top: 16px;
            padding: 12px;
            background: rgba(34,197,94,0.08);
            border: 1px solid rgba(34,197,94,0.2);
            border-radius: 8px;
            display: none;
        }
        .token-display.show { display: block; }
        .token-display .token-label {
            font-size: 11px;
            color: var(--success);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
        }
        .token-display .token-value {
            font-size: 11px;
            color: rgba(255,255,255,0.7);
            word-break: break-all;
            font-family: monospace;
            line-height: 1.5;
        }
        .token-display .token-copy {
            margin-top: 8px;
            font-size: 11px;
            color: var(--success);
            cursor: pointer;
            text-decoration: underline;
            background: none;
            border: none;
            padding: 0;
            font-family: 'Inter', sans-serif;
        }

        /* Right panel — Response */
        .api-response-panel {
            padding: 28px;
            display: flex;
            flex-direction: column;
        }
        .response-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
        }
        .response-header span {
            font-size: 12px;
            font-weight: 600;
            color: rgba(255,255,255,0.4);
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            display: none;
        }
        .status-badge.show { display: inline-flex; align-items: center; gap: 5px; }
        .status-badge.success { background: rgba(34,197,94,0.15); color: var(--success); }
        .status-badge.error   { background: rgba(239,68,68,0.15);  color: var(--error); }
        .status-badge.warning { background: rgba(245,158,11,0.15); color: var(--warning); }

        .response-body {
            flex: 1;
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 10px;
            padding: 16px;
            overflow: auto;
            min-height: 280px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 12.5px;
            line-height: 1.6;
            color: rgba(255,255,255,0.35);
        }
        .response-body.has-content { color: rgba(255,255,255,0.85); }
        .response-body pre {
            margin: 0;
            white-space: pre-wrap;
            word-break: break-word;
        }

        /* JSON Syntax Highlighting */
        .json-key   { color: #7FDBFF; }
        .json-string{ color: #ADFF2F; }
        .json-number{ color: #FFD700; }
        .json-bool  { color: #FF7F7F; }
        .json-null  { color: #FF7F7F; }

        /* Protected Route Tester */
        .protected-tester {
            padding: 24px 28px;
            border-top: 1px solid rgba(255,255,255,0.06);
            background: rgba(0,0,0,0.15);
        }
        .protected-tester h4 {
            font-size: 13px;
            font-weight: 600;
            color: rgba(255,255,255,0.5);
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .protected-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        .btn-action {
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-family: 'Inter', sans-serif;
            border: 1px solid;
        }
        .btn-action.blue {
            background: rgba(26,92,138,0.2);
            border-color: rgba(26,92,138,0.4);
            color: #7DBCD4;
        }
        .btn-action.blue:hover { background: rgba(26,92,138,0.35); }
        .btn-action.red {
            background: rgba(239,68,68,0.1);
            border-color: rgba(239,68,68,0.3);
            color: #FCA5A5;
        }
        .btn-action.red:hover { background: rgba(239,68,68,0.2); }

        /* ── API Endpoints Reference ─────────────────────────────── */
        .endpoints-section { margin-bottom: 80px; }
        .endpoints-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 16px;
        }
        .endpoint-card {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 10px;
            padding: 18px 20px;
            display: flex;
            align-items: flex-start;
            gap: 14px;
            transition: all 0.2s;
        }
        .endpoint-card:hover {
            background: rgba(255,255,255,0.06);
            border-color: rgba(255,255,255,0.12);
        }
        .method-badge {
            padding: 3px 8px;
            border-radius: 5px;
            font-size: 11px;
            font-weight: 800;
            font-family: monospace;
            flex-shrink: 0;
            margin-top: 2px;
        }
        .method-GET  { background: rgba(34,197,94,0.15);  color: var(--success); }
        .method-POST { background: rgba(59,130,246,0.15); color: #93C5FD; }
        .endpoint-info { flex: 1; }
        .endpoint-path {
            font-size: 13px;
            font-weight: 600;
            color: var(--ucad-white);
            font-family: monospace;
            margin-bottom: 4px;
        }
        .endpoint-desc {
            font-size: 12px;
            color: rgba(255,255,255,0.4);
        }
        .endpoint-auth {
            font-size: 10px;
            padding: 2px 7px;
            background: rgba(201,168,76,0.1);
            border: 1px solid rgba(201,168,76,0.2);
            border-radius: 4px;
            color: var(--ucad-gold);
            margin-top: 6px;
            display: inline-block;
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

        /* ── Toasts ──────────────────────────────────────────────── */
        .toast {
            position: fixed;
            bottom: 28px; right: 28px;
            padding: 12px 20px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 600;
            z-index: 999;
            transform: translateY(80px);
            opacity: 0;
            transition: all 0.3s;
            max-width: 320px;
        }
        .toast.show {
            transform: translateY(0);
            opacity: 1;
        }
        .toast.success { background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.4); color: var(--success); }
        .toast.error   { background: rgba(239,68,68,0.12);  border: 1px solid rgba(239,68,68,0.4);  color: var(--error); }
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
                    <span class="stat-value">15</span>
                    <span class="stat-label">Tests Passés</span>
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

    <!-- ── API TESTER ── -->
    <section class="api-tester-section">
        <div class="container">
            <div class="section-title">
                <h2>Testeur d'API Intégré</h2>
                <p>Testez l'authentification directement depuis cette page</p>
                <div class="section-divider"></div>
            </div>

            <div class="api-tester">
                <div class="api-tester-header">
                    <h3>
                        <div class="terminal-dots">
                            <span class="dot-red"></span>
                            <span class="dot-yellow"></span>
                            <span class="dot-green"></span>
                        </div>
                        Authentification API — ISFAD-Gouvernance
                    </h3>
                    <span style="font-size:12px; color: rgba(255,255,255,0.3);">Base URL: <code style="color:var(--ucad-gold-light)">/api</code></span>
                </div>

                <div class="api-tester-body">
                    <!-- Form Panel -->
                    <div class="api-form-panel">
                        <div class="tab-group">
                            <button class="tab-btn active" onclick="switchTab('login')" id="tab-login">Connexion</button>
                            <button class="tab-btn" onclick="switchTab('register')" id="tab-register">Inscription</button>
                        </div>

                        <!-- Login Form -->
                        <div id="form-login">
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" id="login-email" placeholder="admin@isfad.sn" value="admin@isfad.sn">
                            </div>
                            <div class="form-group">
                                <label>Mot de passe</label>
                                <input type="password" id="login-password" placeholder="••••••••" value="password">
                            </div>
                            <button class="btn-primary" id="btn-login" onclick="doLogin()">
                                <span class="btn-text">🔑 Se connecter</span>
                                <div class="spinner"></div>
                            </button>
                            <div class="token-display" id="token-display">
                                <div class="token-label">✅ Jeton Bearer actif</div>
                                <div class="token-value" id="token-value"></div>
                                <button class="token-copy" onclick="copyToken()">📋 Copier le jeton</button>
                            </div>
                        </div>

                        <!-- Register Form -->
                        <div id="form-register" style="display:none">
                            <div class="form-group">
                                <label>Nom</label>
                                <input type="text" id="reg-nom" placeholder="Diallo">
                            </div>
                            <div class="form-group">
                                <label>Prénom</label>
                                <input type="text" id="reg-prenom" placeholder="Fatou">
                            </div>
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" id="reg-email" placeholder="fatou.diallo@isfad.sn">
                            </div>
                            <div class="form-group">
                                <label>Mot de passe</label>
                                <input type="password" id="reg-password" placeholder="Min. 8 chars, maj+min+chiffre+symbole">
                            </div>
                            <div class="form-group">
                                <label>Confirmer le mot de passe</label>
                                <input type="password" id="reg-password-confirm" placeholder="Répéter le mot de passe">
                            </div>
                            <button class="btn-primary" id="btn-register" onclick="doRegister()">
                                <span class="btn-text">📝 Créer un compte</span>
                                <div class="spinner"></div>
                            </button>
                        </div>
                    </div>

                    <!-- Response Panel -->
                    <div class="api-response-panel">
                        <div class="response-header">
                            <span>Réponse du serveur</span>
                            <span class="status-badge" id="status-badge"></span>
                        </div>
                        <div class="response-body" id="response-body">
                            <span>En attente d'une requête...</span>
                        </div>
                    </div>
                </div>

                <!-- Protected Routes -->
                <div class="protected-tester">
                    <h4>🔒 Routes protégées (nécessite un jeton actif)</h4>
                    <div class="protected-actions">
                        <button class="btn-action blue" onclick="doGetMe()">👤 GET /api/me</button>
                        <button class="btn-action blue" onclick="doChangePassword()">🔑 POST /api/change-password</button>
                        <button class="btn-action red" onclick="doLogout()">🚪 POST /api/logout</button>
                        <button class="btn-action red" onclick="doLogoutAll()">🚪 POST /api/logout-all</button>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ── ENDPOINTS REFERENCE ── -->
    <section class="endpoints-section">
        <div class="container">
            <div class="section-title">
                <h2>Référence des Endpoints</h2>
                <p>Documentation rapide de l'API d'authentification</p>
                <div class="section-divider"></div>
            </div>
            <div class="endpoints-grid">
                <div class="endpoint-card">
                    <span class="method-badge method-POST">POST</span>
                    <div class="endpoint-info">
                        <div class="endpoint-path">/api/register</div>
                        <div class="endpoint-desc">Inscription d'un nouvel utilisateur. Retourne un jeton Bearer.</div>
                    </div>
                </div>
                <div class="endpoint-card">
                    <span class="method-badge method-POST">POST</span>
                    <div class="endpoint-info">
                        <div class="endpoint-path">/api/login</div>
                        <div class="endpoint-desc">Authentification. Retourne un jeton Bearer Sanctum.</div>
                    </div>
                </div>
                <div class="endpoint-card">
                    <span class="method-badge method-GET">GET</span>
                    <div class="endpoint-info">
                        <div class="endpoint-path">/api/me</div>
                        <div class="endpoint-desc">Profil de l'utilisateur connecté.</div>
                        <span class="endpoint-auth">🔒 auth:sanctum</span>
                    </div>
                </div>
                <div class="endpoint-card">
                    <span class="method-badge method-POST">POST</span>
                    <div class="endpoint-info">
                        <div class="endpoint-path">/api/change-password</div>
                        <div class="endpoint-desc">Changement de mot de passe. Révoque les anciens jetons.</div>
                        <span class="endpoint-auth">🔒 auth:sanctum</span>
                    </div>
                </div>
                <div class="endpoint-card">
                    <span class="method-badge method-POST">POST</span>
                    <div class="endpoint-info">
                        <div class="endpoint-path">/api/logout</div>
                        <div class="endpoint-desc">Révoque le jeton courant (cet appareil).</div>
                        <span class="endpoint-auth">🔒 auth:sanctum</span>
                    </div>
                </div>
                <div class="endpoint-card">
                    <span class="method-badge method-POST">POST</span>
                    <div class="endpoint-info">
                        <div class="endpoint-path">/api/logout-all</div>
                        <div class="endpoint-desc">Révoque tous les jetons (tous appareils).</div>
                        <span class="endpoint-auth">🔒 auth:sanctum</span>
                    </div>
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

<!-- Toast Notification -->
<div class="toast" id="toast"></div>

<script>
    // ── State ──────────────────────────────────────────────────────────────
    let currentToken = null;

    // ── Tab Switching ──────────────────────────────────────────────────────
    function switchTab(tab) {
        document.getElementById('form-login').style.display    = tab === 'login'    ? 'block' : 'none';
        document.getElementById('form-register').style.display = tab === 'register' ? 'block' : 'none';
        document.getElementById('tab-login').classList.toggle('active',    tab === 'login');
        document.getElementById('tab-register').classList.toggle('active', tab === 'register');
        clearResponse();
    }

    // ── API Helper ─────────────────────────────────────────────────────────
    async function callApi(method, path, body = null, useToken = false) {
        const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        if (useToken && currentToken) headers['Authorization'] = `Bearer ${currentToken}`;

        const opts = { method, headers };
        if (body) opts.body = JSON.stringify(body);

        const res = await fetch(`/api${path}`, opts);
        const data = await res.json().catch(() => ({ message: 'Réponse non-JSON' }));
        return { status: res.status, data };
    }

    // ── Display Helpers ────────────────────────────────────────────────────
    function showResponse(status, data) {
        const body = document.getElementById('response-body');
        const badge = document.getElementById('status-badge');
        body.classList.add('has-content');
        body.innerHTML = `<pre>${syntaxHighlight(JSON.stringify(data, null, 2))}</pre>`;

        badge.className = 'status-badge show ' + (status < 300 ? 'success' : status < 500 ? 'warning' : 'error');
        badge.textContent = `HTTP ${status}`;
    }

    function clearResponse() {
        const body = document.getElementById('response-body');
        body.classList.remove('has-content');
        body.innerHTML = `<span>En attente d'une requête...</span>`;
        const badge = document.getElementById('status-badge');
        badge.className = 'status-badge';
    }

    function setLoading(btnId, loading) {
        const btn = document.getElementById(btnId);
        btn.classList.toggle('loading', loading);
        btn.disabled = loading;
    }

    function showToast(msg, type = 'success') {
        const t = document.getElementById('toast');
        t.textContent = msg;
        t.className = `toast ${type} show`;
        setTimeout(() => t.className = `toast ${type}`, 2800);
    }

    // ── JSON Syntax Highlight ──────────────────────────────────────────────
    function syntaxHighlight(json) {
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
            let cls = 'json-number';
            if (/^"/.test(match)) cls = /:$/.test(match) ? 'json-key' : 'json-string';
            else if (/true|false/.test(match)) cls = 'json-bool';
            else if (/null/.test(match)) cls = 'json-null';
            return `<span class="${cls}">${match}</span>`;
        });
    }

    // ── Login ──────────────────────────────────────────────────────────────
    async function doLogin() {
        setLoading('btn-login', true);
        try {
            const { status, data } = await callApi('POST', '/login', {
                email:         document.getElementById('login-email').value,
                mot_de_passe:  document.getElementById('login-password').value,
            });
            showResponse(status, data);
            if (status === 200 && data.access_token) {
                currentToken = data.access_token;
                const td = document.getElementById('token-display');
                document.getElementById('token-value').textContent = currentToken.substring(0, 60) + '...';
                td.classList.add('show');
                showToast('✅ Connecté avec succès !');
            } else {
                showToast('❌ Échec de connexion', 'error');
            }
        } catch(e) {
            showResponse(0, { error: 'Erreur réseau : ' + e.message });
            showToast('❌ Erreur réseau', 'error');
        }
        setLoading('btn-login', false);
    }

    // ── Register ───────────────────────────────────────────────────────────
    async function doRegister() {
        setLoading('btn-register', true);
        try {
            const { status, data } = await callApi('POST', '/register', {
                nom:                        document.getElementById('reg-nom').value,
                prenom:                     document.getElementById('reg-prenom').value,
                email:                      document.getElementById('reg-email').value,
                mot_de_passe:               document.getElementById('reg-password').value,
                mot_de_passe_confirmation:  document.getElementById('reg-password-confirm').value,
            });
            showResponse(status, data);
            if (status === 201 && data.access_token) {
                currentToken = data.access_token;
                showToast('✅ Compte créé et connecté !');
            } else {
                showToast('❌ Erreur d\'inscription', 'error');
            }
        } catch(e) {
            showResponse(0, { error: 'Erreur réseau : ' + e.message });
        }
        setLoading('btn-register', false);
    }

    // ── Protected Routes ───────────────────────────────────────────────────
    async function doGetMe() {
        if (!currentToken) return showToast('⚠️ Connectez-vous d\'abord', 'error');
        const { status, data } = await callApi('GET', '/me', null, true);
        showResponse(status, data);
    }

    async function doLogout() {
        if (!currentToken) return showToast('⚠️ Connectez-vous d\'abord', 'error');
        const { status, data } = await callApi('POST', '/logout', null, true);
        showResponse(status, data);
        if (status === 200) {
            currentToken = null;
            document.getElementById('token-display').classList.remove('show');
            showToast('🚪 Déconnecté de cet appareil');
        }
    }

    async function doLogoutAll() {
        if (!currentToken) return showToast('⚠️ Connectez-vous d\'abord', 'error');
        const { status, data } = await callApi('POST', '/logout-all', null, true);
        showResponse(status, data);
        if (status === 200) {
            currentToken = null;
            document.getElementById('token-display').classList.remove('show');
            showToast('🚪 Déconnecté de tous les appareils');
        }
    }

    async function doChangePassword() {
        if (!currentToken) return showToast('⚠️ Connectez-vous d\'abord', 'error');
        const actuel = prompt('Mot de passe actuel :');
        const nouveau = prompt('Nouveau mot de passe (min 8, Maj+min+chiffre+symbole) :');
        if (!actuel || !nouveau) return;
        const { status, data } = await callApi('POST', '/change-password', {
            mot_de_passe_actuel:                 actuel,
            nouveau_mot_de_passe:                nouveau,
            nouveau_mot_de_passe_confirmation:   nouveau,
        }, true);
        showResponse(status, data);
        if (status === 200 && data.access_token) {
            currentToken = data.access_token;
            showToast('✅ Mot de passe modifié, nouveau jeton actif');
        }
    }

    // ── Copy Token ─────────────────────────────────────────────────────────
    function copyToken() {
        if (currentToken) {
            navigator.clipboard.writeText(currentToken)
                .then(() => showToast('📋 Jeton copié dans le presse-papiers'))
                .catch(() => showToast('❌ Copie impossible', 'error'));
        }
    }

    // ── Enter Key Submit ───────────────────────────────────────────────────
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const loginVisible = document.getElementById('form-login').style.display !== 'none';
            if (loginVisible) doLogin();
            else doRegister();
        }
    });
</script>

</body>
</html>
