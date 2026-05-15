import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import appLogo from '../../imports/immunotrace-logo-icon.png';
import { 
  Mail, 
  Lock, 
  User, 
  Calendar, 
  Ruler, 
  Weight, 
  Droplet, 
  AlertCircle, 
  MapPin, 
  ArrowRight,
  ChevronLeft,
  ChevronDown,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LandingPage() {
  const navigate = useNavigate();
  const { user, login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [signupStep, setSignupStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    age: '',
    height: '',
    weight: '',
    bloodGroup: '',
    allergy: '',
    location: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupStep === 1) {
      setSignupStep(2);
    } else {
      setLoading(true);
      setError('');
      try {
        await signup({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          age: formData.age ? Number(formData.age) : undefined,
          blood_group: formData.bloodGroup,
          height_cm: formData.height ? Number(formData.height) : undefined,
          weight_kg: formData.weight ? Number(formData.weight) : undefined,
          allergies: formData.allergy,
          location: formData.location,
        });
        navigate('/dashboard');
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Signup failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F4F7F6] font-sans flex items-center justify-center overflow-hidden">
      {/* Soft background ambient glows - Teal/Emerald */}
      <div className="absolute top-0 left-0 w-[1000px] h-[1000px] bg-[#2EC4B6]/15 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-[#0F3D3E]/10 rounded-full blur-3xl translate-x-1/4 translate-y-1/4 pointer-events-none" />

      {/* Decorative floating elements */}
      <motion.div 
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-20 right-32 w-24 h-24 bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl shadow-xl flex items-center justify-center rotate-12"
      >
        <img src={appLogo.src} alt="Logo" className="w-12 h-12 object-contain" />
      </motion.div>
      <motion.div 
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-32 left-32 w-16 h-16 bg-[#0F3D3E]/10 backdrop-blur-lg border border-[#0F3D3E]/20 rounded-2xl flex items-center justify-center -rotate-6"
      >
        <Activity className="w-8 h-8 text-[#0F3D3E]" />
      </motion.div>

      {/* Main Card Container */}
      <div className="relative z-10 w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center p-6">
        
        {/* Left Side: Brand & Hero Text */}
        <div className="hidden md:flex flex-col justify-center px-12 text-[#0F3D3E]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 flex items-center justify-center shadow-lg">
              <img src={appLogo.src} alt="HealthWise" className="w-10 h-10 object-contain" />
            </div>
            <h1 className="text-3xl font-heading font-extrabold tracking-tight">HealthWise</h1>
          </div>
          <h2 className="text-5xl font-heading font-bold leading-tight mb-6">
            Your Personal <br />
            <span className="text-[#2EC4B6]">Health Historian</span>
          </h2>
          <p className="text-lg text-[#0F3D3E]/70 leading-relaxed mb-8">
            Track your vitals, explore AI-powered insights, and keep your clinical data organized with a secure, beautifully crafted ambient dashboard.
          </p>
          <div className="flex gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#F4F7F6] bg-slate-200 overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                </div>
              ))}
            </div>
            <p className="text-sm text-[#0F3D3E]/60 flex items-center">
              Join 10,000+ members <br/> tracking their health
            </p>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <motion.div 
          layout
          className="bg-white/70 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] shadow-[0_20px_50px_rgba(15,61,62,0.08)] p-8 relative overflow-hidden"
        >
          {/* Top Tabs */}
          <div className="flex items-center p-1 bg-[#0F3D3E]/5 rounded-full mb-8 relative">
            <button
              onClick={() => { setMode('login'); setSignupStep(1); setError(''); }}
              className={`flex-1 py-3 text-sm font-semibold rounded-full z-10 transition-colors ${mode === 'login' ? 'text-white' : 'text-[#0F3D3E]/60 hover:text-[#0F3D3E]'}`}
            >
              Log In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 py-3 text-sm font-semibold rounded-full z-10 transition-colors ${mode === 'signup' ? 'text-white' : 'text-[#0F3D3E]/60 hover:text-[#0F3D3E]'}`}
            >
              Create Account
            </button>
            {/* Active Pill Indicator */}
            <motion.div 
              layoutId="authTab"
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#0F3D3E] rounded-full z-0 shadow-md"
              initial={false}
              animate={{
                left: mode === 'login' ? '4px' : 'calc(50% + 0px)'
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>

          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.form 
                key="login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleLoginSubmit}
                className="space-y-5"
              >
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-[#0F3D3E]">Welcome back</h3>
                  <p className="text-[#0F3D3E]/60 text-sm">Enter your credentials to access your dashboard.</p>
                </div>

                <div className="space-y-4 mt-6">
                  {error ? (
                    <div className="text-sm bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-xl">
                      {error}
                    </div>
                  ) : null}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-[#0F3D3E]/40" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="Email address"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-white/60 focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 rounded-2xl outline-none text-[#0F3D3E] placeholder-[#0F3D3E]/40 transition-all shadow-sm"
                      disabled={loading}
                    />
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-[#0F3D3E]/40" />
                    </div>
                    <input
                      type="password"
                      name="password"
                      required
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-white/60 focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 rounded-2xl outline-none text-[#0F3D3E] placeholder-[#0F3D3E]/40 transition-all shadow-sm"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm mt-2">
                  <label className="flex items-center gap-2 text-[#0F3D3E]/70 cursor-pointer">
                    <input type="checkbox" className="rounded border-[#0F3D3E]/20 text-[#2EC4B6] focus:ring-[#2EC4B6]" />
                    Remember me
                  </label>
                  <a href="#" className="text-[#2EC4B6] font-medium hover:underline">Forgot password?</a>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 py-4 bg-[#2EC4B6] hover:bg-[#20A498] text-white rounded-2xl font-semibold shadow-[0_8px_20px_rgba(46,196,182,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {loading ? 'Logging in...' : 'Log In'} <ArrowRight className="w-5 h-5" />
                </button>
              </motion.form>

            ) : (
              <motion.form 
                key="signup-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSignupSubmit}
                className="space-y-5"
              >
                {signupStep === 1 ? (
                  <motion.div 
                    key="step-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="space-y-1 mb-6">
                      <h3 className="text-2xl font-bold text-[#0F3D3E]">Create Account</h3>
                      <p className="text-[#0F3D3E]/60 text-sm">Step 1 of 2: Let's build your health profile.</p>
                    </div>

                    {error ? (
                      <div className="text-sm bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-xl">
                        {error}
                      </div>
                    ) : null}

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-[#0F3D3E]/40" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full pl-11 pr-4 py-3 bg-white/50 border border-white/60 focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 rounded-2xl outline-none text-[#0F3D3E] placeholder-[#0F3D3E]/40 transition-all shadow-sm"
                        disabled={loading}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Calendar className="h-5 w-5 text-[#0F3D3E]/40" />
                        </div>
                        <input
                          type="number"
                          name="age"
                          required
                          placeholder="Age"
                          value={formData.age}
                          onChange={handleInputChange}
                          className="w-full pl-11 pr-4 py-3 bg-white/50 border border-white/60 focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 rounded-2xl outline-none text-[#0F3D3E] placeholder-[#0F3D3E]/40 transition-all shadow-sm"
                          disabled={loading}
                        />
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Droplet className="h-5 w-5 text-[#0F3D3E]/40" />
                        </div>
                        <select
                          name="bloodGroup"
                          required
                          value={formData.bloodGroup}
                          onChange={handleInputChange}
                          className="w-full pl-11 pr-10 py-3 bg-white/50 border border-white/60 focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 rounded-2xl outline-none text-[#0F3D3E] transition-all shadow-sm appearance-none"
                          disabled={loading}
                        >
                          <option value="" disabled className="text-[#0F3D3E]/40">Blood Group</option>
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                            <option key={bg} value={bg}>{bg}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <ChevronDown className="h-5 w-5 text-[#0F3D3E]/40" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Ruler className="h-5 w-5 text-[#0F3D3E]/40" />
                        </div>
                        <input
                          type="text"
                          name="height"
                          required
                          placeholder="Height (cm)"
                          value={formData.height}
                          onChange={handleInputChange}
                          className="w-full pl-11 pr-4 py-3 bg-white/50 border border-white/60 focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 rounded-2xl outline-none text-[#0F3D3E] placeholder-[#0F3D3E]/40 transition-all shadow-sm"
                          disabled={loading}
                        />
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Weight className="h-5 w-5 text-[#0F3D3E]/40" />
                        </div>
                        <input
                          type="text"
                          name="weight"
                          required
                          placeholder="Weight (kg)"
                          value={formData.weight}
                          onChange={handleInputChange}
                          className="w-full pl-11 pr-4 py-3 bg-white/50 border border-white/60 focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 rounded-2xl outline-none text-[#0F3D3E] placeholder-[#0F3D3E]/40 transition-all shadow-sm"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <AlertCircle className="h-5 w-5 text-[#0F3D3E]/40" />
                      </div>
                      <input
                        type="text"
                        name="allergy"
                        placeholder="Any allergies? (Optional)"
                        value={formData.allergy}
                        onChange={handleInputChange}
                        className="w-full pl-11 pr-4 py-3 bg-white/50 border border-white/60 focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 rounded-2xl outline-none text-[#0F3D3E] placeholder-[#0F3D3E]/40 transition-all shadow-sm"
                        disabled={loading}
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-[#0F3D3E]/40" />
                      </div>
                      <input
                        type="text"
                        name="location"
                        required
                        placeholder="Location (City, Country)"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="w-full pl-11 pr-4 py-3 bg-white/50 border border-white/60 focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 rounded-2xl outline-none text-[#0F3D3E] placeholder-[#0F3D3E]/40 transition-all shadow-sm"
                        disabled={loading}
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full mt-6 py-4 bg-[#0F3D3E] hover:bg-[#114748] text-white rounded-2xl font-semibold shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      Next Step <ArrowRight className="w-5 h-5" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="step-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="space-y-1 mb-6 flex items-center gap-3">
                      <button 
                        type="button" 
                        onClick={() => setSignupStep(1)}
                        className="w-10 h-10 rounded-full bg-[#0F3D3E]/5 flex items-center justify-center text-[#0F3D3E] hover:bg-[#0F3D3E]/10 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <div>
                        <h3 className="text-2xl font-bold text-[#0F3D3E]">Secure Account</h3>
                        <p className="text-[#0F3D3E]/60 text-sm">Step 2 of 2: Set your login credentials.</p>
                      </div>
                    </div>

                    {error ? (
                      <div className="text-sm bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-xl">
                        {error}
                      </div>
                    ) : null}

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-[#0F3D3E]/40" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="Email address"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-white/60 focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 rounded-2xl outline-none text-[#0F3D3E] placeholder-[#0F3D3E]/40 transition-all shadow-sm"
                        disabled={loading}
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-[#0F3D3E]/40" />
                      </div>
                      <input
                        type="password"
                        name="password"
                        required
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-white/60 focus:border-[#2EC4B6] focus:ring-2 focus:ring-[#2EC4B6]/20 rounded-2xl outline-none text-[#0F3D3E] placeholder-[#0F3D3E]/40 transition-all shadow-sm"
                        disabled={loading}
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full mt-6 py-4 bg-[#2EC4B6] hover:bg-[#20A498] text-white rounded-2xl font-semibold shadow-[0_8px_20px_rgba(46,196,182,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {loading ? 'Creating account...' : 'Complete Sign Up'} <ArrowRight className="w-5 h-5" />
                    </button>
                    
                    <p className="text-xs text-center text-[#0F3D3E]/50 mt-4 px-4">
                      By completing sign up, you agree to our Terms of Service and Privacy Policy.
                    </p>
                  </motion.div>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

      </div>
    </div>
  );
}
