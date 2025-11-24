To clone the repo locally:
```bash
git clone https://github.com/rdubsky17/gp-pitch.git
cd gp-pitch
```
Or download as ZIP and extract into a folder, ensure you are cd'd into it.

Ensure you have nodeJS installed, the download for the installer can be found here: https://nodejs.org/en/download

## Getting Started

To ensure no issues with package dependencies, run:
```bash
npm ci
```
or
```bash
npm install
```

Database Setup (SQLite):

* Download MySQL Community Server: https://dev.mysql.com/downloads/mysql/ . 9.5 version should work.
* Run the installer.
* Use "Typical" setup type.
* Use default configurations. 
* Set a root password (will need this later)
* After MySQL installed, run mysql CL Client
* Create a database using "CREATE DATABASE guitar_tabs;" .(you can use any name)
* Create .env file in the project folder (use example .env.example)
* in .env file add this line (use your mysql root password):
* * DATABASE_URL="mysql://root:password@localhost:3306/guitar_tabs"
* * * If this proves difficult, run $env:DATABASE_URL="mysql://root:pass@localhost:3306/guitar_tabs"

* Load prisma configs using “npx prisma generate”
* Run migrations using “npx prisma migrate dev”
* Optionally run “npx tsx seed.ts” .This adds admin user with following credentials:
* * Email: admin@admin.com
* * Password: adminadmin

For now, just run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


## Notes:

Song files and audio fonts are currently hardcoded. This is very temporary.
