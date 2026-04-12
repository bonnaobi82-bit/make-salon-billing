import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '@/App';
import { Eye, EyeOff, Sparkles } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'owner'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? `${API}/auth/login` : `${API}/auth/register`;
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await axios.post(endpoint, payload);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="auth-container">
      <div
        className="auth-image-section hidden lg:block"
        style={{
          backgroundImage:
            'url(https://customer-assets.emergentagent.com/job_beauty-billing-4/artifacts/1wcpalfs_Screenshot%202026-04-12%20120611.jpg)'
        }}
      >
        <div className="relative z-10 p-12 text-white flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <Sparkles className="w-8 h-8" strokeWidth={1.5} />
              <h1 className="text-3xl font-serif font-bold">Salon Suite</h1>
            </div>
            <p className="text-lg text-white/90 max-w-md">
              Premium billing and management software designed for modern salons
            </p>
          </div>
          <div>
            <p className="text-[10px] text-white/40 tracking-wider">Created by Kbon Moirang</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-serif text-[#1B3B36] mb-2" data-testid="auth-title">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-[#6B726C]">
              {isLogin ? 'Sign in to your salon dashboard' : 'Start managing your salon today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-[#1B3B36] mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="input-field"
                  required={!isLogin}
                  data-testid="register-name-input"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#1B3B36] mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                required
                data-testid="email-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1B3B36] mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pr-12"
                  required
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B726C] hover:text-[#1B3B36]"
                  data-testid="toggle-password-visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-[#1B3B36] mb-2">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="input-field"
                  data-testid="register-role-select"
                >
                  <option value="owner">Owner</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
              data-testid="auth-submit-button"
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-[#1B3B36] hover:underline"
              data-testid="toggle-auth-mode"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
