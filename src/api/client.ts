import type {
  User,
  UserWithRole,
  Company,
  Declaration,
  DeclarationGroup,
  Certificate,
  Task,
  Document,
  Folder,
  Client,
  Partnership,
  Request,
  Notification,
  AdminStats,
  DashboardStats,
  ApiResponse,
  PaginatedResponse,
  DeclarationFilters,
  CertificateFilters,
  TaskFilters,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Auth endpoints
  auth = {
    login: (email: string, password: string) =>
      this.request<ApiResponse<{ user: UserWithRole; token: string }>>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    register: (data: {
      email: string;
      password: string;
      fullName: string;
      phone: string;
      activityType: 'declarant' | 'certification';
    }) =>
      this.request<ApiResponse<{ user: User; token: string }>>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    logout: () =>
      this.request<ApiResponse<null>>('/auth/logout', {
        method: 'POST',
      }),

    me: () =>
      this.request<ApiResponse<UserWithRole>>('/auth/me'),

    forgotPassword: (email: string) =>
      this.request<ApiResponse<null>>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    resetPassword: (token: string, password: string) =>
      this.request<ApiResponse<null>>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      }),

    adminLogin: (login: string, password: string, code: string) =>
      this.request<ApiResponse<{ token: string }>>('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ login, password, code }),
      }),
  };

  // Company endpoints
  companies = {
    register: (name: string, inn: string) =>
      this.request<ApiResponse<Company>>('/companies/register', {
        method: 'POST',
        body: JSON.stringify({ name, inn }),
      }),

    join: (inn: string) =>
      this.request<ApiResponse<Company>>('/companies/join', {
        method: 'POST',
        body: JSON.stringify({ inn }),
      }),

    findByInn: (inn: string) =>
      this.request<ApiResponse<Company | null>>(`/companies/find?inn=${inn}`),

    getById: (id: string) =>
      this.request<ApiResponse<Company>>(`/companies/${id}`),

    getAll: (page = 1, pageSize = 20) =>
      this.request<PaginatedResponse<Company>>(`/companies?page=${page}&pageSize=${pageSize}`),

    block: (id: string) =>
      this.request<ApiResponse<Company>>(`/companies/${id}/block`, {
        method: 'POST',
      }),

    unblock: (id: string) =>
      this.request<ApiResponse<Company>>(`/companies/${id}/unblock`, {
        method: 'POST',
      }),

    delete: (id: string) =>
      this.request<ApiResponse<null>>(`/companies/${id}`, {
        method: 'DELETE',
      }),

    sendMessage: (id: string, message: string) =>
      this.request<ApiResponse<null>>(`/companies/${id}/message`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
  };

  // Users endpoints
  users = {
    getById: (id: string) =>
      this.request<ApiResponse<UserWithRole>>(`/users/${id}`),

    getByCompany: (companyId: string) =>
      this.request<ApiResponse<UserWithRole[]>>(`/users/company/${companyId}`),

    getAll: (page = 1, pageSize = 20) =>
      this.request<PaginatedResponse<UserWithRole>>(`/users?page=${page}&pageSize=${pageSize}`),

    update: (id: string, data: Partial<User>) =>
      this.request<ApiResponse<User>>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    updateAvatar: (id: string, file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return fetch(`${this.baseUrl}/users/${id}/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        body: formData,
      }).then((res) => res.json()) as Promise<ApiResponse<{ avatarUrl: string }>>;
    },

    block: (id: string) =>
      this.request<ApiResponse<User>>(`/users/${id}/block`, {
        method: 'POST',
      }),

    unblock: (id: string) =>
      this.request<ApiResponse<User>>(`/users/${id}/unblock`, {
        method: 'POST',
      }),

    remove: (id: string, reassignToId: string) =>
      this.request<ApiResponse<null>>(`/users/${id}/remove`, {
        method: 'POST',
        body: JSON.stringify({ reassignToId }),
      }),

    assignRole: (id: string, role: 'director' | 'senior' | 'employee') =>
      this.request<ApiResponse<UserWithRole>>(`/users/${id}/role`, {
        method: 'POST',
        body: JSON.stringify({ role }),
      }),

    sendMessage: (id: string, message: string) =>
      this.request<ApiResponse<null>>(`/users/${id}/message`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
  };

  // Declarations endpoints
  declarations = {
    create: (data: Omit<Declaration, 'id' | 'formattedNumber' | 'createdAt' | 'updatedAt'>) =>
      this.request<ApiResponse<Declaration>>('/declarations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<Declaration>) =>
      this.request<ApiResponse<Declaration>>(`/declarations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      this.request<ApiResponse<null>>(`/declarations/${id}`, {
        method: 'DELETE',
      }),

    getById: (id: string) =>
      this.request<ApiResponse<Declaration>>(`/declarations/${id}`),

    getAll: (filters: DeclarationFilters, page = 1, pageSize = 20) =>
      this.request<PaginatedResponse<Declaration>>(
        `/declarations?${new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
          ...filters,
        } as Record<string, string>).toString()}`
      ),

    redirect: (id: string, toUserId: string) =>
      this.request<ApiResponse<Declaration>>(`/declarations/${id}/redirect`, {
        method: 'POST',
        body: JSON.stringify({ toUserId }),
      }),

    createGroup: (name: string, declarationIds: string[]) =>
      this.request<ApiResponse<DeclarationGroup>>('/declarations/groups', {
        method: 'POST',
        body: JSON.stringify({ name, declarationIds }),
      }),

    addToGroup: (groupId: string, declarationIds: string[]) =>
      this.request<ApiResponse<DeclarationGroup>>(`/declarations/groups/${groupId}/add`, {
        method: 'POST',
        body: JSON.stringify({ declarationIds }),
      }),

    removeFromGroup: (groupId: string, declarationIds: string[]) =>
      this.request<ApiResponse<DeclarationGroup>>(`/declarations/groups/${groupId}/remove`, {
        method: 'POST',
        body: JSON.stringify({ declarationIds }),
      }),

    getGroups: () =>
      this.request<ApiResponse<DeclarationGroup[]>>('/declarations/groups'),
  };

  // Certificates endpoints
  certificates = {
    create: (data: Omit<Certificate, 'id' | 'sentDate' | 'actions' | 'createdAt' | 'updatedAt'>) =>
      this.request<ApiResponse<Certificate>>('/certificates', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<Certificate>) =>
      this.request<ApiResponse<Certificate>>(`/certificates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      this.request<ApiResponse<null>>(`/certificates/${id}`, {
        method: 'DELETE',
      }),

    getById: (id: string) =>
      this.request<ApiResponse<Certificate>>(`/certificates/${id}`),

    getAll: (filters: CertificateFilters, page = 1, pageSize = 20) =>
      this.request<PaginatedResponse<Certificate>>(
        `/certificates?${new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
          ...filters,
        } as Record<string, string>).toString()}`
      ),

    redirect: (id: string, toUserId: string) =>
      this.request<ApiResponse<Certificate>>(`/certificates/${id}/redirect`, {
        method: 'POST',
        body: JSON.stringify({ toUserId }),
      }),

    updateStatus: (id: string, status: Certificate['status'], note?: string, fileIds?: string[]) =>
      this.request<ApiResponse<Certificate>>(`/certificates/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status, note, fileIds }),
      }),

    fillNumber: (id: string, number: string) =>
      this.request<ApiResponse<Certificate>>(`/certificates/${id}/number`, {
        method: 'POST',
        body: JSON.stringify({ number }),
      }),

    confirmPayment: (id: string) =>
      this.request<ApiResponse<Certificate>>(`/certificates/${id}/confirm-payment`, {
        method: 'POST',
      }),

    confirmReview: (id: string) =>
      this.request<ApiResponse<Certificate>>(`/certificates/${id}/confirm-review`, {
        method: 'POST',
      }),

    attachPaymentFiles: (id: string, fileIds: string[]) =>
      this.request<ApiResponse<Certificate>>(`/certificates/${id}/attach-payment`, {
        method: 'POST',
        body: JSON.stringify({ fileIds }),
      }),
  };

  // Tasks endpoints
  tasks = {
    create: (data: Omit<Task, 'id' | 'statusHistory' | 'createdAt' | 'updatedAt'>) =>
      this.request<ApiResponse<Task>>('/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<Task>) =>
      this.request<ApiResponse<Task>>(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      this.request<ApiResponse<null>>(`/tasks/${id}`, {
        method: 'DELETE',
      }),

    getById: (id: string) =>
      this.request<ApiResponse<Task>>(`/tasks/${id}`),

    getAll: (filters: TaskFilters, page = 1, pageSize = 20) =>
      this.request<PaginatedResponse<Task>>(
        `/tasks?${new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
          ...filters,
        } as Record<string, string>).toString()}`
      ),

    updateStatus: (id: string, status: Task['status']) =>
      this.request<ApiResponse<Task>>(`/tasks/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      }),
  };

  // Documents endpoints
  documents = {
    upload: (file: File, folderId?: string, clientId?: string) => {
      const formData = new FormData();
      formData.append('file', file);
      if (folderId) formData.append('folderId', folderId);
      if (clientId) formData.append('clientId', clientId);
      return fetch(`${this.baseUrl}/documents/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        body: formData,
      }).then((res) => res.json()) as Promise<ApiResponse<Document>>;
    },

    delete: (id: string) =>
      this.request<ApiResponse<null>>(`/documents/${id}`, {
        method: 'DELETE',
      }),

    getById: (id: string) =>
      this.request<ApiResponse<Document>>(`/documents/${id}`),

    getAll: (folderId?: string, clientId?: string, ownerId?: string) =>
      this.request<ApiResponse<Document[]>>(
        `/documents?${new URLSearchParams({
          ...(folderId && { folderId }),
          ...(clientId && { clientId }),
          ...(ownerId && { ownerId }),
        }).toString()}`
      ),

    createFolder: (data: { name: string; parentId?: string; accessType: 'private' | 'public' | 'selected'; accessUserIds?: string[]; clientId?: string }) =>
      this.request<ApiResponse<Folder>>('/documents/folders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateFolder: (id: string, data: Partial<Folder>) =>
      this.request<ApiResponse<Folder>>(`/documents/folders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    deleteFolder: (id: string) =>
      this.request<ApiResponse<null>>(`/documents/folders/${id}`, {
        method: 'DELETE',
      }),

    getFolders: (parentId?: string) =>
      this.request<ApiResponse<Folder[]>>(
        `/documents/folders?${parentId ? `parentId=${parentId}` : ''}`
      ),
  };

  // Clients endpoints
  clients = {
    create: (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) =>
      this.request<ApiResponse<Client>>('/clients', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<Client>) =>
      this.request<ApiResponse<Client>>(`/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      this.request<ApiResponse<null>>(`/clients/${id}`, {
        method: 'DELETE',
      }),

    getById: (id: string) =>
      this.request<ApiResponse<Client>>(`/clients/${id}`),

    getAll: (search?: string) =>
      this.request<ApiResponse<Client[]>>(
        `/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`
      ),
  };

  // Partnerships endpoints
  partnerships = {
    request: (targetCompanyInn: string, note?: string) =>
      this.request<ApiResponse<Partnership>>('/partnerships/request', {
        method: 'POST',
        body: JSON.stringify({ targetCompanyInn, note }),
      }),

    accept: (id: string) =>
      this.request<ApiResponse<Partnership>>(`/partnerships/${id}/accept`, {
        method: 'POST',
      }),

    reject: (id: string) =>
      this.request<ApiResponse<Partnership>>(`/partnerships/${id}/reject`, {
        method: 'POST',
      }),

    remove: (id: string) =>
      this.request<ApiResponse<null>>(`/partnerships/${id}`, {
        method: 'DELETE',
      }),

    getAll: () =>
      this.request<ApiResponse<Partnership[]>>('/partnerships'),
  };

  // Requests endpoints
  requests = {
    getAll: () =>
      this.request<ApiResponse<Request[]>>('/requests'),

    accept: (id: string) =>
      this.request<ApiResponse<Request>>(`/requests/${id}/accept`, {
        method: 'POST',
      }),

    reject: (id: string) =>
      this.request<ApiResponse<Request>>(`/requests/${id}/reject`, {
        method: 'POST',
      }),
  };

  // Notifications endpoints
  notifications = {
    getAll: () =>
      this.request<ApiResponse<Notification[]>>('/notifications'),

    markAsRead: (id: string) =>
      this.request<ApiResponse<Notification>>(`/notifications/${id}/read`, {
        method: 'POST',
      }),

    markAllAsRead: () =>
      this.request<ApiResponse<null>>('/notifications/read-all', {
        method: 'POST',
      }),
  };

  // Dashboard endpoints
  dashboard = {
    getStats: (period?: { from: string; to: string }, employeeId?: string) =>
      this.request<ApiResponse<DashboardStats>>(
        `/dashboard/stats?${new URLSearchParams({
          ...(period && { from: period.from, to: period.to }),
          ...(employeeId && { employeeId }),
        }).toString()}`
      ),

    getRecentDeclarations: (limit = 10) =>
      this.request<ApiResponse<Declaration[]>>(`/dashboard/recent-declarations?limit=${limit}`),

    getRecentCertificates: (limit = 10) =>
      this.request<ApiResponse<Certificate[]>>(`/dashboard/recent-certificates?limit=${limit}`),
  };

  // Admin endpoints
  admin = {
    getStats: () =>
      this.request<ApiResponse<AdminStats>>('/admin/stats'),

    getRequests: () =>
      this.request<ApiResponse<Request[]>>('/admin/requests'),

    sendMessage: (userId: string, message: string) =>
      this.request<ApiResponse<null>>('/admin/message', {
        method: 'POST',
        body: JSON.stringify({ userId, message }),
      }),
  };

  // Settings endpoints
  settings = {
    updateProfile: (data: { fullName?: string; email?: string; phone?: string }) =>
      this.request<ApiResponse<User>>('/settings/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    changePassword: (oldPassword: string, newPassword: string) =>
      this.request<ApiResponse<null>>('/settings/password', {
        method: 'PUT',
        body: JSON.stringify({ oldPassword, newPassword }),
      }),

    verifyTelegramCode: (code: string) =>
      this.request<ApiResponse<null>>('/settings/verify-telegram', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
  };
}

export const api = new ApiClient(API_BASE_URL);
