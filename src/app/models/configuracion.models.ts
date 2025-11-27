// Interfaces para el módulo de configuración

export interface ConfigHogar {
  notificaciones_activas: boolean;
  notificaciones_whatsapp: boolean;
  comentarios_habilitados: boolean;
  asistente_activo: boolean;
  asistente_restricciones: string[];
}

export interface PreferenciasMiembro {
  recibir_notificaciones: boolean;
  recibir_notificaciones_whatsapp: boolean;
  comentarios_habilitados: boolean;
}

export interface ActualizarPerfil {
  nombre_completo?: string;
  correo_electronico?: string;
  contrasena?: string;
}

export interface ActualizarRol {
  id_rol: number;
}

export interface ActualizarAsistente {
  asistente_activo: boolean;
  asistente_restricciones: string[];
}

export interface Miembro {
  id: number;
  nombre_completo: string;
  correo_electronico: string;
  id_rol: number;
  nombre_rol?: string;
  id_hogar: number;
}

export interface Rol {
  id: number;
  nombre: string;
}
