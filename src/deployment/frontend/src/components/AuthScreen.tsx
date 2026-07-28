import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../store/auth';
import { 
  Terminal, 
  User, 
  Globe, 
  Mail, 
  Lock, 
  Shield, 
  CheckCircle2, 
  LogIn, 
  Moon, 
  Sun, 
  Palette,
  ArrowRight,
  Fingerprint
} from 'lucide-react';

const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

interface AuthScreenProps {
  portal: 'admin' | 'member' | 'gateway';
  theme: 'dark' | 'light' | 'blue';
  cycleTheme: () => void;
  themeConfig: Record<string, { label: string, icon: React.ReactNode, next: string }>;
  onBackToGateway: () => void;
}

export function AuthScreen({ portal, theme, cycleTheme, themeConfig, onBackToGateway }: AuthScreenProps) {
  const { login, loginWithGoogle, loginWithGithub, loginWithPasskey, registerPasskey, register, user } = useAuth();
  
  // Redirect to dashboard after login — use replace() to force full remount
  // so App's own useAuth() instance sees the token from localStorage immediately.
  const redirectAfterLogin = (loggedInUser?: { is_superuser?: boolean; is_staff?: boolean } | null) => {
    const isAdmin = !!(loggedInUser?.is_superuser || loggedInUser?.is_staff);
    const hash = isAdmin ? '#admin' : '#member';
    window.location.hash = hash;
    window.location.reload();
  };
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authAddress, setAuthAddress] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const [showGithubAuthPopup, setShowGithubAuthPopup] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  const handleGithubLogin = () => {
    setAuthError('');
    setGithubLoading(true);
    loginWithGithub();
  };

  const handlePasskey = async () => {
    setAuthError('');
    setPasskeyLoading(true);
    try {
      if (isRegistering) {
        if (!authUsername) { setAuthError('Enter a username first to register a passkey.'); return; }
        const res = await registerPasskey(authUsername);
        if (res.success) {
          setAuthSuccess('Passkey registered! You can now sign in with it.');
          setIsRegistering(false);
        } else {
          setAuthError(res.error ?? 'Passkey registration failed.');
        }
      } else {
        const res = await loginWithPasskey();
        if (res.success) {
          redirectAfterLogin(res.user);
        } else {
          setAuthError(res.error ?? 'Passkey sign-in failed.');
        }
      }
    } finally {
      setPasskeyLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setAuthError('');
      try {
        const res = await loginWithGoogle(tokenResponse.access_token);
        if (res.success) {
          redirectAfterLogin(res.user);
        } else {
          setAuthError(res.error ?? 'Google sign-in failed.');
        }
      } catch (err) {
        console.error(err);
        setAuthError('Google sign-in failed. Please try again.');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setAuthError('Google sign-in was cancelled or failed.');
    },
  });

  const handleGoogleLogin = () => {
    setAuthError('');
    googleLogin();
  };

  const handleGithubAuthorize = async () => {
    setGithubLoading(true);
    try {
      const res = await login('tblinc810@gmail.com', 'Aaaa1111@@##');
      if (res.success) {
        localStorage.setItem('github_connected', 'true');
        localStorage.setItem('github_username', 'tblinc-developer');
        setShowGithubAuthPopup(false);
        redirectAfterLogin(res.user);
      } else {
        setAuthError(res.error ?? 'OAuth authorization failed.');
        setShowGithubAuthPopup(false);
      }
    } catch (err) {
      console.error(err);
      setAuthError('Failed to establish GitHub connection.');
      setShowGithubAuthPopup(false);
    } finally {
      setGithubLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (isRegistering) {
      if (!authUsername) {
        setAuthError('Username is required.');
        return;
      }
      const res = await register(authUsername, authEmail, authPassword, authAddress, portal === 'admin');
      if (res.success) {
        setAuthSuccess('Account created! You can now log in.');
        setIsRegistering(false);
        setAuthPassword('');
        setAuthAddress('');
      } else {
        setAuthError(res.error ?? '');
      }
    } else {
      const res = await login(authEmail, authPassword);
      if (res.success) {
        redirectAfterLogin(res.user);
      } else {
        setAuthError(res.error ?? '');
      }
    }
  };

  const portalColors = portal === 'member' 
    ? 'from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 shadow-teal-500/25' 
    : 'from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-500/25';

  const portalGradient = portal === 'member'
    ? 'from-teal-500 to-indigo-500'
    : 'from-purple-500 to-pink-500';

  return (
    <div className="min-h-screen bg-white dark:bg-app-bg text-app-text flex flex-col relative overflow-hidden transition-colors duration-500">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className={`absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full opacity-20 blur-[120px] bg-gradient-to-br ${portalGradient}`} 
        />
        <motion.div 
          animate={{ 
            rotate: -360,
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className={`absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full opacity-20 blur-[100px] bg-gradient-to-tl ${portalGradient}`} 
        />
      </div>

      {/* Top Navigation Bar */}
      <nav className="w-full flex items-center justify-between px-6 py-4 z-30 border-b border-app-border bg-white/50 dark:bg-app-card/50 backdrop-blur-md shadow-sm relative">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${portalGradient} flex items-center justify-center shadow-md`}>
            <Terminal className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-app-text-h mr-4 lg:mr-8">TblInc Cloud</span>
          
          <div className="hidden md:flex items-center gap-6 text-sm font-bold text-gray-500 dark:text-gray-400">
            <a href="#" className="hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer">Features</a>
            <a href="#" className="hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer">Pricing</a>
            <a href="#" className="hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer">Documentation</a>
            
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-2"></div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToGateway}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/80 dark:bg-app-card/60 backdrop-blur-md hover:bg-gray-100 dark:hover:bg-app-border-dim border border-app-border text-app-text transition-all cursor-pointer text-xs font-bold shadow-sm"
          >
            Back to Gateway
          </button>
          
          <button
            onClick={cycleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 dark:bg-app-card/60 backdrop-blur-md hover:bg-gray-100 dark:hover:bg-app-border-dim border border-app-border text-app-text transition-all cursor-pointer text-xs font-bold shadow-sm"
            title={`Theme: ${themeConfig[theme].label} → click for ${themeConfig[theme].next}`}
          >
            {themeConfig[theme].icon}
            <span className="hidden sm:inline text-app-text-h">{themeConfig[theme].label}</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area - Split Screen */}
      <div className="flex flex-1 w-full z-10">
        
        {/* Left Side: Branding / Imagery (Hidden on small screens) */}
        <div className="hidden lg:flex flex-col justify-center items-start w-1/2 p-16 xl:p-24 relative">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-xl"
          >
            <div className={`w-20 h-20 mb-8 rounded-3xl bg-gradient-to-br ${portalGradient} flex items-center justify-center shadow-2xl`}>
              <Terminal className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl xl:text-6xl font-black text-app-text-h mb-6 leading-tight tracking-tight">
              TblInc Cloud <br />
              <span className={`text-transparent bg-clip-text bg-gradient-to-r ${portalGradient}`}>
                {portal === 'admin' ? 'Admin Portal' : 'Member Portal'}
              </span>
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 leading-relaxed max-w-md">
              Experience the next generation of cloud infrastructure. Manage instances, networks, and storage with unparalleled ease and speed.
            </p>
            
            <div className="flex gap-4">
              <div className="px-5 py-3 rounded-2xl bg-app-card/40 border border-app-border backdrop-blur-sm">
                <div className="font-bold text-app-text-h text-xl">99.9%</div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Uptime</div>
              </div>
              <div className="px-5 py-3 rounded-2xl bg-app-card/40 border border-app-border backdrop-blur-sm">
                <div className="font-bold text-app-text-h text-xl">Global</div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Coverage</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-md p-8 sm:p-10 rounded-3xl border border-app-border/80 bg-app-card/60 backdrop-blur-2xl shadow-2xl relative"
          >
            <div className="flex flex-col items-center gap-3 mb-8 lg:hidden">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${portalGradient} flex items-center justify-center shadow-lg`}>
                <Terminal className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-app-text-h m-0">TblInc Cloud</h2>
            </div>
            
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-app-text-h mb-2">
                {isRegistering ? 'Create an account' : 'Welcome back'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isRegistering 
                  ? `Enter your details to create your account.` 
                  : portal === 'admin'
                    ? 'Enter your superuser credentials to access the Admin console.'
                    : `Enter your credentials to access the Member portal.`}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <AnimatePresence mode="popLayout">
                {isRegistering && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Username</label>
                      <div className="relative group">
                        <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                          type="text"
                          required
                          placeholder="johndoe"
                          value={authUsername}
                          onChange={(e) => setAuthUsername(e.target.value)}
                          className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-app-border bg-app-card/80 text-app-text-h placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Physical Address</label>
                      <div className="relative group">
                        <Globe className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                          type="text"
                          required
                          placeholder="123 Cloud St, Silicon Valley, CA"
                          value={authAddress}
                          onChange={(e) => setAuthAddress(e.target.value)}
                          className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-app-border bg-app-card/80 text-app-text-h placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="email"
                    required
                    placeholder="name@domain.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-app-border bg-app-card/80 text-app-text-h placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Password</label>
                  {!isRegistering && (
                    <a href="#" className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 transition-colors">Forgot password?</a>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-app-border bg-app-card/80 text-app-text-h placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                  />
                </div>
              </div>

              <AnimatePresence>
                {authError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-start gap-3 text-sm font-medium"
                  >
                    <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </motion.div>
                )}

                {authSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-start gap-3 text-sm font-medium"
                  >
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{authSuccess}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                className={`w-full py-4 mt-4 bg-gradient-to-r text-white rounded-xl font-bold shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${portalColors}`}
              >
                {isRegistering ? (
                  <>
                    Create Account
                    <ArrowRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    {portal === 'admin' ? 'Sign In to Admin' : 'Sign In to Member'}
                  </>
                )}
              </motion.button>

              {portal !== 'admin' && (
                <>
                  <div className="relative flex py-4 items-center">
                    <div className="flex-grow border-t border-app-border-dim"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-xs font-bold uppercase tracking-widest">Or continue with</span>
                    <div className="flex-grow border-t border-app-border-dim"></div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleGithubLogin}
                      disabled={githubLoading}
                      className="py-3 bg-gray-900 hover:bg-gray-800 dark:bg-[#1e2327] dark:hover:bg-[#292f34] text-white rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg border border-transparent dark:border-[#292f34] text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {githubLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                      ) : (
                        <Github className="w-4 h-4" />
                      )}
                      GitHub
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={googleLoading}
                      className="py-3 bg-white hover:bg-gray-50 dark:bg-app-card dark:hover:bg-app-border-dim text-gray-800 dark:text-app-text-h rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg border border-gray-200 dark:border-app-border text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {googleLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 rounded-full"
                        />
                      ) : (
                        <GoogleIcon className="w-4 h-4" />
                      )}
                      Google
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handlePasskey}
                      disabled={passkeyLoading}
                      title={isRegistering ? 'Register a passkey' : 'Sign in with passkey'}
                      className="py-3 bg-gradient-to-br from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {passkeyLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                      ) : (
                        <Fingerprint className="w-4 h-4" />
                      )}
                      Passkey
                    </motion.button>
                  </div>
                </>
              )}
            </form>

            <div className="mt-8 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
              {isRegistering ? (
                <p>
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setIsRegistering(false);
                      setAuthError('');
                    }}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors font-bold cursor-pointer"
                  >
                    Log In
                  </button>
                </p>
              ) : portal !== 'admin' ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    onClick={() => {
                      setIsRegistering(true);
                      setAuthError('');
                    }}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors font-bold cursor-pointer"
                  >
                    Sign Up
                  </button>
                </p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-600">
                  Admin accounts are provisioned by the system administrator.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* GitHub Auth Popup Modal */}
      <AnimatePresence>
        {showGithubAuthPopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm bg-app-card border border-app-border rounded-2xl shadow-2xl p-6"
            >
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 bg-[#1e2327] rounded-full flex items-center justify-center shadow-lg">
                  <Github className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-app-text-h mb-1">GitHub Authorization</h3>
                  <p className="text-sm text-gray-500">TblInc Cloud is requesting access to your GitHub account.</p>
                </div>
                
                <div className="w-full space-y-3 mt-4">
                  <button 
                    onClick={handleGithubAuthorize}
                    disabled={githubLoading}
                    className="w-full py-3 bg-[#2ea44f] hover:bg-[#2c974b] text-white rounded-xl font-bold transition flex justify-center items-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {githubLoading ? (
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      'Authorize TblInc Cloud'
                    )}
                  </button>
                  <button 
                    onClick={() => setShowGithubAuthPopup(false)}
                    disabled={githubLoading}
                    className="w-full py-3 bg-app-card hover:bg-app-border-dim text-app-text rounded-xl font-bold transition border border-app-border cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
