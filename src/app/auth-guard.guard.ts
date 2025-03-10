import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    console.log("AuthGuard Triggered for:", state.url);

    const token = this.authService.getToken();

    if (!token) {
      console.warn("No token found. Redirecting to /login.");
      this.router.navigate(['/login']);
      return false;
    }

    if (this.isTokenExpired(token)) {
      console.warn("Token expired. Attempting to refresh...");

      return this.authService.refreshAccessToken().pipe(
        map((response: any) => {
          if (response?.accessToken) {
            console.log("Token refreshed successfully.");
            this.authService.storeToken(response.accessToken);
            return true;  // Allow access
          } else {
            console.warn("Failed to refresh token. Redirecting to /login.");
            this.handleSessionExpired();
            return false;
          }
        }),
        catchError(error => {
          console.error("Error refreshing token:", error);
          this.handleSessionExpired();
          return of(false);
        })
      );
    }

    console.log("Access Allowed:", state.url);
    return true;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])); // Decode payload
      if (!payload.exp) return true;
      return Date.now() >= payload.exp * 1000; // Check if token is expired
    } catch (e) {
      console.error('AuthGuard: Error decoding token', e);
      return true; // Consider invalid if decoding fails
    }
  }

  private handleSessionExpired() {
    console.warn("Session expired. Clearing tokens & redirecting...");
    this.authService.clearToken();
    this.router.navigate(['/login']);
  }
}
