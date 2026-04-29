import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CAMPUSES = [
  'University of Ghana, Legon',
  'KNUST, Kumasi',
  'University of Cape Coast',
  'University of Professional Studies',
  'University of Energy and Natural Resources',
];

const FEATURES = [
  { icon: '🏫', title: 'Campus-First', desc: 'Find shops physically on your campus for fast, convenient delivery to your hostel or lecture hall.' },
  { icon: '🌍', title: 'Nationwide Reach', desc: 'Switch to nationwide mode to access verified vendors across all Ghanaian universities.' },
  { icon: '🛒', title: 'Everything Campus', desc: 'Textbooks, food, fashion, electronics, stationery, services — all in one place.' },
  { icon: '💸', title: 'Mobile Money', desc: 'Pay seamlessly with MTN MoMo, Vodafone Cash, or AirtelTigo Money.' },
  { icon: '🚀', title: 'Fast Delivery', desc: 'Get your items delivered within 30–45 minutes anywhere on campus.' },
  { icon: '📊', title: 'Vendor Dashboard', desc: 'Powerful tools for campus vendors to manage products, orders and analytics.' },
];

const CATEGORIES = [
  { icon: '📚', label: 'Textbooks', color: 'bg-blue-100 text-blue-700' },
  { icon: '🍔', label: 'Food & Snacks', color: 'bg-orange-100 text-orange-700' },
  { icon: '👕', label: 'Fashion', color: 'bg-purple-100 text-purple-700' },
  { icon: '💻', label: 'Electronics', color: 'bg-indigo-100 text-indigo-700' },
  { icon: '✏️', label: 'Stationery', color: 'bg-green-100 text-green-700' },
  { icon: '🛠️', label: 'Services', color: 'bg-red-100 text-red-700' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCTA = () => {
    if (user) navigate('/shop');
    else navigate('/register');
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-[#2E8B57] rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm" />
            </div>
            <span className="font-bold text-xl">mOOn<span className="text-gray-400 text-sm font-normal">.com</span></span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <button onClick={() => navigate('/shop')} className="bg-[#2E8B57] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#267a4d]">
                Go to Store →
              </button>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="text-sm text-gray-700 hover:text-[#2E8B57] font-medium">Sign In</button>
                <button onClick={() => navigate('/register')} className="bg-[#2E8B57] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#267a4d]">
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1a5c3a] via-[#2E8B57] to-[#3DA56B] text-white py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            🇬🇭 Built for Ghanaian students
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
            Your Campus Life,<br />
            <span className="text-yellow-300">Delivered.</span>
          </h1>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Shop from campus stores or go nationwide. Textbooks, food, fashion, electronics — everything delivered to your hostel door.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleCTA}
              className="bg-white text-[#2E8B57] px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all hover:scale-105 shadow-lg">
              Start Shopping Free →
            </button>
            <button onClick={() => navigate('/register?role=vendor')}
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all">
              Sell on mOOn
            </button>
          </div>
        </div>
      </section>

      {/* Campus Scope Banner */}
      <section className="bg-gray-50 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">Available at</p>
          <div className="flex flex-wrap justify-center gap-3">
            {CAMPUSES.map(c => (
              <span key={c} className="bg-white border rounded-full px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
                🏫 {c.split(',')[0]}
              </span>
            ))}
            <span className="bg-[#2E8B57] text-white rounded-full px-4 py-2 text-sm font-medium shadow-sm">
              + more coming
            </span>
          </div>
        </div>
      </section>

      {/* Scope Feature — the KEY differentiator */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 mb-3">Your Preference. Your Control.</h2>
            <p className="text-gray-600 max-w-xl mx-auto">Choose how wide you want to shop. Toggle between campus-only and nationwide in one click.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-[#2E8B57] rounded-2xl p-8">
              <div className="text-4xl mb-4">🏫</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Campus Mode</h3>
              <p className="text-gray-600 mb-4">See only shops physically on your campus. Perfect for quick hostel deliveries and supporting local student vendors.</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Fastest delivery (30–45 mins)</li>
                <li>✓ Support campus businesses</li>
                <li>✓ Familiar local vendors</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-400 rounded-2xl p-8">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Nationwide Mode</h3>
              <p className="text-gray-600 mb-4">Access verified vendors across all Ghanaian universities. Ideal for hard-to-find textbooks or specialty items.</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Bigger product selection</li>
                <li>✓ Inter-campus vendors</li>
                <li>✓ Competitive pricing</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-10">Everything You Need</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {CATEGORIES.map(cat => (
              <button key={cat.label} onClick={() => navigate('/shop')}
                className="bg-white rounded-2xl p-4 shadow-sm border hover:shadow-md transition-shadow text-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto mb-2 ${cat.color}`}>
                  {cat.icon}
                </div>
                <p className="text-xs font-semibold text-gray-700">{cat.label}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12">Why mOOn?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="p-6 rounded-2xl border hover:shadow-md transition-shadow">
                <p className="text-3xl mb-3">{f.icon}</p>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-[#2E8B57] to-[#3DA56B] text-white text-center">
        <h2 className="text-4xl font-black mb-4">Ready to shop smarter?</h2>
        <p className="text-xl opacity-90 mb-8">Join thousands of students shopping campus-smart across Ghana.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={handleCTA}
            className="bg-white text-[#2E8B57] px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 hover:scale-105 transition-all">
            Shop Now →
          </button>
          <button onClick={() => navigate('/register?role=vendor')}
            className="border-2 border-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10">
            Become a Vendor
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 bg-[#2E8B57] rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-sm" />
          </div>
          <span className="text-white font-bold">mOOn.com</span>
        </div>
        <p className="text-sm">© 2024 mOOn. Your campus life, delivered. 🇬🇭</p>
      </footer>
    </div>
  );
}
