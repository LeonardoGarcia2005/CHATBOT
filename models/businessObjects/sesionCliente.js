import { loggerGlobal } from '../../globalServices/logging/loggerManager.js'
import { sesionClienteDAO } from '../dataAccessObjects/sesionClienteDAO.js'

const consultarSesion = async (phoneNumberUser) => {
  let result = await sesionClienteDAO.consultarSesion(phoneNumberUser)
  return result
}

const insertarSesionEnBD = async (
  phoneNumberUser,
  dateWhatsapp,
  sesionData
) => {
  const sesionJSON = JSON.stringify(sesionData)
  const result = await sesionClienteDAO.insertarSesionEnBD(
    phoneNumberUser,
    dateWhatsapp,
    sesionJSON
  )
  return result
}

const sesionCliente = {
  consultarSesion: consultarSesion,
  insertarSesion: insertarSesionEnBD,
}

export { sesionCliente }
