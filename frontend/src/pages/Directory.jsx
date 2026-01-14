import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Directory() {
    const { user } = useAuth();
    const [profiles, setProfiles] = useState([]);
    const [board, setBoard] = useState([]);
    const [optedIn, setOptedIn] = useState(false);

    useEffect(() => {
        fetch('http://127.0.0.1:8000/api/community/directory')
            .then(res => res.json())
            .then(data => {
                setProfiles(data);
                setOptedIn(data.some(p => p.id === user?.id));
            })
            .catch(console.error);

        fetch('http://127.0.0.1:8000/api/community-info/board')
            .then(res => res.json())
            .then(setBoard)
            .catch(console.error);
    }, [user]);

    const toggleOptIn = async () => {
        const newStatus = !optedIn;
        setOptedIn(newStatus);
        if (newStatus) {
            alert("You have opted IN to the directory. Neighbors can now see your profile.");
        } else {
            alert("You have opted OUT. You are hidden.");
        }
    };

    const BoardCard = ({ member }) => (
        <div className="card" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img
                    src={`https://ui-avatars.com/api/?name=${member.name}&background=0D8ABC&color=fff`}
                    alt={member.name}
                    style={{ width: '48px', height: '48px', borderRadius: '50%' }}
                />
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#000' }}>{member.name}</h3>
                    <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'hsl(215 25% 27%)' }}>{member.position}</div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>{member.email}</div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="container">
            <Link to="/" style={{ display: 'inline-block', marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>← Back to Dashboard</Link>
            <div className="header">
                <h1>Resident Directory</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>Show my profile:</span>
                    <button
                        onClick={toggleOptIn}
                        className={optedIn ? "btn btn-primary" : "btn"}
                        style={{
                            border: optedIn ? 'none' : '1px solid #ccc',
                            backgroundColor: optedIn ? 'hsl(215 25% 27%)' : 'white',
                            color: optedIn ? 'white' : 'black'
                        }}
                    >
                        {optedIn ? 'ON' : 'OFF'}
                    </button>
                </div>
            </div>

            {board.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Board of Directors</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {board.map((member, i) => <BoardCard key={i} member={member} />)}
                    </div>
                </div>
            )}

            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Neighbors</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {profiles.map(profile => (
                    <div key={profile.id} className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <img
                                src={`https://ui-avatars.com/api/?name=${profile.name}&background=random`}
                                alt={profile.name}
                                style={{ width: '48px', height: '48px', borderRadius: '50%' }}
                            />
                            <div>
                                <h3 style={{ margin: 0, textTransform: 'none', color: 'black' }}>{profile.name}</h3>
                                <div style={{ fontSize: '0.875rem', color: '#666' }}>{profile.address}</div>
                            </div>
                        </div>
                        {profile.bio && (
                            <p style={{ fontStyle: 'italic', marginBottom: '1rem', fontSize: '0.9rem' }}>"{profile.bio}"</p>
                        )}
                        <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', fontSize: '0.9rem' }}>
                            <div style={{ marginBottom: '0.25rem' }}>📧 <a href={`mailto:${profile.email}`}>{profile.email}</a></div>
                            {profile.phone && <div>📞 {profile.phone}</div>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
