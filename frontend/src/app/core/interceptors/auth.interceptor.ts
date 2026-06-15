import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { ContextStateService } from '../services/context-state.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('ngac_token');
  let activeReq = req;

  if (token) {
    activeReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  // Interceptar la generación de menú para estructurar INgacRequest
  if (req.url.includes('/arbol/generar-menu') || req.url.includes('/menu/generar')) {
    const contextSvc = inject(ContextStateService);
    const ctx = contextSvc.getContext();

    const originalBody = (req.body as any) || {};
    const modulos = originalBody.solicitud?.modulos || originalBody.modulos || [];
    const operaciones = originalBody.solicitud?.operaciones ||
      originalBody.operaciones || ['VER', 'CREAR', 'EDITAR', 'ELIMINAR'];
    const politicas = originalBody.contexto?.politicas ||
      originalBody.politicas || [ctx.politicaActiva];
    const roles = originalBody.sujeto?.roles || originalBody.roles || ctx.roles;
    const usuarioId = originalBody.sujeto?.usuario_id || originalBody.usuario_id || ctx.usuarioId;
    const division = originalBody.sujeto?.division || originalBody.division;
    const atributos = originalBody.atributos || originalBody.claims || [];

    const ngacPayload = {
      sujeto: {
        usuario_id: usuarioId,
        roles,
        ...(division ? { division } : {}),
      },
      contexto: {
        politicas,
      },
      solicitud: {
        app_id: ctx.appIdActiva,
        modulos,
        operaciones: operaciones,
      },
      ...(atributos.length ? { atributos } : {}),
    };

    activeReq = activeReq.clone({
      body: ngacPayload,
    });
  }

  return next(activeReq);
};
