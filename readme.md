1. install dependencies

```bash
npm i @prisma/client express nodemon
```
2. Initialize Prisma

```bash
npx prisma init --datasource-provider  postgresql
```

3. In the .env file, change the DATABASE_URL string to your Postgres configuration

4. Run

```bash
npx prisma migrate dev --name initial_seeding
```

5. .env is this. should be in your server folder
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stannieauthdb?schema=public"

JWT_SECRET_KEY="shhhhhhdonttellanyone"

```
