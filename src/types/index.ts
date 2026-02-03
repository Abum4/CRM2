// User types
export type UserRole = 'admin' | 'director' | 'senior' | 'employee';
export type ActivityType = 'declarant' | 'certification';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  activityType: ActivityType;
  avatarUrl?: string;
  companyId?: string;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithRole extends User {
  role: UserRole;
}

// Company types
export interface Company {
  id: string;
  name: string;
  inn: string;
  activityType: ActivityType;
  isBlocked: boolean;
  directorId?: string;
  createdAt: string;
  updatedAt: string;
}

// Declaration types
export type DeclarationMode = 
  | 'ЭК/10' | 'ЭК/11' | 'ЭК/12' | 'ИМ/40' | 'ИМ/41' | 'ИМ/42' | 'ИМ/51'
  | 'ЭК/51' | 'ЭК/61' | 'ИМ/61' | 'ИМ/70' | 'ИМ/71' | 'ЭК/71' | 'ИМ/72'
  | 'ЭК/72' | 'ИМ/73' | 'ЭК/73' | 'ИМ/74' | 'ЭК/74' | 'ИМ/75' | 'ЭК/75'
  | 'ИМ/76' | 'ТР/80' | 'НД/40' | 'ПР/40' | 'ПЕ/40' | 'ВД/40' | 'ВД/10'
  | 'ВД/74';

export type VehicleType = '10' | '20' | '30' | '40' | '71' | '72' | '80' | '90';

export interface Vehicle {
  number: string;
  type: VehicleType;
}

export interface Declaration {
  id: string;
  postNumber: string; // 5 digits
  date: string;
  declarationNumber: string; // 7 digits
  formattedNumber: string; // e.g., "26001/22.12.2025/0010722"
  clientId: string;
  mode: DeclarationMode;
  vehicles: Vehicle[];
  note?: string;
  attachedDocumentIds: string[];
  attachedFolderIds: string[];
  groupId?: string;
  ownerId: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeclarationGroup {
  id: string;
  name: string;
  declarationIds: string[];
  companyId: string;
  createdAt: string;
}

// Certificate types
export type CertificateStatus = 
  | 'in_progress' 
  | 'awaiting_payment' 
  | 'on_review' 
  | 'completed' 
  | 'rejected';

export interface CertificateAction {
  id: string;
  certificateId: string;
  action: string;
  note?: string;
  attachedFileIds: string[];
  performedBy: string;
  createdAt: string;
}

export interface Certificate {
  id: string;
  certifierCompanyId?: string; // null means "for self"
  type: string;
  deadline: string;
  number?: string;
  numberToBeFilledByCertifier: boolean;
  clientId: string;
  linkedDeclarationIds: string[];
  note?: string;
  attachedDocumentIds: string[];
  attachedFolderIds: string[];
  sentDate: string;
  status: CertificateStatus;
  ownerId: string;
  assignedToId?: string;
  companyId: string;
  // For declarants: certifier company info
  certifierCompanyName?: string;
  certifierName?: string;
  // For certifiers: declarant company info
  declarantCompanyId?: string;
  declarantCompanyName?: string;
  declarantName?: string;
  actions: CertificateAction[];
  createdAt: string;
  updatedAt: string;
}

// Task types
export type TaskPriority = 'urgent' | 'high' | 'normal';
export type TaskStatus = 
  | 'new' 
  | 'in_progress' 
  | 'waiting' 
  | 'on_review' 
  | 'completed' 
  | 'cancelled' 
  | 'frozen';

export interface TaskStatusChange {
  id: string;
  taskId: string;
  fromStatus: TaskStatus;
  toStatus: TaskStatus;
  changedBy: string;
  createdAt: string;
}

export interface Task {
  id: string;
  targetCompanyId: string;
  targetEmployeeId: string;
  name: string;
  note?: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string;
  attachedDocumentIds: string[];
  attachedDeclarationIds: string[];
  attachedCertificateIds: string[];
  createdByUserId: string;
  createdByCompanyId: string;
  statusHistory: TaskStatusChange[];
  createdAt: string;
  updatedAt: string;
}

// Document types
export type AccessType = 'private' | 'public' | 'selected';

export interface Document {
  id: string;
  name: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  folderId?: string;
  clientId?: string;
  ownerId: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  accessType: AccessType;
  accessUserIds: string[];
  clientId?: string;
  ownerId: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

// Client types
export interface Client {
  id: string;
  companyName: string;
  inn: string;
  directorName: string;
  note?: string;
  accessType: AccessType;
  accessUserIds: string[];
  ownerId: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

// Partnership types
export type PartnershipStatus = 'pending' | 'accepted' | 'rejected';

export interface Partnership {
  id: string;
  requestingCompanyId: string;
  targetCompanyId: string;
  note?: string;
  status: PartnershipStatus;
  createdAt: string;
  updatedAt: string;
}

// Request types
export type RequestType = 'company_registration' | 'employee_join' | 'partnership';
export type RequestStatus = 'pending' | 'accepted' | 'rejected';

export interface Request {
  id: string;
  type: RequestType;
  status: RequestStatus;
  userId?: string;
  userName?: string;
  companyId?: string;
  companyName?: string;
  targetCompanyId?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// Admin types
export interface AdminStats {
  totalCompanies: number;
  totalUsers: number;
  activeRequests: number;
  growthData: {
    date: string;
    companies: number;
    users: number;
  }[];
}

// Dashboard types
export interface DashboardStats {
  activeTasks: number;
  completedTasks: number;
  overdueTasks: number;
  sentDeclarations?: number;
  activeCertificates: number;
  completedCertificates: number;
  overdueCertificates: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter types
export interface DeclarationFilters {
  search?: string;
  postNumber?: string;
  dateFrom?: string;
  dateTo?: string;
  declarationNumber?: string;
  clientId?: string;
  mode?: DeclarationMode;
  vehicleNumber?: string;
  vehicleType?: VehicleType;
  ownerId?: string;
  ownerType?: 'mine' | 'all' | 'employee';
}

export interface CertificateFilters {
  search?: string;
  certifierCompanyId?: string;
  number?: string;
  clientId?: string;
  status?: CertificateStatus;
  dateFrom?: string;
  dateTo?: string;
  ownerId?: string;
  ownerType?: 'mine' | 'all' | 'employee';
}

export interface TaskFilters {
  search?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  targetEmployeeId?: string;
  ownerType?: 'mine' | 'all' | 'employee';
}
