# OAuth Integration Plan for Resum8

## Current Authentication Architecture

### Current State
- **Local Authentication**: Email/password based authentication
- **Token Management**: JWT access/refresh tokens stored in localStorage
- **API Structure**: RESTful API with `/auth/login` and `/auth/register` endpoints
- **Session Management**: Local storage for user data and session state
- **User Profile**: Basic user information with extensible profile fields

### Current Implementation Details
- **Frontend Auth Hook**: `useAuth()` hook managing authentication state
- **API Client**: Centralized API client with token management
- **Storage**: localStorage for tokens and user data
- **Auth Pages**: Unified auth page with sign-in/sign-up toggle

## OAuth Integration Strategy

### Phase 1: Infrastructure Setup

#### 1.1 OAuth Provider Selection
**Recommended Providers (in order of priority):**
1. **Google OAuth** - High user adoption, professional context
2. **LinkedIn OAuth** - Professional networking, resume relevance
3. **GitHub OAuth** - Developer-focused users
4. **Microsoft OAuth** - Enterprise users

#### 1.2 Backend API Extensions
**Required Backend Changes:**
```typescript
// New OAuth endpoints needed
POST /auth/oauth/google
POST /auth/oauth/linkedin
POST /auth/oauth/github
POST /auth/oauth/microsoft

// OAuth callback handling
GET /auth/oauth/{provider}/callback

// Account linking
POST /auth/link-oauth
DELETE /auth/unlink-oauth/{provider}
```

#### 1.3 Frontend OAuth Library
**Recommended Library**: `@auth0/nextjs-auth0` or `next-auth`
- **Pros**: Well-maintained, TypeScript support, security best practices
- **Cons**: Additional bundle size, learning curve

**Alternative**: Custom OAuth implementation with provider SDKs

### Phase 2: OAuth Flow Implementation

#### 2.1 OAuth Button Components
```typescript
// Component structure
interface OAuthButtonProps {
  provider: 'google' | 'linkedin' | 'github' | 'microsoft';
  mode: 'signin' | 'signup' | 'link';
  onSuccess: (data: OAuthResponse) => void;
  onError: (error: Error) => void;
}

// OAuth response structure
interface OAuthResponse {
  access_token: string;
  refresh_token: string;
  user: UserInfo;
  is_new_user: boolean;
  linked_accounts?: string[];
}
```

#### 2.2 Enhanced Auth Hook
```typescript
// Extended useAuth hook
interface OAuthMethods {
  loginWithOAuth: (provider: string, code: string) => Promise<void>;
  linkOAuthAccount: (provider: string, code: string) => Promise<void>;
  unlinkOAuthAccount: (provider: string) => Promise<void>;
  getLinkedAccounts: () => string[];
}
```

#### 2.3 Updated Auth Page Structure
```
/auth
├── OAuth provider buttons (Google, LinkedIn, etc.)
├── Divider ("Or continue with email")
├── Email/password form
└── Account linking section (when authenticated)
```

### Phase 3: User Experience Enhancements

#### 3.1 Account Linking
- **Pre-auth**: Link OAuth accounts to existing email accounts
- **Post-auth**: Add OAuth providers to existing accounts
- **Account Management**: View and manage linked accounts in settings

#### 3.2 Social Profile Integration
```typescript
// Enhanced user profile with OAuth data
interface EnhancedUser extends User {
  oauth_accounts: {
    provider: string;
    provider_id: string;
    email: string;
    profile_data?: {
      name: string;
      avatar_url: string;
      profile_url: string;
    };
  }[];
}
```

#### 3.3 Smart Defaults
- **Profile Picture**: Use OAuth provider avatar
- **Name**: Auto-populate from OAuth profile
- **Professional Info**: Import from LinkedIn profile

### Phase 4: Security Considerations

#### 4.1 Token Security
- **Secure Storage**: Consider httpOnly cookies for sensitive tokens
- **Token Rotation**: Implement automatic refresh token rotation
- **Scope Limitation**: Request minimal necessary permissions

#### 4.2 Account Security
- **Email Verification**: Verify OAuth email matches existing account
- **Account Merging**: Secure process for merging OAuth and local accounts
- **Audit Logging**: Track OAuth login attempts and account changes

#### 4.3 Privacy Compliance
- **Data Minimization**: Only request necessary OAuth scopes
- **User Consent**: Clear consent for data access and storage
- **Data Retention**: Policies for OAuth-derived data

### Phase 5: Implementation Roadmap

#### Week 1: Backend OAuth Infrastructure
- [ ] Set up OAuth applications with providers
- [ ] Implement OAuth endpoints in backend API
- [ ] Add OAuth user account linking in database
- [ ] Update user authentication middleware

#### Week 2: Frontend OAuth Components
- [ ] Install and configure OAuth library
- [ ] Create OAuth button components
- [ ] Update auth page with OAuth options
- [ ] Implement OAuth callback handling

#### Week 3: Integration and Testing
- [ ] Integrate OAuth flow with existing auth system
- [ ] Add account linking functionality
- [ ] Implement error handling and edge cases
- [ ] Add loading states and user feedback

#### Week 4: Polish and Security
- [ ] Security review and testing
- [ ] Performance optimization
- [ ] User experience refinements
- [ ] Documentation and deployment

### Technical Implementation Details

#### OAuth Provider Configurations

**Google OAuth:**
```typescript
const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  scope: ['openid', 'email', 'profile'],
  redirectUri: `${process.env.FRONTEND_URL}/auth/callback/google`
};
```

**LinkedIn OAuth:**
```typescript
const linkedinConfig = {
  clientId: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  scope: ['r_liteprofile', 'r_emailaddress'],
  redirectUri: `${process.env.FRONTEND_URL}/auth/callback/linkedin`
};
```

#### Error Handling Strategy
```typescript
enum OAuthError {
  PROVIDER_ERROR = 'Provider authentication failed',
  ACCOUNT_EXISTS = 'Account already exists with this email',
  LINK_FAILED = 'Failed to link OAuth account',
  NETWORK_ERROR = 'Network connection failed',
  INVALID_STATE = 'Invalid OAuth state parameter'
}
```

### Migration Strategy

#### Existing Users
1. **Graceful Migration**: Existing email/password users can continue using current auth
2. **Optional Linking**: Offer OAuth linking as an enhancement, not requirement
3. **Data Preservation**: Maintain all existing user data and preferences

#### New Users
1. **OAuth First**: Promote OAuth as primary registration method
2. **Email Fallback**: Keep email/password as backup option
3. **Streamlined Onboarding**: Use OAuth profile data to pre-populate forms

### Monitoring and Analytics

#### Success Metrics
- OAuth adoption rate vs traditional auth
- User registration completion rate
- Account linking success rate
- User retention by auth method

#### Error Monitoring
- OAuth flow abandonment points
- Provider-specific error rates
- Account linking failure reasons
- Token refresh failure rates

### Future Enhancements

#### Advanced Features
- **Single Sign-On (SSO)**: Enterprise SSO integration
- **Multi-factor Authentication**: 2FA with OAuth providers
- **Social Features**: Share resumes via LinkedIn
- **Professional Sync**: Auto-update profile from LinkedIn

#### Integration Opportunities
- **Resume Import**: Import experience from LinkedIn
- **Job Matching**: Use OAuth connections for job recommendations
- **Network Analysis**: Leverage professional connections
- **Portfolio Integration**: Link GitHub projects to resumes

## Conclusion

This OAuth integration plan provides a comprehensive roadmap for adding social authentication to Resum8 while maintaining security, user experience, and backwards compatibility. The phased approach allows for iterative development and testing, ensuring a smooth rollout.

Priority should be given to Google and LinkedIn OAuth as they align best with the professional resume optimization use case. The implementation should focus on enhancing rather than replacing the current authentication system.