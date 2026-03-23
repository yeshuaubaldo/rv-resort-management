"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending'); 
  const [searchQuery, setSearchQuery] = useState(''); // Para sa search bar
  const router = useRouter();

 // --- ROUTE GUARD LOGIC ---
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Kapag walang session, balik sa login page
        router.push('/admin/login');
      } else {
        // Kapag meron, saka lang i-fetch ang bookings
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
    router.push('/admin/login'); // Siguraduhin na papunta sa bagong login file
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

  const deleteBooking = async (id: string) => {
    if (confirm("Sigurado ka ba? Hindi na ito mababalik.")) {
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if (!error) fetchBookings();
    }
  };

  // Combined Logic: Filter by Status AND Search by Name/ID
  const filteredBookings = bookings.filter(b => {
    const matchesStatus = b.status === filter;
    const matchesSearch = 
      b.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (b.reference_id && b.reference_id.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans">
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

                <div className="text-center md:text-right px-10 border-x border-slate-50 w-full md:w-auto">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Payment</p>
                   <p className="text-3xl font-black italic text-blue-600">₱{booking.total_price?.toLocaleString()}</p>
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
                    onClick={() => deleteBooking(booking.id)}
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
    </div>
  );
}