import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { ContextStateService } from '../services/context-state.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('ngac_token');
  let activeReq = req;

  if (token) {
    activeReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  // Interceptar la generación de menú para estructurar INgacRequest
  if (req.url.includes('/arbol/generar-menu') || req.url.includes('/menu/generar') || req.url.includes('/menu')) {
    const contextSvc = inject(ContextStateService);
    const ctx = contextSvc.getContext();
    
    const originalBody = (req.body as any) || {};
    const operaciones = originalBody.solicitud?.operaciones || originalBody.operaciones || ['VER', 'EDITAR', 'CREAR', 'ELIMINAR'];

    const ngacPayload = {
      sujeto: {
        usuario_id: ctx.usuarioId,
        roles: ctx.roles
      },
      contexto: {
        politicas: [ctx.politicaActiva]
      },
      solicitud: {
        app_id: ctx.appIdActiva,
        operaciones: operaciones
      }
    };

    activeReq = activeReq.clone({
      body: ngacPayload
    });
  }

  return next(activeReq);
};
