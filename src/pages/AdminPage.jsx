import React, { useState, useEffect } from 'react';
import { db, storage } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Papa from 'papaparse';
import { Trash2, Edit, Plus, Download, RefreshCcw } from 'lucide-react';

const AdminPage = () => {
  const [destinations, setDestinations] = useState([]);
  const [votes, setVotes] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDest, setCurrentDest] = useState({ name: '', desc: '', thumb: '', imgs: [] });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const unsubDest = onSnapshot(collection(db, 'destinations'), (snapshot) => {
      setDestinations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubVotes = onSnapshot(collection(db, 'votes'), (snapshot) => {
      setVotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubDest();
      unsubVotes();
    };
  }, []);

  const handleFileUpload = async (e, type, index = null) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const storageRef = ref(storage, `destinations/${Date.now()}_${file.name}`);
    try {
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      if (type === 'thumb') {
        setCurrentDest({ ...currentDest, thumb: url });
      } else {
        const newImgs = [...currentDest.imgs];
        if (index !== null) {
          newImgs[index] = url;
        } else {
          newImgs.push(url);
        }
        setCurrentDest({ ...currentDest, imgs: newImgs });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload image.");
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEditing) {
      const { id, ...data } = currentDest;
      await updateDoc(doc(db, 'destinations', id), data);
      setIsEditing(false);
    } else {
      await addDoc(collection(db, 'destinations'), currentDest);
    }
    setCurrentDest({ name: '', desc: '', thumb: '', imgs: [] });
  };

  const handleEdit = (dest) => {
    setCurrentDest(dest);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this destination?')) {
      await deleteDoc(doc(db, 'destinations', id));
    }
  };

  const handleResetVotes = async () => {
    if (window.confirm('WARNING: This will delete ALL votes. Are you sure?')) {
      const querySnapshot = await getDocs(collection(db, 'votes'));
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      alert('All votes have been reset.');
    }
  };

  const exportCSV = () => {
    const csvData = votes.map(v => ({
      VoterName: v.voterName,
      Destination: v.destinationName,
      Timestamp: v.timestamp?.toDate ? v.timestamp.toDate().toLocaleString() : v.timestamp
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'votes_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1 className="card-title" style={{ fontSize: '1.5rem' }}>Admin Dashboard</h1>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h2 className="card-title">{isEditing ? 'Edit Destination' : 'Add New Destination'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={currentDest.name}
              onChange={e => setCurrentDest({...currentDest, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={currentDest.desc}
              onChange={e => setCurrentDest({...currentDest, desc: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Thumbnail Image</label>
            {currentDest.thumb && <img src={currentDest.thumb} alt="thumb" style={{ width: 100, height: 100, objectFit: 'cover', marginBottom: 5 }} />}
            <input type="file" onChange={e => handleFileUpload(e, 'thumb')} />
          </div>
          <div className="form-group">
            <label>Gallery Images</label>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 5 }}>
              {currentDest.imgs.map((url, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={url} alt={`gallery-${i}`} style={{ width: 60, height: 60, objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => {
                      const newImgs = [...currentDest.imgs];
                      newImgs.splice(i, 1);
                      setCurrentDest({...currentDest, imgs: newImgs});
                    }}
                    style={{ position: 'absolute', top: 0, right: 0, background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer' }}
                  >×</button>
                </div>
              ))}
            </div>
            <input type="file" onChange={e => handleFileUpload(e, 'gallery')} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={uploading}>
            {isEditing ? 'Update Destination' : 'Add Destination'}
          </button>
          {isEditing && (
            <button className="btn btn-secondary" type="button" onClick={() => {
              setIsEditing(false);
              setCurrentDest({ name: '', desc: '', thumb: '', imgs: [] });
            }}>Cancel</button>
          )}
        </form>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <h2 className="card-title">Manage Destinations</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {destinations.map(d => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.desc}</td>
                  <td className="admin-actions">
                    <button className="btn btn-secondary" style={{ padding: '0.5rem', marginTop: 0 }} onClick={() => handleEdit(d)}><Edit size={16} /></button>
                    <button className="btn btn-danger" style={{ padding: '0.5rem', marginTop: 0 }} onClick={() => handleDelete(d.id)}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="card-title">Voter List</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" style={{ marginTop: 0, width: 'auto' }} onClick={exportCSV}><Download size={16} /> Export CSV</button>
            <button className="btn btn-danger" style={{ marginTop: 0, width: 'auto' }} onClick={handleResetVotes}><RefreshCcw size={16} /> Reset All Votes</button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Voter Name</th>
                <th>Selected Destination</th>
              </tr>
            </thead>
            <tbody>
              {votes.map(v => (
                <tr key={v.id}>
                  <td>{v.voterName}</td>
                  <td>{v.destinationName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
