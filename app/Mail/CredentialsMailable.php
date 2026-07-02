<?php

namespace App\Mail;

use App\Models\Utilisateur;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CredentialsMailable extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Utilisateur $utilisateur,
        public string $motDePasseTemporaire
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Création de votre compte — ISFAD-Gouvernance',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.credentials',
        );
    }
}
