import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';
import { FaseConversacionDAO } from '../dataAccessObjects/faseConversacionDAO.js';


const consultaParaFaseInteraccion = async (fase_conversacion_id) => {
    
    let faseConversacion = await FaseConversacionDAO.consultaParaFaseInteraccion(fase_conversacion_id);

    return faseConversacion;
}

const consultaFaseYSiguienteNivel = async (fase_conversacion_id) => {
    
    let listaFases = await FaseConversacionDAO.consultaFaseYSiguienteNivel(fase_conversacion_id);
    const faseBaseConHijos = componerRamaFases(listaFases,fase_conversacion_id);

    return faseBaseConHijos;
}

const consultafasesConversacionHastaNivel1 = async (guion_conversacion_id) => {
    
    let listaFases = await FaseConversacionDAO.consultafasesConversacionHastaNivel1(guion_conversacion_id);
    const faseBase = getArbolFasesHastaNivel1(listaFases);

    return faseBase;
}

const getArbolFasesHastaNivel1 = (listaFases) => {

    if (!listaFases || !Array.isArray(listaFases) || listaFases.length <= 1) return listaFases;

    let faseIdNodoRaiz = 0;
    listaFases.some(fase => {
        loggerGlobal.debug('Estoy en el some ...');
        if (fase.nivel_nodo == 0){
            faseIdNodoRaiz = fase.id;
            return true;
        }
    });

    loggerGlobal.debug('Voy a componerRamas con faseIdNodoRaiz: '+faseIdNodoRaiz);
    const arbolFases = componerRamaFases(listaFases,faseIdNodoRaiz);

    return arbolFases;

};


/* Esta funcion asume que solo se retornara un objeto JSON con 2 niveles. 
   Identifica el nodo Base indicado por su faseId, y le agrega un arreglo de objetos
   FaseConversacion hijos (aquellos que tienen fase_padre_id = faseIdNodoBase)
*/
function componerRamaFases(listaFases,faseIdNodoBase){

    let mensaje = `No se proporciono una lista de fases para buscar el nodo base con faseId ${faseIdNodoBase} especificado`;
    if (!listaFases || listaFases.length < 1){
        loggerGlobal.error(mensaje);
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            mensaje);
    }

    mensaje = `No se proporciono un faseId como nodo base para buscar en la lista de fases`;
    if (!faseIdNodoBase || faseIdNodoBase < 1){
        loggerGlobal.error(mensaje);
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            mensaje);
    }

    let faseBase = null;
    let fasesHijas = new Array();

    loggerGlobal.debug('Voy a obtener dentro de la lista, la fase base especificada ... ');
    listaFases.some(fase => {
        if (fase.id == faseIdNodoBase){
            faseBase = fase;
            return true;
        }
    });

    if (!faseBase){
        const mensaje = `la fase base con id ${faseIdNodoBase} no se encontro dentro de la lista de fases proporcionada `;
        loggerGlobal.error(mensaje);
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            mensaje);
    }

    loggerGlobal.debug('Voy a obtener fases hijas ... ');
    listaFases.forEach(fase => {
        if (fase.fase_padre_id == faseIdNodoBase){
            fasesHijas.push(fase);
        }
    });
    
    if (fasesHijas.length > 0){
        loggerGlobal.debug(`Obtuve ${fasesHijas.length} fases hijas ... `);
        faseBase.fases_hijas = fasesHijas;
    }

    return faseBase;
}

/*const consultaTodos = async () => {
    return FaseConversacionDAO.consultarTodos();
}

const insertaUno = async (faseInteraccionCreateInput,conversacionId) => {
    return FaseConversacionDAO.insertarUno(faseInteraccionCreateInput,conversacionId);
}*/

const FaseConversacion = {
    consultafasesConversacionHastaNivel1: consultafasesConversacionHastaNivel1,
    getArbolFasesHastaNivel1:getArbolFasesHastaNivel1,
    consultaFaseYSiguienteNivel: consultaFaseYSiguienteNivel,
    consultaParaFaseInteraccion : consultaParaFaseInteraccion,
}

export {FaseConversacion};