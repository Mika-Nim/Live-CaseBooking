import { CaseStatus } from '../../types';
import { formatDateTime as formatDateTimeUtil } from '../../utils/dateFormat';
import { CASE_STATUSES } from '../../constants/statuses';
import { USER_ROLES } from '../../constants/permissions';

export const statusOptions: CaseStatus[] = [
  CASE_STATUSES.CASE_BOOKED,
  CASE_STATUSES.ORDER_PREPARATION,
  CASE_STATUSES.ORDER_PREPARED,
  CASE_STATUSES.PENDING_DELIVERY_HOSPITAL,
  CASE_STATUSES.DELIVERED_HOSPITAL,
  CASE_STATUSES.CASE_COMPLETED,
  CASE_STATUSES.PENDING_DELIVERY_OFFICE,
  CASE_STATUSES.DELIVERED_OFFICE,
  CASE_STATUSES.TO_BE_BILLED,
  CASE_STATUSES.CASE_CLOSED,
  CASE_STATUSES.CASE_CANCELLED
];

export const getNextResponsibleRole = (status: CaseStatus): string | null => {
  switch (status) {
    case CASE_STATUSES.CASE_BOOKED:
      return `${USER_ROLES.OPERATIONS} / ${USER_ROLES.OPERATIONS_MANAGER}`;
    case CASE_STATUSES.ORDER_PREPARATION:
      return 'Operations Team';
    case CASE_STATUSES.ORDER_PREPARED:
      return USER_ROLES.DRIVER;
    case CASE_STATUSES.PENDING_DELIVERY_HOSPITAL:
      return USER_ROLES.DRIVER;
    case CASE_STATUSES.DELIVERED_HOSPITAL:
      return 'Sales Team';
    case CASE_STATUSES.CASE_COMPLETED:
      return `${USER_ROLES.SALES} / ${USER_ROLES.DRIVER}`;
    case CASE_STATUSES.PENDING_DELIVERY_OFFICE:
      return `${USER_ROLES.DRIVER} / ${USER_ROLES.SALES}`;
    case CASE_STATUSES.DELIVERED_OFFICE:
      return `${USER_ROLES.ADMIN} / System`;
    case CASE_STATUSES.TO_BE_BILLED:
      return `${USER_ROLES.ADMIN} / System`;
    default:
      return null;
  }
};

export const getTooltipMessage = (requiredRoles: string[], action: string): string => {
  const roleNames = {
    [USER_ROLES.ADMIN]: 'Administrator',
    [USER_ROLES.OPERATIONS]: 'Operations',
    [USER_ROLES.OPERATIONS_MANAGER]: 'Operations Manager', 
    [USER_ROLES.SALES]: 'Sales',
    [USER_ROLES.SALES_MANAGER]: 'Sales Manager',
    [USER_ROLES.DRIVER]: 'Driver'
  };

  const roleList = requiredRoles
    .filter(role => role !== USER_ROLES.ADMIN) // Remove admin from tooltip display
    .map(role => roleNames[role as keyof typeof roleNames] || role)
    .join(' or ');
  
  return roleList ? `Only ${roleList} can ${action.toLowerCase()}` : `${action} available`;
};

export const formatDateTime = (dateTime: string) => {
  return formatDateTimeUtil(dateTime);
};

export const getStatusColor = (status: CaseStatus): string => {
  switch (status) {
    case CASE_STATUSES.CASE_BOOKED: return '#ff9800';
    case CASE_STATUSES.ORDER_PREPARATION: return '#e91e63';
    case CASE_STATUSES.ORDER_PREPARED: return '#9c27b0';
    case CASE_STATUSES.PENDING_DELIVERY_HOSPITAL: return '#4caf50';
    case CASE_STATUSES.DELIVERED_HOSPITAL: return '#00bcd4';
    case CASE_STATUSES.CASE_COMPLETED: return '#8bc34a';
    case CASE_STATUSES.PENDING_DELIVERY_OFFICE: return '#03a9f4';
    case CASE_STATUSES.DELIVERED_OFFICE: return '#607d8b';
    case CASE_STATUSES.TO_BE_BILLED: return '#795548';
    case CASE_STATUSES.CASE_CLOSED: return '#4caf50';
    case CASE_STATUSES.CASE_CANCELLED: return '#f44336';
    default: return '#757575';
  }
};