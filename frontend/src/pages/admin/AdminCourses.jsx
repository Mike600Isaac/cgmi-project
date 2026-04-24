import { useEffect, useState } from 'react';
import api, { fileUpload } from '../../api/axios';
import AdminLayout from '../../components/AdminLayout';
import toast from 'react-hot-toast';

const EMPTY_COURSE = { title: '', description: '', category: 'convert', price: '0', is_free: true, is_published: false, requires_approval: false, order: '0' };
const CATEGORIES = ['convert', 'missionary', 'discipleship', 'other'];

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_COURSE);
  const [saving, setSaving] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [lessonForm, setLessonForm] = useState({ title: '', description: '', content_type: 'video', order: '0', is_preview: false });
  const [lessonFile, setLessonFile] = useState(null);
  const [addingLesson, setAddingLesson] = useState(false);

  const fetchCourses = () => {
    api.get('/api/courses').then(r => setCourses(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCourses(); }, []);

  const openNew = () => { setEditing(null); setForm(EMPTY_COURSE); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...c, price: String(c.price), order: String(c.order) }); setShowModal(true); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, price: parseFloat(form.price), order: parseInt(form.order) };
      if (editing) {
        await api.put(`/api/courses/admin/${editing.id}`, payload);
        toast.success('Course updated');
      } else {
        await api.post('/api/courses/admin', payload);
        toast.success('Course created');
      }
      setShowModal(false);
      fetchCourses();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const deleteCourse = async (id) => {
    if (!confirm('Delete this course and all its lessons?')) return;
    await api.delete(`/api/courses/admin/${id}`);
    toast.success('Deleted');
    fetchCourses();
  };

  const openLessons = async (course) => {
    setSelectedCourse(course);
    const { data } = await api.get(`/api/courses/${course.id}`);
    setLessons(data.lessons || []);
  };

  const addLesson = async (e) => {
    e.preventDefault();
    setAddingLesson(true);
    try {
      if (lessonFile) {
        const fd = new FormData();
        Object.entries(lessonForm).forEach(([k, v]) => fd.append(k, v));
        fd.append('file', lessonFile);
        await fileUpload(`/api/courses/admin/${selectedCourse.id}/lessons`, fd);
      } else {
        await api.post(`/api/courses/admin/${selectedCourse.id}/lessons`, { ...lessonForm, order: parseInt(lessonForm.order) });
      }
      toast.success('Lesson added');
      const { data } = await api.get(`/api/courses/${selectedCourse.id}`);
      setLessons(data.lessons || []);
      setLessonForm({ title: '', description: '', content_type: 'video', order: '0', is_preview: false });
      setLessonFile(null);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setAddingLesson(false); }
  };

  const deleteLesson = async (lid) => {
    await api.delete(`/api/courses/admin/lessons/${lid}`);
    toast.success('Lesson deleted');
    setLessons(prev => prev.filter(l => l.id !== lid));
  };

  return (
    <AdminLayout title="Courses">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <p className="text-muted mb-0">{courses.length} courses</p>
        <button className="btn btn-gold" onClick={openNew}><i className="bi bi-plus-circle me-1" />New Course</button>
      </div>

      {loading ? <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--gold)' }} /></div> : (
        <div className="row g-3">
          {courses.map(c => (
            <div key={c.id} className="col-md-6 col-lg-4">
              <div className="ministry-card p-3 h-100">
                {c.thumbnail && <img src={`/uploads/${c.thumbnail}`} className="w-100 rounded mb-2" style={{ height: '140px', objectFit: 'cover' }} alt="" />}
                <div className="d-flex gap-2 mb-2 flex-wrap">
                  <span className="badge bg-secondary text-capitalize">{c.category}</span>
                  <span className={`badge ${c.is_published ? 'bg-success' : 'bg-warning text-dark'}`}>{c.is_published ? 'Published' : 'Draft'}</span>
                  <span className={`badge ${c.is_free ? 'bg-info text-dark' : 'bg-primary'}`}>{c.is_free ? 'Free' : `$${c.price}`}</span>
                </div>
                <h6 className="fw-bold mb-1">{c.title}</h6>
                <p className="text-muted small mb-3">{c.lesson_count} lessons · {c.enrollment_count} enrolled</p>
                <div className="d-flex gap-1 flex-wrap">
                  <button className="btn btn-outline-primary btn-sm" onClick={() => openLessons(c)}>
                    <i className="bi bi-list-ul me-1" />Lessons
                  </button>
                  <button className="btn btn-outline-secondary btn-sm" onClick={() => openEdit(c)}>
                    <i className="bi bi-pencil" />
                  </button>
                  <button className="btn btn-outline-danger btn-sm" onClick={() => deleteCourse(c.id)}>
                    <i className="bi bi-trash" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course form modal */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">{editing ? 'Edit Course' : 'New Course'}</h5>
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
                      <label className="form-label fw-semibold">Category</label>
                      <select className="form-select" value={form.category} onChange={e => setForm(p=>({...p,category:e.target.value}))}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Price ($)</label>
                      <input type="number" className="form-control" min="0" step="0.01" value={form.price} onChange={e => setForm(p=>({...p,price:e.target.value}))} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Order</label>
                      <input type="number" className="form-control" min="0" value={form.order} onChange={e => setForm(p=>({...p,order:e.target.value}))} />
                    </div>
                  </div>
                  <div className="d-flex gap-4 flex-wrap">
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" id="is_free" checked={form.is_free} onChange={e => setForm(p=>({...p,is_free:e.target.checked}))} />
                      <label className="form-check-label" htmlFor="is_free">Free Course</label>
                    </div>
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" id="is_pub" checked={form.is_published} onChange={e => setForm(p=>({...p,is_published:e.target.checked}))} />
                      <label className="form-check-label" htmlFor="is_pub">Published</label>
                    </div>
                    <div className="form-check">
                      <input type="checkbox" className="form-check-input" id="req_app" checked={form.requires_approval} onChange={e => setForm(p=>({...p,requires_approval:e.target.checked}))} />
                      <label className="form-check-label" htmlFor="req_app">Requires Approval</label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-gold" disabled={saving}>
                    {saving ? 'Saving...' : (editing ? 'Update Course' : 'Create Course')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Lessons panel */}
      {selectedCourse && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Lessons — {selectedCourse.title}</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedCourse(null)} />
              </div>
              <div className="modal-body">
                <div className="row g-4">
                  {/* Lesson list */}
                  <div className="col-md-7">
                    <h6 className="fw-bold mb-3">Current Lessons ({lessons.length})</h6>
                    {lessons.length === 0 && <p className="text-muted">No lessons yet.</p>}
                    <div className="list-group">
                      {lessons.map((l, i) => (
                        <div key={l.id} className="list-group-item d-flex align-items-center gap-3">
                          <span className="badge bg-secondary">{i+1}</span>
                          <div className="flex-grow-1">
                            <p className="fw-bold mb-0">{l.title}</p>
                            <small className="text-muted text-capitalize">{l.content_type}</small>
                          </div>
                          {l.is_preview && <span className="badge bg-info text-dark">Preview</span>}
                          <button className="btn btn-outline-danger btn-sm" onClick={() => deleteLesson(l.id)}>
                            <i className="bi bi-trash" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add lesson */}
                  <div className="col-md-5">
                    <h6 className="fw-bold mb-3">Add Lesson</h6>
                    <form onSubmit={addLesson}>
                      <div className="mb-2">
                        <label className="form-label small fw-semibold">Title *</label>
                        <input className="form-control form-control-sm" required value={lessonForm.title}
                          onChange={e => setLessonForm(p=>({...p,title:e.target.value}))} />
                      </div>
                      <div className="mb-2">
                        <label className="form-label small fw-semibold">Description</label>
                        <textarea className="form-control form-control-sm" rows={2} value={lessonForm.description}
                          onChange={e => setLessonForm(p=>({...p,description:e.target.value}))} />
                      </div>
                      <div className="row g-2 mb-2">
                        <div className="col-6">
                          <label className="form-label small fw-semibold">Content Type</label>
                          <select className="form-select form-select-sm" value={lessonForm.content_type}
                            onChange={e => setLessonForm(p=>({...p,content_type:e.target.value}))}>
                            {['video','audio','image','pdf','word','txt','text'].map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="col-6">
                          <label className="form-label small fw-semibold">Order</label>
                          <input type="number" className="form-control form-control-sm" min="0" value={lessonForm.order}
                            onChange={e => setLessonForm(p=>({...p,order:e.target.value}))} />
                        </div>
                      </div>
                      {lessonForm.content_type === 'text' ? (
                        <div className="mb-2">
                          <label className="form-label small fw-semibold">Content Text</label>
                          <textarea className="form-control form-control-sm" rows={4}
                            onChange={e => setLessonForm(p=>({...p,content_text:e.target.value}))} />
                        </div>
                      ) : (
                        <div className="mb-2">
                          <label className="form-label small fw-semibold">Upload File</label>
                          <input type="file" className="form-control form-control-sm"
                            onChange={e => setLessonFile(e.target.files[0])} />
                        </div>
                      )}
                      <div className="form-check mb-3">
                        <input type="checkbox" className="form-check-input" id="preview"
                          checked={lessonForm.is_preview} onChange={e => setLessonForm(p=>({...p,is_preview:e.target.checked}))} />
                        <label className="form-check-label small" htmlFor="preview">Free Preview Lesson</label>
                      </div>
                      <button type="submit" className="btn btn-gold btn-sm w-100" disabled={addingLesson}>
                        {addingLesson ? 'Adding...' : 'Add Lesson'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
