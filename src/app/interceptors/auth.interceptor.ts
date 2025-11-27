import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../service/auth.service';
import { catchError, switchMap, throwError, from, of } from 'rxjs';

// Semáforo para evitar múltiples refrescos simultáneos
let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    const authService = inject(AuthService);
    const token = authService.getToken();

    // Función para clonar la petición con el token actual
    const addToken = (request: HttpRequest<unknown>, currentToken: string | null) => {
        if (currentToken) {
            return request.clone({
                setHeaders: {
                    Authorization: `Bearer ${currentToken}`
                }
            });
        }
        return request;
    };

    // 1. Si no hay token, pasar la petición tal cual (ej: login)
    if (!token) {
        return next(req);
    }

    // 2. Verificar si el token está próximo a expirar (Proactive Refresh)
    // Evitamos refrescar si la petición ya es de refresh o auth
    if (!req.url.includes('/auth/') && authService.isTokenNearExpiration(token) && !isRefreshing) {
        console.log('⚠️ [AuthInterceptor] Token próximo a expirar. Intentando refresco proactivo...');
        isRefreshing = true;

        return authService.refreshToken().pipe(
            switchMap((response: any) => {
                isRefreshing = false;
                const newToken = response.access_token;
                return next(addToken(req, newToken));
            }),
            catchError((error) => {
                isRefreshing = false;
                // Si falla el proactivo, intentamos seguir con el token viejo (quizás aún sirva)
                // O dejamos que falle con 401 y lo maneje el reactive
                console.warn('⚠️ [AuthInterceptor] Falló refresco proactivo. Continuando con token actual.');
                return next(addToken(req, token));
            })
        );
    }

    // 3. Petición normal con el token actual
    return next(addToken(req, token)).pipe(
        catchError((error: HttpErrorResponse) => {
            // 4. Reactive Refresh (401 Unauthorized)
            if (error.status === 401 && !req.url.includes('/auth/refresh-token')) {
                if (!isRefreshing) {
                    console.log('🛑 [AuthInterceptor] 401 detectado. Intentando refresco reactivo...');
                    isRefreshing = true;

                    return authService.refreshToken().pipe(
                        switchMap((response: any) => {
                            isRefreshing = false;
                            const newToken = response.access_token;
                            // Reintentar la petición original con el nuevo token
                            return next(addToken(req, newToken));
                        }),
                        catchError((refreshError) => {
                            isRefreshing = false;
                            console.error('❌ [AuthInterceptor] Falló refresco reactivo. Cerrando sesión.');
                            authService.clearUserData();
                            return throwError(() => refreshError);
                        })
                    );
                } else {
                    // Si ya se está refrescando, podríamos encolar, pero por simplicidad retornamos error
                    // O idealmente esperar al nuevo token (complejidad extra con BehaviorSubject)
                    return throwError(() => error);
                }
            }

            return throwError(() => error);
        })
    );
};
