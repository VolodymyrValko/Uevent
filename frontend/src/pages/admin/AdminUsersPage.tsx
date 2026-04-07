
import React, { useEffect, useState } from 'react';
import { adminService } from '../../services';
import { User } from '../../types';
import styles from './AdminPages.module.scss';

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');

  const load = (p: number, s: string) => {
    setLoading(true);
    adminService.getUsers(p, s)
      .then((res) => { setUsers(res.items); setTotal(res.total); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(page, search); }, [page, search]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); setSearch(searchInput); };

  const handleRoleChange = async (userId: number, role: string) => {
    await adminService.changeRole(userId, role);
    load(page, search);
  };

  const handleDelete = async (userId: number, name: string) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await adminService.deleteUser(userId);
      load(page, search);
    } catch {  }
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>Users <span className={styles.count}>({total})</span></h1>
      <form onSubmit={handleSearch} className={styles.searchRow}>
        <input className="field__input" placeholder="Search by name or email…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        <button type="submit" className="btn btn--primary btn--sm">Search</button>
      </form>
      {loading ? <div className="page-loading"><div className="spinner" /></div> : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className={styles.muted}>{u.id}</td>
                  <td>{u.firstName} {u.lastName}</td>
                  <td className={styles.muted}>{u.email}</td>
                  <td>
                    <span className={`${styles.roleBadge} ${u.role === 'admin' ? styles.roleAdmin : styles.roleUser}`}>{u.role}</span>
                  </td>
                  <td className={styles.muted}>{new Date(u.createdAt).toLocaleDateString('uk-UA')}</td>
                  <td className={styles.actionsCell}>
                    <select
                      className={styles.roleSelect}
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                    {u.role !== 'admin' && (
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(u.id, `${u.firstName} ${u.lastName}`)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
