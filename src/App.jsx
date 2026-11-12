import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";
import { LogOut, Plus, ShoppingBag, RefreshCw, Trash2, PackageCheck } from "lucide-react";

const STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
const money = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 2
}).format(Number(value || 0));

function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true); setMessage("");
    const result = mode === "signup"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) setMessage(result.error.message);
    else if (mode === "signup" && !result.data.session)
      setMessage("Account created. Check your email to confirm your account, then log in.");
  }

  return <main className="auth-wrap">
    <section className="auth-card">
      <div className="brand-mark"><ShoppingBag size={22} /></div>
      <p className="eyebrow">ORDERDESK</p>
      <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
      <p className="muted">Sign in to manage your customer orders.</p>
      <form onSubmit={submit} className="stack">
        <label>Email address<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>
        <label>Password<input type="password" minLength={6} required value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" /></label>
        <button className="primary" disabled={busy}>{busy ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}</button>
      </form>
      {message && <p className="notice">{message}</p>}
      <p className="switch">{mode === "login" ? "New here?" : "Already registered?"}
        <button className="link" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>
          {mode === "login" ? "Create an account" : "Log in"}
        </button>
      </p>
    </section>
  </main>;
}

function App() {
  const [session, setSession] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ customer_name: "", product_name: "", quantity: 1, total_amount: "" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadOrders() {
    if (!session?.user) return;
    setLoading(true); setError("");
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setOrders(data || []);
    setLoading(false);
  }

  useEffect(() => { if (session) loadOrders(); }, [session]);

  async function addOrder(event) {
    event.preventDefault();
    setSaving(true); setError("");
    const payload = {
      ...form,
      quantity: Number(form.quantity),
      total_amount: Number(form.total_amount),
      user_id: session.user.id
    };
    const { error } = await supabase.from("orders").insert(payload);
    setSaving(false);
    if (error) setError(error.message);
    else {
      setForm({ customer_name: "", product_name: "", quantity: 1, total_amount: "" });
      loadOrders();
    }
  }

  async function updateStatus(id, status) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) setError(error.message);
    else setOrders(current => current.map(order => order.id === id ? { ...order, status } : order));
  }

  async function deleteOrder(id) {
    if (!window.confirm("Delete this order permanently?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) setError(error.message);
    else setOrders(current => current.filter(order => order.id !== id));
  }

  async function logout() { await supabase.auth.signOut(); setOrders([]); }

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === "Pending").length,
    delivered: orders.filter(o => o.status === "Delivered").length,
    revenue: orders.filter(o => o.status !== "Cancelled").reduce((sum, o) => sum + Number(o.total_amount), 0)
  }), [orders]);

  if (!session) return <AuthScreen />;

  return <main className="page">
    <header className="topbar">
      <div className="brand"><span className="brand-mark small"><ShoppingBag size={18}/></span><span>OrderDesk</span></div>
      <div className="user-area"><span>{session.user.email}</span><button className="ghost" onClick={logout}><LogOut size={16}/> Logout</button></div>
    </header>

    <section className="heading">
      <div><p className="eyebrow">CUSTOMER OPERATIONS</p><h1>Orders overview</h1><p className="muted">Create, track, and manage your customer orders.</p></div>
      <button className="ghost refresh" onClick={loadOrders}><RefreshCw size={16}/> Refresh</button>
    </section>

    {error && <div className="error">{error}</div>}

    <section className="stats">
      <article className="stat"><span>Total orders</span><strong>{stats.total}</strong></article>
      <article className="stat"><span>Pending</span><strong>{stats.pending}</strong></article>
      <article className="stat"><span>Delivered</span><strong>{stats.delivered}</strong></article>
      <article className="stat"><span>Order value</span><strong>{money(stats.revenue)}</strong></article>
    </section>

    <section className="content-grid">
      <article className="panel">
        <div className="panel-title"><div><h2><Plus size={18}/> Add an order</h2><p className="muted">Enter the customer and product details.</p></div></div>
        <form className="stack" onSubmit={addOrder}>
          <label>Customer name<input required value={form.customer_name} onChange={e => setForm({...form, customer_name:e.target.value})} placeholder="Customer name"/></label>
          <label>Product name<input required value={form.product_name} onChange={e => setForm({...form, product_name:e.target.value})} placeholder="e.g. Wireless headphones"/></label>
          <div className="two-col">
            <label>Quantity<input type="number" min="1" required value={form.quantity} onChange={e => setForm({...form, quantity:e.target.value})}/></label>
            <label>Total amount (₹)<input type="number" min="0" step="0.01" required value={form.total_amount} onChange={e => setForm({...form, total_amount:e.target.value})} placeholder="0.00"/></label>
          </div>
          <button className="primary" disabled={saving}>{saving ? "Saving..." : "Create order"}</button>
        </form>
      </article>

      <article className="panel orders-panel">
        <div className="panel-title"><div><h2><PackageCheck size={18}/> Recent orders</h2><p className="muted">Your saved orders from Supabase.</p></div><span className="count">{orders.length} records</span></div>
        {loading ? <p className="empty">Loading orders...</p> : orders.length === 0 ? <p className="empty">No orders yet. Add your first order.</p> :
          <div className="table-wrap"><table><thead><tr><th>Customer / Product</th><th>Qty</th><th>Amount</th><th>Status</th><th></th></tr></thead>
            <tbody>{orders.map(order => <tr key={order.id}>
              <td><strong>{order.customer_name}</strong><small>{order.product_name}</small></td>
              <td>{order.quantity}</td><td>{money(order.total_amount)}</td>
              <td><select className={`status ${order.status.toLowerCase()}`} value={order.status} onChange={e => updateStatus(order.id, e.target.value)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></td>
              <td><button className="icon-button" title="Delete order" onClick={() => deleteOrder(order.id)}><Trash2 size={16}/></button></td>
            </tr>)}</tbody></table></div>}
      </article>
    </section>
    <footer>Built with React, Supabase Auth and PostgreSQL · Row Level Security enabled</footer>
  </main>;
}

export default App;
