import { dbConnectionProvider } from '../db/dbConnectionManager.js'
import { FabricaErrores } from '../errors/errorsManager.js'
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js'
import cron from 'node-cron'

const consultarSesion = async (phoneNumberUser) => {
  // Validar que contiene solo dígitos y tiene una longitud mínima de 7 caracteres y maxima de 15
  const isValid = /^\d{7,15}$/.test(phoneNumberUser)

  if (!isValid) {
    throw FabricaErrores.crearError(
      FabricaErrores.TipoError.ErrorValidacionDatos,
      'Debes enviar un numero telefonico correcto'
    )
  }

  loggerGlobal.info(
    'el numero que me llego para buscar la sesion es: ' + phoneNumberUser
  )

  try {
    const querySesion = `SELECT tiempo_limite_sesion, fecha_hora_inicio_sesion, registro_esta_activo, identificador_cliente_en_canal, estado
                            FROM sesion
                            WHERE identificador_cliente_en_canal='${phoneNumberUser}'
                            ORDER BY fecha_hora_inicio_sesion DESC
                            LIMIT 1`

    return await dbConnectionProvider.oneOrNone(querySesion)
  } catch (error) {
    loggerGlobal.error('Error al consultar una sesion...')
    loggerGlobal.error(error)
    return error
  }
}

const insertarSesionEnBD = async (phoneNumberUser, dateWhatsapp) => {
  try {
    // Si dateWhatsapp es un objeto Date, conviértelo a una cadena ISO 8601
    const formattedDate =
      dateWhatsapp instanceof Date ? dateWhatsapp.toISOString() : dateWhatsapp

    // Define los valores para insertar
    const values = [
      {
        token_sesion: null,
        tiempo_limite_sesion: 3600,
        fecha_hora_inicio_sesion: formattedDate,
        identificador_cliente_en_canal: phoneNumberUser,
        registro_esta_activo: true,
        estado: true,
      },
    ]

    // Define las columnas que se van a insertar
    const columnasInsert = new dbConnectionProvider.helpers.ColumnSet(
      [
        'token_sesion',
        'tiempo_limite_sesion',
        'fecha_hora_inicio_sesion',
        'identificador_cliente_en_canal',
        'registro_esta_activo',
        'estado',
      ],
      { table: 'sesion' }
    )

    const query =
      dbConnectionProvider.helpers.insert(values, columnasInsert) +
      ' RETURNING id, token_sesion, tiempo_limite_sesion, fecha_hora_inicio_sesion, fecha_hora_finaliza_sesion, identificador_cliente_en_canal, registro_esta_activo, estado'

    const result = await dbConnectionProvider.oneOrNone(query)
    return result
  } catch (error) {
    loggerGlobal.error('Error al insertar sesión en BD:', error)
    throw FabricaErrores.crearError(
      FabricaErrores.TipoError.ErrorBaseDatos,
      'Error al insertar sesión en la base de datos'
    )
  }
}

const marcarSesionesInactivas = async () => {
  const queryBuscarSesionesActivas = `
    SELECT id, fecha_hora_inicio_sesion, tiempo_limite_sesion 
    FROM sesion 
    WHERE estado = true`

  try {
    // Obtener todas las sesiones activas
    const sesionesActivas = await dbConnectionProvider.manyOrNone(
      queryBuscarSesionesActivas
    )

    // Obtener la hora actual
    const ahora = new Date()

    // Iterar sobre las sesiones activas y verificar si deben ser marcadas como inactivas
    for (const sesion of sesionesActivas) {
      const fechaInicio = new Date(sesion.fecha_hora_inicio_sesion)

      // Calcular la diferencia en segundos y convertir los milisegundos a segundos para poder manejar mejor las diferencias
      const diferenciaEnSegundos = Math.floor((ahora - fechaInicio) / 1000)

      // Verificar si la sesión ha estado inactiva por más de 3600 segundos es decir una hora
      if (diferenciaEnSegundos > 3600) {
        // Actualizar el estado de la sesión a inactivo
          await dbConnectionProvider.oneOrNone(
          `
          UPDATE sesion
          SET fecha_hora_finaliza_sesion = $1,
              estado = false
          WHERE id = $2
          RETURNING id
          `,
          [new Date(), sesion.id]
        )

        loggerGlobal.info(`Sesión con ID ${sesion.id} marcada como inactiva.`)
      }
    }
  } catch (error) {
    loggerGlobal.error('Error al marcar sesiones como inactivas:', error)
    throw FabricaErrores.crearError(
      FabricaErrores.TipoError.ErrorBaseDatos,
      'Error al marcar sesiones como inactivas en la base de datos'
    )
  }
}

const sesionClienteDAO = {
  consultarSesion: consultarSesion,
  insertarSesionEnBD: insertarSesionEnBD,
}

export { sesionClienteDAO }

// Tarea programada para que se ejecute cada 5 minutos y evaluar si debemos pasar la sesion a activa o inactiva
cron.schedule('*/1 * * * *', () => {
  marcarSesionesInactivas().catch((error) => {
    loggerGlobal.error(
      'Error en la ejecución de la tarea cron para marcarSesionesInactivas:',
      error
    )
  })
})
