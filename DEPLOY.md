# Nimbus CRM - Deployment Guide

## Quick Start (Local Development)

### 1. Copy environment file
```bash
cp .env.example .env
```
Edit `.env` with your actual values.

### 2. Set up PostgreSQL
Install PostgreSQL and create a database:
```sql
CREATE DATABASE nimbus_crm;
CREATE USER nimbus WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE nimbus_crm TO nimbus;
```
Update `DATABASE_URL` in `.env`.

### 3. Run database migrations
```bash
npm run db:push      # Push schema to database
npm run db:seed      # Create admin user + document types
```

### 4. Start development server
```bash
npm run dev
```
Visit http://localhost:3000

**Default login:** admin@dynamicbusiness.co.za / Admin@123  
**IMPORTANT: Change this password immediately after first login!**

---

## Linux VPS Deployment (Ubuntu/Debian)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Nginx
- PM2 (`npm install -g pm2`)

### 1. Clone/copy project to server
```bash
scp -r . user@your-server:/var/www/nimbus-crm
```

### 2. Install dependencies
```bash
cd /var/www/nimbus-crm
npm install --legacy-peer-deps
```

### 3. Create .env
```bash
cp .env.example .env
nano .env
```
Set:
- `DATABASE_URL` → your PostgreSQL connection string
- `NEXTAUTH_SECRET` → run `openssl rand -base64 32`
- `NEXTAUTH_URL` → your domain (e.g. `https://crm.yourdomain.co.za`)
- `APP_URL` → same as NEXTAUTH_URL
- `SMTP_*` → your mail server settings
- `COMPANY_*` → Dynamic Business Systems details

### 4. Build and initialize
```bash
npx prisma generate
npx prisma db push
npm run db:seed
npm run build
```

### 5. Start with PM2
```bash
pm2 start npm --name "nimbus-crm" -- start
pm2 save
pm2 startup
```

### 6. Nginx configuration
```nginx
server {
    listen 80;
    server_name crm.yourdomain.co.za;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Allow large file uploads
    client_max_body_size 20M;
}
```

Then enable HTTPS with Certbot:
```bash
certbot --nginx -d crm.yourdomain.co.za
```

---

## Adding Staff Users

Use Prisma Studio to add users, or create a quick script:
```bash
npx prisma studio
```
Navigate to the User table → Add record.

**Passwords must be bcrypt-hashed.** Generate one:
```bash
node -e "const {hashSync}=require('bcryptjs');console.log(hashSync('YourPassword123',12))"
```

---

## Email Configuration

### Gmail (App Password)
1. Enable 2FA on your Google account
2. Go to Google Account → Security → App Passwords
3. Generate an app password for "Mail"
4. Set in .env:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=yourname@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```

### Office 365 / Microsoft 365
```
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@company.co.za
SMTP_PASS=your-password
```

---

## File Uploads

Uploaded documents are stored in the `uploads/` directory in the project root.  
**Back this directory up regularly!**

For production, consider moving uploads to a dedicated volume:
```
UPLOAD_DIR=/var/data/nimbus-uploads
```
(Update `app/api/portal/[token]/upload/route.ts` to use `process.env.UPLOAD_DIR`)

---

## Adding Document Types

Use Prisma Studio or SQL to add more document types:
```sql
INSERT INTO "DocumentType" (id, name, description, "isActive") 
VALUES (gen_random_uuid(), 'New Document Type', 'Description here', true);
```

---

## Backup

```bash
# Database backup
pg_dump nimbus_crm > backup_$(date +%Y%m%d).sql

# Files backup
tar -czf uploads_$(date +%Y%m%d).tar.gz uploads/
```
