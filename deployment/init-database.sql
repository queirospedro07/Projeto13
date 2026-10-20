-- Runs once, only when initializing a new production volume.
-- The API receives a database owner role without cluster administration powers.
\getenv app_password POSTGRES_APP_PASSWORD
CREATE ROLE nexo LOGIN PASSWORD :'app_password' NOSUPERUSER NOCREATEDB NOCREATEROLE;
ALTER DATABASE nexo OWNER TO nexo;
