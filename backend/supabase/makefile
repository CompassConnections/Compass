# usage: make [command]
help:
	@cat ./makefile

regen-types: regen-types-prod

regen-types-prod:
	npx supabase gen types typescript --remote=ltzepxnhhnrnvovqblfr --schema public > ../../common/src/supabase/schema.ts
	cd ../../common && npx prettier --write ./src/supabase/schema.ts

regen-types-dev:
	npx supabase gen types typescript --remote=zbspxezubpzxmuxciurg --schema public > ../../common/src/supabase/schema.ts
	cd ../../common && npx prettier --write ./src/supabase/schema.ts

# regen-schema-dev: use-dev regen-schema
