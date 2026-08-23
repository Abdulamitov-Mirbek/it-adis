import { 
  LoginResponse, 
  DashboardStats, 
  CoursesResponse, 
  ApplicationsResponse, 
  RecentActivity,
  AdminUser 
} from './types/admin';

const API_BASE_URL = '/api'; // Use Next.js API routes

class AdminAPI {
  private token: string | null = null;

  constructor() {
    // Initialize token from localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('admin_token');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.token = response.access_token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', response.access_token);
      localStorage.setItem('admin_user', JSON.stringify(response.admin));
    }

    return response;
  }

  async logout(): Promise<void> {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    }
  }

  async getProfile(): Promise<AdminUser> {
    return this.request<AdminUser>('/auth/profile');
  }

  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/admin/dashboard');
  }

  async getCourses(page = 1, limit = 10): Promise<CoursesResponse> {
    return this.request<CoursesResponse>(`/admin/courses?page=${page}&limit=${limit}`);
  }

  async getApplications(page = 1, limit = 10, status?: string): Promise<ApplicationsResponse> {
    const statusParam = status ? `&status=${status}` : '';
    return this.request<ApplicationsResponse>(`/admin/applications?page=${page}&limit=${limit}${statusParam}`);
  }

  async getRecentActivity(): Promise<RecentActivity> {
    return this.request<RecentActivity>('/admin/recent-activity');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getStoredUser(): AdminUser | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('admin_user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

export const adminAPI = new AdminAPI();