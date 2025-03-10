import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(private authService: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log("🛡️ Interceptor Triggered:", req.url);
    
    const token = this.authService.getToken(); 

    let authReq = req;
    if (token) {
      console.log("Attaching Token:", token);
      authReq = this.addTokenHeader(req, token);
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error("HTTP Error:", error);

        if (error.status === 401) {
          console.warn("Token Expired! Attempting Refresh...");
          return this.handleTokenExpired(authReq, next);
        }

        return throwError(() => error);
      })
    );
  }

  private handleTokenExpired(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      console.log("Refreshing Access Token...");
      return this.authService.refreshAccessToken().pipe(
        switchMap((response: any) => {
          this.isRefreshing = false;

          if (response?.accessToken && response?.refreshToken) {
            console.log("Token Refreshed:", response.accessToken);

            this.authService.storeToken(response.accessToken);
            this.authService.storeRefreshToken(response.refreshToken);
            this.refreshTokenSubject.next(response.accessToken);

            return next.handle(this.addTokenHeader(request, response.accessToken));
          } else {
            console.error("Invalid Refresh Response:", response);
            return this.logoutAndRedirect();
          }
        }),
        catchError((refreshError) => {
          this.isRefreshing = false;
          console.error("Refresh Token Failed:", refreshError);
          return this.logoutAndRedirect();
        })
      );
    } else {
      console.log("Waiting for refreshed token...");
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => next.handle(this.addTokenHeader(request, token!)))
      );
    }
  }

  private addTokenHeader(request: HttpRequest<any>, token: string) {
    return request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
      withCredentials: true // Allow cookies & credentials
    });
  }
  

  private logoutAndRedirect(): Observable<any> {
    console.warn("Logging Out & Redirecting...");
    this.authService.logout();
    this.router.navigate(['/login']);
    return throwError(() => new Error("Session expired. Please log in again."));
  }
}
