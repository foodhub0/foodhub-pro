-- Adicionar campos de coordenadas para o restaurante
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS latitude decimal(10, 8),
ADD COLUMN IF NOT EXISTS longitude decimal(11, 8);

-- Criar índice para consultas por proximidade (caso necessário no futuro)
CREATE INDEX IF NOT EXISTS idx_restaurants_coordinates ON restaurants(latitude, longitude);

-- Comentários para documentação
COMMENT ON COLUMN restaurants.latitude IS 'Latitude do endereço do restaurante para cálculo de distância';
COMMENT ON COLUMN restaurants.longitude IS 'Longitude do endereço do restaurante para cálculo de distância';
