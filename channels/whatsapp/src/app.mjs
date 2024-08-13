import { createBot, createProvider } from '@builderbot/bot'
import { PostgreSQLAdapter as Database } from '@builderbot/database-postgres'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import { configurationProvider } from '../../../globalServices/config/configurationManager.js'
import { sesionCliente } from '../../../models/businessObjects/sesionCliente.js'
import { loggerGlobal } from '../../../globalServices/logging/loggerManager.js'
import express from 'express'
import axios from 'axios'

// Función para obtener una respuesta del servicio de conversación
async function getResponseFromTalking(received_message, phoneNumberUser) {
  if (!received_message) return null

  loggerGlobal.debug('Voy a invocar los servicios de conversación...')

  const query = {
    mutation: `
      mutation CrearNuevaConversacion($conversacionCreateInput: ConversacionCreateInput!) {
        crearNuevaConversacion(conversacionCreateInput: $conversacionCreateInput) {
          ultima_fase_conversacion {
            id
            nombre_fase
            mensaje_de_fase
          }
        }
      }
    `,
  }

  loggerGlobal.debug('El query es: ' + query.mutation)

  const respuestaSistema = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    body: JSON.stringify({
      query: query.mutation,
      variables: {
        conversacionCreateInput: {
          guion_conversacion_id: '1',
          tomada_por_operador: false,
          canal_id: '3', // 3 es el canal de whatsapp
          identificador_cliente_en_canal: phoneNumberUser,
        },
      },
    }),
    headers: { 'Content-type': 'application/json', 'Canal': 'whatsapp' },
  })
    .then((response) => response.json())
    .then((json) => {
      loggerGlobal.debug('Obtuve respuesta al invocar servicio...')
      loggerGlobal.debug(json)
      return json
    })
    .catch((error) => {
      loggerGlobal.error(error)
    })

  console.log('getResponseFromTalking', respuestaSistema)

  return respuestaSistema
}

// Función para enviar mensajes usando la API de WhatsApp de Meta
async function sendMessage(to, text, buttons = []) {
  const jwtToken = configurationProvider.pageAppForWhatsapp.jwtToken
  const url = 'https://graph.facebook.com/v20.0/105860479205162/messages' // URL de la API de WhatsApp
  const headers = {
    Authorization: `Bearer ${jwtToken}`,
    'Content-Type': 'application/json',
  }

  let body = {
    messaging_product: 'whatsapp',
    to: to,
    type: 'text',
    text: { body: text },
  }

  if (buttons.length > 0) {
    body.type = 'interactive'
    body.interactive = {
      type: 'button',
      body: { text: text },
      action: {
        buttons: buttons.map((button) => ({
          type: 'reply',
          reply: { id: button.id, title: button.body },
        })),
      },
    }
  }

  try {
    await axios.post(url, body, { headers })
  } catch (error) {
    console.error('Error sending message:', error)
  }
}

// Función para manejar los mensajes entrantes
async function handleMessage(phoneNumberUser, message) {
  if (!message || (!message.text && !message.interactive)) {
    loggerGlobal.error('Mensaje recibido en un formato inesperado:', message)
    await sendMessage(
      phoneNumberUser,
      'Lo siento, no pude procesar tu mensaje. ¿Puedes intentarlo de nuevo?'
    )
    return
  }

  if (message.text && message.text.body) {
    const messageBody = message.text.body.toLowerCase()
    await sendMessage(phoneNumberUser, `Recibido: ${messageBody}`)

    // Iniciar la conversación
    const respuestaSistema = await getResponseFromTalking(
      messageBody,
      phoneNumberUser
    )
    if (respuestaSistema) {
      const mensajeDeFase =
        respuestaSistema.data.crearNuevaConversacion.ultima_fase_conversacion
          .mensaje_de_fase
      await sendMessage(phoneNumberUser, mensajeDeFase)
    } else {
      await sendMessage(phoneNumberUser, 'No pude obtener una respuesta.')
    }
  }
}

// Función principal para configurar y manejar el webhook de WhatsApp
async function manejadorWhatsapp(app) {
  // Configurar middleware de Express para manejar JSON y datos de formulario
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Ruta para la verificación del webhook
  app.get('/webhook', (req, res) => {
    const verifyToken = configurationProvider.pageAppForWhatsapp.verifyToken

    const hubMode = req.query['hub.mode']
    const hubVerifyToken = req.query['hub.verify_token']

    if (hubMode === 'subscribe' && hubVerifyToken === verifyToken) {
      const hubChallenge = req.query['hub.challenge']
      res.status(200).send(hubChallenge)
    } else {
      res.sendStatus(403) // Rechazar si el token de verificación es incorrecto
    }
  })

  // Creación del adaptador del proveedor de Meta (WhatsApp)
  const adapterProvider = createProvider(Provider, {
    jwtToken: configurationProvider.pageAppForWhatsapp.jwtToken,
    numberId: configurationProvider.pageAppForWhatsapp.numberId,
    verifyToken: configurationProvider.pageAppForWhatsapp.verifyToken,
    version: configurationProvider.pageAppForWhatsapp.version,
  })

  // Configuración del adaptador de base de datos PostgreSQL
  const adapterDB = new Database({
    host: configurationProvider.db.host,
    user: configurationProvider.db.user,
    database: configurationProvider.db.database,
    password: configurationProvider.db.password,
    port: configurationProvider.db.port,
  })

  // Crear el bot y el servidor HTTP asociado
  const { httpServer } = await createBot({
    provider: adapterProvider,
    database: adapterDB,
  })

  // Ruta para recibir y procesar mensajes entrantes del cliente
  app.post('/webhook', async (req, res) => {
    try {
      // Se va desestructurando las propiedades del mensaje que envía el usuario desde Meta con todas sus propiedades
      const entry = req.body.entry[0]
      const changes = entry.changes[0]
      const value = changes.value

      // Verifica si el evento contiene un mensaje
      if (value.messages && value.messages[0]) {
        const message = value.messages[0]
        const phoneNumberUser = message.from
        const timestampInSeconds = message.timestamp
        // Convertir el timestamp a milisegundos, ya que Meta devuelve la fecha en segundos.
        // Para usar el objeto Date de JavaScript, que requiere milisegundos, es necesario convertirlo.
        const timestampInMilliseconds = timestampInSeconds * 1000
        const date = new Date(timestampInMilliseconds)

        const sesion = await sesionCliente.consultarSesion(phoneNumberUser)
        if (!sesion || !sesion.estado) {
          loggerGlobal.info(
            'No se encontró sesión activa, creando una nueva...'
          )
          await sesionCliente.insertarSesion(phoneNumberUser, date, value)
        } else {
          loggerGlobal.info('Sesión encontrada:', sesion)
        }
        // Procesa el mensaje recibido
        await handleMessage(phoneNumberUser, message)
      } else if (value.statuses && value.statuses[0]) {
        // Manejar estados de mensaje, si es necesario
      } else {
        loggerGlobal.error(
          'Se recibieron datos no relacionados con mensajes:',
          JSON.stringify(req.body, null, 2)
        )
      }
    } catch (error) {
      loggerGlobal.error(console.error('Error procesando el webhook:', error))
    }
    res.sendStatus(200)
  })

  // Iniciar el servidor HTTP
  httpServer(app)
}

export { manejadorWhatsapp }
