'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Building, 
  Link, 
  Github, 
  Globe,
  Save,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  company: string;
  linkedin: string;
  github: string;
  website: string;
  bio: string;
}

export default function ProfilePage() {
  const { isAuthenticated, user, isLoading, updateProfile } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    company: '',
    linkedin: '',
    github: '',
    website: '',
    bio: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        jobTitle: user.jobTitle || '',
        company: user.company || '',
        linkedin: user.linkedin || '',
        github: user.github || '',
        website: user.website || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setSaveStatus('idle');
  };

  const validateForm = (): boolean => {
    if (!formData.email.trim()) {
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return false;
    }

    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      setSaveStatus('error');
      return;
    }

    setIsSaving(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateProfile(formData);
      setSaveStatus('success');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const getCompletionPercentage = (): number => {
    const fields = Object.values(formData);
    const filledFields = fields.filter(field => field.trim() !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-8 pb-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="min-h-screen bg-background pt-8 pb-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              Profile Settings
            </h1>
            <div className="w-28" />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile Summary Card */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Profile Summary
                  </CardTitle>
                  <CardDescription>
                    Complete your profile to get better resume recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Profile Completion</span>
                    <Badge variant={completionPercentage === 100 ? "default" : "secondary"}>
                      {completionPercentage}%
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                  
                  {formData.firstName && formData.lastName && (
                    <div className="pt-4 border-t">
                      <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-white text-xl font-semibold">
                          {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
                        </span>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{formData.firstName} {formData.lastName}</p>
                        <p className="text-sm text-muted-foreground">{formData.email}</p>
                        {formData.jobTitle && (
                          <p className="text-sm text-muted-foreground">{formData.jobTitle}</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Profile Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details and professional information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          placeholder="Enter your first name"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="lastName"
                          placeholder="Enter your last name"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          placeholder="Enter your phone number"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="jobTitle"
                          placeholder="e.g., Software Engineer"
                          value={formData.jobTitle}
                          onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="company"
                          placeholder="Enter your company name"
                          value={formData.company}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Social Links</h3>
                    <div className="grid md:grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn Profile</Label>
                        <div className="relative">
                          <Link className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="linkedin"
                            placeholder="https://linkedin.com/in/yourprofile"
                            value={formData.linkedin}
                            onChange={(e) => handleInputChange('linkedin', e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="github">GitHub Profile</Label>
                          <div className="relative">
                            <Github className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="github"
                              placeholder="https://github.com/yourusername"
                              value={formData.github}
                              onChange={(e) => handleInputChange('github', e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="website">Personal Website</Label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="website"
                              placeholder="https://yourwebsite.com"
                              value={formData.website}
                              onChange={(e) => handleInputChange('website', e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">Professional Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself, your experience, and your professional goals..."
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      className="min-h-[100px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      This information can help generate better resume content tailored to your background.
                    </p>
                  </div>

                  {/* Save Button */}
                  <div className="pt-6 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        {saveStatus === 'success' && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">Profile updated successfully!</span>
                          </div>
                        )}
                        {saveStatus === 'error' && (
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">Please check your email address</span>
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="flex items-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save Profile
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}