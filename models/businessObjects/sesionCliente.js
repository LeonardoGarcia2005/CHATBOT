import { sesionClienteDAO } from '../dataAccessObjects/sesionClienteDAO.js'

const consultarSesion = async (phoneNumberUser) => {
  let result = await sesionClienteDAO.consultarSesion(phoneNumberUser)
  return result
}

const insertarSesionEnBD = async (phoneNumberUser, dateWhatsapp) => {
  let result = await sesionClienteDAO.insertarSesionEnBD(
    phoneNumberUser,
    dateWhatsapp
  )
  return result
}

const sesionCliente = {
  consultarSesion: consultarSesion,
  insertarSesion: insertarSesionEnBD
}

export { sesionCliente }
