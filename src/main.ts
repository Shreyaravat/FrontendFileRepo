import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule, provideHttpClient } from '@angular/common/http';
import { AuthInterceptor } from './app/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    ...appConfig.providers,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ]
})
  .catch((err) => console.error(err));
