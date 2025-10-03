-- Add room_number to rooms table
ALTER TABLE public.rooms ADD COLUMN room_number TEXT;

-- Add name to cages table
ALTER TABLE public.cages ADD COLUMN name TEXT;

-- Create index for better performance
CREATE INDEX idx_rooms_building_id ON public.rooms(building_id);
CREATE INDEX idx_cages_room_id ON public.cages(room_id);