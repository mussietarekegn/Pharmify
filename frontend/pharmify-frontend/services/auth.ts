export const authService = {
  saveTokens(access: string, refresh: string, user: object) {
    sessionStorage.setItem('access_token', access);
    sessionStorage.setItem('refresh_token', refresh);
    sessionStorage.setItem('user', JSON.stringify(user));
  },

  getUser() {
    if (typeof window === 'undefined') return null;
    const u = sessionStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },

  getAccess(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('access_token');
  },

  logout() {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user');
  },

  isLoggedIn(): boolean {
    return !!this.getAccess();
  },
};