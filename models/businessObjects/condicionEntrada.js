import {FabricaErrores} from '../errors/errorsManager.js'
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';
import { CondicionEntradaDAO } from '../dataAccessObjects/condicionEntradaDAO.js';
import { TIPO_MENSAJE_ENTRADA } from './modelConstants.js';

const consultarCondicionEntradaPorFase = async (faseConversacionId,secuencia_dentro_de_fase) => {
    
    return await CondicionEntradaDAO.consultarCondicionEntradaPorFase(faseConversacionId,secuencia_dentro_de_fase);
}

const consultarCondicionEntradaParaAbortar = async (guion_conversacion_id) => {
    
    return await CondicionEntradaDAO.consultarCondicionEntradaParaAbortar(guion_conversacion_id);
}

async function esCondicionEntradaValida(condicionEntrada,entrada_de_cliente){

    if (!condicionEntrada) return false;

    if (condicionEntrada.tipo_mensaje_entrada_id == TIPO_MENSAJE_ENTRADA.DATO_CONSTANTE){
        if (condicionEntrada.valor_dato_constante.toString().trim().toUpperCase() === entrada_de_cliente.toString().trim().toUpperCase()){
            loggerGlobal.debug(`Se evaluo como igual la entrada del cliente <${entrada_de_cliente}> con la condicion de entrada: `);
            return true;
        }

        loggerGlobal.debug(`La entrada del cliente ${entrada_de_cliente} no es valida como condicion de entrada: `);
        return false;
    }

    if (condicionEntrada.tipo_mensaje_entrada_id == TIPO_MENSAJE_ENTRADA.CADENA_LIBRE){
        //cualquier entrada es permitida ...
        return true;
    }

    if (condicionEntrada.tipo_mensaje_entrada_id == TIPO_MENSAJE_ENTRADA.CADENA_CON_PATRON){
        const patron = new RegExp(condicionEntrada.formato_de_valor_entrada);
        //const found = patron.exec(entradaDeCliente);
        //loggerGlobal.debug('el encontrado es: '+found);
        loggerGlobal.debug('el patron es: '+patron.source);
        //loggerGlobal.debug('el formato es: '+condicionEntrada.formato_de_valor_entrada);
        if (patron.test(entrada_de_cliente)){
        //if (found){
            loggerGlobal.debug(`Se evaluo como valida la entrada del cliente <${entrada_de_cliente}> con el formato de entrada requerido`);
            return true;
        }

        loggerGlobal.debug(`La entrada del cliente <${entrada_de_cliente}> no se corresponde con el formato de entrada requerido`);
        return false;
    }

    if (condicionEntrada.tipo_mensaje_entrada_id == TIPO_MENSAJE_ENTRADA.ANALISIS_INTELIGENTE){
        return false;
    }

    if (condicionEntrada.tipo_mensaje_entrada_id == TIPO_MENSAJE_ENTRADA.ECUACION_CON_VARIABLES){
        return false;
    }

    if (condicionEntrada.tipo_mensaje_entrada_id == TIPO_MENSAJE_ENTRADA.IMAGEN){
        return false;
    }

    return false;
}


const verificarEntradaEsValida = async (faseConversacionId,entrada_de_cliente, condicionEntradaParaAbortar) => {

    loggerGlobal.debug('la entrada_de_cliente que me llego: '+entrada_de_cliente);

    if (!entrada_de_cliente || entrada_de_cliente.toString() === ''){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe proveer una entrada de datos para verificarla como condicion de entrada');
    }
    
    if (!condicionEntradaParaAbortar){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'No se proveyo la condicion de entrada para abortar; no se puede verificar si es valida la entrada del cliente');
    }
    
    if (!condicionEntradaParaAbortar.valor_dato_constante){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorConfiguracionDatos,
            'La condicion de entrada para abortar debe tener un valor de dato constante registrado en la BD');
    }
    
    loggerGlobal.debug('La condicionEntradaParaAbortar es: '+condicionEntradaParaAbortar.valor_dato_constante);
    
    if (condicionEntradaParaAbortar.valor_dato_constante && 
        condicionEntradaParaAbortar.valor_dato_constante.toString() === entrada_de_cliente.trim().toString()){
            loggerGlobal.debug('El cliente introdujo la condicion de entrada para abortar ... ');
            return condicionEntradaParaAbortar;
    }

    const condicionesEntrada = await CondicionEntradaDAO.consultarCondicionesEntradaPorFase(faseConversacionId);

    let condicionEntradaValida;
    for(let i = 0; i < condicionesEntrada.length; i++){

        loggerGlobal.debug('Evaluando la condicion de entrada: '+condicionesEntrada[i].id);
        const esEntradaValida = await esCondicionEntradaValida(condicionesEntrada[i], entrada_de_cliente);

        if (esEntradaValida && esEntradaValida === true){ 
            loggerGlobal.debug('La entrada del cliente se evaluo como valida: '+entrada_de_cliente);
            condicionEntradaValida = condicionesEntrada[i];
            break;
        }
    }

    if (!condicionEntradaValida) loggerGlobal.debug('La entrada no es valida ... ');
    return condicionEntradaValida;
}



const CondicionEntrada = {
    consultarCondicionEntradaPorFase : consultarCondicionEntradaPorFase,
    verificarEntradaEsValida: verificarEntradaEsValida,
    esCondicionEntradaValida: esCondicionEntradaValida,
    consultarCondicionEntradaParaAbortar: consultarCondicionEntradaParaAbortar,
}

export {CondicionEntrada};