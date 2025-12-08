import { Student } from './types';

/**
 * Format a number as currency in Brazilian Real (R$)
 */
export const formatCurrency = (value: number): string => {
  return `R$ ${value.toFixed(2)}`;
};

/**
 * Format date from YYYY-MM-DD to DD/MM/YYYY
 */
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

/**
 * Get today's date in YYYY-MM-DD format
 */
export const getToday = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Filter students by search query (name, code, or grade)
 */
export const filterStudents = (
  students: Student[],
  searchQuery: string,
  options: {
    includeInactive?: boolean;
    isStaffOnly?: boolean;
    isStudentOnly?: boolean;
  } = {}
): Student[] => {
  const { includeInactive = false, isStaffOnly = false, isStudentOnly = false } = options;
  
  return students.filter(s => {
    // Filter by active status
    if (!includeInactive && s.isActive === false) return false;
    
    // Filter by staff/student type
    if (isStaffOnly && !s.isStaff) return false;
    if (isStudentOnly && s.isStaff) return false;
    
    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesName = s.name.toLowerCase().includes(q);
      const matchesCode = s.code?.toLowerCase().includes(q);
      const matchesGrade = s.grade.toLowerCase().includes(q);
      return matchesName || matchesCode || matchesGrade;
    }
    
    return true;
  });
};

/**
 * Toggle an item in a Set (add if not present, remove if present)
 */
export const toggleSetItem = <T>(set: Set<T>, item: T): Set<T> => {
  const newSet = new Set(set);
  if (newSet.has(item)) {
    newSet.delete(item);
  } else {
    newSet.add(item);
  }
  return newSet;
};

/**
 * Generate a random password (6 uppercase alphanumeric characters)
 * Uses crypto.getRandomValues for secure random generation
 */
export const generateRandomPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const array = new Uint8Array(6);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
};

/**
 * Safe date parser that handles invalid dates
 */
export const safeDate = (dateInput: Date | string): Date => {
  const d = new Date(dateInput);
  return isNaN(d.getTime()) ? new Date() : d;
};
