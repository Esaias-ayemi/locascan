/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { 
  QrCode, 
  MapPin, 
  User, 
  LogOut, 
  LayoutDashboard, 
  BookOpen, 
  CheckCircle, 
  AlertCircle,
  Plus,
  RefreshCw,
  BarChart3,
  ChevronRight,
  Scan,
  Clock,
  Calendar,
  XCircle,
  Home,
  Settings,
  Mail,
  Lock,
  Shield,
  X,
  ArrowRight,
  Zap,
  Globe,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { cn } from './lib/utils';

// --- Types ---
interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'lecturer';
  onboarding_completed: boolean;
  level?: string;
  department?: string;
  matric_number?: string;
  staff_id?: string;
  phone_number?: string;
}

interface Course {
  id: string;
  course_code: string;
  course_title: string;
}

interface Session {
  id: string;
  course_id: string;
  qr_token: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  expires_at: string;
  is_active: boolean;
}

// --- API Config ---
const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Components ---

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'navy',
  size?: 'sm' | 'md' | 'lg'
}>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-black text-white hover:bg-zinc-800',
      secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200',
      outline: 'border border-zinc-200 bg-transparent hover:bg-zinc-50',
      ghost: 'bg-transparent hover:bg-zinc-100 text-zinc-600',
      danger: 'bg-red-500 text-white hover:bg-red-600',
      navy: 'bg-navy-900 text-white hover:bg-navy-800',
    };
    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3.5 text-base',
    };
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm', className)}>
    {children}
  </div>
);

const Onboarding = ({ user, onComplete }: { user: User; onComplete: (u: User) => void }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone_number: user.phone_number || '',
    level: user.level || '',
    department: user.department || '',
    matric_number: user.matric_number || '',
    staff_id: user.staff_id || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.put('/profile', { ...formData, onboarding_completed: true });
      const res = await api.get('/profile');
      onComplete(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="w-full max-w-5xl grid md:grid-cols-2 gap-12 items-center"
        >
          <div className="space-y-8">
            <div className="bg-navy-900 text-white p-3 rounded-2xl w-fit">
              <User className="h-8 w-8" />
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-none">
                Complete your <br />
                <span className="text-zinc-400 italic">profile.</span>
              </h1>
              <p className="text-lg text-zinc-500 leading-relaxed max-w-sm">
                We need a few more details to personalize your {user.role} experience.
              </p>
            </div>
            
            <div className="hidden md:block space-y-6 pt-8">
              <div className="flex items-center gap-4 text-zinc-400">
                <div className="w-10 h-10 rounded-full border border-zinc-100 flex items-center justify-center font-bold text-sm">1</div>
                <span className="font-medium">Account Created</span>
              </div>
              <div className="flex items-center gap-4 text-navy-900">
                <div className="w-10 h-10 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-sm">2</div>
                <span className="font-medium">Profile Details</span>
              </div>
              <div className="flex items-center gap-4 text-zinc-400">
                <div className="w-10 h-10 rounded-full border border-zinc-100 flex items-center justify-center font-bold text-sm">3</div>
                <span className="font-medium">Ready to Go</span>
              </div>
            </div>
          </div>

          <Card className="p-10 border-zinc-100 shadow-2xl shadow-navy-900/5 rounded-[2.5rem]">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Data Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                  <Mail className="h-4 w-4 text-navy-900" />
                  <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider">Personal Data</h3>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Full Name</label>
                  <Input 
                    className="h-14 rounded-2xl bg-zinc-50 border-transparent focus:bg-white focus:border-navy-900 transition-all"
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Email (Read-only)</label>
                    <Input 
                      className="h-14 rounded-2xl bg-zinc-100 border-transparent cursor-not-allowed opacity-70"
                      value={user.email} 
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Phone Number</label>
                    <Input 
                      className="h-14 rounded-2xl bg-zinc-50 border-transparent focus:bg-white focus:border-navy-900 transition-all"
                      placeholder="08012345678"
                      value={formData.phone_number} 
                      onChange={e => setFormData({ ...formData, phone_number: e.target.value })} 
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* Student/Lecturer Details Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                  <BookOpen className="h-4 w-4 text-navy-900" />
                  <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider">
                    {user.role === 'student' ? 'Student Details' : 'Staff Details'}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Department</label>
                    <select 
                      className="flex h-14 w-full rounded-2xl border-transparent bg-zinc-50 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 focus:bg-white focus:border-navy-900 transition-all"
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                      required
                    >
                      <option value="">Select</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                    </select>
                  </div>
                  {user.role === 'student' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Level</label>
                      <select 
                        className="flex h-14 w-full rounded-2xl border-transparent bg-zinc-50 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 focus:bg-white focus:border-navy-900 transition-all"
                        value={formData.level}
                        onChange={e => setFormData({ ...formData, level: e.target.value })}
                        required
                      >
                        <option value="">Select</option>
                        <option value="100">100 Level</option>
                        <option value="200">200 Level</option>
                        <option value="300">300 Level</option>
                        <option value="400">400 Level</option>
                        <option value="500">500 Level</option>
                      </select>
                    </div>
                  )}
                </div>

                {user.role === 'student' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Matric Number</label>
                    <Input 
                      className="h-14 rounded-2xl bg-zinc-50 border-transparent focus:bg-white focus:border-navy-900 transition-all"
                      value={formData.matric_number} 
                      onChange={e => setFormData({ ...formData, matric_number: e.target.value })} 
                      required 
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <Button className="w-full h-14 rounded-2xl text-lg bg-navy-900 hover:bg-navy-800 shadow-xl shadow-navy-900/20" disabled={loading}>
                {loading ? 'Saving...' : 'Complete Registration'}
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-navy-900 font-sans selection:bg-navy-100">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tight">
            <div className="bg-navy-900 text-white p-1.5 rounded-xl">
              <CheckCircle className="h-6 w-6" />
            </div>
            LocaScan
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-500">
            <a href="#features" className="hover:text-navy-900 transition-colors">Features</a>
            <a href="#about" className="hover:text-navy-900 transition-colors">About</a>
            <a href="#how-it-works" className="hover:text-navy-900 transition-colors">How it Works</a>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/login')}>Login</Button>
            <Button variant="navy" onClick={() => navigate('/login')}>Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
        </div>
        <div className="max-w-7xl mx-auto text-center space-y-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-navy-50 text-navy-600 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              Next-Gen Attendance Tracking
            </span>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-[0.9] mb-8">
              Secure. Bi-Modal.<br />
              <span className="text-zinc-400 italic">Seamless.</span>
            </h1>
            <p className="text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">
              A dynamic QR and GPS-based attendance tracking system designed for modern educational institutions. Eliminate proxy attendance with precision.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
          >
            <Button size="lg" variant="navy" className="h-16 px-10 text-lg rounded-2xl shadow-2xl shadow-navy-900/20" onClick={() => navigate('/login')}>
              Start Tracking Now
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-16 px-10 text-lg rounded-2xl" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              See Features
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-zinc-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: QrCode,
                title: "Dynamic QR Codes",
                description: "Codes rotate every 60 seconds to prevent students from sharing photos of the screen.",
                color: "bg-blue-500"
              },
              {
                icon: MapPin,
                title: "GPS Geofencing",
                description: "Attendance is only marked if the student is physically within the lecturer's defined radius.",
                color: "bg-emerald-500"
              },
              {
                icon: BarChart3,
                title: "Real-time Analytics",
                description: "Instant insights into student engagement and attendance patterns for lecturers.",
                color: "bg-purple-500"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-8 transition-transform group-hover:scale-110", feature.color)}>
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-zinc-500 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <h2 className="text-5xl font-bold tracking-tight leading-none">
              Why Bi-Modal Attendance?
            </h2>
            <p className="text-lg text-zinc-500 leading-relaxed">
              Traditional attendance methods are prone to manipulation. Our platform combines visual verification (QR) with spatial verification (GPS) to create a foolproof system.
            </p>
            <div className="space-y-4">
              {[
                "Eliminate proxy attendance completely",
                "Automated reporting and CSV exports",
                "Mobile-first design for students on the go",
                "Secure and encrypted data handling"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-navy-900 flex items-center justify-center text-white">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-navy-500 to-blue-500 rounded-[3rem] blur-2xl opacity-20 animate-pulse" />
            <div className="relative bg-navy-900 rounded-[3rem] p-12 text-white aspect-square flex flex-col justify-center">
              <div className="space-y-6">
                <div className="text-6xl font-bold">99.9%</div>
                <div className="text-xl opacity-80 uppercase tracking-widest font-medium">Accuracy Rate</div>
                <div className="h-1 w-24 bg-white/20" />
                <p className="text-lg opacity-60">
                  Our dual-verification process ensures that every attendance record is authentic and verified by both time and space.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-zinc-100 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tight">
            <div className="bg-navy-900 text-white p-1.5 rounded-xl">
              <CheckCircle className="h-6 w-6" />
            </div>
            LocaScan
          </div>
          <div className="flex gap-10 text-sm font-medium text-zinc-400">
            <a href="#" className="hover:text-navy-900 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-navy-900 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-navy-900 transition-colors">Contact Us</a>
          </div>
          <div className="text-zinc-400 text-sm">
            © 2026 LocaScan Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
const Login = ({ setUser }: { setUser: (u: User) => void }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student' | 'lecturer'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (isResetPassword) {
        await api.post('/auth/reset-password', { token: resetToken, newPassword });
        setSuccess('Password reset successful! Please login.');
        setIsResetPassword(false);
        setIsForgotPassword(false);
      } else if (isForgotPassword) {
        const res = await api.post('/auth/forgot-password', { email });
        setSuccess(res.data.message);
        if (res.data.debugToken) {
          console.log("Debug Token (Normal in test env):", res.data.debugToken);
          setResetToken(res.data.debugToken); // Auto-fill for convenience in this environment
          setIsResetPassword(true);
        }
      } else if (isRegister) {
        await api.post('/auth/register', { name, email, password, role });
        setIsRegister(false);
        setSuccess('Registration successful! Please login.');
      } else {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 font-bold text-3xl tracking-tight mb-4">
              <div className="bg-navy-900 text-white p-2 rounded-2xl">
                <CheckCircle className="h-7 w-7" />
              </div>
              LocaScan
            </div>
            <p className="text-zinc-400 font-medium">
              {isResetPassword ? 'Enter your new password' : 
               isForgotPassword ? 'Reset your account password' :
               isRegister ? 'Create your account to get started' : 
               'Welcome back, please login to your account'}
            </p>
          </div>

          <Card className="p-10 border-zinc-100 shadow-2xl shadow-navy-900/5 rounded-[2.5rem]">
            <form onSubmit={handleSubmit} className="space-y-6">
              {isResetPassword ? (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Reset Token</label>
                    <Input 
                      className="h-14 rounded-2xl bg-zinc-50 border-transparent focus:bg-white focus:border-navy-900 transition-all"
                      value={resetToken} 
                      onChange={(e) => setResetToken(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">New Password</label>
                    <Input 
                      className="h-14 rounded-2xl bg-zinc-50 border-transparent focus:bg-white focus:border-navy-900 transition-all"
                      type="password" 
                      placeholder="••••••••"
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      required 
                    />
                  </div>
                </>
              ) : isForgotPassword ? (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Email Address</label>
                  <Input 
                    className="h-14 rounded-2xl bg-zinc-50 border-transparent focus:bg-white focus:border-navy-900 transition-all"
                    type="email" 
                    placeholder="name@university.edu"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </div>
              ) : (
                <>
                  {isRegister && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Full Name</label>
                      <Input 
                        className="h-14 rounded-2xl bg-zinc-50 border-transparent focus:bg-white focus:border-navy-900 transition-all"
                        placeholder="John Doe"
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        required 
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Email Address</label>
                    <Input 
                      className="h-14 rounded-2xl bg-zinc-50 border-transparent focus:bg-white focus:border-navy-900 transition-all"
                      type="email" 
                      placeholder="name@university.edu"
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Password</label>
                      {!isRegister && (
                        <button 
                          type="button"
                          onClick={() => setIsForgotPassword(true)}
                          className="text-[10px] font-bold text-navy-600 hover:text-navy-900 uppercase tracking-widest"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <Input 
                      className="h-14 rounded-2xl bg-zinc-50 border-transparent focus:bg-white focus:border-navy-900 transition-all"
                      type="password" 
                      placeholder="••••••••"
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                    />
                  </div>
                  {isRegister && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">I am a...</label>
                      <select 
                        className="flex h-14 w-full rounded-2xl border-transparent bg-zinc-50 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 focus:bg-white focus:border-navy-900 transition-all"
                        value={role}
                        onChange={(e) => setRole(e.target.value as any)}
                      >
                        <option value="student">Student</option>
                        <option value="lecturer">Lecturer</option>
                      </select>
                    </div>
                  )}
                </>
              )}
              
              {error && (
                <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-600">
                  <CheckCircle className="h-4 w-4" />
                  {success}
                </div>
              )}
              
              <Button className="w-full h-14 rounded-2xl text-lg bg-navy-900 hover:bg-navy-800 shadow-xl shadow-navy-900/20" disabled={loading}>
                {loading ? 'Processing...' : 
                 isResetPassword ? 'Reset Password' :
                 isForgotPassword ? 'Send Reset Link' : 
                 isRegister ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-8 text-center space-y-4">
              <button 
                onClick={() => {
                  setIsRegister(!isRegister);
                  setIsForgotPassword(false);
                  setIsResetPassword(false);
                  setError('');
                  setSuccess('');
                }}
                className="text-sm font-bold text-zinc-400 hover:text-navy-900 transition-colors uppercase tracking-widest"
              >
                {isRegister ? 'Already have an account? Login' : 
                 isForgotPassword ? 'Back to Login' :
                 "Don't have an account? Sign Up"}
              </button>
              {isForgotPassword && (
                <div>
                  <button 
                    onClick={() => {
                      setIsForgotPassword(false);
                      setIsResetPassword(false);
                      setSuccess('');
                      setError('');
                    }}
                    className="text-xs font-bold text-zinc-300 hover:text-zinc-500 uppercase tracking-widest transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </Card>
          
          <div className="mt-8 text-center">
            <button 
              onClick={() => navigate('/')}
              className="text-xs font-bold text-zinc-300 hover:text-zinc-500 uppercase tracking-widest transition-colors"
            >
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};


// --- Lecturer Dashboard ---

const LecturerDashboard = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'analytics' | 'attendance' | 'settings'>('home');
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({ code: '', title: '', level: '', department: '', required_attendance: '70', expected_classes: '10' });
  const [courseStats, setCourseStats] = useState<any[]>([]);
  const [selectedCourseSessions, setSelectedCourseSessions] = useState<any[]>([]);
  const [sessionAttendance, setSessionAttendance] = useState<any[]>([]);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [manualLocation, setManualLocation] = useState(false);
  const [customCoords, setCustomCoords] = useState({ lat: '', lng: '', radius: '50' });
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    fetchCourses();
    fetchCourseStats();
  }, []);

  useEffect(() => {
    if (selectedCourse && activeTab === 'attendance') {
      fetchActiveSession(selectedCourse.id);
    }
  }, [selectedCourse, activeTab]);

  useEffect(() => {
    if (activeSession && activeSession.is_active) {
      timerRef.current = setInterval(() => {
        rotateQR();
      }, 55000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [activeSession]);

  const fetchCourses = async () => {
    const res = await api.get('/courses');
    setCourses(res.data);
  };

  const fetchCourseStats = async () => {
    const res = await api.get('/lecturer/courses/stats');
    setCourseStats(res.data);
  };

  const fetchActiveSession = async (courseId: string) => {
    const res = await api.get(`/sessions/active/${courseId}`);
    setActiveSession(res.data);
  };

  const fetchCourseSessions = async (courseId: string) => {
    const res = await api.get(`/lecturer/course/${courseId}/sessions`);
    setSelectedCourseSessions(res.data);
  };

  const fetchSessionAttendance = async (sessionId: string) => {
    const res = await api.get(`/lecturer/session/${sessionId}/attendance`);
    setSessionAttendance(res.data);
  };

  const addCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/courses', { 
        course_code: newCourse.code, 
        course_title: newCourse.title,
        level: newCourse.level,
        department: newCourse.department,
        required_attendance: parseInt(newCourse.required_attendance),
        expected_classes: parseInt(newCourse.expected_classes)
      });
      setNewCourse({ code: '', title: '', level: '', department: '', required_attendance: '70', expected_classes: '10' });
      setShowAddCourse(false);
      fetchCourses();
      fetchCourseStats();
      setStatus({ type: 'success', message: 'Course created successfully' });
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to create course' });
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    const radius = parseInt(customCoords.radius) || 50;

    const start = async (lat: number, lng: number) => {
      try {
        const res = await api.post('/sessions', {
          course_id: selectedCourse.id,
          latitude: lat,
          longitude: lng,
          radius_meters: radius
        });
        setActiveSession({
          ...res.data,
          course_id: selectedCourse.id,
          latitude: lat,
          longitude: lng,
          radius_meters: radius,
          is_active: true
        });
        setStatus({ type: 'success', message: 'Attendance session started' });
      } catch (err) {
        setStatus({ type: 'error', message: 'Failed to start session' });
      } finally {
        setLoading(false);
      }
    };

    if (manualLocation && customCoords.lat && customCoords.lng) {
      await start(parseFloat(customCoords.lat), parseFloat(customCoords.lng));
    } else {
      setStatus({ type: 'info', message: 'Requesting geolocation...' });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          start(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          let msg = 'Geolocation failed. Please enable location or use manual coordinates.';
          if (err.code === 1) msg = 'Location permission denied. Please enable it in your browser settings.';
          setStatus({ type: 'error', message: msg });
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  const rotateQR = async () => {
    if (!activeSession) return;
    const res = await api.post(`/sessions/rotate/${activeSession.id}`);
    setActiveSession(prev => prev ? { ...prev, qr_token: res.data.qr_token } : null);
  };

  const endSession = async () => {
    if (!activeSession) return;
    await api.post(`/sessions/end/${activeSession.id}`);
    setActiveSession(null);
    setStatus({ type: 'info', message: 'Session ended' });
    fetchCourseStats();
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-navy-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-2">Lecturer Portal</h2>
                <p className="text-navy-100 opacity-80">{user.department} • Staff ID: {user.staff_id}</p>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
                    <div className="text-2xl font-bold">{courses.length}</div>
                    <div className="text-xs uppercase tracking-wider opacity-60">My Courses</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
                    <div className="text-2xl font-bold">
                      {courseStats.reduce((acc, curr) => acc + curr.total_sessions, 0)}
                    </div>
                    <div className="text-xs uppercase tracking-wider opacity-60">Total Sessions</div>
                  </div>
                </div>
              </div>
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-navy-900">My Courses</h3>
                <Button size="sm" variant="outline" onClick={() => setShowAddCourse(true)} className="rounded-xl">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>

              {showAddCourse && (
                <Card className="p-6 border-navy-900/10 bg-navy-50/30">
                  <form onSubmit={addCourse} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="Code (e.g. CS101)" value={newCourse.code} onChange={e => setNewCourse({...newCourse, code: e.target.value})} required />
                      <Input placeholder="Title" value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <select 
                        className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none"
                        value={newCourse.department}
                        onChange={e => setNewCourse({...newCourse, department: e.target.value})}
                        required
                      >
                        <option value="">Department</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Physics">Physics</option>
                      </select>
                      <select 
                        className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none"
                        value={newCourse.level}
                        onChange={e => setNewCourse({...newCourse, level: e.target.value})}
                        required
                      >
                        <option value="">Level</option>
                        <option value="100">100</option>
                        <option value="200">200</option>
                        <option value="300">300</option>
                        <option value="400">400</option>
                        <option value="500">500</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">Min. Attendance (%)</label>
                        <Input type="number" placeholder="70" value={newCourse.required_attendance} onChange={e => setNewCourse({...newCourse, required_attendance: e.target.value})} required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">Expected Classes</label>
                        <Input type="number" placeholder="10" value={newCourse.expected_classes} onChange={e => setNewCourse({...newCourse, expected_classes: e.target.value})} required />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1 bg-navy-900" disabled={loading}>Create Course</Button>
                      <Button type="button" variant="ghost" onClick={() => setShowAddCourse(false)}>Cancel</Button>
                    </div>
                  </form>
                </Card>
              )}

              <div className="grid gap-3">
                {courses.map(course => (
                  <Card key={course.id} className="flex items-center justify-between p-4 border-zinc-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center text-navy-900 font-bold">
                        {course.course_code.substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-navy-900">{course.course_code}</div>
                        <div className="text-xs text-zinc-500">{course.course_title}</div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-300" />
                  </Card>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 'analytics':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <h2 className="text-2xl font-bold text-navy-900">Attendance Analytics</h2>
            <div className="grid gap-4">
              {courseStats.map(course => (
                <Card key={course.id} className="p-5 space-y-6 border-zinc-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-navy-900 text-lg">{course.course_code}</h4>
                      <p className="text-xs text-zinc-500">{course.course_title}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase">Students</div>
                      <div className="text-lg font-bold text-navy-900">{course.total_students}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-50">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase">Total Sessions</div>
                      <div className="text-sm font-bold text-navy-900">{course.total_sessions}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase">Active Attendance</div>
                      <div className="text-sm font-bold text-navy-900">{course.students_attended_at_least_once}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 rounded-xl"
                      onClick={() => {
                        setSelectedCourse(course);
                        fetchCourseSessions(course.id);
                        setShowStudentsModal(true);
                        setSelectedSession(null);
                        setSessionAttendance([]); // Clear session attendance
                      }}
                    >
                      Sessions
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 rounded-xl"
                      onClick={async () => {
                        setSelectedCourse(course);
                        const res = await api.get(`/analytics/course/${course.id}`);
                        setSessionAttendance(res.data.attendance.map((a: any) => ({
                          ...a,
                          percentage: res.data.expectedClasses > 0 ? Math.round((a.attended / res.data.expectedClasses) * 100) : 0,
                          currentPercentage: res.data.totalSessionsHeld > 0 ? Math.round((a.attended / res.data.totalSessionsHeld) * 100) : 0
                        })));
                        setShowStudentsModal(true);
                        setSelectedSession({ id: 'overall', isOverall: true });
                      }}
                    >
                      Students
                    </Button>
                    <Button 
                      variant="navy" 
                      size="sm" 
                      className="flex-1 rounded-xl"
                      onClick={async () => {
                        const res = await api.get(`/analytics/course/${course.id}`);
                        const csvData = res.data.attendance.map((a: any) => ({
                          Name: a.name,
                          Matric: a.matric_number,
                          Attended: a.attended,
                          Total: res.data.totalSessions,
                          Percentage: res.data.totalSessions > 0 ? `${Math.round((a.attended / res.data.totalSessions) * 100)}%` : '0%'
                        }));
                        downloadCSV(csvData, `${course.course_code}_attendance.csv`);
                      }}
                    >
                      CSV
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {showStudentsModal && selectedCourse && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                <motion.div 
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] flex flex-col"
                >
                  <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-navy-900 text-white">
                    <div>
                      <h3 className="text-xl font-bold">
                        {selectedSession?.isOverall ? 'Overall Attendance' : `${selectedCourse.course_code} Sessions`}
                      </h3>
                      <p className="text-xs opacity-70">
                        {selectedSession?.isOverall ? 'Student attendance percentages' : 'Select a session to view attendees'}
                      </p>
                    </div>
                    <Button variant="ghost" onClick={() => setShowStudentsModal(false)} className="text-white hover:bg-white/10">
                      <X className="h-6 w-6" />
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {!selectedSession ? (
                      <div className="grid gap-3">
                        {selectedCourseSessions.map(session => (
                          <button 
                            key={session.id}
                            onClick={() => {
                              setSelectedSession(session);
                              fetchSessionAttendance(session.id);
                            }}
                            className="flex items-center justify-between p-4 rounded-2xl border border-zinc-100 hover:border-navy-900 transition-all text-left group"
                          >
                            <div>
                              <div className="font-bold text-navy-900">{new Date(session.created_at).toLocaleDateString()}</div>
                              <div className="text-xs text-zinc-500">{new Date(session.created_at).toLocaleTimeString()}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-[10px] font-bold text-zinc-400 uppercase">Attendees</div>
                                <div className="text-sm font-bold text-navy-900">{session.attendance_count}</div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-navy-900" />
                            </div>
                          </button>
                        ))}
                        {selectedCourseSessions.length === 0 && (
                          <div className="text-center py-12 text-zinc-400">No sessions recorded for this course.</div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedSession(null)} className="mb-2">
                          <ChevronRight className="h-4 w-4 rotate-180 mr-1" /> Back to Sessions
                        </Button>
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-navy-900">
                            {selectedSession.isOverall ? 'Student List' : `Attendees (${sessionAttendance.length})`}
                          </h4>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => downloadCSV(sessionAttendance, `${selectedSession.isOverall ? 'Overall' : 'Session'}_Attendance.csv`)}
                          >
                            Download List
                          </Button>
                        </div>
                        <div className="grid gap-2">
                          {sessionAttendance.map((student, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl">
                              <div className="flex-1">
                                <div className="font-bold text-sm text-navy-900">{student.name}</div>
                                <div className="text-[10px] text-zinc-500">{student.matric_number}</div>
                              </div>
                              {selectedSession.isOverall ? (
                                <div className="text-right">
                                  <div className={cn(
                                    "text-sm font-bold",
                                    student.percentage < 70 ? "text-red-500" : "text-emerald-500"
                                  )}>
                                    {student.percentage}%
                                  </div>
                                  <div className="text-[10px] text-zinc-400">{student.attended} sessions</div>
                                </div>
                              ) : (
                                <div className="text-[10px] text-zinc-400">{new Date(student.signed_in_at).toLocaleTimeString()}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        );

      case 'attendance':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-navy-900">Start Attendance</h2>
              <p className="text-zinc-500 text-sm px-8">Select a course to generate a dynamic QR code for students to scan.</p>
            </div>

            <Card className="p-8 border-zinc-100">
              {courses.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-navy-50 rounded-full flex items-center justify-center mx-auto">
                    <BookOpen className="h-8 w-8 text-navy-900 opacity-20" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-navy-900">No Courses Found</h3>
                    <p className="text-sm text-zinc-500">You need to add courses in the Home tab before you can start attendance.</p>
                  </div>
                  <Button variant="outline" onClick={() => setActiveTab('home')}>Go to Home</Button>
                </div>
              ) : activeSession ? (
                <div className="flex flex-col items-center space-y-6">
                  <div className="p-6 bg-white rounded-3xl shadow-2xl border border-zinc-100">
                    <QRCodeSVG value={activeSession.qr_token} size={240} level="H" />
                  </div>
                  <div className="text-center space-y-4 w-full">
                    <div>
                      <h3 className="text-xl font-bold text-navy-900">{selectedCourse?.course_code}</h3>
                      <p className="text-sm text-zinc-500">Session is active and rotating</p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
                      <Clock className="h-4 w-4" />
                      QR code updates every 60 seconds
                    </div>
                    <Button variant="danger" onClick={endSession} className="w-full h-14 text-lg rounded-2xl mt-4">
                      End Attendance Session
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-navy-900 uppercase tracking-wider">Select Course</label>
                    <div className="grid gap-3">
                      {courses.map(course => (
                        <button
                          key={course.id}
                          onClick={() => setSelectedCourse(course)}
                          className={cn(
                            "w-full flex items-center justify-between p-5 rounded-2xl border transition-all text-left",
                            selectedCourse?.id === course.id 
                              ? "border-navy-900 bg-navy-900 text-white shadow-lg" 
                              : "border-zinc-100 bg-zinc-50 hover:border-zinc-200"
                          )}
                        >
                          <div>
                            <div className="font-bold">{course.course_code}</div>
                            <div className={cn("text-xs opacity-70", selectedCourse?.id === course.id ? "text-white" : "text-zinc-500")}>
                              {course.course_title}
                            </div>
                          </div>
                          {selectedCourse?.id === course.id && <CheckCircle className="h-5 w-5" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-zinc-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-navy-900 uppercase">Location Restriction</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400">Manual</span>
                        <input 
                          type="checkbox" 
                          checked={manualLocation} 
                          onChange={e => setManualLocation(e.target.checked)}
                          className="h-4 w-4 rounded border-zinc-300 text-navy-900 focus:ring-navy-900"
                        />
                      </div>
                    </div>

                    {manualLocation && (
                      <div className="grid grid-cols-2 gap-3">
                        <Input placeholder="Lat" value={customCoords.lat} onChange={e => setCustomCoords({...customCoords, lat: e.target.value})} />
                        <Input placeholder="Lng" value={customCoords.lng} onChange={e => setCustomCoords({...customCoords, lng: e.target.value})} />
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase">
                        <span>Radius</span>
                        <span>{customCoords.radius} meters</span>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max="500" 
                        step="10"
                        value={customCoords.radius}
                        onChange={e => setCustomCoords({...customCoords, radius: e.target.value})}
                        className="w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-navy-900"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={startSession} 
                    disabled={loading || !selectedCourse} 
                    className="w-full h-16 text-lg bg-navy-900 hover:bg-navy-800 rounded-2xl shadow-xl shadow-navy-900/20"
                  >
                    {loading ? <RefreshCw className="h-6 w-6 animate-spin" /> : 'Start Attendance'}
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        );

      case 'settings':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <h2 className="text-2xl font-bold text-navy-900">Settings</h2>
            
            <div className="space-y-3">
              <Card className="p-6 border-zinc-100 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-navy-900 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-navy-900 text-lg">{user.name}</h3>
                    <p className="text-zinc-500 text-sm">{user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-50">
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase">Email</div>
                    <div className="text-sm font-medium text-navy-900 truncate">{user.email}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase">Department</div>
                    <div className="text-sm font-medium text-navy-900">{user.department || 'N/A'}</div>
                  </div>
                </div>
              </Card>

              <div className="space-y-2">
                <button className="w-full flex items-center justify-between p-4 bg-zinc-50 rounded-2xl text-zinc-600 hover:bg-zinc-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5" />
                    <span className="font-medium">Privacy & Security</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center justify-between p-4 bg-red-50 rounded-2xl text-red-600 hover:bg-red-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Logout</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <LecturerLayout user={user} onLogout={onLogout} activeTab={activeTab} setActiveTab={setActiveTab}>
      <AnimatePresence mode="wait">
        {renderContent()}
      </AnimatePresence>
    </LecturerLayout>
  );
};

// --- Student Portal ---

const StudentPortal = ({ user, onLogout, setUser }: { user: User; onLogout: () => void; setUser: (u: User) => void }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'analytics' | 'attendance' | 'registration' | 'settings'>('home');
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [registeredSemesters, setRegisteredSemesters] = useState<any[]>([]);
  const [selectedSemester, setSelectedSemester] = useState('2025/2026 First Semester');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [analyticsDate, setAnalyticsDate] = useState(new Date().toISOString().split('T')[0]);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 15000);
    return () => clearInterval(interval);
  }, [user.level, user.department]);

  const refreshData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSemesters(),
        fetchAttendance(),
        fetchAvailableCourses(),
        fetchAttendanceHistory(historyDate)
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSemesters = async () => {
    const res = await api.get('/student/semesters');
    setRegisteredSemesters(res.data);
  };

  const fetchAttendance = async () => {
    const res = await api.get('/student/attendance');
    setAttendanceStats(res.data);
  };

  const fetchAvailableCourses = async () => {
    const res = await api.get('/courses/available');
    setAvailableCourses(res.data);
  };

  const fetchAttendanceHistory = async (date: string) => {
    const res = await api.get(`/student/attendance/history?date=${date}`);
    setAttendanceHistory(res.data);
  };

  const registerCourse = async (courseId: string) => {
    if (!user.onboarding_completed) {
      setStatus({ type: 'error', message: 'Please complete your profile setup in the Settings tab before registering for courses.' });
      return;
    }
    setLoading(true);
    try {
      await api.post('/courses/register', { course_id: courseId, semester: selectedSemester });
      refreshData();
      setStatus({ type: 'success', message: 'Registered successfully' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to register' });
    } finally {
      setLoading(false);
    }
  };

  const unregisterCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to unregister from this course?')) return;
    setLoading(true);
    try {
      await api.post('/courses/unregister', { course_id: courseId });
      refreshData();
      setStatus({ type: 'success', message: 'Unregistered successfully' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to unregister' });
    } finally {
      setLoading(false);
    }
  };

  const startScanning = () => {
    setScanning(true);
    setStatus(null);
    setTimeout(() => {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scannerRef.current.render(onScanSuccess, onScanFailure);
    }, 100);
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const onScanSuccess = async (decodedText: string) => {
    stopScanning();
    setLoading(true);
    setStatus({ type: 'info', message: 'Verifying location...' });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await api.post('/attendance/mark', {
            qr_token: decodedText,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
          setStatus({ type: 'success', message: res.data.message });
          fetchAttendance();
        } catch (err: any) {
          setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to mark attendance' });
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setStatus({ type: 'error', message: 'Geolocation access denied. Please enable GPS.' });
        setLoading(false);
      }
    );
  };

  const onScanFailure = (error: any) => {};

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-navy-900">Dashboard</h2>
              <Button variant="ghost" size="sm" onClick={refreshData} disabled={loading}>
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            </div>
            <div className="bg-navy-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-2">Welcome Back!</h2>
                <p className="text-navy-100 opacity-80">{user.department} • {user.level} Level</p>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
                    <div className="text-2xl font-bold">{attendanceStats.length}</div>
                    <div className="text-xs uppercase tracking-wider opacity-60">Courses</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
                    <div className="text-2xl font-bold">
                      {attendanceStats.length > 0 
                        ? Math.round(attendanceStats.reduce((acc, curr) => acc + (curr.attended / (curr.total_sessions || 1) * 100), 0) / attendanceStats.length)
                        : 0}%
                    </div>
                    <div className="text-xs uppercase tracking-wider opacity-60">Avg. Attendance</div>
                  </div>
                </div>
              </div>
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-navy-900">Registered Courses</h3>
              <div className="grid gap-3">
                {attendanceStats.map(course => (
                  <Card key={course.id} className="flex items-center justify-between p-4 border-zinc-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center text-navy-900 font-bold">
                        {course.course_code.substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-navy-900">{course.course_code}</div>
                        <div className="text-xs text-zinc-500">{course.course_title}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => unregisterCourse(course.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <X className="h-4 w-4" />
                      </Button>
                      <ChevronRight className="h-4 w-4 text-zinc-300" />
                    </div>
                  </Card>
                ))}
                {attendanceStats.length === 0 && (
                  <div className="text-center py-12 text-zinc-400">
                    <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No courses registered yet</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-navy-900">Attendance History</h3>
                <input 
                  type="date" 
                  value={historyDate}
                  onChange={(e) => {
                    setHistoryDate(e.target.value);
                    fetchAttendanceHistory(e.target.value);
                  }}
                  className="text-xs font-medium border border-zinc-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-navy-900"
                />
              </div>
              <Card className="p-4 border-zinc-100">
                {attendanceHistory.length > 0 ? (
                  <div className="space-y-3">
                    {attendanceHistory.map((record, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                        <div>
                          <div className="text-sm font-bold text-navy-900">{record.course_code}</div>
                          <div className="text-[10px] text-zinc-500">{record.course_title}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-emerald-600">Present</div>
                          <div className="text-[10px] text-zinc-400">{new Date(record.marked_at).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-400">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-10" />
                    <p className="text-xs">No attendance records for this date</p>
                  </div>
                )}
              </Card>
            </div>
          </motion.div>
        );

      case 'analytics':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-navy-900">Attendance Summary</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Check Date:</span>
                <input 
                  type="date" 
                  value={analyticsDate}
                  onChange={(e) => setAnalyticsDate(e.target.value)}
                  className="text-xs font-medium border border-zinc-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-navy-900"
                />
              </div>
            </div>
            <div className="grid gap-4">
              {attendanceStats.map(course => {
                const totalExpected = course.expected_classes || 10;
                const attended = course.attended_sessions;
                const heldSoFar = course.total_sessions_held;
                const absent = Math.max(0, heldSoFar - attended);
                const overallPercentage = Math.round((attended / totalExpected) * 100);
                const currentPercentage = heldSoFar > 0 ? Math.round((attended / heldSoFar) * 100) : 0;
                const passMark = 70;

                // Check if student was present on the selected date
                const wasPresentOnDate = attendanceHistory.some(h => 
                  h.course_code === course.course_code && 
                  new Date(h.marked_at).toISOString().split('T')[0] === analyticsDate
                );
                
                return (
                  <Card key={course.id} className="p-5 space-y-6 border-zinc-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-navy-900 text-lg">{course.course_code}</h4>
                        <p className="text-xs text-zinc-500">{course.course_title}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider",
                          overallPercentage >= passMark ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                        )}>
                          {overallPercentage}% Overall
                        </div>
                        <div className="text-[10px] font-bold text-zinc-400 uppercase">
                          {currentPercentage}% Current
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div className="bg-zinc-50 rounded-2xl p-2 text-center">
                        <div className="text-sm font-bold text-navy-900">{totalExpected}</div>
                        <div className="text-[8px] font-bold text-zinc-400 uppercase">Expected</div>
                      </div>
                      <div className="bg-navy-50 rounded-2xl p-2 text-center">
                        <div className="text-sm font-bold text-navy-900">{heldSoFar}</div>
                        <div className="text-[8px] font-bold text-zinc-400 uppercase">Held</div>
                      </div>
                      <div className="bg-emerald-50 rounded-2xl p-2 text-center">
                        <div className="text-sm font-bold text-emerald-600">{attended}</div>
                        <div className="text-[8px] font-bold text-zinc-400 uppercase">Present</div>
                      </div>
                      <div className="bg-red-50 rounded-2xl p-2 text-center">
                        <div className="text-sm font-bold text-red-600">{absent}</div>
                        <div className="text-[8px] font-bold text-zinc-400 uppercase">Absent</div>
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-50 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-navy-900" />
                        <span className="text-xs font-medium text-navy-900">Status for {analyticsDate}</span>
                      </div>
                      {wasPresentOnDate ? (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-xs font-bold uppercase">Present</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-400">
                          <XCircle className="h-4 w-4" />
                          <span className="text-xs font-bold uppercase">No Record</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-zinc-400 uppercase font-bold">
                        <span>Attendance Progress</span>
                        <span>{overallPercentage}% of {totalExpected} classes</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, overallPercentage)}%` }}
                          className={cn("h-full", overallPercentage >= passMark ? "bg-navy-900" : "bg-red-500")}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-400 italic">
                        * Target: {passMark}% ({Math.ceil(totalExpected * (passMark/100))} classes)
                      </p>
                    </div>
                  </Card>
                );
              })}
              {attendanceStats.length === 0 && (
                <div className="text-center py-24 text-zinc-400">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-10" />
                  <p>Register for courses to see analytics</p>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 'attendance':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-navy-900">Mark Attendance</h2>
              <p className="text-zinc-500 text-sm px-8">Scan the QR code displayed by your lecturer to mark your attendance.</p>
            </div>

            <Card className="p-8 border-zinc-100">
              {scanning ? (
                <div className="space-y-6">
                  <div id="reader" className="overflow-hidden rounded-2xl border-4 border-navy-900/10" />
                  <Button variant="outline" onClick={stopScanning} className="w-full">Cancel Scanning</Button>
                </div>
              ) : (
                <div className="flex flex-col items-center py-12 space-y-8">
                  <div className="w-32 h-32 bg-navy-50 rounded-full flex items-center justify-center relative">
                    <Scan className="h-12 w-12 text-navy-900" />
                    <div className="absolute inset-0 border-2 border-navy-900/20 rounded-full animate-ping" />
                  </div>
                  <Button onClick={startScanning} className="w-full max-w-xs bg-navy-900 hover:bg-navy-800 h-14 text-lg">
                    Start Scanning
                  </Button>
                </div>
              )}

              {status && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "mt-6 p-4 rounded-2xl text-sm font-medium flex items-center gap-3",
                    status.type === 'success' ? "bg-emerald-50 text-emerald-700" : 
                    status.type === 'error' ? "bg-red-50 text-red-700" : "bg-navy-50 text-navy-700"
                  )}
                >
                  {status.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  {status.message}
                </motion.div>
              )}
            </Card>
          </motion.div>
        );

      case 'registration':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-navy-900">Course Registration</h2>
            </div>

            <div className="space-y-4">
              {!user.onboarding_completed ? (
                <Card className="p-8 border-amber-100 bg-amber-50 text-center space-y-4">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                    <User className="h-8 w-8 text-amber-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-amber-900">Profile Incomplete</h3>
                    <p className="text-sm text-amber-700">You must complete your profile (Level and Department) in the Settings tab to see available courses for registration.</p>
                  </div>
                  <Button variant="navy" className="bg-amber-600 hover:bg-amber-700" onClick={() => setActiveTab('settings')}>
                    Go to Settings
                  </Button>
                </Card>
              ) : (
                <>
                  {availableCourses.map(course => (
                    <Card key={course.id} className="p-5 border-zinc-100 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-navy-500 uppercase">{course.course_code}</div>
                        <h4 className="font-bold text-navy-900">{course.course_title}</h4>
                        <p className="text-xs text-zinc-400">{course.department} • {course.level} Level</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="navy"
                        onClick={() => registerCourse(course.id)}
                        disabled={loading}
                      >
                        Register
                      </Button>
                    </Card>
                  ))}
                  {availableCourses.length === 0 && (
                    <div className="text-center py-24 text-zinc-400">
                      <Plus className="h-16 w-16 mx-auto mb-4 opacity-10" />
                      <p>No new courses available for registration in your level/department</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        );

      case 'settings':
        if (isEditingProfile) {
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20">
              <div className="flex items-center gap-2">
                <button onClick={() => setIsEditingProfile(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <X className="h-5 w-5 text-zinc-500" />
                </button>
                <h2 className="text-2xl font-bold text-navy-900">Update Profile</h2>
              </div>
              
              <Card className="p-6 border-zinc-100">
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setLoading(true);
                    const formData = new FormData(e.currentTarget);
                    const data = {
                      name: formData.get('name'),
                      phone_number: formData.get('phone_number'),
                      department: formData.get('department'),
                      level: formData.get('level'),
                      matric_number: formData.get('matric_number'),
                      onboarding_completed: true
                    };
                    try {
                      await api.put('/profile', data);
                      const res = await api.get('/profile');
                      setStatus({ type: 'success', message: 'Profile updated successfully!' });
                      setTimeout(() => {
                        setUser(res.data);
                        setIsEditingProfile(false);
                        setStatus(null);
                      }, 2000);
                    } catch (err: any) {
                      setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to update profile' });
                    } finally {
                      setLoading(false);
                    }
                  }} 
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                      <Mail className="h-4 w-4 text-navy-900" />
                      <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider">Personal Data</h3>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Full Name</label>
                      <Input name="name" defaultValue={user.name} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Phone Number</label>
                      <Input name="phone_number" defaultValue={user.phone_number} required />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                      <BookOpen className="h-4 w-4 text-navy-900" />
                      <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider">Student Details</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Department</label>
                        <select 
                          name="department"
                          className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950"
                          defaultValue={user.department || ""}
                          required
                        >
                          <option value="">Select Department</option>
                          <option value="Computer Science">Computer Science</option>
                          <option value="Engineering">Engineering</option>
                          <option value="Mathematics">Mathematics</option>
                          <option value="Physics">Physics</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Level</label>
                        <select 
                          name="level"
                          className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950"
                          defaultValue={user.level || ""}
                          required
                        >
                          <option value="">Select Level</option>
                          <option value="100">100 Level</option>
                          <option value="200">200 Level</option>
                          <option value="300">300 Level</option>
                          <option value="400">400 Level</option>
                          <option value="500">500 Level</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Matric Number</label>
                      <Input name="matric_number" defaultValue={user.matric_number} required />
                    </div>
                  </div>

                  {status && (
                    <div className={cn(
                      "p-4 rounded-2xl text-sm font-medium",
                      status.type === 'success' ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    )}>
                      {status.message}
                    </div>
                  )}

                  <Button type="submit" className="w-full h-14 rounded-2xl bg-navy-900" disabled={loading}>
                    {loading ? 'Updating...' : 'Save Changes'}
                  </Button>
                </form>
              </Card>
            </motion.div>
          );
        }

        if (isChangingPassword) {
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20">
              <div className="flex items-center gap-2">
                <button onClick={() => setIsChangingPassword(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  <X className="h-5 w-5 text-zinc-500" />
                </button>
                <h2 className="text-2xl font-bold text-navy-900">Change Password</h2>
              </div>
              
              <Card className="p-6 border-zinc-100">
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setStatus({ type: 'info', message: 'Password change feature coming soon' });
                  }} 
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Current Password</label>
                    <Input type="password" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">New Password</label>
                    <Input type="password" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Confirm New Password</label>
                    <Input type="password" required />
                  </div>
                  {status && (
                    <div className="p-4 rounded-2xl bg-navy-50 text-navy-700 text-sm">
                      {status.message}
                    </div>
                  )}
                  <Button type="submit" className="w-full h-14 rounded-2xl bg-navy-900">
                    Update Password
                  </Button>
                </form>
              </Card>
            </motion.div>
          );
        }

        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20">
            <h2 className="text-2xl font-bold text-navy-900">Settings</h2>
            
            <Card className="p-6 border-zinc-100 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-navy-900 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-navy-900 text-lg">{user.name}</h3>
                  <p className="text-zinc-500 text-sm">{user.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-50">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase">Matric Number</div>
                  <div className="text-sm font-medium text-navy-900">{user.matric_number || 'N/A'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase">Level</div>
                  <div className="text-sm font-medium text-navy-900">{user.level || 'N/A'}</div>
                </div>
              </div>
            </Card>

            <div className="space-y-2">
              <button 
                onClick={() => setIsEditingProfile(true)}
                className="w-full flex items-center justify-between p-4 bg-zinc-50 rounded-2xl text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5" />
                  <span className="font-medium">Update Profile</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setIsChangingPassword(true)}
                className="w-full flex items-center justify-between p-4 bg-zinc-50 rounded-2xl text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5" />
                  <span className="font-medium">Change Password</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </button>
              <button 
                onClick={onLogout}
                className="w-full flex items-center justify-between p-4 bg-red-50 rounded-2xl text-red-600 hover:bg-red-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Sign Out</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <StudentLayout user={user} onLogout={onLogout} activeTab={activeTab} setActiveTab={setActiveTab}>
      <AnimatePresence mode="wait">
        {renderContent()}
      </AnimatePresence>
    </StudentLayout>
  );
};

// --- Main Layouts ---

const StudentLayout = ({ user, onLogout, children, activeTab, setActiveTab }: { 
  user: User; 
  onLogout: () => void; 
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: any) => void;
}) => {
  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <header className="px-6 py-4 flex flex-col gap-1">
        <div className="flex items-center gap-2 font-bold text-2xl text-navy-900">
          <div className="bg-navy-900 text-white p-1 rounded-lg">
            <CheckCircle className="h-5 w-5" />
          </div>
          LocaScan
        </div>
        <div className="text-right">
          <span className="text-sm text-zinc-500">Hello, {user.name}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 px-6 py-3 pb-8 z-50">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {[
            { id: 'home', icon: LayoutDashboard, label: 'Home' },
            { id: 'analytics', icon: BarChart3, label: 'Analytics' },
            { id: 'attendance', icon: Scan, label: 'LocaScan' },
            { id: 'registration', icon: BookOpen, label: 'Courses' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 transition-all",
                activeTab === tab.id ? "text-navy-900" : "text-zinc-400"
              )}
            >
              <tab.icon className={cn("h-6 w-6", activeTab === tab.id && "fill-navy-900/10")} />
              <span className="text-[10px] font-medium uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

const LecturerLayout = ({ user, onLogout, children, activeTab, setActiveTab }: { 
  user: User; 
  onLogout: () => void; 
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: any) => void;
}) => {
  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <header className="px-6 py-4 flex flex-col gap-1">
        <div className="flex items-center gap-2 font-bold text-2xl text-navy-900">
          <div className="bg-navy-900 text-white p-1 rounded-lg">
            <CheckCircle className="h-5 w-5" />
          </div>
          LocaScan
        </div>
        <div className="text-right">
          <span className="text-sm text-zinc-500">Hello, {user.name}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 px-6 py-3 pb-8 z-50">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {[
            { id: 'home', icon: LayoutDashboard, label: 'Home' },
            { id: 'analytics', icon: BarChart3, label: 'Analytics' },
            { id: 'attendance', icon: Scan, label: 'LocaScan' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 transition-all",
                activeTab === tab.id ? "text-navy-900" : "text-zinc-400"
              )}
            >
              <tab.icon className={cn("h-6 w-6", activeTab === tab.id && "fill-navy-900/10")} />
              <span className="text-[10px] font-medium uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile');
      setUser(res.data);
    } catch (e) {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <RefreshCw className="h-8 w-8 animate-spin text-zinc-300" />
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          !user ? <LandingPage /> : (
            !user.onboarding_completed ? <Navigate to="/onboarding" /> : (
              user.role === 'lecturer' ? (
                <LecturerDashboard user={user} onLogout={handleLogout} />
              ) : (
                <StudentPortal user={user} onLogout={handleLogout} setUser={setUser} />
              )
            )
          )
        } />
        <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} />
        <Route path="/onboarding" element={
          user ? (
            user.onboarding_completed ? <Navigate to="/" /> : <Onboarding user={user} onComplete={setUser} />
          ) : <Navigate to="/login" />
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
