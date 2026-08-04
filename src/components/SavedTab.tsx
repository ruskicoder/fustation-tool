import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SavedExamsMap, SavedExamItem } from '../types';

interface SavedTabProps {
  savedExams: SavedExamsMap;
  selectedIds: Set<string>;
  onToggleSelect: (examId: string) => void;
  onToggleFolder: (subjectCode: string, folderExamIds: string[]) => void;
  onSelectAll: (allFilteredIds: string[]) => void;
  onBatchDelete: () => void;
  onBatchDownload: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onDeleteItem: (examId: string) => void;
  onExportItem: (examId: string) => void;
  onExportFolder: (folderExamIds: string[]) => void;
  onDeleteFolder: (folderExamIds: string[]) => void;
}

const IndeterminateCheckbox: React.FC<{
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  title?: string;
}> = ({ checked, indeterminate, onChange, title }) => {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = !!indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      type="checkbox"
      ref={ref}
      checked={checked}
      aria-checked={indeterminate ? 'mixed' : checked}
      onChange={onChange}
      title={title}
      className="fus-checkbox"
    />
  );
};

export const SavedTab: React.FC<SavedTabProps> = ({
  savedExams,
  selectedIds,
  onToggleSelect,
  onToggleFolder,
  onSelectAll,
  onBatchDelete,
  onBatchDownload,
  searchQuery,
  onSearchChange,
  onDeleteItem,
  onExportItem,
  onExportFolder,
  onDeleteFolder
}) => {
  // Folder expanded state: default is empty Set (all collapsed)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const savedList: SavedExamItem[] = useMemo(() => Object.values(savedExams || {}), [savedExams]);

  // Filtered by search query
  const filteredList = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return savedList;
    return savedList.filter((item) => {
      const codeMatch = (item.subjectCode || '').toLowerCase().includes(q);
      const titleMatch = (item.title || '').toLowerCase().includes(q);
      const idMatch = (item.id || '').toLowerCase().includes(q);
      return codeMatch || titleMatch || idMatch;
    });
  }, [savedList, searchQuery]);

  // All IDs in filtered search list
  const allFilteredIds = useMemo(() => filteredList.map((item) => item.id), [filteredList]);

  // Grouped by Subject Code sorted alphabetically
  const groupedFolders = useMemo(() => {
    const groups: Record<string, SavedExamItem[]> = {};
    filteredList.forEach((item) => {
      const code = (item.subjectCode || 'UNASSIGNED').toUpperCase();
      if (!groups[code]) groups[code] = [];
      groups[code].push(item);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b));
    return sortedKeys.map((key) => ({
      subjectCode: key,
      items: groups[key]
    }));
  }, [filteredList]);

  // Master selection status
  const isAllSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.has(id));
  const isPartialSelected = !isAllSelected && allFilteredIds.some((id) => selectedIds.has(id));
  const selectedCount = selectedIds.size;

  const toggleFolderExpand = (subjectCode: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(subjectCode)) {
        next.delete(subjectCode);
      } else {
        next.add(subjectCode);
      }
      return next;
    });
  };

  return (
    <div className="fus-saved-wrapper">
      {/* Sticky Redesigned Top Toolbar (ISSUE-36B) */}
      <div className="fus-saved-header-sticky">
        <div className="fus-toolbar-left">
          <IndeterminateCheckbox
            checked={isAllSelected}
            indeterminate={isPartialSelected}
            onChange={() => onSelectAll(allFilteredIds)}
            title="Select all exams"
          />
          <span className="fus-selection-count">
            {selectedCount > 0 ? `${selectedCount} sel` : `${savedList.length}`}
          </span>
        </div>

        {/* Live Search Input */}
        <div className="fus-search-wrapper">
          <input
            type="text"
            className="fus-saved-search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Batch Action Buttons (Revealed when selectedCount > 0) */}
        <div className={`fus-batch-actions ${selectedCount > 0 ? 'visible' : ''}`}>
          <button
            type="button"
            className="fus-ctrl-btn fus-btn-danger-icon"
            title={`Delete ${selectedCount} selected items`}
            onClick={onBatchDelete}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>

          <button
            type="button"
            className="fus-ctrl-btn"
            title={`Download ${selectedCount} selected items`}
            onClick={onBatchDownload}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable Tree View List (ISSUE-33, ISSUE-34) */}
      <div className="fus-saved-list" role="tree">
        {savedList.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--fus-text-dim)', fontSize: '12px' }}>
            No saved exams in local cache
          </div>
        ) : groupedFolders.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--fus-text-dim)', fontSize: '12px' }}>
            No matching exams found
          </div>
        ) : (
          groupedFolders.map((group) => {
            const folderIds = group.items.map((i) => i.id);
            const isFolderAllSelected = folderIds.length > 0 && folderIds.every((id) => selectedIds.has(id));
            const isFolderPartialSelected = !isFolderAllSelected && folderIds.some((id) => selectedIds.has(id));
            const isExpanded = expandedFolders.has(group.subjectCode);

            return (
              <div key={group.subjectCode} className="fus-folder-group">
                {/* Folder Parent Row */}
                <div
                  className="fus-folder-row"
                  role="treeitem"
                  aria-expanded={isExpanded}
                  aria-checked={isFolderAllSelected ? 'true' : isFolderPartialSelected ? 'mixed' : 'false'}
                >
                  <div className="fus-row-left">
                    <IndeterminateCheckbox
                      checked={isFolderAllSelected}
                      indeterminate={isFolderPartialSelected}
                      onChange={() => onToggleFolder(group.subjectCode, folderIds)}
                      title={`Select all items in ${group.subjectCode}`}
                    />
                    <button
                      type="button"
                      className="fus-folder-toggle-btn"
                      onClick={() => toggleFolderExpand(group.subjectCode)}
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${group.subjectCode}`}
                    >
                      <span className="fus-disclosure">{isExpanded ? '▼' : '▶'}</span>
                      <span className="fus-badge fus-badge-subject">{group.subjectCode}</span>
                      <span className="fus-folder-count">({group.items.length})</span>
                    </button>
                  </div>

                  <div className="fus-row-actions">
                    <button
                      type="button"
                      className="fus-ctrl-btn fus-btn-danger-icon"
                      title={`Delete entire ${group.subjectCode} folder`}
                      onClick={() => onDeleteFolder(folderIds)}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="fus-ctrl-btn"
                      title={`Download all in ${group.subjectCode}`}
                      onClick={() => onExportFolder(folderIds)}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Child Exam Rows (Rendered when expanded) */}
                {isExpanded && (
                  <div className="fus-folder-children" role="group">
                    {group.items.map((item) => {
                      const isSelected = selectedIds.has(item.id);
                      const termStr = item.term || item.termCode || 'SP26';
                      const typeStr = item.examType || 'FE';

                      return (
                        <div
                          key={item.id}
                          className={`fus-child-row ${isSelected ? 'selected' : ''}`}
                          role="treeitem"
                          aria-checked={isSelected}
                        >
                          <div className="fus-row-left">
                            <input
                              type="checkbox"
                              className="fus-checkbox"
                              checked={isSelected}
                              onChange={() => onToggleSelect(item.id)}
                            />
                            <span className="fus-badge fus-badge-type" title="Term">{termStr}</span>
                            <span className="fus-badge fus-badge-campus" title="Exam Type">{typeStr}</span>
                            <span className="fus-saved-code" title={item.title}>{item.title}</span>
                            {item.isPartial && <span className="fus-badge-partial" title="Partial fetch">Partial</span>}
                          </div>

                          <div className="fus-row-actions">
                            {/* Placeholder View Button (Disabled) */}
                            <button
                              type="button"
                              className="fus-ctrl-btn fus-btn-view-placeholder"
                              disabled
                              title="View questions (placeholder)"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>

                            {/* Delete Item */}
                            <button
                              type="button"
                              className="fus-ctrl-btn fus-btn-danger-icon"
                              title="Delete item"
                              onClick={() => onDeleteItem(item.id)}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>

                            {/* Export Item */}
                            <button
                              type="button"
                              className="fus-ctrl-btn"
                              title="Export item"
                              onClick={() => onExportItem(item.id)}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
