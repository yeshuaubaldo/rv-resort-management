"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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

  // --- RECOVERY STATES ---
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);

  // --- LOGIC STATES ---
  const [confirmedDates, setConfirmedDates] = useState<string[]>([]);
  const [totalPrice, setTotalPrice] = useState(7000);

  // --- AMENITIES DATA (WITH IMAGE LINKING) ---
  const amenities = [
    { title: 'Main Pool', desc: 'Adult (6ft) & Kiddie (2ft)', icon: '', img: '/pool-main.jpg' },
    { title: 'Cottages', desc: '2 Open-air huts', icon: '', img: '/cottage.jpg' },
    { title: 'Pavilion', desc: 'Indoor event space', icon: '', img: '/paV.jpg' },
    { title: 'AC Rooms', desc: '3 Bedroom setup', icon: '', img: '/bedr.jpg' },
    { title: 'High-speed WiFi', desc: 'Always connected', icon: '', img: '/wife.jpg' },
    { title: 'Full Videoke', desc: 'Unlimited songs', icon: '', img: '/videoke.jpg' },
    { title: 'Basketball', desc: 'Outdoor court', icon: '', img: '/bball.jpg' },
    { title: 'Night View', desc: 'Ambient lighting', icon: '', img: '/night.jpg' }
  ];

  useEffect(() => {
    const fetchOccupiedDates = async () => {
      const { data } = await supabase
        .from('bookings')
        .select('reservation_date')
        .in('status', ['Confirmed', 'Pending']);
      
      if (data) {
        setConfirmedDates(data.map(b => b.reservation_date));
      }
    };
    if (isModalOpen) fetchOccupiedDates();
  }, [isModalOpen]);

  useEffect(() => {
    let base = shift === 'Day Time' ? 7000 : shift === 'Night Time' ? 8000 : 13000;
    setTotalPrice(base + (extraRooms * 1000));
  }, [shift, extraRooms]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resDate) { alert("Please select a date."); return; }
    setLoading(true);

    const { data: existing } = await supabase
      .from('bookings')
      .select('id')
      .eq('reservation_date', resDate)
      .eq('status', 'Confirmed');

    if (existing && existing.length > 0) {
      alert("Oops! This date is already fully booked.");
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
      alert("Booking not found.");
    }
    setLoading(false);
  };

  const findIdByPhone = async () => {
    if (!recoveryPhone) return;
    setLoading(true);
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
      setRecoveryMessage("No record found.");
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
    setResDate('');
  };

  const galleryImages = [
    { src: '/pool-main.jpg', alt: 'Main Pool', className: 'col-span-2 row-span-2 h-64 md:h-[400px]' },
    { src: '/kitchen-area.jpg', alt: 'Kitchen', className: 'h-32 md:h-[192px]' },
    { src: '/live.jpg', alt: 'Living Room', className: 'h-32 md:h-[192px]' },
    { src: '/night-view.jpg', alt: 'Night View', className: 'h-32 md:h-[192px]' },
    { src: '/entertainment.jpg', alt: 'Entertainment', className: 'h-32 md:h-[192px]' },
  ];

  return (
    <main className="min-h-screen font-sans text-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white600/50 backdrop-blur-xl z-50 border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-slate-100">
              <img src="/logo1.jpg" alt="R&V Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-black text-blue-600 tracking-tighter italic leading-none">
              R&V <span className="block text-[9px] text-slate-400 not-italic tracking-[0.5em] uppercase mt-1">Private Pool</span>
            </h1>
          </div>
          <div className="hidden md:flex space-x-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <a href="#amenities" className="hover:text-blue-600 transition-colors">Experience</a>
            <a href="#rates" className="hover:text-blue-600 transition-colors">Pricing</a>
            <a href="#location" className="hover:text-blue-600 transition-colors">Visit Us</a>
          </div>
          <button onClick={() => { setIsModalOpen(true); setTrackMode(false); }} className="bg-slate-950 text-white px-7 py-3 rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-blue-100">
            Book My Stay
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="relative h-[600px] w-full rounded-[4rem] overflow-hidden shadow-2xl group">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent z-10"></div>
            <img src="/hero.jpg" className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[3s]" alt="Resort View" />
            <div className="absolute inset-0 z-20 flex flex-col justify-end p-10 md:p-24">
              <span className="bg-blue-500 text-white px-5 py-1.5 rounded-full text-[9px] font-black uppercase mb-6 inline-block tracking-[0.4em] self-start shadow-lg">Premium Sanctuary</span>
              <h2 className="text-6xl md:text-9xl font-black text-white mb-8 uppercase italic leading-[0.85] tracking-tighter">
                Your Private <br/><span className="text-blue-400">Escape.</span>
              </h2>
              <div className="flex flex-wrap gap-5">
                <button onClick={() => { setIsModalOpen(true); setTrackMode(false); }} className="bg-white text-slate-950 px-12 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-2xl">Start Reservation</button>
                <button onClick={() => { setIsModalOpen(true); setTrackMode(true); }} className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-12 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-white hover:text-slate-950 transition-all">Track My Booking</button>
              </div>
            </div>
          </div>
        </div>
      </section>

    
{/* Amenities Section - Dark Blue Premium Look */}
<section id="amenities" className="bg-slate-950 py-24 px-6 rounded-[4rem] mx-4 md:mx-10 my-10 relative overflow-hidden">
  {/* Abstract Background Glow */}
  <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full"></div>
  
  <div className="max-w-6xl mx-auto relative z-10">
    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
      <div className="max-w-xl">
        <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400 mb-4 italic">The Experience</h3>
        <h2 className="text-5xl font-black uppercase italic leading-none tracking-tighter text-white">Designed for <br/>Your Comfort.</h2>
      </div>
      <p className="text-slate-500 font-bold text-xs uppercase tracking-widest italic">Exclusivity in every corner</p>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {[
        { title: 'Main Pool', desc: 'Adult & Kiddie', img: '/pool-main.jpg' },
        { title: 'Cottages', desc: '2 Open-air huts', img: '/cott.jpg' },
        { title: 'Pavilion', desc: 'Indoor space', img: '/paV.jpg' },
        { title: 'AC Rooms', desc: '3 Bedroom setup', img: '/bedr.jpg' },
        { title: 'High-speed WiFi', desc: 'Always connected', img: '/wife.jpg' },
        { title: 'Full Videoke', desc: 'Unlimited songs', img: '/videoke.jpg' },
        { title: 'Basketball', desc: 'Outdoor court', img: '/bball.jpg' },
        { title: 'Night View', desc: 'Ambient lighting', img: '/night.jpg' }
      ].map((item) => (
        <div 
          key={item.title} 
          onClick={() => setSelectedImg(item.img)}
          className="group relative h-64 rounded-[3rem] overflow-hidden cursor-pointer border border-white/5 hover:border-blue-500/50 transition-all duration-500 shadow-2xl"
        >
          {/* Background Image with Dark Overlay */}
          <img 
            src={item.img} 
            alt={item.title} 
            className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
          
          {/* Text Content */}
          <div className="absolute bottom-8 left-8 right-8">
            <h4 className="font-black uppercase text-[12px] tracking-widest text-white mb-1 group-hover:text-blue-400 transition-colors">
              {item.title}
            </h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter group-hover:text-slate-200 transition-colors">
              {item.desc}
            </p>
          </div>

          {/* Small "View" indicator that appears on hover */}
          <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="bg-blue-600 text-[8px] font-black text-white px-3 py-1 rounded-full uppercase tracking-widest">
              View
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>


      {/* Pricing Table */}
      <section id="rates" className="max-w-6xl mx-auto px-6 py-20">
        <div className="bg-slate-950 rounded-[4rem] p-12 md:p-20 text-white relative overflow-hidden shadow-2xl shadow-blue-100">
           <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full"></div>
           <div className="relative z-10 text-center mb-16">
             <h3 className="text-blue-400 font-black uppercase text-[10px] tracking-[0.5em] mb-4 italic">Exclusive Rates</h3>
             <h2 className="text-5xl md:text-6xl font-black italic uppercase leading-none">Choose Your Schedule.</h2>
           </div>
           <div className="grid md:grid-cols-3 gap-8 relative z-10">
              {[
                { title: 'Sun-Kissed Day', price: '7,000', time: '8:00 AM - 5:00 PM', color: 'blue' },
                { title: 'Starry Night', price: '8,000', time: '7:00 PM - 5:00 AM', color: 'blue' },
                { title: 'Full 22-Hour Stay', price: '13,000', time: 'Ultimate Relaxation', color: 'yellow' }
              ].map((rate, i) => (
                <div key={i} className={`p-10 rounded-[3rem] border ${rate.color === 'yellow' ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-white/5 bg-white/5'} hover:bg-white/10 transition-colors`}>
                  <p className={`font-black text-xs uppercase tracking-widest ${rate.color === 'yellow' ? 'text-yellow-500' : 'text-blue-400'} mb-6`}>{rate.title}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold">₱</span>
                    <span className="text-6xl font-black tracking-tighter">{rate.price}</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-4 tracking-widest italic">{rate.time}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Location Section */}
      <section id="location" className="max-w-6xl mx-auto px-6 py-20 mb-20">
        <div className="flex flex-col md:flex-row gap-16 items-center">
          <div className="flex-1">
            <h3 className="text-blue-600 font-black uppercase text-[10px] tracking-[0.5em] mb-4 italic">Visit Us</h3>
            <h2 className="text-5xl font-black uppercase italic leading-none mb-8">Pandi's Hidden <br/>Water Gem.</h2>
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <span className="text-xl">📍</span>
                <p className="text-slate-500 font-bold text-sm uppercase tracking-tight italic">#0411 BES, Sto. Rosario St. <br/>Bagong Barrio, Pandi, Bulacan</p>
              </div>
              <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="inline-block text-blue-600 font-black text-[10px] uppercase tracking-widest border-b-2 border-blue-600 pb-1">Get Directions</a>
            </div>
          </div>
          <div className="flex-[1.5] w-full h-[500px] rounded-[4rem] overflow-hidden border-[12px] border-slate-50 shadow-2xl">
             <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15426.69747209736!2d120.9472314!3d14.8435349!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397acef87777777%3A0x66c88688688!2sR%26V%20Private%20Pool!5e0!3m2!1sen!2sph!4v1710000000000!5m2!1sen!2sph" className="w-full h-full border-0 grayscale" loading="lazy"></iframe>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start gap-10">
          <div className="flex flex-col items-center md:items-start space-y-4">
            <div className="text-2xl font-black italic tracking-tighter uppercase">R&V Private Pool</div>
            <a href="https://www.facebook.com/profile.php?id=61550826866114" target="_blank" className="hover:opacity-70 text-xl transition-all"> pesbok</a>
            <p className="text-[10px] font-bold tracking-widest opacity-80 uppercase">R&V Private Pool & Event Place</p>
          </div>
          <div className="flex flex-col space-y-3 text-[11px] font-medium tracking-wide">
            <div className="flex items-center gap-3"><span>📞</span><span>0938 611 2459</span></div>
            <div className="flex items-center gap-3"><span>✉️</span><span>r.vprivatepoolandeventplace@gmail.com</span></div>
            <div className="flex items-center gap-3"><span>📍</span><span>Bagong Barrio, Pandi, Bulacan</span></div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto border-t border-white/10 mt-10 pt-6 text-center">
          <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.5em]">Copyright © 2026 All Rights Reserved R&V Private Pool</p>
        </div>
      </footer>

      {/* Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={closeModal}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[4rem] shadow-2xl p-10 max-h-[92vh] overflow-y-auto">
            <button onClick={closeModal} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 text-3xl">×</button>

            {bookingRef ? (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8"><span className="text-4xl">✨</span></div>
                <h4 className="text-3xl font-black uppercase italic text-slate-900 mb-3">Booking Requested!</h4>
                <div className="bg-slate-50 p-8 rounded-[3rem] border-2 border-dashed border-slate-200 mb-10 cursor-pointer" onClick={() => copyToClipboard(bookingRef)}>
                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.3em] mb-3 block">Reference ID</span>
                  <span className="text-4xl font-black tracking-[0.2em] text-slate-900">{bookingRef}</span>
                  <span className="text-[10px] font-black text-slate-300 uppercase mt-4 block">{copied ? '✓ Copied' : 'Tap to Copy'}</span>
                </div>
                <button onClick={closeModal} className="w-full bg-slate-950 text-white py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-widest">Back to Home</button>
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-10 bg-slate-50 p-1.5 rounded-[2rem] border border-slate-100">
                  <button onClick={() => setTrackMode(false)} className={`flex-1 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${!trackMode ? 'bg-white shadow-xl text-blue-600' : 'text-slate-300'}`}>Reserve Now</button>
                  <button onClick={() => setTrackMode(true)} className={`flex-1 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${trackMode ? 'bg-white shadow-xl text-blue-600' : 'text-slate-300'}`}>Track Booking</button>
                </div>

                {!trackMode ? (
                  <form onSubmit={handleBooking} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <label className="block text-[8px] font-black text-blue-600 uppercase mb-2">Full Name</label>
                        <input required value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="JUAN DELA CRUZ" className="bg-transparent w-full outline-none font-black text-sm uppercase" />
                      </div>
                      <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <label className="block text-[8px] font-black text-blue-600 uppercase mb-2">Contact Info</label>
                        <input required value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="09123456789" className="bg-transparent w-full outline-none font-black text-sm" />
                      </div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-center">
                      <label className="block text-[8px] font-black text-blue-600 uppercase mb-4 tracking-[0.2em]">Pick Your Desired Date</label>
                      <DatePicker
                        selected={resDate ? new Date(resDate) : null}
                        onChange={(date: Date | null) => setResDate(date ? date.toISOString().split('T')[0] : "")}
                        excludeDates={confirmedDates.map(d => new Date(d))}
                        minDate={new Date()}
                        inline
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <label className="block text-[8px] font-black text-blue-600 uppercase mb-2">Shift</label>
                        <select value={shift} onChange={(e) => setShift(e.target.value)} className="bg-transparent w-full outline-none font-black text-xs uppercase cursor-pointer">
                          <option value="Day Time">Sun-Kissed Day</option>
                          <option value="Night Time">Starry Night</option>
                          <option value="22 Hours">22H Full Stay</option>
                        </select>
                      </div>
                      <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <label className="block text-[8px] font-black text-blue-600 uppercase mb-2">Extra Rooms</label>
                        <select value={extraRooms} onChange={(e) => setExtraRooms(Number(e.target.value))} className="bg-transparent w-full outline-none font-black text-xs uppercase">
                          <option value={0}>Standard</option>
                          <option value={1}>+1 Bedroom</option>
                          <option value={2}>+2 Bedrooms</option>
                        </select>
                      </div>
                    </div>
                    <div className="bg-blue-600 p-7 rounded-[2.5rem] text-white flex justify-between items-center shadow-xl shadow-blue-200">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]">Estimation</p>
                      <p className="text-3xl font-black italic">₱{totalPrice.toLocaleString()}</p>
                    </div>
                    <button type="submit" disabled={loading || !resDate} className="w-full py-6 rounded-[2rem] font-black text-xs uppercase bg-slate-950 text-white hover:bg-blue-600 transition-all shadow-2xl">
                      {loading ? 'Processing...' : 'Book Now'}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-8 py-4 text-center">
                    {!showPhoneInput ? (
                      <div className="space-y-6">
                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-left">
                          <label className="block text-[8px] font-black text-blue-600 uppercase mb-3 tracking-widest">Tracking Number</label>
                          <input value={trackId} onChange={(e) => setTrackId(e.target.value)} placeholder="RV-XXXXX" className="bg-transparent w-full outline-none font-black text-2xl uppercase tracking-[0.3em]" />
                        </div>
                        <button onClick={handleTrack} className="w-full bg-slate-950 text-white py-6 rounded-[2rem] font-black text-[11px] uppercase shadow-2xl">Search Record</button>
                        <button onClick={() => setShowPhoneInput(true)} className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-blue-600 transition-all">Recover via Phone</button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100 text-left">
                          <label className="block text-[8px] font-black text-blue-600 uppercase mb-3">Registered Phone</label>
                          <input value={recoveryPhone} onChange={(e) => setRecoveryPhone(e.target.value)} placeholder="09XXXXXXXXX" className="bg-transparent w-full outline-none font-black text-xl" />
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => setShowPhoneInput(false)} className="flex-1 bg-slate-100 text-slate-400 py-5 rounded-[1.5rem] font-black text-[10px] uppercase">Cancel</button>
                          <button onClick={findIdByPhone} className="flex-[2] bg-blue-600 text-white py-5 rounded-[1.5rem] font-black text-[10px] uppercase shadow-xl shadow-blue-100">Find ID</button>
                        </div>
                        {recoveryMessage && <p className="text-[11px] font-black uppercase text-blue-400 animate-pulse">{recoveryMessage}</p>}
                      </div>
                    )}
                    {trackResult && (
                      <div className="mt-10 p-8 bg-slate-50 rounded-[3rem] border border-slate-100 text-left shadow-inner">
                        <div className="flex justify-between items-center mb-6">
                          <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.3em]">Status</span>
                          <span className={`px-5 py-1.5 rounded-full text-[9px] font-black uppercase ${trackResult.status === 'Confirmed' ? 'bg-green-600 text-white' : 'bg-amber-500 text-white'}`}>
                            {trackResult.status}
                          </span>
                        </div>
                        <h5 className="font-black text-slate-900 uppercase italic text-2xl mb-2">{trackResult.guest_name}</h5>
                        <p className="text-[10px] font-bold text-slate-400 uppercase italic">{trackResult.reservation_date} • {trackResult.shift}</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox (Image Viewer) */}
      {selectedImg && (
        <div className="fixed inset-0 bg-slate-950/98 z-[110] flex items-center justify-center p-6 animate-in fade-in duration-500" onClick={() => setSelectedImg(null)}>
          <img src={selectedImg} className="max-w-full max-h-[85vh] rounded-[3rem] shadow-2xl border-4 border-white/10" alt="Detailed view" />
          <button className="absolute top-10 right-10 text-white/40 hover:text-white text-4xl">×</button>
        </div>
      )}
    </main>
  );
}