import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { AssistantVoiceService, RespuestaVoz } from '../../services/assistant-voice.service';

@Component({
    selector: 'app-voice-assistant',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './voice-assistant.component.html',
    styleUrls: ['./voice-assistant.component.css'],
    animations: [
        trigger('slideUp', [
            transition(':enter', [
                style({ transform: 'translateY(20px)', opacity: 0 }),
                animate('500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                    style({ transform: 'translateY(0)', opacity: 1 }))
            ]),
            transition(':leave', [
                animate('300ms ease-out',
                    style({ transform: 'translateY(20px)', opacity: 0 }))
            ])
        ]),
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0, transform: 'scale(0.8)' }),
                animate('400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                    style({ opacity: 1, transform: 'scale(1)' }))
            ])
        ])
    ]
})
export class VoiceAssistantComponent {
    // Estado de la grabación
    isRecording = false;
    isSending = false;

    // Control del menú de burbujas
    menuOpen = false;

    // MediaRecorder y chunks de audio
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];

    // Datos de la respuesta
    textoUsuario = '';
    respuestaTexto = '';
    audioUrl = '';

    // Estado de error
    errorMessage = '';

    // Efecto visual de pulso
    isPulsing = false;

    constructor(private assistantService: AssistantVoiceService) { }

    /**
     * Maneja el click en el orbe principal
     */
    handleOrbClick(): void {
        console.log('🖱️ [VoiceAssistant] Click en orbe. Estado:', {
            recording: this.isRecording,
            sending: this.isSending,
            menuOpen: this.menuOpen
        });

        if (this.isRecording) {
            this.detenerYEnviar();
        } else if (!this.isSending) {
            this.toggleMenu();
        }
    }

    /**
     * Toggle del menú de burbujas
     */
    toggleMenu(): void {
        this.menuOpen = !this.menuOpen;
        console.log(`📂 [VoiceAssistant] Menú ${this.menuOpen ? 'abierto' : 'cerrado'}`);
    }

    /**
     * Inicia la grabación de audio usando getUserMedia
     */
    async iniciarGrabacion(): Promise<void> {
        console.log('🎤 [VoiceAssistant] Iniciando proceso de grabación...');
        try {
            // Limpiar estado previo y cerrar menú
            this.reset();
            this.menuOpen = false;

            // Solicitar acceso al micrófono
            console.log('🎤 [VoiceAssistant] Solicitando acceso al micrófono...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('✅ [VoiceAssistant] Acceso al micrófono concedido.');

            // Determinar mimeType con fallback
            let mimeType = 'audio/webm';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'audio/webm;codecs=opus';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'audio/ogg;codecs=opus';
                    if (!MediaRecorder.isTypeSupported(mimeType)) {
                        mimeType = ''; //usar default del navegador
                    }
                }
            }
            console.log(`ℹ️ [VoiceAssistant] MimeType seleccionado: ${mimeType || 'default'}`);

            // Configurar MediaRecorder
            const options = mimeType ? { mimeType } : {};
            this.mediaRecorder = new MediaRecorder(stream, options);

            this.audioChunks = [];

            // Capturar chunks de audio
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                    console.log(`📦 [VoiceAssistant] Chunk de audio capturado: ${event.data.size} bytes`);
                }
            };

            // Iniciar grabación
            this.mediaRecorder.start();
            this.isRecording = true;
            console.log('🔴 [VoiceAssistant] Grabación iniciada.');

        } catch (error) {
            console.error('❌ [VoiceAssistant] Error al iniciar grabación:', error);
            this.errorMessage = 'No se pudo acceder al micrófono. Verifica los permisos.';
            this.mostrarErrorTemporal();
        }
    }

    /**
     * Detiene la grabación y envía el audio al backend
     */
    async detenerYEnviar(): Promise<void> {
        console.log('⏹️ [VoiceAssistant] Deteniendo grabación...');
        if (!this.mediaRecorder || !this.isRecording) {
            console.warn('⚠️ [VoiceAssistant] No hay grabación activa para detener.');
            return;
        }

        this.isRecording = false;

        // Crear promesa para esperar el evento stop
        const audioBlob = await new Promise<Blob>((resolve) => {
            this.mediaRecorder!.onstop = () => {
                // Usar el mimeType real del grabador o fallback a webm
                const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
                console.log(`ℹ️ [VoiceAssistant] Grabación detenida. MimeType final: ${mimeType}`);

                const blob = new Blob(this.audioChunks, { type: mimeType });
                console.log(`💾 [VoiceAssistant] Blob creado. Tamaño total: ${blob.size} bytes, Tipo: ${blob.type}`);
                resolve(blob);
            };
            this.mediaRecorder!.stop();

            // Detener todas las pistas del stream
            this.mediaRecorder!.stream.getTracks().forEach(track => {
                track.stop();
                console.log('🔇 [VoiceAssistant] Pista de audio detenida.');
            });
        });

        // Validar que haya audio
        if (audioBlob.size === 0) {
            console.error('❌ [VoiceAssistant] El blob de audio está vacío.');
            this.errorMessage = 'No se grabó ningún audio.';
            this.mostrarErrorTemporal();
            return;
        }

        // Enviar al backend
        await this.enviarAudio(audioBlob);
    }

    /**
     * Envía el audio al backend y procesa la respuesta
     */
    private async enviarAudio(blob: Blob): Promise<void> {
        console.log('🚀 [VoiceAssistant] Preparando envío de audio al backend...');
        this.isSending = true;
        this.errorMessage = '';

        try {
            // Obtener el token real desde el servicio de autenticación
            const token = localStorage.getItem('access_token') || 'TU_TOKEN_AQUI';
            console.log(`🔑 [VoiceAssistant] Token obtenido: ${token ? 'Sí (Longitud: ' + token.length + ')' : 'No'}`);

            // Historial opcional (ejemplo vacío)
            const historial = undefined;

            // Llamar al servicio
            console.log('📡 [VoiceAssistant] Llamando a AssistantVoiceService.enviarAudio...');
            const respuesta = await this.assistantService
                .enviarAudio(blob, token, historial)
                .toPromise();

            console.log('✅ [VoiceAssistant] Respuesta recibida del backend:', respuesta);

            if (respuesta) {
                this.procesarRespuesta(respuesta);
            }

        } catch (error: any) {
            console.error('❌ [VoiceAssistant] Error al enviar audio:', error);
            console.error('❌ [VoiceAssistant] Detalles del error:', {
                status: error.status,
                statusText: error.statusText,
                message: error.message,
                errorBody: error.error
            });

            if (error.status === 0) {
                this.errorMessage = 'Error de conexión con el servidor.';
            } else if (error.status === 401) {
                this.errorMessage = 'Sesión expirada o token inválido.';
            } else {
                this.errorMessage = error?.error?.message || 'Error al procesar el audio.';
            }

            this.mostrarErrorTemporal();
        } finally {
            this.isSending = false;
            console.log('🏁 [VoiceAssistant] Proceso de envío finalizado.');
        }
    }

    /**
     * Procesa la respuesta del backend
     */
    private procesarRespuesta(respuesta: RespuestaVoz): void {
        console.log('⚙️ [VoiceAssistant] Procesando respuesta...');
        // Setear textos
        this.textoUsuario = respuesta.texto_usuario || '';
        this.respuestaTexto = respuesta.respuesta_texto || '';
        console.log('📝 [VoiceAssistant] Textos actualizados:', { usuario: this.textoUsuario, respuesta: this.respuestaTexto });

        // Crear URL del audio si está disponible
        if (respuesta.audio_base64 && respuesta.mime_type) {
            this.audioUrl = `data:${respuesta.mime_type};base64,${respuesta.audio_base64}`;
            console.log('🔊 [VoiceAssistant] Audio URL generada.');
        } else {
            console.log('⚠️ [VoiceAssistant] No se recibió audio en la respuesta.');
        }

        // Activar efecto de pulso
        this.activarEfectoPulso();

        // Vibración si está disponible
        if (navigator.vibrate) {
            navigator.vibrate([80, 40, 80]);
        }
    }

    /**
     * Activa el efecto visual de pulso temporalmente
     */
    private activarEfectoPulso(): void {
        this.isPulsing = true;
        setTimeout(() => {
            this.isPulsing = false;
        }, 1500); // Duración de la animación
    }

    /**
     * Muestra el error temporalmente
     */
    private mostrarErrorTemporal(): void {
        setTimeout(() => {
            this.errorMessage = '';
        }, 5000);
    }

    /**
     * Reinicia el componente al estado inicial
     */
    reset(): void {
        console.log('🔄 [VoiceAssistant] Reseteando componente.');
        this.textoUsuario = '';
        this.respuestaTexto = '';
        this.audioUrl = '';
        this.errorMessage = '';
        this.isPulsing = false;
        this.audioChunks = [];
        this.menuOpen = false;
    }
}
