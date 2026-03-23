"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- FORM & TRACKING STATES ---
  const [guestName, setGuestName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [resDate, setResDate] = useState('');
  const [shift, setShift] = useState('Day Time');
  const [extraRooms, setExtraRooms] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [trackMode, setTrackMode] = useState(false); 
  const [trackId, setTrackId] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // --- RECOVERY STATES (FORGOT ID) ---
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);

  // --- LOGIC STATES ---
  const [confirmedDates, setConfirmedDates] = useState<string[]>([]);
  const [totalPrice, setTotalPrice] = useState(7000);

  // FETCH OCCUPIED DATES (Step 1 Fix)
  // Kinukuha nito ang lahat ng dates na "Confirmed" na para hindi na ma-book uli.
  useEffect(() => {
    const fetchOccupiedDates = async () => {
      const { data } = await supabase
        .from('bookings')
        .select('reservation_date')
        .eq('status', 'Confirmed');
      
      if (data) {
        const dates = data.map(b => b.reservation_date);
        setConfirmedDates(dates);
      }
    };
    fetchOccupiedDates();
  }, [isModalOpen]); // Nag-f-fetch uli tuwing binubuksan ang modal para laging updated

  useEffect(() => {
    let base = shift === 'Day Time' ? 7000 : shift === 'Night Time' ? 8000 : 13000;
    setTotalPrice(base + (extraRooms * 1000));
  }, [shift, extraRooms]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);

    // DOUBLE BOOKING PROTECTION (Step 1 Core Logic)
    // Double check sa database bago mag-submit para kahit dalawang tao sabay nag-book, isa lang ang papasok.
    const { data: existing } = await supabase
      .from('bookings')
      .select('id')
      .eq('reservation_date', resDate)
      .eq('status', 'Confirmed');

    if (existing && existing.length > 0) {
      alert("Oops! May nauna na pong mag-book sa date na ito habang nag-f-fill up kayo. Pakipili ng ibang date.");
      setLoading(false);
      return;
    }

    const newRef = "RV-" + Math.random().toString(36).substring(2, 7).toUpperCase();

    const { error } = await supabase.from('bookings').insert([{ 
      guest_name: guestName, 
      contact_number: contactNumber,
      reservation_date: resDate, 
      shift: shift,
      extra_rooms: extraRooms, 
      total_price: totalPrice, 
      status: 'Pending',
      reference_id: newRef
    }]);

    if (!error) {
      setBookingRef(newRef);
      setGuestName(''); setResDate(''); setContactNumber('');
    } else {
      alert("Error: " + error.message);
    }
    setLoading(false);
  };

  const handleTrack = async () => {
    if (!trackId) return;
    setLoading(true);
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('reference_id', trackId.toUpperCase())
      .single();

    if (data) {
      setTrackResult(data);
    } else {
      setTrackResult(null);
      alert("Booking not found. Pakicheck ang ID.");
    }
    setLoading(false);
  };

  const findIdByPhone = async () => {
    if (!recoveryPhone) return;
    setLoading(true);
    setRecoveryMessage(null);

    const { data } = await supabase
      .from('bookings')
      .select('reference_id, guest_name')
      .eq('contact_number', recoveryPhone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setRecoveryMessage(`Found it! Hi ${data.guest_name}, your ID is ${data.reference_id}`);
      setTrackId(data.reference_id);
    } else {
      setRecoveryMessage("No booking found for this number.");
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setBookingRef(null);
    setTrackResult(null);
    setShowPhoneInput(false);
    setRecoveryMessage(null);
    setRecoveryPhone('');
  };

  const galleryImages = [
    { src: '/pool-main.jpg', alt: 'Main Pool', className: 'col-span-2 row-span-2 h-64 md:h-[400px]' },
    { src: '/kitchen-area.jpg', alt: 'Kitchen', className: 'h-32 md:h-[192px]' },
    { src: '/live.jpg', alt: 'Living Room', className: 'h-32 md:h-[192px]' },
    { src: '/night-view.jpg', alt: 'Night View', className: 'h-32 md:h-[192px]' },
    { src: '/entertainment.jpg', alt: 'Entertainment', className: 'h-32 md:h-[192px]' },
  ];

  // Helper function para sa button state
  const isDateTaken = confirmedDates.includes(resDate);

  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-black text-blue-600 tracking-tighter italic leading-none">
            R&V <span className="block text-[10px] text-slate-400 not-italic tracking-widest uppercase">Private Pool</span>
          </h1>
          <div className="hidden md:flex space-x-8 text-sm font-bold text-slate-600 uppercase tracking-widest">
            <a href="#amenities" className="hover:text-blue-500 transition-colors">Amenities</a>
            <a href="#rates" className="hover:text-blue-500 transition-colors">Rates</a>
            <a href="#location" className="hover:text-blue-500 transition-colors">Location</a>
          </div>
          <button onClick={() => { setIsModalOpen(true); setTrackMode(false); }} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-blue-200">
            Book Now
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="relative h-[550px] w-full rounded-[3rem] overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-8 md:p-20">
              <div className="max-w-3xl">
                <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase mb-6 inline-block tracking-[0.3em]">Exclusive Resort</span>
                <h2 className="text-5xl md:text-8xl font-black text-white mb-6 uppercase italic leading-[0.9]">Premium <br/><span className="text-blue-500">Staycation</span></h2>
                <div className="flex gap-4">
                  <button onClick={() => { setIsModalOpen(true); setTrackMode(false); }} className="bg-white text-slate-900 px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-500 hover:text-white transition-all">Reserve Now</button>
                  <button onClick={() => { setIsModalOpen(true); setTrackMode(true); }} className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white hover:text-slate-900 transition-all">Track Booking</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <section className="max-w-6xl mx-auto px-6 pb-20 space-y-24">
        {/* Amenities */}
        <div id="amenities">
          <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-10 flex items-center gap-4">
            <span className="w-12 h-[2px] bg-blue-600"></span> Resort Amenities
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[{ title: '2ft Kiddie Pool', icon: '👶' }, { title: '6ft Adult Pool', icon: '🏊' }, { title: '2 Cottages', icon: '🛖' }, { title: 'Indoor Pavilion', icon: '🏛️' }, { title: '3 AC Rooms', icon: '🛏️' }, { title: 'Free WiFi', icon: '📶' }, { title: 'Videoke', icon: '🎤' }, { title: 'Basketball Area', icon: '🏀' }].map((item) => (
              <div key={item.title} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-blue-200 transition-all flex flex-col items-center text-center">
                <span className="text-3xl mb-3">{item.icon}</span>
                <span className="font-black uppercase text-[10px] tracking-widest text-slate-500">{item.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded-[3.5rem] shadow-xl">
           {galleryImages.map((img, i) => (
             <div key={i} onClick={() => setSelectedImg(img.src)} className={`cursor-pointer overflow-hidden rounded-[2rem] bg-slate-100 ${img.className}`}>
               <img src={img.src} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" alt={img.alt} />
             </div>
           ))}
        </div>

        {/* Rates */}
        <div id="rates" className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden">
           <div className="relative z-10">
             <h3 className="text-2xl font-black uppercase italic text-blue-400 mb-12">Official Rates</h3>
             <div className="grid md:grid-cols-3 gap-12">
                <div className="border-l-2 border-blue-600/30 pl-8">
                  <p className="font-black text-2xl italic uppercase tracking-tight">Day Time</p>
                  <p className="text-blue-500 font-black text-4xl mt-3">₱7,000</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-2 tracking-widest">8:00 AM - 5:00 PM</p>
                </div>
                <div className="border-l-2 border-blue-600/30 pl-8">
                  <p className="font-black text-2xl italic uppercase tracking-tight">Night Time</p>
                  <p className="text-blue-500 font-black text-4xl mt-3">₱8,000</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-2 tracking-widest">7:00 PM - 5:00 AM</p>
                </div>
                <div className="border-l-2 border-yellow-500/30 pl-8">
                  <p className="font-black text-2xl italic text-yellow-500 uppercase tracking-tight">22 Hours Stay</p>
                  <p className="text-yellow-500 font-black text-4xl mt-3">₱13,000</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-2 tracking-widest">Full Day & Night</p>
                </div>
             </div>
           </div>
        </div>

        {/* Location */}
        <div id="location" className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-6">Our <span className="text-blue-600">Location</span></h3>
          <p className="text-slate-500 font-bold text-sm mb-10 italic">📍 #0411 BES, Sto. Rosario St. Bagong Barrio, Pandi, Bulacan</p>
          <div className="w-full h-[450px] rounded-[2.5rem] overflow-hidden border-8 border-slate-50 grayscale hover:grayscale-0 transition-all duration-1000">
             <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3856.7032734125714!2d120.9419131!3d14.8419131!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDUwJzMxLjAiTiAxMjDCsDU2JzMxLjAiRQ!5e0!3m2!1sen!2sph!4v1711100000000!5m2!1sen!2sph" className="w-full h-full border-0" loading="lazy"></iframe>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 py-12 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-xl font-black text-blue-600 italic tracking-tighter mb-2">R&V PRIVATE POOL</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Bulacan's Hidden Gem • © 2026</p>
        </div>
      </footer>

      {/* --- SMART MODAL (BOOK & TRACK) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={closeModal}></div>
          
          <div className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 animate-in fade-in zoom-in duration-300">
            <button onClick={closeModal} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 text-2xl">×</button>

            {bookingRef ? (
              /* --- SUCCESS VIEW --- */
              <div className="text-center py-6">
                <div className="text-5xl mb-4">✅</div>
                <h4 className="text-2xl font-black uppercase italic text-blue-600 mb-2">Request Sent!</h4>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-6 leading-relaxed">Pakisave ang ID para sa tracking.<br/>Screenshot mo na rin para sure!</p>
                
                <div className="group relative bg-slate-100 p-6 rounded-3xl border-2 border-dashed border-slate-300 mb-8 cursor-pointer active:scale-95 transition-transform" 
                     onClick={() => copyToClipboard(bookingRef)}>
                  <span className="text-3xl font-black tracking-[0.3em] text-slate-800 block mb-2">{bookingRef}</span>
                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{copied ? '✓ Copied to Clipboard!' : 'Click to Copy ID'}</span>
                </div>

                <button onClick={closeModal} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-colors">Done</button>
              </div>
            ) : (
              <>
                {/* MODAL TABS */}
                <div className="flex gap-2 mb-8 bg-slate-100 p-1 rounded-2xl">
                  <button onClick={() => setTrackMode(false)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${!trackMode ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>New Booking</button>
                  <button onClick={() => setTrackMode(true)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${trackMode ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Track Status</button>
                </div>

                {!trackMode ? (
                  /* --- BOOKING FORM --- */
                  <form onSubmit={handleBooking} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl"><label className="block text-[8px] font-black text-blue-600 uppercase mb-1">Name</label>
                        <input required value={guestName} onChange={(e) => setGuestName(e.target.value)} className="bg-transparent w-full outline-none font-bold text-sm uppercase" />
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl"><label className="block text-[8px] font-black text-blue-600 uppercase mb-1">Phone</label>
                        <input required value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} className="bg-transparent w-full outline-none font-bold text-sm" />
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl"><label className="block text-[8px] font-black text-blue-600 uppercase mb-1">Date</label>
                      <input required type="date" value={resDate} onChange={(e) => setResDate(e.target.value)} className={`bg-transparent w-full outline-none font-bold text-sm ${isDateTaken ? 'text-red-500' : ''}`} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl"><label className="block text-[8px] font-black text-blue-600 uppercase mb-1">Shift</label>
                        <select value={shift} onChange={(e) => setShift(e.target.value)} className="bg-transparent w-full outline-none font-bold text-xs uppercase cursor-pointer">
                          <option value="Day Time">Day Time</option><option value="Night Time">Night Time</option><option value="22 Hours">22 Hours</option>
                        </select>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl"><label className="block text-[8px] font-black text-blue-600 uppercase mb-1">Extra Rooms</label>
                        <select value={extraRooms} onChange={(e) => setExtraRooms(Number(e.target.value))} className="bg-transparent w-full outline-none font-bold text-xs uppercase cursor-pointer">
                          <option value={0}>None</option><option value={1}>1 Room</option><option value={2}>2 Rooms</option>
                        </select>
                      </div>
                    </div>
                    <div className="bg-blue-600 p-6 rounded-3xl text-white mt-4 shadow-lg shadow-blue-100">
                      <div className="flex justify-between items-center mb-1"><p className="text-[10px] font-bold uppercase opacity-80">Total Price</p><p className="text-2xl font-black italic">₱{totalPrice.toLocaleString()}</p></div>
                    </div>
                    
                    {/* BUTTON WITH VALIDATION FEEDBACK */}
                    <button 
                      type="submit" 
                      disabled={loading || isDateTaken} 
                      className={`w-full py-5 rounded-3xl font-black text-xs uppercase tracking-widest mt-2 transition-all shadow-xl ${
                        isDateTaken 
                        ? 'bg-red-100 text-red-500 cursor-not-allowed shadow-none' 
                        : 'bg-slate-900 text-white hover:bg-blue-700 shadow-slate-200'
                      }`}
                    >
                      {loading ? 'Sending...' : isDateTaken ? '📅 Fully Booked' : 'Reserve Now'}
                    </button>
                  </form>
                ) : (
                  /* --- TRACKING & RECOVERY VIEW --- */
                  <div className="space-y-6">
                    {!showPhoneInput ? (
                      <div className="animate-in fade-in slide-in-from-left-4 duration-300 space-y-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border"><label className="block text-[8px] font-black text-blue-600 uppercase mb-2">Reference ID</label>
                          <input value={trackId} onChange={(e) => setTrackId(e.target.value)} placeholder="RV-XXXXX" className="bg-transparent w-full outline-none font-black text-xl uppercase tracking-widest" />
                        </div>
                        <button onClick={handleTrack} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all">{loading ? 'Checking...' : 'Check Status'}</button>
                        <button onClick={() => { setShowPhoneInput(true); setRecoveryMessage(null); }} className="w-full text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">Forgot ID? Find via Phone Number</button>
                      </div>
                    ) : (
                      <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                          <label className="block text-[8px] font-black text-blue-600 uppercase mb-2">Enter Registered Phone</label>
                          <input value={recoveryPhone} onChange={(e) => setRecoveryPhone(e.target.value)} placeholder="09XXXXXXXXX" className="bg-transparent w-full outline-none font-bold text-lg" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setShowPhoneInput(false); setRecoveryMessage(null); }} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">Back</button>
                          <button onClick={findIdByPhone} className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">{loading ? 'Searching...' : 'Find My ID'}</button>
                        </div>
                        {recoveryMessage && (
                          <div className="p-4 bg-slate-900 rounded-2xl text-center">
                             <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest leading-relaxed animate-pulse">{recoveryMessage}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {trackResult && (
                      <div className="mt-8 p-6 bg-blue-50 rounded-[2.5rem] border border-blue-100 animate-in slide-in-from-bottom-4 shadow-inner">
                        <div className="flex justify-between items-center mb-4"><span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Booking Status</span>
                          <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase ${trackResult.status === 'Confirmed' ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-yellow-500 text-white shadow-lg shadow-yellow-100'}`}>{trackResult.status}</span>
                        </div>
                        <h5 className="font-black text-slate-800 uppercase italic text-xl leading-none mb-2">{trackResult.guest_name}</h5>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{trackResult.reservation_date} • {trackResult.shift}</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Lightbox for Gallery */}
      {selectedImg && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedImg(null)}>
          <img src={selectedImg} className="max-w-full max-h-[85vh] rounded-3xl shadow-2xl animate-in zoom-in duration-300" alt="Full view" />
        </div>
      )}
    </main>
  );
}