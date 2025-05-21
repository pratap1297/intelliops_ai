interface User {
  id: string;
  email: string;
  created_at: string;
}

interface AuthResponse {
  user: User | null;
  error: string | null;
}

// Simulate some delay to mimic API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class AuthService {
  private readonly STORAGE_KEY = 'auth_user';

  constructor() {
    // Initialize with stored user data
    this.getSession();
  }

  private getStoredUser(): User | null {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  private setStoredUser(user: User | null): void {
    if (user) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  async signUp(email: string, password: string): Promise<AuthResponse> {
    await delay(500); // Simulate API delay

    // Simple validation
    if (!email || !password) {
      return { user: null, error: 'Email and password are required' };
    }

    if (password.length < 6) {
      return { user: null, error: 'Password must be at least 6 characters' };
    }

    // Check if user already exists
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    if (existingUsers.find((u: User) => u.email === email)) {
      return { user: null, error: 'User already exists' };
    }

    // Create new user
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      created_at: new Date().toISOString(),
    };

    // Store user in "database"
    existingUsers.push({ ...newUser, password });
    localStorage.setItem('users', JSON.stringify(existingUsers));

    // Store current session
    this.setStoredUser(newUser);

    return { user: newUser, error: null };
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    await delay(500); // Simulate API delay

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u: any) => u.email === email && u.password === password);

    if (!user) {
      return { user: null, error: 'Invalid email or password' };
    }

    const sessionUser: User = {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    };

    this.setStoredUser(sessionUser);
    return { user: sessionUser, error: null };
  }

  async signOut(): Promise<void> {
    await delay(200); // Simulate API delay
    this.setStoredUser(null);
  }

  async getSession(): Promise<{ user: User | null }> {
    const user = this.getStoredUser();
    return { user };
  }

  async resetPassword(email: string): Promise<{ error: string | null }> {
    await delay(500); // Simulate API delay

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u: any) => u.email === email);

    if (!user) {
      return { error: 'User not found' };
    }

    // In a real app, this would send an email
    console.log(`Password reset requested for ${email}`);
    return { error: null };
  }

  async updatePassword(password: string): Promise<{ error: string | null }> {
    await delay(500); // Simulate API delay

    const currentUser = this.getStoredUser();
    if (!currentUser) {
      return { error: 'No user logged in' };
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === currentUser.id);

    if (userIndex === -1) {
      return { error: 'User not found' };
    }

    users[userIndex].password = password;
    localStorage.setItem('users', JSON.stringify(users));

    return { error: null };
  }

  onAuthStateChange(callback: (user: User | null) => void): { unsubscribe: () => void } {
    const handler = () => {
      callback(this.getStoredUser());
    };

    window.addEventListener('storage', handler);
    return {
      unsubscribe: () => window.removeEventListener('storage', handler),
    };
  }
}

export const auth = new AuthService();