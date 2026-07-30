export interface Notification {
  id: string;
  userId: string;
  title?: string;
  message?: string;
  type?: string;
  read?: boolean;
  isRead?: boolean;
  createdAt: string;
}

