## ProducerKit — MVP (PRD condensé)

### Vision
ProducerKit est une webapp SaaS pour beatmakers et producteurs Hip-Hop / R&B / Trap / Afrobeats. Le MVP permet de générer des melody loops et vocal hooks “placeholder” via une UI pro orientée producteurs, avec un workflow de sauvegarde et lecture audio.

### Objectifs MVP
- Offrir une landing page marketing complète.
- Authentifier via Supabase (email/password + Google OAuth).
- Protéger les routes `/dashboard` et `/library`.
- Générer des loops “placeholder” (audio synthétique) avec paramètres pro.
- Sauvegarder et consulter des loops dans une bibliothèque.
- Fournir un mini-player persistant.

### Hors-scope MVP
- Pas d’API audio réelle.
- Pas de paiement Stripe actif.
- Pas de vraie stem separation.

### Pages
1. `/` Landing
2. `/auth` Auth (login/signup + Google)
3. `/dashboard` Générateur
4. `/library` Bibliothèque
5. `/pricing` Pricing

### Design system
- Dark-only.
- Couleurs (tokens):
  - Background principal: `#0a0a0f`
  - Cards/panels: `#111118`
  - Inputs: `#1a1a24`
  - Accent: `#7c3aed`
  - Accent hover: `#6d28d9`
  - Accent glow: `#7c3aed22`
  - Texte primaire: `#f1f0f5`
  - Texte secondaire: `#6b7280`
  - Bordures: `#2d2d3d`
  - Succès: `#10b981`
  - Erreur: `#ef4444`
- Police: Inter.
- Border radius global: 10px.
- Transitions de pages: fade 200ms.

### Données Supabase
Tables: `profiles`, `loops`.

### Critères d’acceptation
- Le parcours “signup/login → dashboard → generate → play → save → library” fonctionne.
- Le mini-player reste actif en navigation.
- Aucune `alert()`; uniquement des toasts.
- UI responsive.
