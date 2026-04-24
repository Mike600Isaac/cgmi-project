import { useEffect, useState } from 'react';
import api from '../../api/axios';
import AdminLayout from '../../components/AdminLayout';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetch = (q = search, pg = page) => {
    setLoading(true);
    api.get('/api/admin/users', { params: { search: q, page: pg, per_page: 20 } })
      .then(r => { setUsers(r.data.items); setTotalPages(r.data.pages); setTotal(r.data.total); })
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [page]);

  const toggleActive = async (u) => {
    await api.patch(`/api/admin/users/${u.id}/toggle-active`);
    toast.success(u.is_active ? 'User deactivated' : 'User activated');
    fetch();
  };

  const changeRole = async (u, role) => {
    await api.put(`/api/admin/users/${u.id}`, { role });
    toast.success('Role updated');
    fetch();
  };

  return (
    <AdminLayout title="Users">
      <div className="d-flex gap-3 mb-4 flex-wrap align-items-center">
        <p className="text-muted mb-0">{total} total users</p>
        <div className="d-flex gap-2 ms-auto">
          <input className="form-control form-control-sm" style={{ width: '220px' }} placeholder="Search name / email..."
            value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && (setPage(1), fetch(search, 1))} />
          <button className="btn btn-gold btn-sm" onClick={() => { setPage(1); fetch(search, 1); }}>
            <i className="bi bi-search" />
          </button>
        </div>
      </div>

      {loading ? <div className="text-center py-5"><div className="spinner-border" style={{ color: 'var(--gold)' }} /></div> : (
        <div className="table-responsive ministry-card">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>User</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '36px', height: '36px', background: 'rgba(201,168,76,.15)', color: 'var(--gold)', fontSize: '0.8rem', flexShrink: 0 }}>
                        {u.first_name?.[0]}{u.last_name?.[0]}
                      </div>
                      <div>
                        <p className="fw-bold mb-0">{u.first_name} {u.last_name}</p>
                        <small className="text-muted">@{u.username}</small>
                      </div>
                    </div>
                  </td>
                  <td><small>{u.email}</small></td>
                  <td>
                    <select className="form-select form-select-sm" style={{ width: '100px' }} value={u.role}
                      onChange={e => changeRole(u, e.target.value)}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td><small>{dayjs(u.created_at).format('DD MMM YY')}</small></td>
                  <td>
                    <span className={`badge ${u.is_active ? 'bg-success' : 'bg-danger'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className={`btn btn-sm btn-outline-${u.is_active ? 'danger' : 'success'}`} onClick={() => toggleActive(u)}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="d-flex gap-2 mt-3">
          <button className="btn btn-sm btn-outline-secondary" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Prev</button>
          <span className="btn btn-sm disabled">Page {page}/{totalPages}</span>
          <button className="btn btn-sm btn-outline-secondary" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>Next</button>
        </div>
      )}
    </AdminLayout>
  );
}
