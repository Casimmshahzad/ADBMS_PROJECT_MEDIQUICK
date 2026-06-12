import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- STYLES ---
const inputStyle = { width: '90%', padding: '10px', margin: '10px auto', display: 'block', borderRadius: '5px', border: '1px solid #ccc' };
const btnStyle = { width: '100%', padding: '12px', color: 'white', background: '#34495e', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };
const cardStyle = { background: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', marginBottom: '15px', textAlign: 'left', border: '1px solid #eee' };
const trackerBoxStyle = { background: '#e8f6f3', padding: '20px', borderRadius: '15px', marginBottom: '30px' };

// --- TIMER COMPONENT ---
const ReservationTimer = ({ createdAt }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calculateTime = () => {
            const expiryTime = new Date(createdAt).getTime() + 3600000; // 1 hour duration
            const diff = expiryTime - new Date().getTime();

            if (diff <= 0) {
                setTimeLeft('Expired');
                return;
            }

            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${minutes}m ${seconds}s left`);
        };

        calculateTime();
        const interval = setInterval(calculateTime, 1000);
        return () => clearInterval(interval);
    }, [createdAt]);

    return <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>⏱️ {timeLeft}</span>;
};

// --- AUTH COMPONENT ---
const AuthView = ({ roleType, setUser, setAuthRole }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [form, setForm] = useState({ username: '', password: '', pharmacyName: '', location: '' });

    const handleAuth = async () => {
        if (!form.username || !form.password) return alert("Fill in credentials");
        const endpoint = isLogin ? '/login' : '/register';
        try {
            const res = await axios.post(`http://localhost:5000${endpoint}`, { ...form, role: roleType });
            if (isLogin) {
                setUser(res.data.user);
                setAuthRole(null);
            } else {
                alert("Account Created! Now Login.");
                setIsLogin(true);
            }
        } catch (err) {
            alert(err.response?.data?.message || "Auth failed. Is the backend running?");
        }
    };

    return (
        <div style={{ maxWidth: '350px', margin: '50px auto', background: '#f4f4f4', padding: '30px', borderRadius: '20px' }}>
            <button onClick={() => setAuthRole(null)} style={{ float: 'left', marginBottom: '10px' }}>← Back</button>
            <h2 style={{ clear: 'both', textTransform: 'capitalize' }}>{roleType} Portal</h2>
            <h3>{isLogin ? 'Login' : 'Register'}</h3>
            <input placeholder="Username" onChange={e => setForm({ ...form, username: e.target.value })} style={inputStyle} />
            <input type="password" placeholder="Password" onChange={e => setForm({ ...form, password: e.target.value })} style={inputStyle} />
            {!isLogin && roleType === 'shopkeeper' && (
                <>
                    <input placeholder="Pharmacy Name" onChange={e => setForm({ ...form, pharmacyName: e.target.value })} style={inputStyle} />
                    <input placeholder="Location (e.g. DHA)" onChange={e => setForm({ ...form, location: e.target.value })} style={inputStyle} />
                </>
            )}
            <button onClick={handleAuth} style={{ ...btnStyle, background: '#27ae60', marginTop: '10px' }}>{isLogin ? "Login Now" : "Sign Up"}</button>
            <p onClick={() => setIsLogin(!isLogin)} style={{ cursor: 'pointer', color: '#2980b9', marginTop: '15px' }}>
                {isLogin ? "Need an account? Register" : "Already have an account? Login"}
            </p>
        </div>
    );
};

// --- CUSTOMER VIEW ---
const CustomerView = ({ logout, user }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [tracker, setTracker] = useState(user.savedMeds || []);
    const [myReservations, setMyReservations] = useState([]);
    const [trackForm, setTrackForm] = useState({ medName: '', qty: '', daily: '' });

    const fetchMyReservations = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/reservations/customer/${user._id}`);
            setMyReservations(res.data);
        } catch (err) { console.error("Failed fetching customer reservations"); }
    };

    useEffect(() => { fetchMyReservations(); }, []);

    const handleSearch = async () => {
        const res = await axios.get(`http://localhost:5000/search?name=${query}`);
        setResults(res.data);
    };

    const addTrack = async () => {
        if (!trackForm.medName || !trackForm.qty || !trackForm.daily) return alert("Fill all fields");
        const res = await axios.post('http://localhost:5000/save-track', { ...trackForm, userId: user._id });
        setTracker(res.data);
        setTrackForm({ medName: '', qty: '', daily: '' });
    };

    const reserveMed = async (medId) => {
        try {
            await axios.post('http://localhost:5000/reserve', { userId: user._id, medicineId: medId });
            alert("Reservation placed successfully!");
            fetchMyReservations();
        } catch (err) { alert("Could not complete reservation"); }
    };

    const cancelReservation = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/reserve/${id}`);
            fetchMyReservations();
        } catch (err) { alert("Could not cancel reservation"); }
    };

    return (
        <div style={{ maxWidth: '800px', margin: 'auto', padding: '20px' }}>
            <button onClick={logout} style={{ float: 'right' }}>Logout</button>
            <h2>Hello, {user.username}</h2>

            <div style={trackerBoxStyle}>
                <h3>📋 My Medicine Tracker</h3>
                <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                    <input placeholder="Med Name" value={trackForm.medName} onChange={e => setTrackForm({...trackForm, medName: e.target.value})} style={{ flex: 2, padding: '8px' }} />
                    <input placeholder="Qty" type="number" value={trackForm.qty} onChange={e => setTrackForm({...trackForm, qty: e.target.value})} style={{ flex: 1, padding: '8px' }} />
                    <input placeholder="Daily" type="number" value={trackForm.daily} onChange={e => setTrackForm({...trackForm, daily: e.target.value})} style={{ flex: 1, padding: '8px' }} />
                    <button onClick={addTrack} style={{ background: '#2ecc71', color: 'white', border: 'none', borderRadius: '5px', padding: '0 15px' }}>Track</button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                    {tracker.map((m, i) => {
                        const daysLeft = Math.floor(m.qty / m.daily);
                        return (
                            <div key={i} style={{ ...cardStyle, width: '180px', margin: 0, borderTop: daysLeft < 4 ? '4px solid #e74c3c' : '4px solid #2ecc71' }}>
                                <strong>{m.medName.toUpperCase()}</strong><br/>
                                <span style={{ fontSize: '0.9em' }}>{daysLeft} days left ({m.qty} pills)</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* CUSTOMER ACTIVE RESERVATIONS VIEW */}
            <div style={{ background: '#e3f2fd', padding: '20px', borderRadius: '15px', marginBottom: '30px', border: '1px solid #2196f3', textAlign: 'left' }}>
                <h3>🛒 My Active Reservations</h3>
                {myReservations.length === 0 ? <p>You have no active layout holds.</p> : myReservations.map(res => (
                    <div key={res._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #bbdefb' }}>
                        <div>
                            <b>{res.medicineId?.name}</b> ({res.medicineId?.pharmacyName}) <br/>
                            <ReservationTimer createdAt={res.createdAt} />
                        </div>
                        <button onClick={() => cancelReservation(res._id)} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                ))}
            </div>

            <h3>🔍 Search Local Pharmacies</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input placeholder="Search medicine..." onChange={e => setQuery(e.target.value)} style={{ flex: 1, padding: '12px' }} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                <button onClick={handleSearch} style={{ padding: '12px 25px', background: '#3498db', color: 'white', border: 'none', borderRadius: '5px' }}>Search</button>
            </div>

            {results.map(r => (
                <div key={r._id} style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <b style={{ fontSize: '1.2em' }}>{r.name}</b> <br/>
                            <small>📍 {r.pharmacyName || "Private Vendor"} | {r.location || "N/A"}</small>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ color: '#27ae60', fontWeight: 'bold' }}>Rs. {r.price}</span> <br/>
                            <button onClick={() => reserveMed(r._id)} style={{ marginTop: '5px', background: '#3498db', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '0.8em', cursor: 'pointer' }}>Reserve</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- SHOPKEEPER VIEW ---
const ShopkeeperView = ({ logout, user }) => {
    const [inventory, setInventory] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [newMed, setNewMed] = useState({ name: '', price: '' });

    const fetchInv = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/search?pharmacyId=${user._id}`);
            setInventory(res.data);
        } catch (err) { console.error("Fetch inventory failed"); }
    };

    const fetchReservations = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/reservations/pharmacy/${user._id}`);
            setReservations(res.data);
        } catch (err) { console.error("Fetch reservations failed"); }
    };

    useEffect(() => { 
        fetchInv(); 
        fetchReservations(); 
    }, []);

    const addStock = async () => {
        if (!newMed.name || !newMed.price) return alert("Enter name and price");
        try {
            await axios.post('http://localhost:5000/add-medicine', { 
                ...newMed, 
                pharmacyId: user._id, 
                pharmacyName: user.pharmacyName, 
                location: user.location 
            });
            setNewMed({ name: '', price: '' });
            fetchInv();
        } catch (err) { alert("Failed to add medicine"); }
    };

    const dismissReservation = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/reserve/${id}`);
            fetchReservations();
        } catch (err) { alert("Could not dismiss reservation"); }
    };

    return (
        <div style={{ maxWidth: '700px', margin: 'auto', padding: '20px' }}>
            <button onClick={logout} style={{ float: 'right' }}>Logout</button>
            <h2>Pharmacy: {user.pharmacyName}</h2>
            <p>📍 {user.location}</p>

            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '15px', marginBottom: '30px', border: '1px solid #ddd' }}>
                <h3>➕ Add New Medicine</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input placeholder="Medicine Name" value={newMed.name} onChange={e => setNewMed({...newMed, name: e.target.value})} style={{ flex: 2, padding: '10px' }} />
                    <input placeholder="Price" type="number" value={newMed.price} onChange={e => setNewMed({...newMed, price: e.target.value})} style={{ flex: 1, padding: '10px' }} />
                    <button onClick={addStock} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px' }}>Add Item</button>
                </div>
            </div>

            {/* RESERVATIONS DASHBOARD WITH DISMISS FUNCTION */}
            <div style={{ background: '#fff9db', padding: '20px', borderRadius: '15px', marginBottom: '30px', border: '1px solid #f59f00', textAlign: 'left' }}>
                <h3>🔔 Hold Requests / Reservations</h3>
                {reservations.length === 0 ? <p>No current holding requests.</p> : reservations.map(res => (
                    <div key={res._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0e0a0' }}>
                        <div>
                            👤 <b>{res.userId?.username}</b> requested to reserve 💊 <b>{res.medicineId?.name}</b>
                        </div>
                        <button onClick={() => dismissReservation(res._id)} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Dismiss</button>
                    </div>
                ))}
            </div>

            <h3>📦 Current Inventory List</h3>
            {inventory.length === 0 ? <p>Your inventory is empty.</p> : inventory.map(item => (
                <div key={item._id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between' }}>
                    <b>{item.name}</b>
                    <span>Rs. {item.price}</span>
                </div>
            ))}
        </div>
    );
};

// --- MAIN APP ---
export default function App() {
    const [user, setUser] = useState(null);
    const [authRole, setAuthRole] = useState(null);

    const logout = () => { setUser(null); setAuthRole(null); };

    return (
        <div style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
            <h1 style={{ textAlign: 'center', color: '#2c3e50', marginTop: '30px' }}>🩺 MediQuick</h1>
            
            {!user && !authRole && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginTop: '100px' }}>
                    <div onClick={() => setAuthRole('customer')} style={{ border: '3px solid #3498db', padding: '40px', borderRadius: '20px', cursor: 'pointer', textAlign: 'center', width: '150px' }}>
                        <div style={{ fontSize: '40px' }}>👤</div>
                        <h2 style={{ color: '#3498db', marginTop: '10px' }}>Customer</h2>
                    </div>
                    <div onClick={() => setAuthRole('shopkeeper')} style={{ border: '3px solid #2ecc71', padding: '40px', borderRadius: '20px', cursor: 'pointer', textAlign: 'center', width: '150px' }}>
                        <div style={{ fontSize: '40px' }}>🏪</div>
                        <h2 style={{ color: '#2ecc71', marginTop: '10px' }}>Shopkeeper</h2>
                    </div>
                </div>
            )}

            {!user && authRole && <AuthView roleType={authRole} setUser={setUser} setAuthRole={setAuthRole} />}
            
            {user && (user.role === 'customer' 
                ? <CustomerView logout={logout} user={user} /> 
                : <ShopkeeperView logout={logout} user={user} />
            )}
        </div>
    );
}