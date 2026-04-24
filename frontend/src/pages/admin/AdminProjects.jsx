import { useEffect, useState } from 'react';
import api, { fileUpload } from '../../api/axios';
import AdminLayout from '../../components/AdminLayout';
import toast from 'react-hot-toast';

const EMPTY = { title: '', description: '', status: 'ongoing', goal_amount: '', location: '', order: '0', is_published: true, start_date: '', end_date: '' };

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [imgFile, setImgFile] = useState(null);

  const fetch = () => {
    api.get('/api/projects').then(r => setProjects(r.data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []);

  const openNew = () => { setEditing(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...p, goal_amount: String(p.goal_amount || ''), order: String(p.order), start_date: p.start_date || '', end_date: p.end_date || '' }); setShowModal(true); };

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, order: parseInt(form.order), goal_amount: form.goal_amount ? parseFloat(form.goal_amount) : null };
      let projectId;
      if (editing) {
        await api.put(`/api/projects/${editing.id}`, payload);
        projectId = editing.id;
        toast.success('Updated');
      } else {
        const { data } = await api.post('/api/projects', payload);
        projectId = data.project.id;
        toast.success('Created');
      }
      if (imgFile) {
        const fd = new FormData(); fd.append('file', imgFile);
        await fileUpload(`/api/projects/${projectId}/image`, fd);
        setImgFile(null);
      }
      setShowModal(false); fetch();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const deleteProject = async (id) => {
    if (!confirm('Delete project?')) return;
    await api.delete(`/api/projects/${id}`);
    toast.success('Deleted'); fetch();
  };

  return (
    <AdminLayout title="Projects">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <p className="text-muted mb-0">{projects.length} projects</p>
        <button className="btn btn-gold" onClick={openNew}><i className="bi bi-plus-circle me-1" />New Project</button>
      </div>

      {loading ? <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--gold)' }} /></div> : (
        <div className="row g-3">
          {projects.map(p => (
            <div key={p.id} className="col-md-6 col-lg-4">
              <div className="ministry-card p-3 h-100">
                {p.image_url && <img src={`/uploads/${p.image_url}`} className="w-100 rounded mb-2" style={{ height: '120px', objectFit: 'cover' }} alt="" />}
                <div className="d-flex gap-2 mb-2">
                  <span className={`badge bg-${p.status === 'completed' ? 'success' : p.status === 'planning' ? 'warning text-dark' : 'primary'}`}>{p.status}</span>
                  {!p.is_published && <span className="badge bg-secondary">Hidden</span>}
                </div>
                <h6 className="fw-bold">{p.title}</h6>
                {p.location && <p className="small text-muted mb-1"><i className="bi bi-geo-alt me-1" />{p.location}</p>}
                {p.goal_amount && <p className="small text-muted mb-2">Goal: ${p.goal_amount?.toLocaleString()}</p>}
                <div className="d-flex gap-1 mt-2">
                  <button className="btn btn-outline-secondary btn-sm" onClick={() => openEdit(p)}><i className="bi bi-pencil" /></button>
                  <button className="btn btn-outline-danger btn-sm" onClick={() => deleteProject(p.id)}><i className="bi bi-trash" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">{editing ? 'Edit Project' : 'New Project'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={save}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Title *</label>
                    <input className="form-control" required value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Description</label>
                    <textarea className="form-control" rows={3} value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Status</label>
                      <select className="form-select" value={form.status} onChange={e => setForm(p=>({...p,status:e.target.value}))}>
                        {['planning','ongoing','completed'].map(s=><option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Goal Amount ($)</label>
                      <input type="number" className="form-control" min="0" step="0.01" value={form.goal_amount} onChange={e => setForm(p=>({...p,goal_amount:e.target.value}))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Location</label>
                      <input className="form-control" value={form.location} onChange={e => setForm(p=>({...p,location:e.target.value}))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Start Date</label>
                      <input type="date" className="form-control" value={form.start_date} onChange={e => setForm(p=>({...p,start_date:e.target.value}))} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">End Date</label>
                      <input type="date" className="form-control" value={form.end_date} onChange={e => setForm(p=>({...p,end_date:e.target.value}))} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Project Image</label>
                    <input type="file" accept="image/*" className="form-control" onChange={e => setImgFile(e.target.files[0])} />
                  </div>
                  <div className="form-check">
                    <input type="checkbox" className="form-check-input" id="pub" checked={form.is_published} onChange={e => setForm(p=>({...p,is_published:e.target.checked}))} />
                    <label className="form-check-label" htmlFor="pub">Published (visible on site)</label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-gold" disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update' : 'Create')}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
