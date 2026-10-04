'use client';
import React from 'react';

export default function BulkActionBar({
  selectedCount,
  onDelete,
  onHide,
  onShow,
  onClear,
  btnStyle
}) {
  if (!selectedCount) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justify: 'space-between',
      background: '#e0f2fe',
      padding: '10px 16px',
      borderRadius: 8,
      marginBottom: 16
    }}>
      <span>تم تحديد <strong>{selectedCount}</strong> باقة</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" style={btnStyle('danger')} onClick={onDelete}>
          حذف المحدد
        </button>
        <button type="button" style={btnStyle('ghost')} onClick={onHide}>
          إخفاء المحدد
        </button>
        <button type="button" style={btnStyle('ghost')} onClick={onShow}>
          إظهار المحدد
        </button>
        <button type="button" style={btnStyle('ghost')} onClick={onClear}>
          إلغاء
        </button>
      </div>
    </div>
  );
}
