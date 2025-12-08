import { useState } from 'react';

/**
 * Custom hook for managing selection state (checkboxes, multi-select)
 */
export const useSelection = <T extends string = string>() => {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set());

  const toggleSelection = (id: T) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = (allIds: T[]) => {
    if (selectedIds.size === allIds.length && allIds.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const isSelected = (id: T): boolean => {
    return selectedIds.has(id);
  };

  const isAllSelected = (allIds: T[]): boolean => {
    return selectedIds.size === allIds.length && allIds.length > 0;
  };

  return {
    selectedIds,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    isSelected,
    isAllSelected,
    setSelectedIds
  };
};

/**
 * Custom hook for managing modal state
 */
export const useModal = <T = any>() => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const open = (modalData?: T) => {
    if (modalData !== undefined) {
      setData(modalData);
    }
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    // Don't clear data immediately to allow for exit animations
  };

  const reset = () => {
    setData(null);
  };

  return {
    isOpen,
    data,
    open,
    close,
    reset,
    setData
  };
};

/**
 * Custom hook for managing search state with debouncing support
 */
export const useSearch = (initialValue: string = '') => {
  const [searchQuery, setSearchQuery] = useState(initialValue);

  const clearSearch = () => {
    setSearchQuery('');
  };

  return {
    searchQuery,
    setSearchQuery,
    clearSearch
  };
};
