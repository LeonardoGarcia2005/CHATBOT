import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';
import { FaseInteraccionDAO } from '../dataAccessObjects/faseInteraccionDAO.js';


const consultaUno = async (id) => {
    return FaseInteraccionDAO.consultarUno(id);
}

const consultaTodos = async () => {
    return FaseInteraccionDAO.consultarTodos();
}

const insertaUno = async (faseInteraccionCreateInput,conversacionId) => {
    return FaseInteraccionDAO.insertarUno(faseInteraccionCreateInput,conversacionId);
}

const insertaFasesInteraccion_query = (fasesInteraccionCreateInput) => {
    return FaseInteraccionDAO.insertaFasesInteraccion_query(fasesInteraccionCreateInput);
}

const llenarFasesInteraccionCreateInput = async (fases_conversacion) => {
    if (!fases_conversacion || !Array.isArray(fases_conversacion)){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            `Debe especificar un arreglo de fases de conversacion para poder crear los FaseInteraccionCreateInput`);
    }

    let fases_interaccion = [];
    //antes yo estaba especificando la secuencia, pero ahora lo puse como los mensajes emitidos, con un
    //trigger que incremente ese campo en la BD, para evitar tener que consultarlo el último valor para 
    //incrementarlo cuando haga nuevos registros en esta tabla
    //let contador = 1;
    fases_conversacion.forEach(faseConversacion => {
        const faseInteraccionCreateInput = {
            fase_conversacion_id: faseConversacion.id,
            conversacion_id: faseConversacion.conversacion_id,
            //secuencia_en_conversacion: contador++,
            mensaje_fase_conversacion: faseConversacion.mensaje_de_fase,
        }
        fases_interaccion.push(faseInteraccionCreateInput);
    });
    return fases_interaccion;
}



const FaseInteraccion = {
    consultarUno : consultaUno,
    consultarTodos: consultaTodos,
    insertarUno: insertaUno,
    llenarFasesInteraccionCreateInput: llenarFasesInteraccionCreateInput,
    insertaFasesInteraccion_query: insertaFasesInteraccion_query,
}

export {FaseInteraccion};