import React from 'react';
import { SetItemProps } from './types';

const SetItem: React.FC<SetItemProps> = ({
  name,
  index,
  type,
  isEditing,
  editValue,
  isDragging,
  totalItems,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onMove,
  onDragStart,
  onEditValueChange
}) => {
  return (
    <div 
      className={`set-item ${isDragging ? 'dragging' : ''}`}
      draggable={!isEditing}
      onDragStart={() => onDragStart(type, index)}
    >
      {isEditing ? (
        <div className="edit-form">
          <input
            type="text"
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            className="edit-input"
          />
          <div className="edit-actions">
            <button 
              onClick={() => onSave(name, editValue)}
              className="save-button-small"
            >
              ✓
            </button>
            <button 
              onClick={onCancel}
              className="cancel-button-small"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <div className="set-display">
          <div className="drag-handle" title="Drag to reorder">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="12" height="2" rx="1"/>
              <rect x="6" y="8" width="12" height="2" rx="1"/>
              <rect x="6" y="12" width="12" height="2" rx="1"/>
              <rect x="6" y="16" width="12" height="2" rx="1"/>
            </svg>
          </div>
          <span className="set-name">{name}</span>
          <div className="set-actions">
            <div className="arrow-controls">
              <button 
                onClick={() => onMove(type, index, 'up')}
                className="arrow-button"
                disabled={index === 0}
                title="Move up one position"
              >
                ▲
              </button>
              <button 
                onClick={() => onMove(type, index, 'down')}
                className="arrow-button"
                disabled={index === totalItems - 1}
                title="Move down one position"
              >
                ▼
              </button>
            </div>
            <button 
              onClick={() => onEdit(name)}
              className="edit-button-small"
            >
              ✏️
            </button>
            <button 
              onClick={() => onDelete(name)}
              className="delete-button-small"
            >
              🗑️
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SetItem;