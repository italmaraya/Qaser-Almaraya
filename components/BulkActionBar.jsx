'use client';
import React from 'react';

// Dashboard → الباقات: the bar that appears once packages are ticked.
export default function BulkActionBar({ selectedIds, handleBulkDelete, handleBulkToggleActive, clearSelection, btnStyle }) {
  const count = (selectedIds || []).length;
  if (!count) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', background: '#e0f2fe', border: '1px solid #bae1f2', padding: '10px 16px', borderRadius: 10, marginBottom: 12 }}>
      <span style={{ fontSize: 13.5 }}>تم تحديد <strong>{count}</strong> باقة</span>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" style={btnStyle('ghost')} onClick={() => handleBulkToggleActive(false)}>🚫 إخفاء المحدد</button>
        <button type="button" style={btnStyle('ghost')} onClick={() => handleBulkToggleActive(true)}>👁 إظهار المحدد</button>
        <button type="button" style={btnStyle('danger')} onClick={handleBulkDelete}>حذف المحدد نهائياً</button>
        <button type="button" style={btnStyle('ghost')} onClick={clearSelection}>إلغاء التحديد</button>
      </div>
    </div>
  );
}
