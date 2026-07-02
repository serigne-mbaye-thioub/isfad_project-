<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Création de votre compte</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #f4f6f8;
            color: #1a2b3c;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(13, 61, 92, 0.08);
            border: 1px solid #e1e8ed;
        }
        .header {
            background-color: #071F2E;
            color: #ffffff;
            padding: 30px;
            text-align: center;
            border-bottom: 3px solid #C9A84C;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }
        .content {
            padding: 30px;
            line-height: 1.6;
        }
        .content p {
            margin-bottom: 20px;
        }
        .credentials-box {
            background-color: #f0f4f8;
            border-left: 4px solid #1A5C8A;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .credentials-box p {
            margin: 8px 0;
            font-size: 15px;
        }
        .credentials-box strong {
            color: #0d3d5c;
        }
        .credentials-box code {
            font-family: monospace;
            background: #e2e8f0;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 14px;
        }
        .btn {
            display: inline-block;
            background-color: #1A5C8A;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: bold;
            margin-top: 15px;
            text-align: center;
        }
        .btn:hover {
            background-color: #0d3d5c;
        }
        .footer {
            background-color: #f7fafc;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #718096;
            border-top: 1px solid #edf2f7;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ISFAD-Gouvernance</h1>
            <div style="color: #C9A84C; font-size: 11px; margin-top: 5px; text-transform: uppercase; letter-spacing: 2px;">Université Cheikh Anta Diop de Dakar</div>
        </div>
        <div class="content">
            <p>Bonjour {{ $utilisateur->prenom }} {{ $utilisateur->nom }},</p>
            <p>Un compte utilisateur a été créé pour vous sur la plateforme de gouvernance de projets de l'ISFAD (UCAD) par l'administrateur.</p>
            <p>Voici vos paramètres de connexion temporaires :</p>
            
            <div class="credentials-box">
                <p><strong>Adresse e-mail :</strong> <code>{{ $utilisateur->email }}</code></p>
                <p><strong>Mot de passe temporaire :</strong> <code>{{ $motDePasseTemporaire }}</code></p>
            </div>

            <p><strong>Remarque importante :</strong> Lors de votre première connexion, il vous sera demandé de modifier obligatoirement ce mot de passe par mesure de sécurité.</p>
        </div>
        <div class="footer">
            <p>✦ Lux Mea Lex ✦</p>
            <p>Ce message a été généré automatiquement par la plateforme ISFAD-Gouvernance.</p>
        </div>
    </div>
</body>
</html>
