## Prerequisites

To clone the repo locally:
```bash
git clone https://github.com/rdubsky17/gp-pitch.git
cd gp-pitch
```
Or download as ZIP and extract into a folder, ensure you are cd'd into it.

Ensure you have **nodeJS** installed, the download for the installer can be found here: https://nodejs.org/en/download

To check if nodeJS is installed on a system, execute the following command:
```bash
node -v
```

## Getting Started

To ensure no issues with package dependencies, run:
```bash
npm ci
```
or
```bash
npm install
```

### Database Setup (SQLite):

1. Create **.env** file (in the project folder) with **DATABASE_URL** (see the format in .env.example)
```bash
DATABASE_URL="file:./prisma/data/database.db"
```
2. Create database & run migrations using the following command:
```bash
npx prisma migrate dev
```
_Optional:_
* Use the following command to get the clear representation of database schema:
```bash
npx prisma studio
```
* Run the following command to add admin user to the database:
```bash
  npx tsx seed.ts
  ```
*  The admin user credentials:
* * Email: admin@admin.com
* * Password: adminadmin

### JWT Setup:
1. Add **JWT_SECRET** to **.env** file (see the format in .env.example)
```bash
JWT_SECRET="your-strong-secret-key"
```
* This can be any random string.
* For exanple, to generate a secure secret key for JWT in the terminal, you can utilize the crypto module available in Node.js.
``` bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Nodemailer Setup:

(see password in Discord)

1. Add following variables to **.env**:
```bash
EMAIL_USER=guitartabsweb@gmail.com    
EMAIL_PASS="your-email-password"  
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```
\
For now, just run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


## Notes:

Song files and audio fonts are currently hardcoded. This is very temporary.
