import React, { useState } from 'react';
import { X, Mail, Lock, User, LogOut, CheckCircle, ShieldAlert, Key } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  setUser: (user: any) => void;
  token: string | null;
  setToken: (token: string | null) => void;
  setCart: (cart: any[]) => void;
  onOpenAdmin: () => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  user,
  setUser,
  token,
  setToken,
  setCart,
  onOpenAdmin
}: AuthModalProps) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setToken(data.token);
      setUser(data.user);
      setCart(data.cart || []);
      setSuccess('Logged in successfully!');
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setToken(data.token);
      setUser(data.user);
      setSuccess('Account created successfully!');
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleMockGoogleLogin = () => {
    setError(null);
    setSuccess('Simulated Google Authentication completed successfully!');
    const mockUser = {
      id: 999,
      email: 'googleuser@gmail.com',
      fullName: 'Google User',
      role: 'customer'
    };
    setUser(mockUser);
    setToken('MOCK_GOOGLE_TOKEN_' + Date.now());
    setTimeout(() => {
      onClose();
      setSuccess(null);
    }, 1200);
  };

  const handleSendOTP = () => {
    if (!email) {
      setError('Please provide an email address first.');
      return;
    }
    setError(null);
    setOtpSent(true);
    setSuccess('SMS/Email OTP code sent: 4821');
  };

  const handleVerifyOTP = () => {
    setError(null);
    if (otpCode === '4821') {
      const mockUser = {
        id: 888,
        email: email,
        fullName: 'OTP Verified User',
        role: 'customer'
      };
      setUser(mockUser);
      setToken('MOCK_OTP_TOKEN_' + Date.now());
      setSuccess('OTP verified successfully!');
      setTimeout(() => {
        onClose();
        setSuccess(null);
        setOtpSent(false);
        setOtpCode('');
      }, 1200);
    } else {
      setError('Invalid OTP code. Please enter 4821.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setCart([]);
    setSuccess('Logged out successfully.');
    setTimeout(() => {
      onClose();
      setSuccess(null);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#18181b] border border-neutral-800 rounded-3xl p-6 relative shadow-2xl text-white overflow-hidden">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {user ? (
          /* PROFILE MODE */
          <div className="space-y-6 py-4">
            <div className="text-center space-y-1.5">
              <div className="w-16 h-16 bg-[#adc6ff]/10 text-[#adc6ff] border border-[#adc6ff]/20 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-lg font-bold">{user.fullName}</h3>
              <p className="text-xs text-neutral-450 font-mono">{user.email}</p>
              {user.role === 'admin' && (
                <span className="inline-block mt-2 px-2.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] uppercase font-mono tracking-widest font-bold rounded-full">
                  Administrator
                </span>
              )}
            </div>

            <div className="space-y-3 pt-2">
              {user.role === 'admin' && (
                <button
                  onClick={() => {
                    onOpenAdmin();
                    onClose();
                  }}
                  className="w-full py-3 bg-[#adc6ff] hover:bg-[#adc6ff]/90 text-[#002e69] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  Open Admin Dashboard
                </button>
              )}

              <button
                onClick={handleLogout}
                className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* LOGIN / SIGNUP MODE */
          <div className="space-y-5">
            <div className="flex border-b border-neutral-800 pb-1">
              <button 
                onClick={() => { setIsLoginTab(true); setError(null); }}
                className={`flex-1 pb-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  isLoginTab ? 'border-[#adc6ff] text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Log In
              </button>
              <button 
                onClick={() => { setIsLoginTab(false); setError(null); }}
                className={`flex-1 pb-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  !isLoginTab ? 'border-[#adc6ff] text-white' : 'border-transparent text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {otpSent ? (
              /* OTP VERIFICATION VIEW */
              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold">Verify OTP Code</h4>
                  <p className="text-xs text-neutral-400">Enter the verification code sent to your credentials.</p>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter Code (Use: 4821)"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full bg-[#202024]/60 border border-neutral-800/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#adc6ff] font-mono tracking-widest text-center"
                  />
                  <Key className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  onClick={handleVerifyOTP}
                  className="w-full py-3 bg-[#adc6ff] text-[#002e69] font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#adc6ff]/90 transition-all cursor-pointer"
                >
                  Verify Code
                </button>
                <button
                  onClick={() => setOtpSent(false)}
                  className="w-full py-2.5 border border-neutral-800 rounded-xl text-neutral-450 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Back to Login
                </button>
              </div>
            ) : isLoginTab ? (
              /* LOGIN TAB */
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#202024]/60 border border-neutral-800/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#adc6ff]"
                    required
                  />
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>

                <div className="relative">
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#202024]/60 border border-neutral-800/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#adc6ff]"
                    required
                  />
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#adc6ff] text-[#002e69] font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#adc6ff]/90 transition-all cursor-pointer"
                >
                  Sign In
                </button>

                <div className="flex items-center my-4">
                  <div className="flex-grow h-px bg-neutral-800" />
                  <span className="px-3 text-xs text-neutral-500 uppercase tracking-widest font-mono">Or</span>
                  <div className="flex-grow h-px bg-neutral-800" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    className="py-2.5 border border-neutral-800 rounded-xl hover:bg-white/5 transition-all text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>OTP Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleMockGoogleLogin}
                    className="py-2.5 border border-neutral-800 rounded-xl hover:bg-white/5 transition-all text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Google OAuth</span>
                  </button>
                </div>
              </form>
            ) : (
              /* SIGNUP TAB */
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#202024]/60 border border-neutral-800/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#adc6ff]"
                    required
                  />
                  <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>

                <div className="relative">
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#202024]/60 border border-neutral-800/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#adc6ff]"
                    required
                  />
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>

                <div className="relative">
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#202024]/60 border border-neutral-800/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#adc6ff]"
                    required
                  />
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#adc6ff] text-[#002e69] font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#adc6ff]/90 transition-all cursor-pointer"
                >
                  Create Account
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
