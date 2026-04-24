import { useEffect, useState } from 'react';
import api, { fileUpload } from '../../api/axios';
import AdminLayout from '../../components/AdminLayout';
import toast from 'react-hot-toast';

const SECTIONS = [
  { key: 'home_hero', label: 'Home Hero Banner', fields: ['title', 'subtitle', 'body', 'image'] },
  { key: 'home_about', label: 'Home About Snippet', fields: ['title', 'body'] },
  { key: 'home_verse', label: 'Home Scripture Verse', fields: ['title', 'body'] },
  { key: 'about_ministry', label: 'About the Ministry', fields: ['title', 'body', 'image'] },
  { key: 'about_evangelist', label: 'About the Evangelist', fields: ['title', 'subtitle', 'body', 'image'] },
];

export default function AdminSiteContent() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].key);
  const [content, setContent] = useState({});
  const [form, setForm] = useState({ title: '', subtitle: '', body: '' });
  const [imgFile, setImgFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/api/site/content').then(r => setContent(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const c = content[activeSection] || {};
    setForm({ title: c.title || '', subtitle: c.subtitle || '', body: c.body || '' });
    setImgFile(null);
  }, [activeSection, content]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/api/site/content/${activeSection}`, form);
      if (imgFile) {
        const fd = new FormData();
        fd.append('file', imgFile);
        await fileUpload(`/api/site/content/${activeSection}/image`, fd);
        setImgFile(null);
      }
      // Refresh
      const { data } = await api.get('/api/site/content');
      setContent(data);
      toast.success('Content saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const currentSection = SECTIONS.find(s => s.key === activeSection);
  const currentContent = content[activeSection] || {};

  return (
    <AdminLayout title="Site Content">
      <div className="row g-4">
        {/* Section selector */}
        <div className="col-md-3">
          <div className="ministry-card p-3">
            <h6 className="fw-bold mb-3 text-muted text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Sections</h6>
            <div className="list-group list-group-flush">
              {SECTIONS.map(s => (
                <button
                  key={s.key}
                  className={`list-group-item list-group-item-action d-flex align-items-center gap-2 border-0 rounded mb-1 ${activeSection === s.key ? 'active' : ''}`}
                  style={activeSection === s.key ? { background: 'rgba(201,168,76,.15)', color: 'var(--gold)', fontWeight: 600 } : {}}
                  onClick={() => setActiveSection(s.key)}
                >
                  <i className="bi bi-file-text" />
                  <span className="small">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="col-md-9">
          <div className="ministry-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0">{currentSection?.label}</h5>
              {currentContent.updated_at && (
                <small className="text-muted">Last saved: {new Date(currentContent.updated_at).toLocaleString()}</small>
              )}
            </div>

            {loading ? (
              <div className="text-center py-4"><div className="spinner-border" style={{ color: 'var(--gold)' }} /></div>
            ) : (
              <form onSubmit={save}>
                {currentSection?.fields.includes('title') && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Title / Heading</label>
                    <input className="form-control" value={form.title}
                      onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                      placeholder="Enter the heading text" />
                  </div>
                )}

                {currentSection?.fields.includes('subtitle') && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Subtitle / Role</label>
                    <input className="form-control" value={form.subtitle}
                      onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))}
                      placeholder="e.g. Servant of God & Evangelist" />
                  </div>
                )}

                {currentSection?.fields.includes('body') && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Body / Content</label>
                    <textarea className="form-control" rows={8} value={form.body}
                      onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                      placeholder="Enter the main content text (supports line breaks)" />
                    <small className="text-muted">You can use plain text with line breaks for paragraphs.</small>
                  </div>
                )}

                {currentSection?.fields.includes('image') && (
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Section Image</label>
                    {currentContent.image_url && (
                      <div className="mb-2">
                        <img src={`/uploads/${currentContent.image_url}`}
                          alt="Current"
                          className="img-thumbnail"
                          style={{ height: '120px', objectFit: 'cover' }} />
                        <small className="text-muted ms-2">Current image</small>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="form-control"
                      onChange={e => setImgFile(e.target.files[0])} />
                    <small className="text-muted">Upload a new image to replace the current one.</small>
                  </div>
                )}

                <div className="d-flex gap-3 align-items-center mt-4">
                  <button type="submit" className="btn btn-gold px-5" disabled={saving}>
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                      : <><i className="bi bi-check-circle me-2" />Save Changes</>}
                  </button>
                  <button type="button" className="btn btn-outline-secondary"
                    onClick={() => {
                      const c = content[activeSection] || {};
                      setForm({ title: c.title || '', subtitle: c.subtitle || '', body: c.body || '' });
                    }}>
                    Reset
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Live preview */}
          <div className="ministry-card p-4 mt-3">
            <h6 className="fw-bold mb-3 text-muted">
              <i className="bi bi-eye me-2" />Live Preview
            </h6>
            <div style={{ background: 'var(--section-bg)', borderRadius: '10px', padding: '20px' }}>
              {form.title && <h4 style={{ fontFamily: 'Cinzel, serif' }}>{form.title}</h4>}
              {form.subtitle && <p className="text-gold fw-semibold">{form.subtitle}</p>}
              {form.body && <p className="text-muted" style={{ whiteSpace: 'pre-line' }}>{form.body}</p>}
              {!form.title && !form.subtitle && !form.body && (
                <p className="text-muted fst-italic">Fill in the fields above to see a preview.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
