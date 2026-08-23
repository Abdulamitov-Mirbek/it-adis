export interface AdminUser {
  id: string;
  email: string;
  name: string;
}

export interface LoginResponse {
  access_token: string;
  admin: AdminUser;
}

export interface DashboardStats {
  totalCourses: number;
  totalApplications: number;
  applicationsByStatus: {
    pending: number;
    accepted: number;
    rejected: number;
  };
  acceptanceRate: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  duration: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';
  price: number;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  _count: {
    applications: number;
  };
}

export interface Application {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  program: string;
  status: 'PENDING' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  course?: {
    title: string;
    slug: string;
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface CoursesResponse {
  courses: Course[];
  pagination: Pagination;
}

export interface ApplicationsResponse {
  applications: Application[];
  pagination: Pagination;
}

export interface RecentActivity {
  recentApplications: Array<{
    id: string;
    applicantName: string;
    courseName: string;
    status: Application['status'];
    createdAt: string;
  }>;
}