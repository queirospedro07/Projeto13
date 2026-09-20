export type UserRole = 'USER' | 'CREATOR' | 'MODERATOR' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  xp: number;
  level: number;
  streakDays: number;
  dailyGoalMinutes: number;
  minutesToday: number;
  totalMinutes?: number;
  profile?: {
    headline?: string;
    website?: string;
    github?: string;
    twitter?: string;
    linkedin?: string;
    isPublic?: boolean;
    showStreak?: boolean;
    showLeaderboard?: boolean;
    themePreference?: string;
  };
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  thumbnailUrl?: string;
  bannerUrl?: string;
  price: number;
  isFree: boolean;
  featured: boolean;
  durationHours: number;
  language: string;
  creator: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
    bio?: string;
  };
  space?: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
  };
  studentsCount?: number;
  reviewsCount?: number;
  averageRating?: number;
  isEnrolled?: boolean;
  userProgress?: number;
  modules?: CourseModule[];
  resources?: Resource[];
  reviews?: Review[];
  userEnrollment?: Enrollment;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  type: 'video' | 'text' | 'quiz' | 'assignment';
  content?: string;
  videoUrl?: string;
  durationMin: number;
  orderIndex: number;
  xpReward: number;
  quiz?: {
    id: string;
    title: string;
    xpReward: number;
  };
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  progressPercent: number;
  isCompleted: boolean;
  completedAt?: string;
  enrolledAt: string;
  lessonProgresses?: LessonProgress[];
  course?: Course;
}

export interface LessonProgress {
  id: string;
  enrollmentId: string;
  lessonId: string;
  isCompleted: boolean;
  completedAt?: string;
}

export type QuizQuestionType = 'single' | 'multiple' | 'find-incorrect' | 'true-false' | 'open-ended';

export interface QuizOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface QuizQuestion {
  id: string;
  quizId?: string;
  question: string;
  type: QuizQuestionType | string;
  orderIndex?: number;
  explanation?: string;
  points?: number;
  options: QuizOption[];
  // Open-ended / essay question fields
  gradingMode?: 'auto' | 'teacher';
  expectedAnswer?: string;
  keywords?: string[];
  minWords?: number;
}

export interface Quiz {
  id: string;
  lessonId?: string;
  title: string;
  description?: string;
  passingScore: number;
  xpReward: number;
  questions: QuizQuestion[];
  attempts?: {
    id: string;
    score: number;
    passed: boolean;
    xpEarned: number;
    createdAt: string;
  }[];
}

export interface Space {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description: string;
  bannerUrl?: string;
  logoUrl?: string;
  category: string;
  owner: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
    bio?: string;
  };
  membersCount: number;
  coursesCount: number;
  channelsCount: number;
  isMember: boolean;
  userRole?: string;
  channels?: Channel[];
  events?: SpaceEvent[];
  courses?: Course[];
  members?: {
    id: string;
    role: string;
    user: User;
  }[];
}

export interface Channel {
  id: string;
  spaceId: string;
  name: string;
  topic?: string;
  type: 'text' | 'voice' | 'announcement' | 'resources';
  orderIndex: number;
}

export interface Message {
  id: string;
  channelId?: string;
  senderId: string;
  sender: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
    role: string;
  };
  recipientId?: string;
  content: string;
  isPinned: boolean;
  replyTo?: {
    id?: string;
    content?: string;
    sender?: { id: string; name?: string; username: string };
  };
  attachmentUrl?: string;
  attachmentType?: string;
  createdAt: string;
  reactions?: {
    id?: string;
    emoji: string;
    userId?: string;
    user?: { id: string; username: string };
    count?: number;
  }[];
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  xpReward: number;
  category: string;
  isUnlocked?: boolean;
  unlockedAt?: string;
}

export interface Review {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

export interface SpaceEvent {
  id: string;
  spaceId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  hostName: string;
  _count?: { participants: number };
}

export interface Resource {
  id: string;
  title: string;
  description?: string;
  url: string;
  type: 'pdf' | 'zip' | 'code' | 'link' | 'doc';
  sizeBytes?: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'message' | 'mention' | 'achievement' | 'course_update' | 'event';
  title: string;
  content: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}
