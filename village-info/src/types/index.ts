export type UserRole = 'SuperAdmin' | 'Admin' | 'WardAdmin';
export type UserStatus = 'Active' | 'Inactive' | 'Blocked';
export type Gender = 'Male' | 'Female' | 'Other';
export type OtpStatus = 'Pending' | 'Verified' | 'Expired';
export type ImportMode = 'InsertOnly' | 'Upsert';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  mobile: string;
  role: UserRole;
  status: UserStatus;
  assignedWards?: Ward[];
  permissions: string[];
  createdAt: string;
}

export interface Ward {
  id: string;
  wardNumber: string;
  wardNameHindi: string;
  wardNameEnglish: string;
  descriptionHindi?: string;
  descriptionEnglish?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
  voterCount?: number;
}

export interface Voter {
  id: string;
  epicNumber: string;
  fullNameHindi: string;
  fullNameEnglish: string;
  fatherHusbandNameHindi?: string;
  fatherHusbandNameEnglish?: string;
  gender: Gender;
  dateOfBirth?: string;
  age?: number;
  mobileNumber?: string;
  houseNumber?: string;
  addressHindi?: string;
  addressEnglish?: string;
  wardId: string;
  ward?: Ward;
  boothNumber?: string;
  boothName?: string;
  serialNumber?: string;
  area?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

export interface InterestOption {
  id: string;
  nameHindi: string;
  nameEnglish: string;
  imageUrl?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface PublicSubmission {
  id: string;
  interestOptionId: string;
  interestOption?: InterestOption;
  mobileNumber?: string;
  maskedMobile?: string;
  isOtpVerified: boolean;
  otpVerifiedAt?: string;
  sessionId: string;
  language: string;
  source: string;
  ipAddress?: string;
  status: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  ipAddress?: string;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface DashboardStats {
  totalWards: number;
  totalAdmins: number;
  totalWardAdmins: number;
  totalVoters: number;
  activeVoters: number;
  inactiveVoters: number;
  maleVoters: number;
  femaleVoters: number;
  otherVoters: number;
  wardWiseCount: { wardName: string; count: number }[];
  boothWiseCount: { boothName: string; count: number }[];
  recentImports: ImportSummary[];
  totalSubmissions: number;
  verifiedSubmissions: number;
}

export interface ImportSummary {
  id: string;
  fileName: string;
  totalRows: number;
  inserted: number;
  updated: number;
  duplicates: number;
  invalid: number;
  failed: number;
  importedAt: string;
  importedBy: string;
}

export interface VoterFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  wardId?: string;
  boothNumber?: string;
  gender?: string;
  status?: string;
  minAge?: number;
  maxAge?: number;
  sortBy?: string;
  sortDesc?: boolean;
}

export interface ContentItem {
  id: string;
  key: string;
  valueHindi: string;
  valueEnglish: string;
  type: 'text' | 'image' | 'html';
  updatedAt: string;
}

export interface GalleryImage {
  id: string;
  titleHindi: string;
  titleEnglish: string;
  imageUrl: string;
  displayOrder: number;
  isActive: boolean;
}
