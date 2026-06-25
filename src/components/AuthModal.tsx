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

  React.useEffect(() => {
    if (!isOpen) return;

    const existingScript = document.getElementById('google-gsi-client');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.id = 'google-gsi-client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeGoogleSignIn();
      };
      document.body.appendChild(script);
    } else {
      setTimeout(() => {
        initializeGoogleSignIn();
      }, 200);
    }
  }, [isOpen]);

  const initializeGoogleSignIn = () => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
    
    const win = window as any;
    if (win.google?.accounts?.id) {
      win.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleSignInCallback
      });

      const googleBtnElement = document.getElementById('google-signin-btn-container');
      if (googleBtnElement && googleClientId !== 'YOUR_GOOGLE_CLIENT_ID') {
        win.google.accounts.id.renderButton(googleBtnElement, {
          theme: 'outline',
          size: 'large',
          width: 200,
          text: 'signin_with'
        });
      }
    }
  };

  const handleGoogleSignInCallback = async (response: any) => {
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google Sign In failed');
      }

      setToken(data.token);
      setUser(data.user);
      setCart(data.cart || []);
      setSuccess('Logged in successfully via Google!');
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = () => {
    setError(null);
    setSuccess(null);

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';

    if (!googleClientId || googleClientId === 'YOUR_GOOGLE_CLIENT_ID') {
      // Sandbox Simulation mode
      console.log('Running Google login in Sandbox Simulation mode');
      setSuccess('Simulating Google Authentication... (Sandbox Mode)');

      fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isMock: true,
          email: 'googleuser@gmail.com',
          name: 'Google User'
        })
      })
      .then(res => res.json())
      .then(data => {
        setToken(data.token);
        setUser(data.user);
        setCart(data.cart || []);
        setSuccess('Logged in successfully via Google (Sandbox)!');
        setTimeout(() => {
          onClose();
          setSuccess(null);
        }, 1200);
      })
      .catch(err => {
        setError(err.message || 'Google Sign In failed');
      });
      return;
    }

    const win = window as any;
    if (win.google?.accounts?.id) {
      win.google.accounts.id.prompt();
    } else {
      setError('Google Sign In SDK is still loading. Please try again.');
    }
  };

  const handleMicrosoftSignIn = () => {
    setError(null);
    setSuccess(null);
    
    const microsoftClientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID || 'YOUR_MICROSOFT_CLIENT_ID';
    
    if (!microsoftClientId || microsoftClientId === 'YOUR_MICROSOFT_CLIENT_ID') {
      console.log('Running Microsoft login in Sandbox Simulation mode');
      setSuccess('Simulating Microsoft Authentication... (Sandbox Mode)');
      
      fetch('/api/auth/microsoft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isMock: true,
          email: 'microsoftuser@outlook.com',
          name: 'Microsoft User'
        })
      })
      .then(res => res.json())
      .then(data => {
        setToken(data.token);
        setUser(data.user);
        setCart(data.cart || []);
        setSuccess('Logged in successfully via Microsoft (Sandbox)!');
        setTimeout(() => {
          onClose();
          setSuccess(null);
        }, 1200);
      })
      .catch(err => {
        setError(err.message || 'Microsoft Sign In failed');
      });
      return;
    }

    // Real Microsoft OAuth 2.0 Implicit Flow Popup
    const redirectUri = window.location.origin + '/';
    const scope = 'user.read';
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${microsoftClientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;

    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      'MicrosoftSignIN',
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
    );

    if (!popup) {
      setError('Blocker active. Please enable popups for Microsoft Sign In.');
      return;
    }

    const interval = setInterval(async () => {
      try {
        if (popup.closed) {
          clearInterval(interval);
          return;
        }

        if (popup.location.href.startsWith(redirectUri)) {
          const hash = popup.location.hash;
          popup.close();
          clearInterval(interval);

          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          
          if (!accessToken) {
            setError('Failed to retrieve Microsoft access token');
            return;
          }

          setSuccess('Microsoft authorized. Resolving user profile...');
          
          const res = await fetch('/api/auth/microsoft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken })
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Microsoft Sign In failed');
          }

          setToken(data.token);
          setUser(data.user);
          setCart(data.cart || []);
          setSuccess('Logged in successfully via Microsoft!');
          setTimeout(() => {
            onClose();
            setSuccess(null);
          }, 1000);
        }
      } catch (e) {
        // Cross-origin exception is expected before redirect, ignore it
      }
    }, 500);
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

                {/* Google and Microsoft login buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="py-2.5 bg-[#202024]/40 hover:bg-[#202024]/80 border border-neutral-800/80 rounded-xl transition-all text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer text-white font-sans"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"
                      />
                      <path
                        fill="#34A853"
                        d="M16.04 15.345c-1.127.756-2.536 1.173-4.04 1.173a7.077 7.077 0 0 1-6.734-4.856L1.24 14.777C3.198 18.727 7.27 21.425 12 21.425c2.973 0 5.673-.982 7.564-2.673l-3.524-3.407z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.49 12.275c0-.818-.08-1.581-.227-2.318H12v4.51h6.464c-.29 1.536-1.145 2.827-2.424 3.673l3.524 3.407c2.064-1.91 3.25-4.718 3.25-8.272z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.266 11.662a7.03 7.03 0 0 1 0-1.897L1.24 6.65a12.012 12.012 0 0 0 0 8.127l4.026-3.115z"
                      />
                    </svg>
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleMicrosoftSignIn}
                    className="py-2.5 bg-[#202024]/40 hover:bg-[#202024]/80 border border-neutral-800/80 rounded-xl transition-all text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer text-white font-sans"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 23 23">
                      <path fill="#f35325" d="M0 0h11v11H0z" />
                      <path fill="#81bc06" d="M12 0h11v11H12z" />
                      <path fill="#05a6f0" d="M0 12h11v11H0z" />
                      <path fill="#ffba08" d="M12 12h11v11H12z" />
                    </svg>
                    <span>Microsoft</span>
                  </button>
                </div>

                {/* OTP fallback link */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    className="text-xs text-neutral-450 hover:text-[#adc6ff] font-medium transition-colors cursor-pointer"
                  >
                    Or sign in with OTP Code
                  </button>
                </div>

                {/* Google mounting container (optional if standard button rendered) */}
                <div id="google-signin-btn-container" className="hidden" />
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
