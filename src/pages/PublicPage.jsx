import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, query, where, getDocs } from 'firebase/firestore';

const PublicPage = () => {
  const [destinations, setDestinations] = useState([]);
  const [votes, setVotes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedPlaceName, setVotedPlaceName] = useState('');
  const [justVoted, setJustVoted] = useState(false);
  const [modalImg, setModalImg] = useState(null);

  useEffect(() => {
    // Check if this device has already voted
    const savedVote = localStorage.getItem('voted_destination');
    if (savedVote) {
      const voteData = JSON.parse(savedVote);
      setHasVoted(true);
      setVotedPlaceName(voteData.name);
      setCurrentUser(voteData.voterName || 'User');
    }

    const unsubDest = onSnapshot(collection(db, 'destinations'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDestinations(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    });

    const unsubVotes = onSnapshot(collection(db, 'votes'), (snapshot) => {
      setVotes(snapshot.docs.map(doc => doc.data()));
    });

    return () => {
      unsubDest();
      unsubVotes();
    };
  }, []);

  const handleLogin = async () => {
    if (!nameInput.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    const name = nameInput.trim();
    setCurrentUser(name);

    // Check if user has already voted
    const q = query(collection(db, 'votes'), where('voterName', '==', name));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      setHasVoted(true);
      setVotedPlaceName(querySnapshot.docs[0].data().destinationName);
    }
  };

  const submitVote = async () => {
    if (!selectedId) {
      alert('เลือกสถานที่ก่อนนะ!');
      return;
    }
    if (hasVoted) return;

    const selectedPlace = destinations.find(d => d.id === selectedId);
    await addDoc(collection(db, 'votes'), {
      voterName: currentUser,
      destinationId: selectedId,
      destinationName: selectedPlace.name,
      timestamp: new Date()
    });

    setHasVoted(true);
    setJustVoted(true);
    setVotedPlaceName(selectedPlace.name);

    // Save to localStorage to prevent multiple votes from same device
    localStorage.setItem('voted_destination', JSON.stringify({
      id: selectedId,
      name: selectedPlace.name,
      voterName: currentUser
    }));
  };

  const voteCounts = votes.reduce((acc, vote) => {
    acc[vote.destinationId] = (acc[vote.destinationId] || 0) + 1;
    return acc;
  }, {});

  const totalVotes = votes.length;
  const voterNames = votes
    .map(vote => vote.voterName)
    .filter(Boolean);

  const selectedPlace = destinations.find(d => d.id === selectedId);

  if (!currentUser) {
    return (
      <>
        <div className="hero">
          <h1>🗺️ มิตติ้งนี้ไปไหนดี?</h1>
          <p>โหวตเลือกสถานที่ที่อยากไปด้วยกัน</p>
        </div>
        <div className="container">
          <div className="login-wrap">
            <div className="card">
              <div className="card-title">ยืนยันตัวตนก่อนโหวต</div>
              <div className="card-sub">ใส่ชื่อของคุณ เพื่อให้ระบบนับโหวตได้ถูกต้อง — แต่ละชื่อโหวตได้ครั้งเดียวเท่านั้น</div>
              <input
                type="text"
                placeholder="ชื่อเล่นหรือชื่อจริง เช่น มิ้ว, ต้น, แบม"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className={nameError ? 'error' : ''}
              />
              {nameError && <div className="err-msg" style={{ display: 'block' }}>กรุณาใส่ชื่อของคุณด้วยนะ</div>}
              <button className="btn btn-primary" onClick={handleLogin}>เข้าร่วมโหวต →</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="hero">
        <h1>🗺️ มิตติ้งนี้ไปไหนดี?</h1>
        <p>โหวตเลือกสถานที่ที่อยากไปด้วยกัน</p>
      </div>
      <div className="container">
        <div className="voter-badge">👤 <span>{currentUser}</span></div>

        {hasVoted && !justVoted && (
          <div className="success-banner">
            ✅ <span>คุณโหวตให้ "{votedPlaceName}" ไปแล้ว ดูผลด้านล่างได้เลย</span>
          </div>
        )}

        <div className="section-label">เลือกสถานที่</div>
        <div className="places-grid">
          {destinations.map(p => (
            <div
              key={p.id}
              className={`place-card ${selectedId === p.id ? 'selected' : ''}`}
              onClick={() => !hasVoted && setSelectedId(p.id)}
            >
              <img className="place-thumb" src={p.thumb} alt={p.name} loading="lazy" />
              <div className="place-info">
                <div style={{ flex: 1 }}>
                  <div className="place-name">{p.name}</div>
                  <div className="place-desc">{p.desc}</div>
                </div>
                <div className="radio-dot"></div>
              </div>
            </div>
          ))}
        </div>

        {selectedPlace && (
          <div className="gallery-card">
            <div className="gallery-name">รูป {selectedPlace.name}</div>
            <div className="gallery-imgs">
              {selectedPlace.imgs?.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={selectedPlace.name}
                  loading="lazy"
                  onClick={() => setModalImg(url)}
                />
              ))}
            </div>
          </div>
        )}

        {!hasVoted && (
          <button className="btn btn-primary" onClick={submitVote} style={{ marginTop: '1rem' }}>
            ยืนยันการโหวต ✓
          </button>
        )}

        {justVoted && (
           <div className="success-banner" style={{ marginTop: '1rem' }}>
           🎉 <span>โหวตให้ "{votedPlaceName}" เรียบร้อย!</span>
         </div>
        )}

        <div className="section-label" style={{ marginTop: '1.75rem' }}>ผลโหวตทั้งหมด</div>
        <div className="results-card">
          {destinations.map(p => {
            const count = voteCounts[p.id] || 0;
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            return (
              <div key={p.id} className="result-row">
                <div className="result-top">
                  <span className="result-place-name">{p.name}</span>
                  <span className="result-count">{count} คน · {pct}%</span>
                </div>
                <div className="bar-bg">
                  <div className="bar-fill" style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="section-label" style={{ marginTop: '1.75rem' }}>คนที่โหวตแล้ว</div>
        <div className="voter-summary-card">
          <div className="voter-summary-top">
            <div className="voter-summary-title">คนที่โหวตแล้ว</div>
            <div className="voter-summary-total">ทั้งหมด {totalVotes} คน</div>
          </div>
          {voterNames.length > 0 ? (
            <div className="voter-name-list">
              {voterNames.map((name, index) => (
                <span key={`${name}-${index}`} className="voter-name-chip">{name}</span>
              ))}
            </div>
          ) : (
            <div className="empty-voters">ยังไม่มีคนโหวต</div>
          )}
        </div>
      </div>

      {modalImg && (
        <div className="modal-bg" onClick={() => setModalImg(null)}>
          <button className="modal-close" onClick={() => setModalImg(null)}>✕</button>
          <img src={modalImg} alt="รูปขยาย" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
};

export default PublicPage;
