# Supabase Setup & Migration

## 🔧 WICHTIG: Führe diese SQL-Migration aus!

Um die Team-Zuweisung für Fahrzeuge zu aktivieren, musst du folgendes SQL in deiner Supabase-Datenbank ausführen:

### Migration ausführen:

1. Gehe zu [app.supabase.com](https://app.supabase.com)
2. Wähle dein Projekt
3. Klicke auf **SQL Editor** (links im Menü)
4. Klicke auf **New Query**
5. Kopiere und füge folgenden SQL-Code ein:

```sql
-- Add current_team_id column to vehicles table
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS current_team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_vehicles_current_team_id ON vehicles(current_team_id);

-- Add comment for documentation
COMMENT ON COLUMN vehicles.current_team_id IS 'Team currently assigned to this vehicle';
```

6. Klicke auf **RUN** (oder drücke Ctrl+Enter)

### ✅ Bestätigung:

Nach erfolgreicher Ausführung solltest du sehen:
```
Success. No rows returned
```

### 🔄 Types aktualisieren (nach Migration):

Nachdem die Migration ausgeführt wurde, aktualisiere die TypeScript-Types:

```bash
# In deinem Supabase-Projekt Dashboard:
# Settings → API → Generate Types

# Oder mit Supabase CLI:
npx supabase gen types typescript --project-id sagtimdfnmzqlbzxjqzu > src/types/database.types.ts
```

### 📊 Verifizierung:

Überprüfe in Supabase unter **Table Editor → vehicles**, dass die neue Spalte `current_team_id` vorhanden ist.

---

## Danach kannst du:

- ✅ Teams zu Fahrzeugen zuweisen
- ✅ Nach Teams filtern
- ✅ Team-Farben als Badges sehen
- ✅ Fahrzeuge einem Team entziehen

**Hinweis:** Die App funktioniert auch ohne diese Migration, aber die Team-Zuweisung wird dann nicht persistiert.

