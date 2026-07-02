<?php

namespace App\Mail;

use App\Models\Reunion;
use App\Models\Utilisateur;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ReunionPlanifieeMail extends Mailable
{
    use Queueable, SerializesModels;

    public Reunion $reunion;
    public Utilisateur $participant;

    public function __construct(Reunion $reunion, Utilisateur $participant)
    {
        $this->reunion = $reunion;
        $this->participant = $participant;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Invitation : ' . $this->reunion->titre,
        );
    }

    public function content(): Content
    {
        // Envoi d'un email sous forme de texte brut/simple HTML
        return new Content(
            htmlString: $this->buildSimpleMail(),
        );
    }

    private function buildSimpleMail(): string
    {
        $date = $this->reunion->date_reunion->format('d/m/Y à H:i');
        $lieu = $this->reunion->lieu ?? 'Non précisé';
        
        return "
            <p>Bonjour {$this->participant->prenom},</p>
            <p>Vous avez été invité(e) à une réunion sur la plateforme ISFAD-Gouvernance.</p>
            <br>
            <p><strong>Détails :</strong></p>
            <p>- Titre : {$this->reunion->titre}</p>
            <p>- Date : {$date}</p>
            <p>- Lieu / Lien : {$lieu}</p>
            <p>- Ordre du jour : {$this->reunion->ordre_du_jour}</p>
            <br>
            <p>Merci de vous connecter à votre espace pour confirmer votre présence.</p>
        ";
    }
}
