<?php

namespace Tests\Feature;

use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\ResetPasswordMail;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_sends_email_and_creates_token()
    {
        Mail::fake();

        $user = Utilisateur::create([
            'nom' => 'Test', 'prenom' => 'User', 'email' => 'test@example.com',
            'mot_de_passe' => bcrypt('password123'), 'fonction' => 'Membre d’équipe', 'actif' => true
        ]);

        $response = $this->postJson('/api/forgot-password', ['email' => 'test@example.com']);

        $response->assertStatus(200);
        $this->assertDatabaseHas('password_reset_tokens', ['email' => 'test@example.com']);
        Mail::assertSent(ResetPasswordMail::class);
    }

    public function test_reset_password_with_valid_token()
    {
        $user = Utilisateur::create([
            'nom' => 'Test', 'prenom' => 'User', 'email' => 'test@example.com',
            'mot_de_passe' => bcrypt('password123'), 'fonction' => 'Membre d’équipe', 'actif' => true
        ]);

        DB::table('password_reset_tokens')->insert([
            'email' => 'test@example.com',
            'token' => '123456',
            'created_at' => now()
        ]);

        $response = $this->postJson('/api/reset-password', [
            'email' => 'test@example.com',
            'token' => '123456',
            'mot_de_passe' => 'nouveau_secret',
            'mot_de_passe_confirmation' => 'nouveau_secret'
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('password_reset_tokens', ['email' => 'test@example.com']);
    }
}
