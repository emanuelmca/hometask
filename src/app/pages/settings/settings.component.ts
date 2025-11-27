import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfiguracionService } from '../../service/configuracion.service';
import {
    ConfigHogar,
    PreferenciasMiembro,
    ActualizarPerfil,
    ActualizarAsistente,
    Miembro
} from '../../models/configuracion.models';

interface Tab {
    id: string;
    label: string;
    adminOnly: boolean;
}

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
    // Control de tabs
    activeTab: string = 'profile';
    tabs: Tab[] = [
        { id: 'home', label: 'Configuración del Hogar', adminOnly: true },
        { id: 'profile', label: 'Mi Perfil', adminOnly: false },
        { id: 'members', label: 'Gestión de Miembros', adminOnly: true }
    ];

    // Estado de usuario
    isAdmin: boolean = false;
    currentUserId: number = 0;

    // Configuración del hogar
    configHogar: ConfigHogar = {
        notificaciones_activas: true,
        notificaciones_whatsapp: true,
        comentarios_habilitados: true,
        asistente_activo: true,
        asistente_restricciones: []
    };

    // Preferencias personales
    miPerfil: ActualizarPerfil = {
        nombre_completo: '',
        correo_electronico: '',
        contrasena: ''
    };

    misPreferencias: PreferenciasMiembro = {
        recibir_notificaciones: true,
        recibir_notificaciones_whatsapp: true,
        comentarios_habilitados: true
    };

    // Miembros del hogar
    miembros: Miembro[] = [];
    selectedMember: Miembro | null = null;
    showMemberDialog: boolean = false;
    memberPreferences: PreferenciasMiembro = {
        recibir_notificaciones: true,
        recibir_notificaciones_whatsapp: true,
        comentarios_habilitados: true
    };
    selectedRole: number = 2;

    // Campo para nueva restricción del asistente
    nuevaRestriccion: string = '';

    // Estado de carga
    loading: boolean = false;
    message: string = '';
    messageType: 'success' | 'error' | '' = '';

    constructor(private configuracionService: ConfiguracionService) { }

    ngOnInit(): void {
        this.checkUserRole();
        this.loadInitialData();
    }

    /**
     * Verifica el rol del usuario desde el token
     */
    checkUserRole(): void {
        const idRol = localStorage.getItem('id_rol');
        const idMiembro = localStorage.getItem('id_miembro');

        this.isAdmin = idRol === '1';
        this.currentUserId = idMiembro ? parseInt(idMiembro) : 0;

        // Si no es admin, mostrar solo tab de perfil
        if (!this.isAdmin) {
            this.activeTab = 'profile';
        }
    }

    /**
     * Carga datos iniciales según el tab activo
     */
    loadInitialData(): void {
        if (this.isAdmin && this.activeTab === 'home') {
            this.loadConfigHogar();
        } else if (this.activeTab === 'profile') {
            this.loadMiPerfil();
        } else if (this.isAdmin && this.activeTab === 'members') {
            this.loadMiembros();
        }
    }

    /**
     * Cambia de tab
     */
    changeTab(tabId: string): void {
        this.activeTab = tabId;
        this.clearMessage();
        this.loadInitialData();
    }

    /**
     * Verifica si un tab debe mostrarse
     */
    shouldShowTab(tab: Tab): boolean {
        return !tab.adminOnly || this.isAdmin;
    }

    // ==================== CONFIGURACIÓN DEL HOGAR ====================

    loadConfigHogar(): void {
        this.loading = true;
        this.configuracionService.getConfigHogar().subscribe({
            next: (config) => {
                this.configHogar = config;
                this.loading = false;
            },
            error: (err) => {
                this.showMessage('Error al cargar configuración del hogar: ' + (err.error?.detail || err.message), 'error');
                this.loading = false;
            }
        });
    }

    guardarConfigHogar(): void {
        this.loading = true;
        this.configuracionService.updateConfigHogar(this.configHogar).subscribe({
            next: () => {
                this.showMessage('Configuración del hogar guardada exitosamente', 'success');
                this.loading = false;
            },
            error: (err) => {
                this.showMessage('Error al guardar: ' + (err.error?.detail || err.message), 'error');
                this.loading = false;
            }
        });
    }

    guardarAsistente(): void {
        this.loading = true;
        const payload: ActualizarAsistente = {
            asistente_activo: this.configHogar.asistente_activo,
            asistente_restricciones: this.configHogar.asistente_restricciones
        };

        this.configuracionService.updateAsistente(payload).subscribe({
            next: () => {
                this.showMessage('Configuración del asistente guardada exitosamente', 'success');
                this.loading = false;
            },
            error: (err) => {
                this.showMessage('Error al guardar asistente: ' + (err.error?.detail || err.message), 'error');
                this.loading = false;
            }
        });
    }

    agregarRestriccion(): void {
        if (this.nuevaRestriccion.trim()) {
            this.configHogar.asistente_restricciones.push(this.nuevaRestriccion.trim());
            this.nuevaRestriccion = '';
        }
    }

    eliminarRestriccion(index: number): void {
        this.configHogar.asistente_restricciones.splice(index, 1);
    }

    // ==================== MI PERFIL ====================

    loadMiPerfil(): void {
        this.loading = true;

        // Cargar datos del perfil desde localStorage
        this.miPerfil.nombre_completo = localStorage.getItem('nombre_usuario') || '';
        this.miPerfil.correo_electronico = localStorage.getItem('correo_usuario') || '';

        // Cargar preferencias personales
        if (this.currentUserId) {
            this.configuracionService.getPreferencias(this.currentUserId).subscribe({
                next: (prefs) => {
                    this.misPreferencias = prefs;
                    this.loading = false;
                },
                error: (err) => {
                    this.showMessage('Error al cargar preferencias: ' + (err.error?.detail || err.message), 'error');
                    this.loading = false;
                }
            });
        } else {
            this.loading = false;
        }
    }

    guardarMiPerfil(): void {
        this.loading = true;

        // Solo enviar campos que han sido modificados
        const payload: ActualizarPerfil = {};

        if (this.miPerfil.nombre_completo) {
            payload.nombre_completo = this.miPerfil.nombre_completo;
        }
        if (this.miPerfil.correo_electronico) {
            payload.correo_electronico = this.miPerfil.correo_electronico;
        }
        if (this.miPerfil.contrasena) {
            payload.contrasena = this.miPerfil.contrasena;
        }

        this.configuracionService.updateMiPerfil(payload).subscribe({
            next: () => {
                this.showMessage('Perfil actualizado exitosamente', 'success');

                // Actualizar localStorage
                if (payload.nombre_completo) {
                    localStorage.setItem('nombre_usuario', payload.nombre_completo);
                }
                if (payload.correo_electronico) {
                    localStorage.setItem('correo_usuario', payload.correo_electronico);
                }

                // Limpiar campo de contraseña
                this.miPerfil.contrasena = '';
                this.loading = false;
            },
            error: (err) => {
                this.showMessage('Error al actualizar perfil: ' + (err.error?.detail || err.message), 'error');
                this.loading = false;
            }
        });
    }

    guardarMisPreferencias(): void {
        this.loading = true;
        this.configuracionService.updatePreferencias(this.currentUserId, this.misPreferencias).subscribe({
            next: () => {
                this.showMessage('Preferencias actualizadas exitosamente', 'success');
                this.loading = false;
            },
            error: (err) => {
                this.showMessage('Error al actualizar preferencias: ' + (err.error?.detail || err.message), 'error');
                this.loading = false;
            }
        });
    }

    // ==================== GESTIÓN DE MIEMBROS ====================

    loadMiembros(): void {
        this.loading = true;
        this.configuracionService.getMiembrosHogar().subscribe({
            next: (miembros) => {
                // Filtrar para no mostrar al usuario actual en la lista
                this.miembros = miembros.filter(m => m.id !== this.currentUserId);
                this.loading = false;
            },
            error: (err) => {
                this.showMessage('Error al cargar miembros: ' + (err.error?.detail || err.message), 'error');
                this.loading = false;
            }
        });
    }

    editarPreferenciasMiembro(miembro: Miembro): void {
        this.selectedMember = miembro;
        this.loading = true;

        this.configuracionService.getPreferencias(miembro.id).subscribe({
            next: (prefs) => {
                this.memberPreferences = prefs;
                this.showMemberDialog = true;
                this.loading = false;
            },
            error: (err) => {
                this.showMessage('Error al cargar preferencias del miembro: ' + (err.error?.detail || err.message), 'error');
                this.loading = false;
            }
        });
    }

    cerrarDialogMiembro(): void {
        this.showMemberDialog = false;
        this.selectedMember = null;
    }

    guardarPreferenciasMiembro(): void {
        if (!this.selectedMember) return;

        this.loading = true;
        this.configuracionService.updatePreferencias(this.selectedMember.id, this.memberPreferences).subscribe({
            next: () => {
                this.showMessage('Preferencias del miembro actualizadas exitosamente', 'success');
                this.loading = false;
                this.cerrarDialogMiembro();
            },
            error: (err) => {
                this.showMessage('Error al actualizar preferencias: ' + (err.error?.detail || err.message), 'error');
                this.loading = false;
            }
        });
    }

    actualizarRolMiembro(miembro: Miembro, nuevoRol: number): void {
        this.loading = true;
        this.configuracionService.updateRol(miembro.id, { id_rol: nuevoRol }).subscribe({
            next: () => {
                this.showMessage(`Rol de ${miembro.nombre_completo} actualizado exitosamente`, 'success');
                miembro.id_rol = nuevoRol;
                this.loading = false;
            },
            error: (err) => {
                this.showMessage('Error al actualizar rol: ' + (err.error?.detail || err.message), 'error');
                this.loading = false;
            }
        });
    }

    getRoleName(idRol: number): string {
        const roles: { [key: number]: string } = {
            1: 'Administrador',
            2: 'Miembro'
        };
        return roles[idRol] || 'Desconocido';
    }

    // ==================== UTILIDADES ====================

    showMessage(message: string, type: 'success' | 'error'): void {
        this.message = message;
        this.messageType = type;

        // Auto-ocultar mensaje después de 5 segundos
        setTimeout(() => {
            this.clearMessage();
        }, 5000);
    }

    clearMessage(): void {
        this.message = '';
        this.messageType = '';
    }
}
