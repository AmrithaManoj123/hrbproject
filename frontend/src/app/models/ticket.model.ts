import { User } from './user.model';

export interface TicketListItem {
  id: number;
  title: string;
  status: string;
  priority?: string;
  categoryName?: string;
  assignedAgentName?: string;
  customerName: string;
  customerEmail: string;
  aiPredictedCategory?: string;
  aiConfidenceScore?: number;
  requiresAgentReview: boolean;
  createdAt: string;
  slaDueAt?: string;
}

export interface TicketDetail {
  id: number;
  title: string;
  description: string;
  status: string;
  priority?: string;
  category?: { id: number; name: string };
  createdBy: User;
  assignedAgent?: User;
  assignedTeam?: { id: number; name: string };
  aiPredictedCategory?: string;
  aiPredictedPriority?: string;
  aiConfidenceScore?: number;
  aiPriorityConfidenceScore?: number;
  requiresAgentReview?: boolean;
  slaDueAt?: string;
  createdAt: string;
  updatedAt: string;
  comments: TicketComment[];
  attachments: TicketAttachment[];
  history: TicketHistory[];
}

export interface TicketComment {
  id: number;
  authorName: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
}

export interface TicketAttachment {
  id: number;
  fileName: string;
  fileSize: number;
  downloadUrl: string;
}

export interface TicketHistory {
  fieldName: string;
  oldValue?: string;
  newValue?: string;
  changedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
