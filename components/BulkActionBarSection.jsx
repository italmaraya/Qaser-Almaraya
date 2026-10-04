'use client';
import React from 'react';

export default function BulkActionBar({ selectedIds, handleBulkDelete, handleBulkToggleActive, clearSelection, btnStyle }) {
  if (!selectedIds || selectedIds.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#e0f2fe', padding: '10px 16px', borderRadius: 8, marginBottom: 16 }}>
      <span>تم تحديد <strong>{selectedIds.length}</strong> باقة</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" style={btnStyle('danger')} onClick={handleBulkDelete}>حذف المحدد</button>
        <button type="button" style={btnStyle('ghost')} onClick={() => handleBulkToggleActive(false)}>إخفاء المحدد</button>
        <button type="button" style={btnStyle('ghost')} onClick={() => handleBulkToggleActive(true)}>إظهار المحدد</button>
        <button type="button" style={btnStyle('ghost')} onClick={clearSelection}>إلغاء</button>
      </div>
    </div>
  );
}
