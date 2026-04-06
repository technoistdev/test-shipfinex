import { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Bell, Wallet, Plus, Trash2 } from 'lucide-react';

const API_BASE = 'http://localhost:3000';

interface Holding { asset: string; quantity: number; _id?: string }
interface Alert { _id: string; targetNav: number; direction: string; isTriggered: boolean }
interface NavDataPoint { time: string; nav: number }

function App() {
  const [userId, setUserId] = useState<string>('demo-user');
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [navHistory, setNavHistory] = useState<NavDataPoint[]>([]);
  const [currentNav, setCurrentNav] = useState<number>(0);
  const [assetPrices, setAssetPrices] = useState<Record<string, number>>({});
  const [alertEvents, setAlertEvents] = useState<any[]>([]);
  const [intelEvents, setIntelEvents] = useState<any[]>([]);
  const evtSource = useRef<EventSource | null>(null);

  const [assetInput, setAssetInput] = useState('');
  const [qtyInput, setQtyInput] = useState('');
  const [alertTargetInput, setAlertTargetInput] = useState('');
  const [alertDirInput, setAlertDirInput] = useState('above');

  useEffect(() => {
    setCurrentNav(0);
    setNavHistory([]);
    setAlertEvents([]);
    setIntelEvents([]);
    setAssetPrices({});
    setHoldings([]);
    setAlerts([]);
    fetchHoldings();
    fetchAlerts();
    
    if (evtSource.current) evtSource.current.close();
    
    evtSource.current = new EventSource(`${API_BASE}/stream?userId=${userId}`);
    
    evtSource.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'nav') {
        const payload = data.payload;
        setCurrentNav(payload.totalNav);
        if (payload.assetPrices) setAssetPrices(payload.assetPrices);
        
        setNavHistory(prev => {
          const newPoint = { 
            time: new Date(payload.timestamp).toLocaleTimeString(), 
            nav: payload.totalNav 
          };
          const next = [...prev, newPoint];
          if (next.length > 50) next.shift();
          return next;
        });
      } else if (data.type === 'alert') {
        setAlertEvents(prev => [{...data.payload, time: new Date().toLocaleTimeString()}, ...prev].slice(0, 5));
        fetchAlerts();
      } else if (data.type === 'intel') {
        setIntelEvents(prev => [{...data.payload, time: new Date().toLocaleTimeString()}, ...prev].slice(0, 5));
      }
    };

    return () => {
      if (evtSource.current) evtSource.current.close();
    };
  }, [userId]);

  const fetchHoldings = async () => {
    const res = await fetch(`${API_BASE}/holdings?userId=${userId}`);
    const data = await res.json();
    setHoldings(data);
  };

  const fetchAlerts = async () => {
    const res = await fetch(`${API_BASE}/alerts?userId=${userId}`);
    const data = await res.json();
    setAlerts(data);
  };

  const addHolding = async () => {
    if (!assetInput || !qtyInput) return;
    await fetch(`${API_BASE}/holdings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, asset: assetInput.toLowerCase(), quantity: parseFloat(qtyInput) })
    });
    setAssetInput('');
    setQtyInput('');
    fetchHoldings();
  };

  const removeHolding = async (asset: string) => {
    await fetch(`${API_BASE}/holdings/${asset}?userId=${userId}`, { method: 'DELETE' });
    fetchHoldings();
  };

  const addAlert = async () => {
    if (!alertTargetInput) return;
    await fetch(`${API_BASE}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, targetNav: parseFloat(alertTargetInput), direction: alertDirInput })
    });
    setAlertTargetInput('');
    fetchAlerts();
  };

  const removeAlert = async (id: string) => {
    await fetch(`${API_BASE}/alerts/${id}`, { method: 'DELETE' });
    fetchAlerts();
  };

  return (
    <div className="min-h-screen bg-sfx-bg text-gray-100 p-8 font-sans bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-sfx-bg to-sfx-bg">
      
      <header className="flex justify-between items-center mb-10 pb-6 border-b border-sfx-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sfx-accent flex items-center justify-center shadow-[0_0_15px_var(--color-sfx-accent-glow)]">
            <Activity className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Shipfinex NAV Tracker</h1>
        </div>
        
        <div className="flex items-center gap-3 bg-sfx-card px-4 py-2 rounded-lg border border-sfx-border">
          <span className="text-sm text-gray-400">User ID:</span>
          <input 
            className="bg-transparent border-none text-white outline-none w-32 font-medium"
            value={userId} 
            onChange={e => setUserId(e.target.value)} 
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        <div className="md:col-span-2 space-y-8">
          
          <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 bg-sfx-accent/10 rounded-bl-full w-48 h-48 -z-10 blur-2xl"></div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Total Portfolio NAV</h2>
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-8 flex items-baseline gap-2">
              <span className="text-4xl text-sfx-accent font-bold">$</span>
              {currentNav.toFixed(2)}
            </div>
            
            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={navHistory}>
                  <defs>
                    <linearGradient id="colorNav" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <YAxis domain={['auto', 'auto']} hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }} 
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="nav" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorNav)" animationDuration={300} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {alertEvents.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl">
               <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-orange-400"><Bell size={20}/> Recent Alerts</h3>
               <div className="space-y-3">
                 {alertEvents.map((evt, i) => (
                   <div key={`${evt.time}-${evt.targetNav}-${i}`} className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="font-bold text-orange-400">Target Reached: </span> 
                        NAV {evt.direction === 'above' ? '>' : '<'} ${evt.targetNav.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-400">{evt.time} &rarr; Actual: ${evt.currentNav.toFixed(2)}</div>
                   </div>
                 ))}
               </div>
            </div>
          )}
          
          {/* Market Intel Panel */}
          {intelEvents.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl">
               <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-blue-400"><Activity size={20}/> On-Chain Market Intel</h3>
               <div className="space-y-3">
                 
                 { 
                 intelEvents.map((evt) =>
                  
                 (
                   <div key={evt.txid} className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex justify-between items-center transition-all animate-in fade-in slide-in-from-top-1">
                      <div>
                        <span className="font-bold text-blue-400">Whale Move: </span> 
                        {evt.value.toFixed(2)} BTC moved on-chain
                      </div>
                      <div className="text-xs text-mono text-gray-500 truncate w-32 ml-4">TX: {evt.txid.substring(0, 8)}...</div>
                   </div>
                 )
                 
                 )}
               </div>
            </div>
          )}

        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          
          {/* Holdings Panel */}
          <div className="glass-panel p-6 rounded-2xl">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-6"><Wallet size={20} className="text-sfx-accent"/> Assets</h2>
            
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 mb-6">
              {holdings.map((h) => {
                const price = assetPrices[h.asset] || 0;
                const value = h.quantity * price;
                return (
                  <div key={h.asset} className="flex justify-between items-center bg-sfx-bg p-3 rounded-lg border border-sfx-border group">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold capitalize text-white">{h.asset}</span>
                        <span className="text-[10px] bg-sfx-accent/20 text-sfx-accent px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">Live</span>
                      </div>
                      <span className="text-xs text-gray-500">{h.quantity} units @ ${price.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Holdings</div>
                      </div>
                      <button onClick={() => removeHolding(h.asset)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
                );
              })}
              {holdings.length === 0 && <div className="text-center text-gray-500 py-4 text-sm">No assets held</div>}
            </div>

            <div className="flex gap-2">
              <input placeholder="Asset (e.g. bitcoin)" className="bg-sfx-bg border border-sfx-border rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-sfx-accent transition" value={assetInput} onChange={e=>setAssetInput(e.target.value)} />
              <input type="number" placeholder="Qty" className="bg-sfx-bg border border-sfx-border rounded-lg px-3 py-2 text-sm w-20 outline-none focus:border-sfx-accent transition" value={qtyInput} onChange={e=>setQtyInput(e.target.value)} />
              <button onClick={addHolding} className="bg-sfx-accent hover:bg-blue-400 text-white p-2 rounded-lg transition"><Plus size={20}/></button>
            </div>
          </div>

          {/* Alerts Panel */}
          <div className="glass-panel p-6 rounded-2xl">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-6"><Bell size={20} className="text-sfx-accent"/> NAV Alerts</h2>
            
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 mb-6">
              {alerts.map((a) => (
                <div key={a._id} className={`flex justify-between items-center bg-sfx-bg p-3 rounded-lg border ${a.isTriggered ? 'border-orange-500/30 opacity-60' : 'border-sfx-border'}`}>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">NAV {a.direction === 'above' ? '>' : '<'} ${a.targetNav}</span>
                    <span className="text-xs text-gray-500">{a.isTriggered ? 'Triggered' : 'Active'}</span>
                  </div>
                  <button onClick={() => removeAlert(a._id)} className="text-red-400 hover:text-red-300 transition"><Trash2 size={16}/></button>
                </div>
              ))}
              {alerts.length === 0 && <div className="text-center text-gray-500 py-4 text-sm">No alerts configured</div>}
            </div>

            <div className="flex gap-2">
              <select className="bg-sfx-bg border border-sfx-border rounded-lg px-2 text-sm outline-none focus:border-sfx-accent transition" value={alertDirInput} onChange={e=>setAlertDirInput(e.target.value)}>
                <option value="above">&gt;</option>
                <option value="below">&lt;</option>
              </select>
              <input type="number" placeholder="Target $" className="bg-sfx-bg border border-sfx-border rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-sfx-accent transition" value={alertTargetInput} onChange={e=>setAlertTargetInput(e.target.value)} />
              <button onClick={addAlert} className="bg-sfx-accent hover:bg-blue-400 text-white p-2 rounded-lg transition"><Plus size={20}/></button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
