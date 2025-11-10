# 🚀 Vercel Deployment Anleitung

## Schnellstart (5 Minuten)

### 1. Vercel-Account erstellen

1. Gehen Sie zu [vercel.com](https://vercel.com)
2. Klicken Sie auf "Sign Up"
3. Wählen Sie "Continue with GitHub"
4. Autorisieren Sie Vercel für Ihr GitHub-Konto

### 2. Projekt importieren

1. In Vercel Dashboard klicken Sie auf **"Add New..."** → **"Project"**
2. Wählen Sie das Repository **"GodSmasher/ForstbetriebMVP"**
3. Klicken Sie auf **"Import"**

### 3. Projekt konfigurieren

#### Framework Preset
- Vercel erkennt automatisch: **Next.js**
- Keine Änderung nötig ✓

#### Root Directory
- Lassen Sie auf **"./"** (Standard)

#### Build and Output Settings
- Build Command: `npm run build` (automatisch erkannt)
- Output Directory: `.next` (automatisch erkannt)
- Install Command: `npm install` (automatisch erkannt)

### 4. Umgebungsvariablen hinzufügen ⚠️ WICHTIG!

Klicken Sie auf **"Environment Variables"** und fügen Sie hinzu:

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://ihr-projekt.supabase.co

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY  
Value: ihr-supabase-anon-key
```

**Wo finde ich diese Werte?**
1. Gehen Sie zu [app.supabase.com](https://app.supabase.com)
2. Wählen Sie Ihr Projekt
3. Gehen Sie zu **Settings** → **API**
4. Kopieren Sie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 5. Deployen!

1. Klicken Sie auf **"Deploy"**
2. Vercel baut Ihre Anwendung (~2-3 Minuten)
3. Nach erfolgreichem Build erhalten Sie eine URL wie:
   ```
   https://forstbetrieb-mvp-xxx.vercel.app
   ```

## ✅ Deployment erfolgreich!

Ihre Anwendung ist jetzt live! 🎉

### Nächste Schritte:

1. **Custom Domain einrichten** (optional)
   - Settings → Domains → Add Domain
   - Z.B. `forstbetrieb.ihredomain.de`

2. **Automatische Deployments**
   - Jeder Push auf `main` wird automatisch deployed
   - Preview-Deployments für andere Branches

3. **Deployment-URL teilen**
   - Production: `https://ihr-projekt.vercel.app`
   - Preview URLs für jeden Branch/PR

## 🔧 Troubleshooting

### Build schlägt fehl?

**Fehler: "Missing environment variables"**
- Lösung: Fügen Sie die Supabase-Credentials hinzu (siehe Schritt 4)

**Fehler: "Module not found"**
- Lösung: Vercel baut automatisch neu. Warten Sie 1-2 Minuten.

**Fehler: "ENOENT: no such file"**
- Lösung: Überprüfen Sie, dass `.gitignore` korrekt ist (node_modules, .next)

### Runtime-Fehler nach Deployment?

**Supabase Connection Error**
- Überprüfen Sie, dass beide Umgebungsvariablen gesetzt sind
- Stellen Sie sicher, dass die URL korrekt ist (mit `https://`)
- Überprüfen Sie, dass der ANON key verwendet wird (nicht service_role!)

**404 Errors**
- Alle Routen sollten funktionieren
- Middleware ist konfiguriert für `/dashboard` und `/login`

### Logs anzeigen

1. Gehen Sie zu Ihrem Projekt in Vercel
2. Klicken Sie auf **"Deployments"**
3. Wählen Sie ein Deployment
4. Klicken Sie auf **"Runtime Logs"** oder **"Build Logs"**

## 📊 Performance-Optimierung

Vercel optimiert automatisch:
- ✓ Image Optimization
- ✓ Edge Caching
- ✓ Automatic HTTPS
- ✓ Global CDN
- ✓ Serverless Functions

## 🌍 Deployment-Regionen

Aktuell konfiguriert: **Frankfurt (fra1)** für beste Performance in Deutschland

Ändern in `vercel.json`:
```json
{
  "regions": ["fra1"]  // Frankfurt
}
```

Weitere Regionen: `ams1` (Amsterdam), `cdg1` (Paris), `lhr1` (London)

## 🔄 Updates deployen

```bash
# 1. Änderungen machen
git add .

# 2. Committen
git commit -m "Feature: Neue Funktion"

# 3. Pushen
git push origin main

# Vercel deployed automatisch!
```

## 🎯 Production Checklist

- [ ] Supabase-Umgebungsvariablen gesetzt
- [ ] Build lokal erfolgreich (`npm run build`)
- [ ] Alle TypeScript-Fehler behoben
- [ ] `.env.local` NICHT im Git
- [ ] `node_modules` und `.next` NICHT im Git
- [ ] Custom Domain konfiguriert (optional)
- [ ] Supabase Row Level Security aktiviert
- [ ] SSL/HTTPS automatisch von Vercel

## 📞 Support

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Supabase Docs: [supabase.com/docs](https://supabase.com/docs)
- Next.js Docs: [nextjs.org/docs](https://nextjs.org/docs)

---

**Viel Erfolg mit Ihrem Deployment!** 🚀

