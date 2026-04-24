import { useEffect, useState } from 'react';
import api, { fileUpload } from '../../api/axios';
import AdminLayout from '../../components/AdminLayout';
import toast from 'react-hot-toast';

export default function AdminMedia() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [form, setForm] = useState({ title: '', description: '', section: 'messages', allow_download: true, tags: '' });
  const [file, setFile] = useState(null);

  const fetch = () => {
    const params = { page, per_page: 20 };
    if (section) params.section = section;
    api.get('/api/media', { params }).then(r => {
      setItems(r.data.items || []);
      setTotalPages(r.data.pages || 1);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [section, page]);

  const upload = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Please select a file'); return; }
    setUploading(true);
    setProgress(0);
    try {
      const fd = new FormData();
      fd.append('file', file);
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      await fileUpload('/api/media/upload', fd, setProgress);
      toast.success('Media uploaded!');
      setFile(null);
      setForm({ title: '', description: '', section: 'messages', allow_download: true, tags: '' });
      fetch();
    } catch (err) { toast.error(err.response?.data?.error || 'Upload failed'); }
    finally { setUploading(false); setProgress(0); }
  };

  const deleteMedia = async (id) => {
    if (!confirm('Delete this media file?')) return;
    await api.delete(`/api/media/${id}`);
    toast.success('Deleted');
    fetch();
  };

  const togglePublish = async (m) => {
    await api.put(`/api/media/${m.id}`, { is_published: !m.is_published });
    toast.success(m.is_published ? 'Unpublished' : 'Published');
    fetch();
  };

  return (
    <AdminLayout title="Media Manager">
      <div className="row g-4">
        {/* Upload panel */}
        <div className="col-lg-4">
          <div className="ministry-card p-4">
            <h5 className="fw-bold mb-3"><i className="bi bi-upload me-2 text-gold" />Upload Media</h5>
            <form onSubmit={upload}>
              <div className="mb-3">
                <label className="form-label fw-semibold small">File *</label>
                <input type="file" className="form-control" onChange={e => setFile(e.target.files[0])} />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Title</label>
                <input className="form-control" value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} placeholder="Auto-detect if empty" />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Description</label>
                <textarea className="form-control" rows={2} value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Section</label>
                <select className="form-select" value={form.section} onChange={e => setForm(p=>({...p,section:e.target.value}))}>
                  <option value="messages">Media Messages</option>
                  <option value="gallery">Outreach Gallery</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Tags (comma-separated)</label>
                <input className="form-control" value={form.tags} onChange={e => setForm(p=>({...p,tags:e.target.value}))} placeholder="sunday, sermon, revival" />
              </div>
              <div className="form-check mb-3">
                <input type="checkbox" className="form-check-input" id="dl" checked={form.allow_download}
                  onChange={e => setForm(p=>({...p,allow_download:e.target.checked}))} />
                <label className="form-check-label small" htmlFor="dl">Allow Download</label>
              </div>
              {uploading && (
                <div className="mb-3">
                  <div className="progress">
                    <div className="progress-bar bg-warning" style={{ width: `${progress}%` }}>{progress}%</div>
                  </div>
                </div>
              )}
              <button type="submit" className="btn btn-gold w-100" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload File'}
              </button>
            </form>
          </div>
        </div>

        {/* Media list */}
        <div className="col-lg-8">
          <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
            <span className="fw-semibold me-2">Section:</span>
            {[['', 'All'], ['messages', 'Messages'], ['gallery', 'Gallery']].map(([v, l]) => (
              <button key={v} className={`btn btn-sm ${section === v ? 'btn-gold' : 'btn-outline-secondary'}`}
                onClick={() => { setSection(v); setPage(1); }}>{l}</button>
            ))}
          </div>

          {loading ? <div className="text-center py-4"><div className="spinner-border" style={{ color: 'var(--gold)' }} /></div> : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Title</th><th>Type</th><th>Section</th><th>Views</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(m => (
                    <tr key={m.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <i className={`bi bi-${m.media_type === 'video' ? 'play-circle' : m.media_type === 'audio' ? 'music-note-beamed' : m.media_type === 'image' ? 'image' : 'file-earmark-pdf'} text-gold`} />
                          <span className="fw-semibold">{m.title}</span>
                        </div>
                      </td>
                      <td><span className="badge bg-secondary text-capitalize">{m.media_type}</span></td>
                      <td><span className="badge bg-info text-dark">{m.section}</span></td>
                      <td><small>{m.view_count}</small></td>
                      <td>
                        <span className={`badge ${m.is_published ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {m.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-outline-secondary btn-sm" onClick={() => togglePublish(m)} title="Toggle publish">
                            <i className={`bi bi-${m.is_published ? 'eye-slash' : 'eye'}`} />
                          </button>
                          <a href={`/api/media/${m.id}/download`} className="btn btn-outline-primary btn-sm" title="Download">
                            <i className="bi bi-download" />
                          </a>
                          <button className="btn btn-outline-danger btn-sm" onClick={() => deleteMedia(m.id)}>
                            <i className="bi bi-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-sm btn-outline-secondary" disabled={page === 1} onClick={() => setPage(p=>p-1)}>Prev</button>
              <span className="btn btn-sm disabled">Page {page}/{totalPages}</span>
              <button className="btn btn-sm btn-outline-secondary" disabled={page === totalPages} onClick={() => setPage(p=>p+1)}>Next</button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
