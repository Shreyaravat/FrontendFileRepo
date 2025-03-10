import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  private apiUrlLogin = 'http://localhost:8080/api/login';
  private apiUrlRefresh = 'http://localhost:8080/api/refresh';

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object, private router: Router) {}

  // Login and store token automatically
  login(credentials: { username: string; password: string }): Observable<{ accessToken: string, refreshToken: string }> {
    console.log("LoginAuthService called...");
    return this.http.post<{ accessToken: string, refreshToken: string }>(this.apiUrlLogin, credentials).pipe(
      tap(response => {
        if (response.accessToken && response.refreshToken) {
          this.storeToken(response.accessToken);
          this.storeRefreshToken(response.refreshToken);
        }
      }),
      catchError(error => {
        console.error('Login failed:', error);
        return throwError(() => new Error('Invalid username or password'));
      })
    );
  }

  // Refresh Access Token
  refreshAccessToken(): Observable<{ accessToken: string }> {
    console.log("RefreshAccessTokenAuthService called...");
    let refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      console.warn("No refresh token found in localStorage.");
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<{ accessToken: string }>(this.apiUrlRefresh, { refreshToken }).pipe(
      tap(response => {
        if (response.accessToken) {
          this.storeToken(response.accessToken);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Refresh token failed:', error);
        if (error.status === 403 || error.status === 401) {
          console.warn('Refresh token expired. Logging out...');
          this.logout();
        }
        return throwError(() => new Error('Session expired. Please log in again.'));
      })
    );
  }

  // Logout
  logout() {
    console.log("logoutAuthService called...");
    this.clearToken();
    this.router.navigate(['/login']);
  }

  // Check if token is expired
  isTokenExpired(token: string): boolean {
    console.log("Checking if token is expired...");
    try {
      const decodedToken: any = jwtDecode(token);
      return Date.now() >= decodedToken.exp * 1000;
    } catch (error) {
      console.error("Error decoding token:", error);
      return true;
    }
  }

  // Store tokens
  storeToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('authToken', token);
    }
  }

  storeRefreshToken(refreshToken: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  getRefreshToken(): string | null {
    return isPlatformBrowser(this.platformId) ? localStorage.getItem('refreshToken') : null;
  }

  getToken(): string | null {
    return isPlatformBrowser(this.platformId) ? localStorage.getItem('authToken') : null;
  }

  // Clear tokens
  clearToken(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
function jwtDecode(token: string): any {
  throw new Error('Function not implemented.');
}

