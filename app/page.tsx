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

  // --- PAYMENT STATES ---
  const [paymentRef, setPaymentRef] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- RECOVERY STATES ---
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);

  // --- LOGIC STATES ---
  const [confirmedDates, setConfirmedDates] = useState<string[]>([]);
  const [totalPrice, setTotalPrice] = useState(7000);

  // --- CUSTOM MODAL STATE ---
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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

  // --- HANDLERS ---

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
    } else {
      alert("Error: " + error.message);
    }
    setLoading(false);
  };

  const handlePaymentSubmit = async (refId: string) => {
    if (!receiptFile) return alert("Please upload a screenshot of your receipt.");
    if (paymentRef.length !== 4) return alert("Please enter the last 4 digits of the Reference Number.");

    setIsUploading(true);
    try {
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${refId}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, receiptFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          payment_ref: paymentRef,
          payment_image_url: publicUrl,
          status: 'Pending' 
        })
        .eq('reference_id', refId);

      if (updateError) throw updateError;

      // TRIGGER CUSTOM MODAL INSTEAD OF ALERT
      setShowSuccessModal(true);
      
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsUploading(false);
    }
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

  const closeModal = () => {
    setIsModalOpen(false);
    setBookingRef(null);
    setTrackResult(null);
    setShowPhoneInput(false);
    setRecoveryMessage(null);
    setRecoveryPhone('');
    setResDate('');
    setGuestName('');
    setContactNumber('');
    setPaymentRef('');
    setReceiptFile(null);
  };

  return (
    <main className="min-h-screen font-sans text-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/60 backdrop-blur-xl z-50 border-b border-slate-100 shadow-sm">
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

      {/* Amenities Section */}
      <section id="amenities" className="bg-slate-950 py-24 px-6 rounded-[4rem] mx-4 md:mx-10 my-10 relative overflow-hidden">
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
              <div key={item.title} onClick={() => setSelectedImg(item.img)} className="group relative h-64 rounded-[3rem] overflow-hidden cursor-pointer border border-white/5 hover:border-blue-500/50 transition-all duration-500 shadow-2xl">
                <img src={item.img} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
                <div className="absolute bottom-8 left-8 right-8">
                  <h4 className="font-black uppercase text-[12px] tracking-widest text-white mb-1 group-hover:text-blue-400 transition-colors">{item.title}</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter group-hover:text-slate-200 transition-colors">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={closeModal}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[4rem] shadow-2xl p-10 max-h-[92vh] overflow-y-auto">
            <button onClick={closeModal} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 text-3xl">×</button>

            {bookingRef ? (
              <div className="space-y-6 animate-in fade-in zoom-in duration-300 text-center">
                <div>
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">✅</span>
                  </div>
                  <h4 className="text-2xl font-black uppercase italic text-slate-900">Booking Saved!</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ref ID: {bookingRef}</p>
                </div>

                <div className="bg-blue-600 p-6 rounded-[3rem] text-white shadow-xl">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-4 opacity-80">Scan to Pay via GCash</p>
                  <img src="/gcash-qr.jpg" className="w-40 h-40 mx-auto rounded-2xl border-4 border-white/20 mb-4 object-cover" alt="GCash QR" />
                  <p className="font-black text-lg leading-none uppercase">Rassid Serohijos</p>
                  <p className="text-[10px] font-bold opacity-70">0938 611 2459</p>
                </div>

                <div className="space-y-4 text-left">
                  <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <label className="block text-[8px] font-black text-blue-600 uppercase mb-2">Last 4 Digits of GCash Ref #</label>
                    <input 
                      maxLength={4}
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value.replace(/\D/g, ""))}
                      placeholder="XXXX"
                      className="bg-transparent w-full outline-none font-black text-xl tracking-[0.5em]"
                    />
                  </div>

                  <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <label className="block text-[8px] font-black text-blue-600 uppercase mb-2">Upload Screenshot</label>
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                      className="text-[10px] font-bold uppercase w-full"
                    />
                  </div>

                  <button 
                    onClick={() => handlePaymentSubmit(bookingRef)}
                    disabled={isUploading}
                    className="w-full bg-slate-950 text-white py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-widest hover:bg-blue-600 transition-all"
                  >
                    {isUploading ? 'Uploading...' : 'Confirm Payment'}
                  </button>
                </div>
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

      {/* --- CUSTOM SUCCESS POP-UP --- */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-6 animate-in fade-in duration-300">
          <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl max-w-sm w-full text-center scale-in-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">
              ✓
            </div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 mb-3">Success!</h2>
            <p className="text-slate-500 font-bold text-[11px] uppercase tracking-widest leading-relaxed mb-8">
              Payment submitted! We will verify your booking shortly.
            </p>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                closeModal();
                window.location.reload(); 
              }}
              className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] hover:bg-slate-950 transition-all shadow-xl shadow-blue-100"
            >
              Close Window
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox */}
      {selectedImg && (
        <div className="fixed inset-0 bg-slate-950/98 z-[110] flex items-center justify-center p-6 animate-in fade-in duration-500" onClick={() => setSelectedImg(null)}>
          <img src={selectedImg} className="max-w-full max-h-[85vh] rounded-[3rem] shadow-2xl border-4 border-white/10" alt="Detailed view" />
          <button className="absolute top-10 right-10 text-white/40 hover:text-white text-4xl">×</button>
        </div>
      )}
    </main>
  );
}