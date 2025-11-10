-- Add current_team_id column to vehicles table
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS current_team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_vehicles_current_team_id ON vehicles(current_team_id);

-- Add comment for documentation
COMMENT ON COLUMN vehicles.current_team_id IS 'Team currently assigned to this vehicle';

