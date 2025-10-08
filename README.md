# 🎓 BanglaLMS - Single Institution Learning Management System

A modern, full-featured Learning Management System built for single institutions in Bangladesh. Perfect for coaching centers, schools, and educational organizations.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://www.mongodb.com/atlas)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC)](https://tailwindcss.com/)

## 🌟 Features

### ✅ Complete LMS Functionality
- **User Management** - Admin, Teacher, and Student roles with permissions
- **Course Management** - Create courses with modules, lessons, and multimedia content
- **Assignment System** - Create, submit, grade assignments with file uploads
- **Quiz System** - Interactive quizzes with auto-grading (MCQ, True/False, Short Answer)
- **Progress Tracking** - Comprehensive dashboards for all user roles
- **Grading System** - Flexible grading with late penalties and feedback

### 📱 Mobile-First Design
- Fully responsive (320px to 4K displays)
- Touch-optimized interface
- Hamburger navigation for mobile
- Perfect for Bangladesh students using mobile phones

### 🇧🇩 Bangladesh-Ready
- Optimized for Bangladesh market
- Works on 3G/4G mobile data
- Asia/Dhaka timezone default
- bKash/Nagad payment ready (future)

---

## 🚀 Quick Start

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/Atiqul-Imon/single-institution-lms.git
cd single-institution-lms
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp env.example .env.local
```

Edit `.env.local`:
```env
MONGODB_URI=your_mongodb_atlas_connection_string
NEXTAUTH_SECRET=your_random_secret_key
NEXTAUTH_URL=http://localhost:3000
```

4. **Seed the database:**
```bash
npm run seed
```

5. **Start development server:**
```bash
npm run dev
```

6. **Open browser:**
```
http://localhost:3000
```

---

## 🔐 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@banglalms.com | admin123 |
| **Teacher** | teacher1@banglalms.com | teacher123 |
| **Student** | student1@banglalms.com | student123 |

⚠️ **Change these passwords before production!**

---

## 📚 Sample Data

After seeding:
- **6 Users** (1 Admin, 2 Teachers, 3 Students)
- **4 Courses** (Math, Physics, Chemistry, English)
- **3 Assignments** (with due dates)
- **3 Quizzes** (13 questions total)

---

## 🛠️ Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **MongoDB Atlas** - Cloud database
- **Tailwind CSS** - Styling
- **NextAuth.js** - Authentication
- **Mongoose** - ODM

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push to GitHub ✅
2. Import to [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

**Environment Variables:**
```env
MONGODB_URI=your_mongodb_atlas_string
NEXTAUTH_SECRET=generate_new_secret
NEXTAUTH_URL=https://your-domain.vercel.app
```

Generate secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📁 Project Structure

```
lms-website/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/         # API routes
│   │   ├── auth/        # Auth pages
│   │   └── dashboard/   # Dashboard pages
│   ├── components/      # React components
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilities
│   ├── models/         # Mongoose models
│   └── types/          # TypeScript types
├── scripts/
│   └── seed.js         # Database seeding
└── public/             # Static assets
```

---

## 🎯 Key Features

### Course Management
- Modules and lessons
- Video (YouTube/direct), text, PDFs
- Student enrollment
- Progress tracking

### Assignment System
- File upload & text submissions
- Due dates with penalties
- Teacher grading interface
- Feedback system

### Quiz System
- MCQ, True/False, Short Answer
- Auto-grading
- Time limits & attempts
- Detailed analytics

---

## 📱 Mobile Responsive

- **Breakpoints:** 320px to 4K
- **Touch-friendly:** 44px minimum buttons
- **Hamburger menu:** Mobile navigation
- **Responsive tables:** Cards on mobile

---

## 🔒 Security

- Passwords hashed with bcrypt
- JWT sessions
- Environment variables protected
- Role-based access control
- API route protection

---

## 🧪 Testing

```bash
# Re-seed database
npm run seed

# Test different roles
- Admin: admin@banglalms.com / admin123
- Teacher: teacher1@banglalms.com / teacher123  
- Student: student1@banglalms.com / student123
```

---

## 📖 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run seed     # Seed database with sample data
npm run lint     # Run linter
```

---

## 🗺️ Roadmap

- [ ] Bengali language support
- [ ] bKash/Nagad payments
- [ ] Live classes (Zoom/Jitsi)
- [ ] Parent portal
- [ ] Mobile app
- [ ] Email notifications
- [ ] Advanced analytics

---

## 👨‍💻 Author

**Atiqul Islam**
- GitHub: [@Atiqul-Imon](https://github.com/Atiqul-Imon)

---

## 📄 License

Private and proprietary. All rights reserved.

---

**Made with ❤️ for Bangladesh 🇧🇩**

**Version:** 1.0.0  
**Status:** Production-Ready ✅
