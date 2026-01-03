import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiFileText, FiFile, FiVideo, FiPlus, FiX, FiEdit2, FiTrash2, FiArrowLeft } from 'react-icons/fi';

interface FileItem {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'video';
  url: string;
  uploadedAt: string; // ISO
}

const iconByType: Record<FileItem['type'], JSX.Element> = {
  pdf: <FiFileText className="text-red-600" />,
  docx: <FiFile className="text-blue-600" />,
  video: <FiVideo className="text-purple-600" />
};

const CourseFilesPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  // Mock course name
  const courseTitle = useMemo(() => {
    const titles: Record<string, string> = {
      '1': 'Kỹ năng chăm sóc người cao tuổi',
      '2': 'Xử lý tình huống khẩn cấp',
      '3': 'Giao tiếp với người cao tuổi'
    };
    return titles[courseId || ''] || `Khoá học #${courseId}`;
  }, [courseId]);

  // Mock initial files per course
  const initialFiles: FileItem[] = useMemo(() => {
    const now = Date.now();
    if (courseId === '2') {
      return [
        { id: 'f3', name: 'Guideline sơ cứu', type: 'pdf', url: '#', uploadedAt: new Date(now - 86400000).toISOString() },
        { id: 'f4', name: 'Video minh hoạ', type: 'video', url: '#', uploadedAt: new Date(now - 3600000).toISOString() }
      ];
    }
    return [
      { id: 'f1', name: 'Tài liệu tổng quan', type: 'pdf', url: '#', uploadedAt: new Date(now - 86400000 * 2).toISOString() },
      { id: 'f2', name: 'Slide đào tạo', type: 'docx', url: '#', uploadedAt: new Date(now - 7200000).toISOString() }
    ];
  }, [courseId]);

  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<FileItem | null>(null);
  const [form, setForm] = useState<{ name: string; type: FileItem['type']; url: string }>(
    () => ({ name: '', type: 'pdf', url: '' })
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', type: 'pdf', url: '' });
    setIsFormOpen(true);
  };

  const openEdit = (item: FileItem) => {
    setEditing(item);
    setForm({ name: item.name, type: item.type, url: item.url });
    setIsFormOpen(true);
  };

  const closeForm = () => setIsFormOpen(false);

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editing) {
      setFiles(prev => prev.map(f => f.id === editing.id ? { ...f, name: form.name.trim(), type: form.type, url: form.url.trim() } : f));
    } else {
      const newFile: FileItem = {
        id: `${Date.now()}`,
        name: form.name.trim(),
        type: form.type,
        url: form.url.trim() || '#',
        uploadedAt: new Date().toISOString()
      };
      setFiles(prev => [newFile, ...prev]);
    }
    setIsFormOpen(false);
  };

  const confirmDelete = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xoá tài liệu này?')) {
      setFiles(prev => prev.filter(f => f.id !== id));
    }
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    const p = (n: number) => `${n}`.padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tài liệu: {courseTitle}</h1>
          <p className="text-gray-600">Quản lý tài liệu theo khoá học</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="inline-flex items-center px-3 py-2 border rounded-lg hover:bg-gray-50">
            <FiArrowLeft className="mr-2" /> Quay lại
          </button>
          <button onClick={openAdd} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <FiPlus className="mr-2" /> Thêm file
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {files.map(file => (
          <div key={file.id} className="bg-white rounded-lg shadow p-5 hover:shadow-lg transition">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                  {iconByType[file.type]}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{file.name}</h3>
                  <p className="text-sm text-gray-500">Loại: {file.type.toUpperCase()} • Upload: {formatDateTime(file.uploadedAt)}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <a href={file.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
                Xem
              </a>
              <button onClick={() => openEdit(file)} className="inline-flex items-center px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50">
                <FiEdit2 className="mr-2" /> Sửa
              </button>
              <button onClick={() => confirmDelete(file.id)} className="inline-flex items-center px-3 py-2 rounded-md border border-red-300 text-red-600 hover:bg-red-50">
                <FiTrash2 className="mr-2" /> Xoá
              </button>
            </div>
          </div>
        ))}

        {files.length === 0 && (
          <div className="col-span-full bg-white rounded-lg shadow p-8 text-center text-gray-600">
            Chưa có tài liệu nào.
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Chỉnh sửa file' : 'Thêm file'}</h2>
              <button onClick={closeForm} className="p-2 rounded hover:bg-gray-100">
                <FiX />
              </button>
            </div>

            <form onSubmit={submitForm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên file</label>
                <input
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập tên file"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại file</label>
                <select
                  value={form.type}
                  onChange={e => setForm(prev => ({ ...prev, type: e.target.value as FileItem['type'] }))}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pdf">PDF</option>
                  <option value="docx">DOCX</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <input
                  value={form.url}
                  onChange={e => setForm(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeForm} className="px-4 py-2 rounded-lg border hover:bg-gray-50">Huỷ</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                  {editing ? 'Lưu thay đổi' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseFilesPage;
