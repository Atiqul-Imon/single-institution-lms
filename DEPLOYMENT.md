# 🚀 Vercel Deployment Guide

## Quick Deploy to Vercel (5 Minutes)

### Step 1: Sign in to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign in with GitHub"**
3. Authorize Vercel to access your repositories

### Step 2: Import Project
1. Click **"Add New..."** → **"Project"**
2. Find **"single-institution-lms"** in your repositories
3. Click **"Import"**

### Step 3: Configure Build Settings
Vercel will auto-detect Next.js. Verify these settings:

```
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Development Command: npm run dev
```

**Root Directory:** Leave as `.` (root)

### Step 4: Add Environment Variables
Click **"Environment Variables"** and add these:

#### Required Variables:

**1. MONGODB_URI**
```
mongodb+srv://imonatikulislam_db_user:2AiOAXAEukwqjMd2@cluster0.p6ph2iu.mongodb.net/banglalms?retryWrites=true&w=majority&appName=Cluster0
```

**2. NEXTAUTH_SECRET**
Generate a new secret (IMPORTANT - don't use the dev one!):
```bash
# Run this command locally:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and paste as NEXTAUTH_SECRET value.

**3. NEXTAUTH_URL**
```
https://your-project-name.vercel.app
```
(You'll get the exact URL after first deployment, then update this)

### Step 5: Deploy!
1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Your site is live! 🎉

### Step 6: Update NEXTAUTH_URL
1. Copy your Vercel deployment URL (e.g., `https://single-institution-lms.vercel.app`)
2. Go to **Project Settings** → **Environment Variables**
3. Update **NEXTAUTH_URL** with your actual URL
4. Click **"Redeploy"** to apply changes

---

## 🔒 Post-Deployment Security

### 1. Change Default Passwords
Login to your deployed site and change these passwords:
- admin@banglalms.com
- teacher1@banglalms.com  
- student1@banglalms.com

### 2. Secure MongoDB
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. **Network Access** → Add Vercel IPs or use `0.0.0.0/0` (all IPs)
3. **Database Access** → Rotate password if needed
4. Enable backup (paid feature)

### 3. Environment Variables Checklist
- [ ] NEXTAUTH_SECRET is unique (not from development)
- [ ] NEXTAUTH_URL matches your Vercel URL
- [ ] MONGODB_URI is correct and accessible

---

## 🌍 Custom Domain (Optional)

### Add Your Own Domain:
1. In Vercel, go to **Project Settings** → **Domains**
2. Click **"Add"**
3. Enter your domain (e.g., `yourlms.com`)
4. Follow DNS configuration instructions
5. Wait for DNS propagation (5-30 minutes)
6. SSL certificate auto-generated ✅

---

## 🔄 Continuous Deployment

**Auto-deploy is already configured!**

Every time you push to GitHub main branch:
```bash
git add .
git commit -m "Update feature"
git push origin main
```
→ Vercel automatically deploys! 🚀

---

## 📊 Monitoring

### Vercel Analytics (Free):
1. Go to **Analytics** tab in Vercel dashboard
2. View:
   - Page views
   - User locations
   - Performance metrics
   - Core Web Vitals

### Vercel Logs:
1. Click **"Deployments"**
2. Select a deployment
3. View **"Build Logs"** and **"Function Logs"**

---

## 🐛 Troubleshooting

### Build Fails:
**Check:**
- Environment variables are set correctly
- No TypeScript errors (run `npm run build` locally)
- Dependencies are in package.json

### Can't Login:
**Check:**
- NEXTAUTH_URL matches deployment URL
- NEXTAUTH_SECRET is set
- MongoDB is accessible (Network Access)

### Database Connection Error:
**Check:**
- MONGODB_URI is correct
- MongoDB Atlas Network Access allows Vercel (0.0.0.0/0)
- Database user has read/write permissions

---

## ✅ Deployment Checklist

- [ ] Signed in to Vercel with GitHub
- [ ] Imported repository
- [ ] Added MONGODB_URI
- [ ] Generated and added NEXTAUTH_SECRET
- [ ] Added NEXTAUTH_URL (temporary, will update)
- [ ] Clicked Deploy
- [ ] Updated NEXTAUTH_URL with actual Vercel URL
- [ ] Redeployed with correct URL
- [ ] Tested login functionality
- [ ] Changed default passwords
- [ ] Configured MongoDB Network Access

---

## 🎉 Success!

Your LMS is now live and accessible to the world!

**Next Steps:**
1. Share the URL with your users
2. Create your actual courses
3. Invite teachers and students
4. Monitor usage and feedback
5. Iterate and improve

---

**Made with ❤️ for Bangladesh 🇧🇩**

