import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SavedExamsMap, SavedExamItem } from '../types';
import { TrashIcon, DownloadIcon, EyeIcon, InboxIcon, InfoIcon, XIcon } from './Icons';
import { SavedListSkeleton } from './Skeleton';

type DeleteTarget =
  | { type: 'item'; id: string; name: string }
  | { type: 'folder'; folderIds: string[]; name: string; isFiltered?: boolean; totalCount?: number }
  | { type: 'batch'; count: number };

interface SavedTabProps {
  savedExams: SavedExamsMap;
  selectedIds: Set<string>;
  isLoading?: boolean;
  isExporting?: boolean;
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
  onViewItem: (examId: string) => void;
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

const isPeItem = (item: SavedExamItem): boolean => {
  const ds = item.dataset;
  const category = item.examCategory || ds?.examCategory;
  if (category === 'PE' || category === 'FE') return category === 'PE';

  const typeStr = (item.examType || ds?.examType || '').toUpperCase();
  if (typeStr.includes('PE') || ['PE', 'PE1', 'PE2', 'B5PE'].includes(typeStr)) return true;
  if (typeStr.includes('FE') || typeStr === 'FE') return false;

  const titleStr = (item.title || ds?.title || '').toUpperCase();
  if (titleStr.includes('_PE_') || titleStr.includes('_PE') || titleStr.includes('PRACTICAL')) return true;
  if (titleStr.includes('_FE_') || titleStr.includes('_FE')) return false;

  const totalQ = item.totalQuestions ?? ds?.totalQuestions ?? ds?.questions?.length ?? 0;
  if (totalQ === 0) return true;

  return false;
};

export const SavedTab: React.FC<SavedTabProps> = ({
  savedExams,
  selectedIds,
  isLoading,
  isExporting,
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
  onDeleteFolder,
  onViewItem
}) => {
  // Folder expanded state: default is empty Set (all collapsed)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [inspectItem, setInspectItem] = useState<SavedExamItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DeleteTarget | null>(null);

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
      {/* Sticky Top Toolbar */}
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
            onClick={() => setPendingDelete({ type: 'batch', count: selectedCount })}
          >
            <TrashIcon size={13} />
          </button>

          <button
            type="button"
            className="fus-ctrl-btn"
            disabled={isExporting}
            style={isExporting ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            title={isExporting ? 'Export in progress...' : `Download ${selectedCount} selected items`}
            onClick={onBatchDownload}
          >
            <DownloadIcon size={13} />
          </button>
        </div>
      </div>

      {/* Scrollable Tree View List */}
      <div className="fus-saved-list" role="tree">
        {isLoading ? (
          <SavedListSkeleton rows={4} />
        ) : savedList.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--fus-text-dim)', fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <InboxIcon size={24} />
            <span>No saved exams in local cache</span>
          </div>
        ) : groupedFolders.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--fus-text-dim)', fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <InboxIcon size={24} />
            <span>No matching exams found</span>
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
                      title={searchQuery.trim() ? `Delete ${folderIds.length} search results in ${group.subjectCode}` : `Delete entire ${group.subjectCode} folder`}
                      onClick={() => {
                        const totalSubjectItems = savedList.filter(i => (i.subjectCode || 'UNASSIGNED').toUpperCase() === group.subjectCode).length;
                        const isFiltered = searchQuery.trim().length > 0 && folderIds.length < totalSubjectItems;
                        setPendingDelete({ type: 'folder', folderIds, name: group.subjectCode, isFiltered, totalCount: totalSubjectItems });
                      }}
                    >
                      <TrashIcon size={12} />
                    </button>

                    <button
                      type="button"
                      className="fus-ctrl-btn"
                      disabled={isExporting}
                      style={isExporting ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                      title={isExporting ? 'Export in progress...' : `Download all in ${group.subjectCode}`}
                      onClick={() => onExportFolder(folderIds)}
                    >
                      <DownloadIcon size={12} />
                    </button>
                  </div>
                </div>

                {/* Child Exam Rows (Rendered when expanded) */}
                {isExpanded && (
                  <div className="fus-folder-children" role="group">
                    {group.items.map((item) => {
                      const isSelected = selectedIds.has(item.id);
                      const termStr = item.term || item.termCode || 'N/A';
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
                            {typeStr !== 'PE' && <span className="fus-badge fus-badge-campus" title="Exam Type">{typeStr}</span>}
                            {item.examCategory === 'PE' && <span className="fus-badge fus-badge-subject" style={{ background: 'rgba(236,72,153,0.15)', color: '#ec4899', borderColor: 'rgba(236,72,153,0.3)' }} title="Practical Exam">PE</span>}
                            <span className="fus-saved-code" title={item.title}>{item.title}</span>
                            {item.isPartial && <span className="fus-badge-partial" title="Partial fetch">Partial</span>}
                          </div>

                          <div className="fus-row-actions">
                            {/* Inspect Info Button */}
                            <button
                              type="button"
                              className="fus-ctrl-btn"
                              title="View dataset metadata details"
                              onClick={() => setInspectItem(item)}
                            >
                              <InfoIcon size={12} />
                            </button>

                            {/* View Item Button */}
                            <button
                              type="button"
                              className="fus-ctrl-btn fus-btn-view"
                              title="View exam questions"
                              onClick={() => onViewItem(item.id)}
                            >
                              <EyeIcon size={12} />
                            </button>

                            {/* Delete Item */}
                            <button
                              type="button"
                              className="fus-ctrl-btn fus-btn-danger-icon"
                              title="Delete item"
                              onClick={() => setPendingDelete({ type: 'item', id: item.id, name: item.title })}
                            >
                              <TrashIcon size={12} />
                            </button>

                            {/* Export Item */}
                            <button
                              type="button"
                              className="fus-ctrl-btn"
                              disabled={isExporting}
                              style={isExporting ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                              title={isExporting ? 'Export in progress...' : 'Export item'}
                              onClick={() => onExportItem(item.id)}
                            >
                              <DownloadIcon size={12} />
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

      {/* Metadata Inspector Modal */}
      {inspectItem && (() => {
        const isPe = isPeItem(inspectItem);
        const pdfLink = inspectItem.pdfUrl || inspectItem.dataset?.pdfUrl || (inspectItem.id && inspectItem.id !== 'unknown' ? `/api/exams/pdf?productId=${inspectItem.id}` : null);
        const zipLink = inspectItem.zipUrl || inspectItem.dataset?.zipUrl;

        return (
          <div className="fus-modal-overlay" onClick={() => setInspectItem(null)}>
            <div className="fus-modal-content fus-inspect-modal" onClick={(e) => e.stopPropagation()}>
              <div className="fus-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <InfoIcon size={16} />
                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--fus-modal-text)' }}>Dataset Metadata Inspector</span>
                </div>
                <button type="button" className="fus-ctrl-btn" onClick={() => setInspectItem(null)}>
                  <XIcon size={13} />
                </button>
              </div>

              <div className="fus-modal-body" style={{ maxHeight: '380px', overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Core Attributes */}
                <table className="fus-metadata-table" style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr><td style={{ width: '120px' }}>Subject Code:</td><td><strong style={{ color: 'var(--fus-modal-accent)' }}>{inspectItem.subjectCode || 'N/A'}</strong></td></tr>
                    <tr><td>Title:</td><td style={{ wordBreak: 'break-all', color: 'var(--fus-modal-text)' }}>{inspectItem.title || inspectItem.id}</td></tr>
                    <tr><td>Product ID:</td><td><code style={{ fontSize: '11px', background: 'var(--fus-modal-code-bg)', padding: '2px 6px', borderRadius: '4px', color: 'var(--fus-modal-text-muted)' }}>{inspectItem.id}</code></td></tr>
                    <tr><td>Category:</td><td><span className="fus-badge" style={{ background: isPe ? 'rgba(236,72,153,0.2)' : 'rgba(59,130,246,0.2)', color: isPe ? '#ec4899' : '#60a5fa', borderColor: isPe ? 'rgba(236,72,153,0.4)' : 'rgba(59,130,246,0.4)' }}>{isPe ? 'PE' : 'FE'}</span></td></tr>
                    <tr><td>Term & Type:</td><td style={{ color: 'var(--fus-modal-text)' }}>{inspectItem.term || 'N/A'} · {inspectItem.examType || 'FE'}</td></tr>
                    <tr><td>Campus:</td><td style={{ color: 'var(--fus-modal-text)' }}>{inspectItem.dataset?.campus || inspectItem.campus || 'N/A'}</td></tr>
                    <tr><td>Session Time:</td><td style={{ color: 'var(--fus-modal-text)' }}>{inspectItem.dataset?.examSessionTime || inspectItem.examSessionTime || 'N/A'}</td></tr>
                    <tr><td>Session Date:</td><td style={{ color: 'var(--fus-modal-text)' }}>{inspectItem.dataset?.examSessionDate || inspectItem.examSessionDate || 'N/A'}</td></tr>
                    <tr><td>Saved Date:</td><td style={{ color: 'var(--fus-modal-text)' }}>{inspectItem.extractedAt ? new Date(inspectItem.extractedAt).toLocaleString() : 'N/A'}</td></tr>
                    <tr><td>Total Questions:</td><td style={{ color: 'var(--fus-modal-text)' }}>{inspectItem.totalQuestions ?? inspectItem.dataset?.totalQuestions ?? inspectItem.dataset?.questions?.length ?? 0}</td></tr>
                  </tbody>
                </table>

                {/* Asset & Image Links */}
                {isPe ? (
                  <div style={{ background: 'var(--fus-modal-sub-bg)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--fus-modal-border)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#ec4899', marginBottom: '6px' }}>PRACTICAL EXAM (PE) ASSETS</div>
                    <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div><strong style={{ color: 'var(--fus-modal-text-muted)' }}>PDF Paper:</strong> {pdfLink ? <a href={pdfLink.startsWith('http') ? pdfLink : `https://www.fustation.net${pdfLink.startsWith('/') ? '' : '/'}${pdfLink}`} target="_blank" rel="noreferrer" style={{ color: 'var(--fus-modal-accent)', wordBreak: 'break-all' }}>{pdfLink}</a> : <span style={{ color: '#ef4444' }}>Not Available</span>}</div>
                      <div><strong style={{ color: 'var(--fus-modal-text-muted)' }}>ZIP AnswerKey:</strong> {zipLink ? <a href={zipLink.startsWith('http') ? zipLink : `https://www.fustation.net${zipLink.startsWith('/') ? '' : '/'}${zipLink}`} target="_blank" rel="noreferrer" style={{ color: 'var(--fus-modal-accent)', wordBreak: 'break-all' }}>{zipLink}</a> : <span style={{ color: 'var(--fus-modal-text-muted)' }}>None Attached</span>}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: 'var(--fus-modal-sub-bg)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--fus-modal-border)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#60a5fa', marginBottom: '6px' }}>FE QUESTION IMAGE ATTACHMENTS</div>
                    {(() => {
                      const questions = inspectItem.dataset?.questions || [];
                      const withImages = questions.filter((q) => q.imageUrl);
                      if (withImages.length === 0) {
                        return <div style={{ fontSize: '11px', color: 'var(--fus-modal-text-muted)' }}>No image attachments in this exam set.</div>;
                      }
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '130px', overflowY: 'auto' }}>
                          {withImages.map((q) => (
                            <div key={q.id || q.index} style={{ fontSize: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--fus-modal-code-bg)', padding: '4px 6px', borderRadius: '4px', gap: '8px' }}>
                              <span style={{ wordBreak: 'break-all', color: 'var(--fus-modal-text)' }}>Q{q.index}: {q.imageUrl}</span>
                              <span style={{ flexShrink: 0, color: q.imageBase64 ? '#34d399' : '#fbbf24', fontSize: '9px', fontWeight: 600 }}>{q.imageBase64 ? 'BASE64' : 'REMOTE'}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Confirmation Modal */}
      {pendingDelete && (
        <div className="fus-modal-overlay" onClick={() => setPendingDelete(null)}>
          <div className="fus-modal-content fus-delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fus-modal-header" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                <TrashIcon size={16} />
                <span style={{ fontWeight: 600, fontSize: '13px' }}>Confirm Permanent Deletion</span>
              </div>
              <button type="button" className="fus-ctrl-btn" onClick={() => setPendingDelete(null)}>
                <XIcon size={13} />
              </button>
            </div>

            <div style={{ padding: '16px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--fus-modal-text)', lineHeight: 1.5 }}>
                {pendingDelete.type === 'item' && `Are you sure you want to delete "${pendingDelete.name}" from your saved exams cache?`}
                {pendingDelete.type === 'folder' && (
                  pendingDelete.isFiltered
                    ? `Are you sure you want to delete the ${pendingDelete.folderIds.length} search-matching exam(s) in "${pendingDelete.name}"? (${(pendingDelete.totalCount || 0) - pendingDelete.folderIds.length} hidden exams will be kept)`
                    : `Are you sure you want to delete the entire subject folder "${pendingDelete.name}" (${pendingDelete.folderIds.length} exams)?`
                )}
                {pendingDelete.type === 'batch' && `Are you sure you want to delete all ${pendingDelete.count} selected saved exams?`}
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: 'var(--fus-modal-text-muted)' }}>
                This action cannot be undone.
              </p>
            </div>

            <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--fus-modal-border)', background: 'var(--fus-modal-sub-bg)' }}>
              <button type="button" className="fus-btn-secondary" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => setPendingDelete(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="fus-btn-danger"
                style={{ padding: '4px 12px', fontSize: '12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => {
                  if (pendingDelete.type === 'item') onDeleteItem(pendingDelete.id);
                  else if (pendingDelete.type === 'folder') onDeleteFolder(pendingDelete.folderIds);
                  else if (pendingDelete.type === 'batch') onBatchDelete();
                  setPendingDelete(null);
                }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
