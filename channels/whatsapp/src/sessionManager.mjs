//Guardar la sesion 
//Crear un obtenersesion buscando por el numero de telefono y verificar si la sesion no está vencida

import { configurationProvider } from '../../../globalServices/config/configurationManager.js';
import axios from 'axios'
import { dbConnectionProvider } from '../../../models/db/dbConnectionManager.js'
import { FabricaErrores } from '../../../models/errors/errorsManager.js';
import { loggerGlobal } from '../../../globalServices/logging/loggerManager.js';

class SessionManager {
    constructor() {
        this.sessions = {};
        this.timeoutWarnings = {};
    }

    async obtenerSession(phoneNumberUser) {
        if (!this.sessions[phoneNumberUser]) {
            const newSession = {
                identificador_cliente_en_canal: phoneNumberUser,
                tiempo_limite_sesion: 3600,
                estado: true,
            };
            this.sessions[phoneNumberUser] = newSession;

            await this.insertarSesionEnBD(phoneNumberUser);
        }
        return this.sessions[phoneNumberUser];
    }

    async actualizarSession(userId, data) {
        this.sessions[userId] = { ...this.sessions[userId], ...data, ultimaInteraccion: Date.now() };
        
        if (this.timeoutWarnings[userId]) {
            clearTimeout(this.timeoutWarnings[userId]);
            delete this.timeoutWarnings[userId];
        }
        
        this.timeoutWarnings[userId] = setTimeout(() => {
            this.advertirInactividad(userId);
        }, 50 * 1000);

        await this.actualizarSesionEnBD(userId, this.sessions[userId]);
    }

    async eliminarSession(userId) {
        delete this.sessions[userId];
        if (this.timeoutWarnings[userId]) {
            clearTimeout(this.timeoutWarnings[userId]);
            delete this.timeoutWarnings[userId];
        }

        await this.finalizarSesionEnBD(userId);
    }

    async advertirInactividad(userId) {
        if (this.sessions[userId]) {
            await sendMessage(userId, "Tu sesión está por expirar debido a inactividad. Por favor, responde si deseas continuar.");
            setTimeout(async () => {
                if (this.sessions[userId] && Date.now() - this.sessions[userId].ultimaInteraccion > 60 * 1000) {
                    await this.limpiarSesionesInactivas();
                    await sendMessage(userId, "Tu sesión ha expirado. Por favor, di 'hola' para comenzar una nueva conversación.");
                }
            }, 60 * 1000);
        }
    }

    async limpiarSesionesInactivas(tiempoInactivo = 60 * 1000) {
        const ahora = Date.now();
        for (const userId of Object.keys(this.sessions)) {
            if (ahora - this.sessions[userId].ultimaInteraccion > tiempoInactivo) {
                loggerGlobal.debug(`Sesión expirada para el usuario ${userId}`);
                await this.eliminarSession(userId);
            }
        }
    }

    async insertarSesionEnBD(phoneNumberUser) {
        try {
            const values = [{
                token_sesion: null,
                tiempo_limite_sesion: 3600,
                fecha_hora_inicio_sesion: new Date(),
                identificador_cliente_en_canal: phoneNumberUser,
                registro_esta_activo: true,
                estado: true,
            }];

            const columnasInsert = new dbConnectionProvider.helpers.ColumnSet([
                'token_sesion',
                'tiempo_limite_sesion',
                'identificador_cliente_en_canal',
                'registro_esta_activo'
            ], { table: 'sesion' });

            const query = dbConnectionProvider.helpers.insert(values, columnasInsert) + 
                          ' RETURNING id, token_sesion, tiempo_limite_sesion, usuario_id, fecha_hora_inicio_sesion, fecha_hora_finaliza_sesion, registro_esta_activo';

            const result = await dbConnectionProvider.oneOrNone(query);
            return result;
        } catch (error) {
            loggerGlobal.error('Error al insertar sesión en BD:', error);
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorBaseDatos,
                'Error al insertar sesión en la base de datos'
            );
        }
    }

    async actualizarSesionEnBD(userId, sessionData) {
        try {
            const query = `
                UPDATE public.sesion 
                SET datos = $1 
                WHERE token_sesion = $2 AND registro_esta_activo = true
            `;
            await dbConnectionProvider.none(query, [JSON.stringify(sessionData), userId]);
        } catch (error) {
            loggerGlobal.error('Error al actualizar sesión en BD:', error);
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorBaseDatos,
                'Error al actualizar sesión en la base de datos'
            );
        }
    }

    async finalizarSesionEnBD(userId) {
        try {
            const query = `
                UPDATE public.sesion 
                SET fecha_hora_finaliza_sesion = CURRENT_TIMESTAMP, 
                    registro_esta_activo = false 
                WHERE token_sesion = $1
            `;
            await dbConnectionProvider.none(query, [userId]);
        } catch (error) {
            loggerGlobal.error('Error al finalizar sesión en BD:', error);
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorBaseDatos,
                'Error al finalizar sesión en la base de datos'
            );
        }
    }
}



//Funcion para enviar mensajes 
async function sendMessage(to, text, buttons = []) {
    const jwtToken = configurationProvider.pageAppForWhatsapp.jwtToken;
    const url = `https://graph.facebook.com/v20.0/105860479205162/messages`;
    const headers = {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
    };

    let body = {
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: { body: text }
    };

    if (buttons.length > 0) {
        body.type = "interactive";
        body.interactive = {
            type: "button",
            body: { text: text },
            action: {
                buttons: buttons.map(button => ({
                    type: "reply",
                    reply: { id: button.id, title: button.body }
                }))
            }
        };
    }
    try {
        // await getResponseFromTalking();
        await axios.post(url, body, { headers });
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

export default new SessionManager();