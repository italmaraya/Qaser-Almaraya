import { useState } from 'react';

export function usePackagesBulk(packages, api, load) {
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = (filteredPkgs) => {
    if (selectedIds.length === filteredPkgs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPkgs.map(p => p.id));
    }
  };

  async function handleBulkDelete() {
    if (!selectedIds.length || !confirm(`هل أنت متأكد من حذف ${selectedIds.length} باقة؟`)) return;
    try {
      await Promise.all(selectedIds.map(id => api(`/api/admin/packages/${id}`, { method: 'DELETE' })));
      setSelectedIds([]);
      load();
      alert('تم الحذف بنجاح!');
    } catch (e) {
      alert('حدث خطأ أثناء الحذف: ' + e.message);
    }
  }

  async function handleBulkToggleActive(activeState) {
    if (!selectedIds.length) return;
    try {
      await Promise.all(selectedIds.map(id => {
        const pkg = (packages || []).find(p => p.id === id);
        return pkg ? api(`/api/admin/packages/${id}`, { method: 'PUT', body: JSON.stringify({ ...pkg, active: activeState }) }) : Promise.resolve();
      }));
      setSelectedIds([]);
      load();
      alert('تم التحديث بنجاح!');
    } catch (e) {
      alert('حدث خطأ أثناء التحديث: ' + e.message);
    }
  }

  return {
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    handleBulkDelete,
    handleBulkToggleActive,
    clearSelection: () => setSelectedIds([])
  };
}
