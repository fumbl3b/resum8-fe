'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    // Check if we should start in signup mode
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsSignUp(true);
    }
  }, [searchParams]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showBetaMessage, setShowBetaMessage] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        setIsLoading(false);
        return;
      }
    }

    try {
      if (isSignUp) {
        await register(email, password);
        setSuccess(true);
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        await login(email, password);
        router.push('/dashboard');
      }
    } catch (err) {
      setError(isSignUp ? 'Account creation failed. Please try again.' : 'Invalid email or password. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setSuccess(false);
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start p-4 pt-20">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {showBetaMessage && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg relative">
            <button
              onClick={() => setShowBetaMessage(false)}
              className="absolute top-2 right-2 p-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded"
            >
              <X className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </button>
            <p className="text-sm text-blue-800 dark:text-blue-200 pr-6">
              Please be nice, we're in beta. Send any feedback to <span className="font-medium">resum8@fumblebee.site</span>
            </p>
          </div>
        )}

        <Card>
          <CardHeader className="text-center">
            {/* Toggle Switch */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative bg-muted rounded-lg p-1 flex">
                <button
                  type="button"
                  onClick={() => isSignUp && toggleMode()}
                  className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                    !isSignUp 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => !isSignUp && toggleMode()}
                  className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                    isSignUp 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            <CardTitle className="text-2xl">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <CardDescription>
              {isSignUp ? 'Get started with Resum8 today' : 'Sign in to your Resum8 account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={isSignUp ? "Create a password" : "Enter your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              )}
              {error && (
                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-md">
                  {error}
                </div>
              )}
              {success && (
                <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-md">
                  Account created successfully! Redirecting to dashboard...
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading || success}>
                {isLoading 
                  ? (isSignUp ? 'Creating Account...' : 'Signing In...') 
                  : success 
                    ? 'Account Created!' 
                    : (isSignUp ? 'Create Account' : 'Sign In')
                }
              </Button>
            </form>
            
            {!isSignUp && (
              <div className="mt-4 text-center">
                <button className="text-sm text-muted-foreground hover:text-primary hover:underline">
                  Forgot your password?
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}