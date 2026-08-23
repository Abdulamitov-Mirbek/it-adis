// Public API client for frontend sections
export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDesc?: string;
  duration: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';
  price: number;
  isActive: boolean;
  isFeatured: boolean;
  order: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  program: string;
  courseId?: string;
}

export interface Stats {
  students: number;
  employed: number;
  courses: number;
  years: number;
}

export interface Review {
  id: number;
  name: string;
  role: string;
  initials: string;
  color: string;
  stars: number;
  text: string;
  course: string;
}

export interface Teacher {
  id: number;
  name: string;
  role: string;
  bio: string;
  tags: string[];
  initials: string;
  color: string;
}

const API_BASE_URL = '/api'; // Use Next.js API routes

class API {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<T>;
  }

  async getCourses(): Promise<Course[]> {
    return this.request<Course[]>('/courses');
  }

  async submitApplication(application: Application): Promise<{ success: boolean; message: string }> {
    return this.request('/applications', {
      method: 'POST',
      body: JSON.stringify(application),
    });
  }

  async getStats(): Promise<Stats> {
    return this.request<Stats>('/public/stats');
  }

  async getReviews(): Promise<Review[]> {
    return this.request<Review[]>('/public/reviews');
  }

  async getTeachers(): Promise<Teacher[]> {
    return this.request<Teacher[]>('/public/teachers');
  }
}

export const api = new API();