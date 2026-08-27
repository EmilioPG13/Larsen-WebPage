-- Optional English overrides for a machine's spec values, mirroring the `en`
-- block that src/data/machines.json already carries for the static catalog.
ALTER TABLE "machines" ADD COLUMN "en" JSONB;
