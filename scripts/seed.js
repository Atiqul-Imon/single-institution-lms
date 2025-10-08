const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

// Get database collections directly
let db;
let User, Course, Assignment, Quiz;

// Sample data
const sampleData = {
  users: {
    admin: {
      email: 'admin@banglalms.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'super_admin',
      profile: {
        firstName: 'Admin',
        lastName: 'User',
        phone: '+8801712345678',
        preferences: {
          language: 'en',
          timezone: 'Asia/Dhaka',
          notifications: { email: true, sms: false, push: true }
        }
      },
      isActive: true
    },
    teacher1: {
      email: 'teacher1@banglalms.com',
      password: 'teacher123',
      name: 'Karim Rahman',
      role: 'teacher',
      profile: {
        firstName: 'Karim',
        lastName: 'Rahman',
        phone: '+8801812345678',
        bio: 'Mathematics teacher with 10 years of experience',
        preferences: {
          language: 'en',
          timezone: 'Asia/Dhaka',
          notifications: { email: true, sms: true, push: true }
        }
      },
      isActive: true
    },
    teacher2: {
      email: 'teacher2@banglalms.com',
      password: 'teacher123',
      name: 'Fatima Begum',
      role: 'teacher',
      profile: {
        firstName: 'Fatima',
        lastName: 'Begum',
        phone: '+8801912345678',
        bio: 'Science teacher passionate about student success',
        preferences: {
          language: 'en',
          timezone: 'Asia/Dhaka',
          notifications: { email: true, sms: false, push: true }
        }
      },
      isActive: true
    },
    student1: {
      email: 'student1@banglalms.com',
      password: 'student123',
      name: 'Rahim Ahmed',
      role: 'student',
      profile: {
        firstName: 'Rahim',
        lastName: 'Ahmed',
        phone: '+8801612345678',
        dateOfBirth: new Date('2005-03-15'),
        preferences: {
          language: 'en',
          timezone: 'Asia/Dhaka',
          notifications: { email: true, sms: false, push: true }
        }
      },
      isActive: true
    },
    student2: {
      email: 'student2@banglalms.com',
      password: 'student123',
      name: 'Ayesha Khan',
      role: 'student',
      profile: {
        firstName: 'Ayesha',
        lastName: 'Khan',
        phone: '+8801512345678',
        dateOfBirth: new Date('2006-07-20'),
        preferences: {
          language: 'en',
          timezone: 'Asia/Dhaka',
          notifications: { email: true, sms: true, push: true }
        }
      },
      isActive: true
    },
    student3: {
      email: 'student3@banglalms.com',
      password: 'student123',
      name: 'Sabbir Hossain',
      role: 'student',
      profile: {
        firstName: 'Sabbir',
        lastName: 'Hossain',
        phone: '+8801412345678',
        dateOfBirth: new Date('2005-11-05'),
        preferences: {
          language: 'en',
          timezone: 'Asia/Dhaka',
          notifications: { email: true, sms: false, push: false }
        }
      },
      isActive: true
    }
  },
  courses: [
    {
      code: 'MATH101',
      title: 'Advanced Mathematics - SSC',
      description: 'Complete mathematics course for SSC students covering algebra, geometry, and calculus basics.',
      subject: 'Mathematics',
      grade: 'SSC',
      thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400',
      duration: 120,
      level: 'INTERMEDIATE',
      status: 'PUBLISHED',
      modules: [
        {
          title: 'Algebra Fundamentals',
          description: 'Learn the basics of algebra',
          order: 1,
          lessons: [
            {
              title: 'Introduction to Algebra',
              type: 'video',
              content: 'Welcome to algebra!',
              videoUrl: 'https://www.youtube.com/watch?v=NybHckSEQBI',
              duration: 15,
              order: 1
            },
            {
              title: 'Linear Equations',
              type: 'text',
              content: 'Linear equations are equations of the first degree...',
              duration: 10,
              order: 2
            }
          ]
        },
        {
          title: 'Geometry Basics',
          description: 'Understanding shapes and angles',
          order: 2,
          lessons: [
            {
              title: 'Triangles and Properties',
              type: 'video',
              videoUrl: 'https://www.youtube.com/watch?v=example',
              duration: 20,
              order: 1
            }
          ]
        }
      ],
      resources: [
        { title: 'Algebra Formula Sheet', type: 'pdf', url: 'https://example.com/formulas.pdf' }
      ]
    },
    {
      code: 'PHY101',
      title: 'Physics - Class 10',
      description: 'Comprehensive physics course covering mechanics, electricity, and modern physics.',
      subject: 'Physics',
      grade: 'Class 10',
      thumbnail: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400',
      duration: 100,
      level: 'INTERMEDIATE',
      status: 'PUBLISHED',
      modules: [
        {
          title: 'Mechanics',
          description: 'Study of motion and forces',
          order: 1,
          lessons: [
            {
              title: 'Newton\'s Laws of Motion',
              type: 'video',
              content: 'Understanding the three laws of motion',
              videoUrl: 'https://www.youtube.com/watch?v=example2',
              duration: 25,
              order: 1
            }
          ]
        }
      ]
    },
    {
      code: 'CHEM101',
      title: 'Chemistry - SSC',
      description: 'Essential chemistry concepts for SSC examination preparation.',
      subject: 'Chemistry',
      grade: 'SSC',
      thumbnail: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=400',
      duration: 90,
      level: 'INTERMEDIATE',
      status: 'PUBLISHED',
      modules: [
        {
          title: 'Atomic Structure',
          description: 'Understanding atoms and molecules',
          order: 1,
          lessons: [
            {
              title: 'Introduction to Atoms',
              type: 'text',
              content: 'Atoms are the basic building blocks of matter...',
              duration: 15,
              order: 1
            }
          ]
        }
      ]
    },
    {
      code: 'ENG101',
      title: 'English Grammar & Composition',
      description: 'Master English grammar, writing skills, and literature for SSC.',
      subject: 'English',
      grade: 'SSC',
      thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400',
      duration: 80,
      level: 'BEGINNER',
      status: 'PUBLISHED',
      modules: [
        {
          title: 'Parts of Speech',
          description: 'Learn nouns, verbs, adjectives and more',
          order: 1,
          lessons: [
            {
              title: 'Nouns and Pronouns',
              type: 'text',
              content: 'Nouns are naming words...',
              duration: 10,
              order: 1
            }
          ]
        }
      ]
    }
  ],
  assignments: [
    {
      code: 'MATH101-A1',
      title: 'Algebra Practice Problems',
      description: 'Solve 20 algebra problems covering linear equations, quadratic equations, and inequalities.',
      type: 'HOMEWORK',
      submissionType: 'file',
      totalMarks: 100,
      passingMarks: 40,
      weight: 10,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      allowLateSubmission: true,
      latePenalty: 10,
      maxAttempts: 2,
      instructions: '1. Show all your work\n2. Write clearly\n3. Submit as PDF\n4. Double-check your answers',
      rubric: 'Each problem is worth 5 marks. Partial credit given for showing work.',
      attachments: [],
      isPublished: true
    },
    {
      code: 'PHY101-A1',
      title: 'Newton\'s Laws Lab Report',
      description: 'Write a detailed lab report on experiments demonstrating Newton\'s three laws of motion.',
      type: 'LAB',
      submissionType: 'file',
      totalMarks: 50,
      passingMarks: 25,
      weight: 15,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      allowLateSubmission: true,
      latePenalty: 5,
      maxAttempts: 1,
      instructions: 'Include: Introduction, Methodology, Results, Discussion, Conclusion',
      rubric: 'Format: 10 marks, Content: 30 marks, Analysis: 10 marks',
      isPublished: true
    },
    {
      code: 'ENG101-A1',
      title: 'Essay Writing - My Dream',
      description: 'Write a 500-word essay about your dreams and aspirations for the future.',
      type: 'ESSAY',
      submissionType: 'text',
      totalMarks: 30,
      passingMarks: 15,
      weight: 10,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      allowLateSubmission: false,
      maxAttempts: 1,
      instructions: 'Write in clear English, use proper grammar, minimum 500 words',
      rubric: 'Grammar: 10 marks, Content: 15 marks, Creativity: 5 marks',
      isPublished: true
    }
  ],
  quizzes: [
    {
      code: 'MATH101-Q1',
      title: 'Algebra Basics Quiz',
      description: 'Test your understanding of basic algebra concepts',
      type: 'PRACTICE',
      timeLimit: 30,
      totalPoints: 50,
      passingScore: 25,
      maxAttempts: 3,
      shuffleQuestions: true,
      shuffleOptions: true,
      showCorrectAnswers: true,
      availableFrom: new Date(),
      availableTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      isPublished: true,
      questions: [
        {
          type: 'multiple_choice',
          question: 'What is the value of x in the equation: 2x + 5 = 15?',
          points: 10,
          options: ['x = 5', 'x = 10', 'x = 7.5', 'x = 20'],
          correctAnswer: 0,
          explanation: 'Subtract 5 from both sides: 2x = 10, then divide by 2: x = 5'
        },
        {
          type: 'multiple_choice',
          question: 'Which of the following is a quadratic equation?',
          points: 10,
          options: ['x + 5 = 0', 'x² + 3x + 2 = 0', '2x = 10', 'x³ + 1 = 0'],
          correctAnswer: 1,
          explanation: 'A quadratic equation has x² as the highest power'
        },
        {
          type: 'true_false',
          question: 'The slope of a horizontal line is zero.',
          points: 10,
          correctAnswer: true,
          explanation: 'A horizontal line has no rise, only run, so slope = 0/run = 0'
        },
        {
          type: 'multiple_choice',
          question: 'Simplify: 3x + 2x - x = ?',
          points: 10,
          options: ['4x', '5x', '6x', '2x'],
          correctAnswer: 0,
          explanation: '3x + 2x - x = (3 + 2 - 1)x = 4x'
        },
        {
          type: 'short_answer',
          question: 'If f(x) = 2x + 3, what is f(5)?',
          points: 10,
          correctAnswer: '13',
          explanation: 'f(5) = 2(5) + 3 = 10 + 3 = 13'
        }
      ]
    },
    {
      code: 'PHY101-Q1',
      title: 'Newton\'s Laws Quiz',
      description: 'Test your knowledge of Newton\'s three laws of motion',
      type: 'GRADED',
      timeLimit: 20,
      totalPoints: 40,
      passingScore: 20,
      maxAttempts: 2,
      shuffleQuestions: true,
      shuffleOptions: true,
      showCorrectAnswers: false,
      availableFrom: new Date(),
      availableTo: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
      isPublished: true,
      questions: [
        {
          type: 'multiple_choice',
          question: 'Which law states "An object at rest stays at rest"?',
          points: 10,
          options: ['First Law', 'Second Law', 'Third Law', 'None of the above'],
          correctAnswer: 0,
          explanation: 'Newton\'s First Law is the law of inertia'
        },
        {
          type: 'multiple_choice',
          question: 'F = ma represents which law?',
          points: 10,
          options: ['First Law', 'Second Law', 'Third Law', 'Law of Gravity'],
          correctAnswer: 1,
          explanation: 'Newton\'s Second Law: Force equals mass times acceleration'
        },
        {
          type: 'true_false',
          question: 'For every action, there is an equal and opposite reaction.',
          points: 10,
          correctAnswer: true,
          explanation: 'This is Newton\'s Third Law'
        },
        {
          type: 'short_answer',
          question: 'What is the SI unit of force?',
          points: 10,
          correctAnswer: 'Newton',
          explanation: 'The SI unit of force is Newton (N)'
        }
      ]
    },
    {
      code: 'CHEM101-Q1',
      title: 'Atomic Structure Quiz',
      description: 'Basic concepts of atomic structure',
      type: 'PRACTICE',
      timeLimit: 15,
      totalPoints: 30,
      passingScore: 15,
      maxAttempts: 5,
      shuffleQuestions: false,
      shuffleOptions: true,
      showCorrectAnswers: true,
      availableFrom: new Date(),
      availableTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      isPublished: true,
      questions: [
        {
          type: 'multiple_choice',
          question: 'What is the charge of a proton?',
          points: 10,
          options: ['Negative', 'Positive', 'Neutral', 'Variable'],
          correctAnswer: 1,
          explanation: 'Protons have a positive charge of +1'
        },
        {
          type: 'multiple_choice',
          question: 'Where are electrons located in an atom?',
          points: 10,
          options: ['In the nucleus', 'Around the nucleus', 'In neutrons', 'In protons'],
          correctAnswer: 1,
          explanation: 'Electrons orbit around the nucleus in electron shells'
        },
        {
          type: 'true_false',
          question: 'Atoms are the smallest particles that cannot be divided.',
          points: 10,
          correctAnswer: false,
          explanation: 'Atoms can be divided into protons, neutrons, and electrons'
        }
      ]
    }
  ]
};

async function seed() {
  try {
    console.log('🌱 Starting database seeding...\n');
    console.log('📡 Connecting to MongoDB Atlas...');
    
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
    
    db = mongoose.connection.db;
    User = db.collection('users');
    Course = db.collection('courses');
    Assignment = db.collection('assignments');
    Quiz = db.collection('quizzes');
    
    console.log('✅ Connected to MongoDB Atlas\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Course.deleteMany({});
    await Assignment.deleteMany({});
    await Quiz.deleteMany({});
    console.log('✅ Existing data cleared\n');

    // Create users
    console.log('👥 Creating users...');
    const createdUsers = {};
    
    for (const [key, userData] of Object.entries(sampleData.users)) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const result = await User.insertOne({
        ...userData,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      createdUsers[key] = { _id: result.insertedId, ...userData };
      console.log(`   ✓ Created ${userData.role}: ${userData.email}`);
    }
    console.log(`✅ Created ${Object.keys(createdUsers).length} users\n`);

    // Create courses
    console.log('📚 Creating courses...');
    const createdCourses = [];
    
    for (const courseData of sampleData.courses) {
      const result = await Course.insertOne({
        ...courseData,
        teacher: createdUsers.teacher1._id,
        students: [
          createdUsers.student1._id,
          createdUsers.student2._id,
          createdUsers.student3._id
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const course = { _id: result.insertedId, ...courseData };
      createdCourses.push(course);
      console.log(`   ✓ Created course: ${course.title}`);
    }
    console.log(`✅ Created ${createdCourses.length} courses\n`);

    // Create assignments
    console.log('📝 Creating assignments...');
    const createdAssignments = [];
    
    for (let i = 0; i < sampleData.assignments.length; i++) {
      const assignmentData = sampleData.assignments[i];
      const course = createdCourses[i % createdCourses.length];
      
      const result = await Assignment.insertOne({
        ...assignmentData,
        course: course._id,
        teacher: createdUsers.teacher1._id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const assignment = { _id: result.insertedId, ...assignmentData };
      createdAssignments.push(assignment);
      console.log(`   ✓ Created assignment: ${assignment.title}`);
    }
    console.log(`✅ Created ${createdAssignments.length} assignments\n`);

    // Create quizzes
    console.log('🎯 Creating quizzes...');
    const createdQuizzes = [];
    
    for (let i = 0; i < sampleData.quizzes.length; i++) {
      const quizData = sampleData.quizzes[i];
      const course = createdCourses[i % createdCourses.length];
      
      const result = await Quiz.insertOne({
        ...quizData,
        course: course._id,
        teacher: createdUsers.teacher1._id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      const quiz = { _id: result.insertedId, ...quizData };
      createdQuizzes.push(quiz);
      console.log(`   ✓ Created quiz: ${quiz.title}`);
    }
    console.log(`✅ Created ${createdQuizzes.length} quizzes\n`);

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 DATABASE SEEDING COMPLETE!\n');
    console.log('📊 Summary:');
    console.log(`   • Users: ${Object.keys(createdUsers).length}`);
    console.log(`   • Courses: ${createdCourses.length}`);
    console.log(`   • Assignments: ${createdAssignments.length}`);
    console.log(`   • Quizzes: ${createdQuizzes.length}\n`);
    
    console.log('🔐 Login Credentials:\n');
    console.log('   Admin:');
    console.log('   📧 Email: admin@banglalms.com');
    console.log('   🔑 Password: admin123\n');
    
    console.log('   Teacher:');
    console.log('   📧 Email: teacher1@banglalms.com');
    console.log('   🔑 Password: teacher123\n');
    
    console.log('   Student:');
    console.log('   📧 Email: student1@banglalms.com');
    console.log('   🔑 Password: student123\n');
    
    console.log('   (More accounts available - check seed.js)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('✅ You can now start your application!');
    console.log('🚀 Run: npm run dev');
    console.log('🌐 Visit: http://localhost:3000\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
  }
}

// Run seeding
seed();

