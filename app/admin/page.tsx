"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/admin/login');
      } else {
        fetchBookings();
      }
    };
    checkUser();
  }, [router]);

  const fetchBookings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .order('reservation_date', { ascending: true });

    if (data) setBookings(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      fetchBookings();
    } else {
      alert("Error updating status: " + error.message);
    }
  };

  const confirmDelete = async () => {
    if (deleteModal.id) {
      const { error } = await supabase.from('bookings').delete().eq('id', deleteModal.id);
      if (!error) {
        fetchBookings();
        setDeleteModal({ open: false, id: null });
      }
    }
  };

  // HYBRID LOGIC: Gumagana sa Full URL at File Name lang
  const getImageUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith('http')) return path; // Kung URL na, wag na galawin
    
    const { data } = supabase.storage.from('receipts').getPublicUrl(path);
    return data.publicUrl;
  };

  const filteredBookings = bookings.filter(b => {
    const matchesStatus = b.status === filter;
    const matchesSearch =
      b.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.reference_id && b.reference_id.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans relative">
      <div className="max-w-6xl mx-auto">

        {/* HEADER & LOGOUT */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
              Admin <span className="text-blue-600">Console</span>
            </h1>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-3 bg-white px-3 py-1 rounded-full border border-slate-200 inline-block">
              R&V Private Pool Management
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="bg-white text-red-600 border border-red-100 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm"
          >
            Sign Out
          </button>
        </div>

        {/* CONTROLS: SEARCH & TABS */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1 bg-white p-2 rounded-3xl shadow-sm border border-slate-200 flex items-center px-6">
            <span className="mr-3 opacity-30">🔍</span>
            <input
              type="text"
              placeholder="Search Guest Name or Reference ID..."
              className="bg-transparent w-full outline-none font-bold text-xs uppercase tracking-tight"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex bg-white p-1 rounded-3xl shadow-sm border border-slate-200">
            {['Pending', 'Confirmed', 'Checked Out'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${filter === s ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* BOOKINGS LIST */}
        {loading ? (
          <div className="text-center py-20 font-black text-slate-300 uppercase tracking-widest animate-pulse">Loading Data...</div>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.length === 0 && (
              <div className="bg-white p-20 rounded-[3.5rem] text-center border-2 border-dashed border-slate-200">
                <p className="font-black text-slate-300 uppercase tracking-widest text-[10px]">No bookings found.</p>
              </div>
            )}

            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-xl hover:scale-[1.01] transition-all duration-300">

                <div className="flex-1 w-full">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border border-blue-100">
                      {booking.reference_id || 'NO ID'}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      📅 {booking.reservation_date}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 uppercase italic leading-none">{booking.guest_name}</h3>
                  <p className="text-slate-500 font-bold text-xs mt-2 flex gap-3 uppercase">
                    <span className="text-blue-500">📱 {booking.contact_number}</span>
                    <span>• {booking.shift}</span>
                    <span className="text-slate-300">|</span>
                    <span>{booking.extra_rooms} Rooms</span>
                  </p>
                </div>

                {/* PAYMENT SECTION - FIXED VERSION */}
                <div className="text-center md:text-left px-10 border-x border-slate-50 w-full md:w-auto flex flex-col gap-2">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Payment</p>
                    <p className="text-2xl font-black italic text-blue-600 leading-none">₱{booking.total_price?.toLocaleString()}</p>
                  </div>
                  
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-black text-slate-500 uppercase">GCash Ref: 
                      <span className="text-blue-600 ml-1">{booking.payment_ref || 'NONE'}</span>
                    </p>
                    
                    {booking.payment_image_url ? (
                      <div className="flex flex-col gap-2 mt-2">
                        <button 
                          onClick={() => window.open(getImageUrl(booking.payment_image_url), '_blank')}
                          className="w-full bg-blue-600 text-white text-[8px] font-black py-2 rounded-lg hover:bg-blue-700 transition-all uppercase"
                        >
                          View Full Receipt
                        </button>

                        <img 
                          src={getImageUrl(booking.payment_image_url)} 
                          alt="Receipt Preview"
                          className="w-full h-16 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(getImageUrl(booking.payment_image_url), '_blank')}
                        />
                      </div>
                    ) : (
                      <p className="mt-2 text-[8px] font-black text-red-400 uppercase italic">No Screenshot</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  {booking.status === 'Pending' && (
                    <button
                      onClick={() => updateStatus(booking.id, 'Confirmed')}
                      className="flex-1 bg-green-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                    >
                      Approve
                    </button>
                  )}

                  {booking.status === 'Confirmed' && (
                    <button
                      onClick={() => updateStatus(booking.id, 'Checked Out')}
                      className="flex-1 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
                    >
                      Check Out
                    </button>
                  )}

                  <button
                    onClick={() => setDeleteModal({ open: true, id: booking.id })}
                    className="bg-red-50 text-red-600 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CUSTOM DELETE MODAL */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <h2 className="text-2xl font-black text-slate-900 uppercase italic mb-2">Delete reservation?</h2>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-tight leading-relaxed mb-8">
                This action cannot be undone.
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmDelete}
                  className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all"
                >
                  Delete 
                </button>
                <button 
                  onClick={() => setDeleteModal({ open: false, id: null })}
                  className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}