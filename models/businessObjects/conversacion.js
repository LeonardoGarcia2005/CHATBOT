import {FaseInteraccion} from './faseInteraccion.js'; 
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';
import {FabricaErrores} from '../errors/errorsManager.js'
import { ConversacionDAO } from '../dataAccessObjects/conversacionDAO.js';
import { GuionConversacion } from './guionConversacion.js';
import { ClienteCanal } from './clienteCanal.js';
import { MensajeEmitido } from './mensajeEmitido.js';
//import { cli } from 'winston/lib/winston/config/index.js';
import { CondicionEntrada } from './condicionEntrada.js';
import { AccionARealizar } from './accionARealizar.js';
import { FaseConversacionDAO } from '../dataAccessObjects/faseConversacionDAO.js';


const consultaUno = async (id) => {
    return ConversacionDAO.consultarUno(id);
}

const consultaTodos = async () => {
    return ConversacionDAO.consultarTodos();
}

const insertaUno = async (conversacionCreateInput,guionConversacionId) => {
    return ConversacionDAO.insertarUno(conversacionCreateInput,guionConversacionId);
}

const txInsertaConversacion = async (conversacionCreateInput,faseInteraccionCreateInput,guionConversacionId) => {
    return ConversacionDAO.txInsertarConversacion(conversacionCreateInput,faseInteraccionCreateInput,guionConversacionId);
}

/*
Este metodo tiene 2 comportamientos, dependiendo de como esta la bandera (boolean) del campo ramas_distintas_cliente_no_cliente
de la tabla guion_conversacion. Si esa columna esta en true, significa que la conversacion tomara ramas de fases
diferentes dependiendo de si es un cliente o si es un no cliente. Pero si esta en false, significa que sin importar si
quien accede es cliente o no, igual se va a registrar la fase de interaccion correspondiente a la fase de conversacion 
de nivel 1 que sigue al nodo raiz (nivel 0) del guion de conversacion, es decir, es una misma rama de fases de conversacion
para clientes y no clientes.
Por lo antes dicho, para crear una nueva conversacion, despues que hace las validaciones del negocio y las consultas
correspondientes, este servicio creara un registro en la tabla conversacion, y tambien uno o mas registros en las tabla
fase_interaccion, que serian el del nodo raiz y luego el que corresponde a la fase de conversacion de nivel 1 
respectiva: si se tienen ramas diferentes para clientes y no clientes, se buscara la fase de conversacion que se
debe mostrar a los clientes y creara una fase de interaccion con esa informacion; y si es un no cliente se creara con
la fase de conversacion que corresponde a los no clientes. Pero si no se tienen ramas diferentes para clientes y no 
clientes, entonces simplemente se creara la fase de interaccion con la informacion de la fase de conversacion de nivel 1
que primero se encuentre definida en el guion_conversacion.
En ambos casos, antes de crear la conversacion, el servicio tambien verifica si ya existe un registro en la tabla
cliente_canal con los datos del cliente que esta accediendo al sistema, y obtiene esos datos para verificar si se trata
o no de un cliente de la empresa. Pero si no existe el registro, entonces lo crea con el identificador que el cliente
tenga para ese canal en particular por donde esta accediendo.
Este servicio tambien invoca los metodos de mensajeEmitido para hacer el registro de la secuencia de los primeros 
mensajes emitidos en la conversacion, que son los que estan definidos en la fase de conversacion inicial (nodo raiz) y
la fase de conversacion que venga despues, segun lo arriba explicado, de nivel 1.
*/
const crearNuevaConversacion = async (conversacionCreateInput) => {

    const guionConversacion = await GuionConversacion.consultarGuion_CrearConversacion(conversacionCreateInput.guion_conversacion_id);
    loggerGlobal.debug('El guionConversacion consultado es: '+guionConversacion);
    loggerGlobal.debug('Sus canales registrados son: '+guionConversacion.canales);
    loggerGlobal.debug('La condicion entrada para abortar es: '+guionConversacion.condicion_entrada_para_abortar.valor_dato_constante);
    
    if (!guionConversacion.canales || guionConversacion.canales.length < 1){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorConfiguracionDatos,
            `El GuionConversacion con id ${conversacionCreateInput.guion_conversacion_id} no tiene canales registrados`);
    }

    const canales = guionConversacion.canales;
    let canalConversacionEsValido = false;
    let canalConversacion;
    canales.forEach(canal => {
        if (canal.id === conversacionCreateInput.canal_id){
            canalConversacionEsValido = true;
            canalConversacion = canal;
            loggerGlobal.debug('el canal de la conversacion es: ');
            loggerGlobal.debug(canal.toString());
            loggerGlobal.debug(JSON.stringify(canal));
            return;
        }
    });
    if (!canalConversacionEsValido){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            `El canal especificado en la conversacion no es valido para el GuionConversacion con id ${conversacionCreateInput.guion_conversacion_id}`);
    }

    if (!canalConversacion.admite_identificador_cliente_null && canalConversacion.admite_identificador_cliente_null === false &&
        !conversacionCreateInput.identificador_cliente_en_canal){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            `El canal de la conversacion exige que se especifique un identificador de cliente y este no fue suministrado`);
    }

    if (!guionConversacion.fase_conversacion_raiz){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            `El GuionConversacion con id ${conversacionCreateInput.guion_conversacion_id} no trajo la fase de conversacion raiz en la consulta`);
    }

    let esClienteChatbot = false;
    let clienteCanal;

    if (canalConversacion.admite_identificador_cliente_null && canalConversacion.admite_identificador_cliente_null === true){

        loggerGlobal.debug('el canal de conversacion acepta identificador de cliente null y se creara el cliente_canal ');
        const clienteCanalInput = {
            canal_id: canalConversacion.id,
        }
        clienteCanal = await ClienteCanal.insertaClienteCanal(clienteCanalInput);
    }
    else{        
        loggerGlobal.debug('voy a verificar el cliente que esta accediendo al sistema ...');
        clienteCanal = await ClienteCanal.getClienteCanal(conversacionCreateInput.identificador_cliente_en_canal,canalConversacion.id);
    
        if (!clienteCanal){

            loggerGlobal.debug('el cliente canal no existe y por tanto se creara');
            const clienteCanalInput = {
                canal_id: canalConversacion.id,
                identificador_cliente_en_canal: conversacionCreateInput.identificador_cliente_en_canal,
            }
            clienteCanal = await ClienteCanal.insertaClienteCanal(clienteCanalInput);
        }
        else{
            //solo en caso de que exista cliente_canal y exista cliente_chatbot, se asume que es un cliente
            if (clienteCanal.cliente_chatbot){ 
                esClienteChatbot = true;
                loggerGlobal.debug('quien accede es un cliente ...');
            }
            else loggerGlobal.debug('quien accede No es un cliente ...');
        }
    }

    loggerGlobal.debug('el cliente_canal_id obtenido es: '+clienteCanal.id);
    conversacionCreateInput.cliente_canal_id = clienteCanal.id;
    const fasesParaInteraccion = [];
    let ultimaFaseConversacion;

    if (guionConversacion.ramas_distintas_cliente_no_cliente){

        loggerGlobal.debug('Tengo ramas distintas para cliente y no cliente ...')
        const fasesConversacionNivel1 = guionConversacion.fase_conversacion_raiz.fases_hijas;

        if (!fasesConversacionNivel1 || fasesConversacionNivel1.length < 2 || !fasesConversacionNivel1[0] || 
            !fasesConversacionNivel1[1]){
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorConfiguracionDatos,
                `El GuionConversacion con id ${conversacionCreateInput.guion_conversacion_id} no tiene al menos 2 fases de conversacion de nivel 1 registradas`);
        }

        if (!fasesConversacionNivel1[0].es_fase_inicial_cliente && !fasesConversacionNivel1[1].es_fase_inicial_cliente){
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorConfiguracionDatos,
                `El GuionConversacion con id ${conversacionCreateInput.guion_conversacion_id} esta configurado para tener 2 ramas diferentes para clientes y no clientes, pero ambos nodos de nivel 1 estan configurados para no clientes. Indique en la BD cual es para clientes`);
        }

        let siguienteFaseCliente;
        let siguienteFaseNoCliente;
        fasesParaInteraccion.push(guionConversacion.fase_conversacion_raiz);

        if (esClienteChatbot){
            if (fasesConversacionNivel1[0].es_fase_inicial_cliente === true){ 
                siguienteFaseCliente = fasesConversacionNivel1[0];
            }
            else{
                siguienteFaseCliente = fasesConversacionNivel1[1];
            }
            fasesParaInteraccion.push(siguienteFaseCliente);
            ultimaFaseConversacion = siguienteFaseCliente;
        }
        else{
            if (fasesConversacionNivel1[0].es_fase_inicial_cliente === true){ 
                siguienteFaseNoCliente = fasesConversacionNivel1[1];
            }
            else{
                siguienteFaseNoCliente = fasesConversacionNivel1[0];
            }
            fasesParaInteraccion.push(siguienteFaseNoCliente);
            ultimaFaseConversacion = siguienteFaseNoCliente;
        }

    }
    else {
        loggerGlobal.debug('Tengo la misma rama de opciones para cliente y no cliente ...')

        if (!conversacionCreateInput.identificador_cliente_en_canal && !canalConversacion.admite_identificador_cliente_null){
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorValidacionDatos,
                `El canal de la conversacion no admite que el identificador del cliente sea null`);
        }


        const faseConversacionRaiz = guionConversacion.fase_conversacion_raiz;
        fasesParaInteraccion.push(faseConversacionRaiz);
        ultimaFaseConversacion = faseConversacionRaiz;
    }


    conversacionCreateInput.fases_interaccion = await FaseInteraccion.llenarFasesInteraccionCreateInput(fasesParaInteraccion);
    loggerGlobal.debug('fasesParaInteraccion: '+JSON.stringify(conversacionCreateInput.fases_interaccion));
    const nuevaConversacion = await ConversacionDAO.crearNuevaConversacion(conversacionCreateInput,clienteCanal.id);
    //nuevaConversacion.canal = JSON.stringify(canalConversacion);
    nuevaConversacion.guion_conversacion = guionConversacion;
    nuevaConversacion.ultima_fase_conversacion = ultimaFaseConversacion;
    nuevaConversacion.fase_conversacion_nodo_base = fasesParaInteraccion[fasesParaInteraccion.length - 1];//este es un arreglo de objetos FaseConversacion
    return nuevaConversacion;
}



const continuarConversacion = async (userNameCliente, 
                                        clienteId,
                                        entrada_de_cliente, 
                                        conversacionId, 
                                        condicionEntradaParaAbortar,
                                        faseConversacionIdNodoBase,
                                        ultima_fase_conversacion_id,
                                        ultima_fase_conversacion_entrada_invalida,
                                        ultima_fase_interaccion_id,
                                        usuarioEstaAutenticado) => {

    if (!conversacionId || isNaN(conversacionId)){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            `El conversacionId especificado es inválido`);
    }

    if (!ultima_fase_conversacion_id || isNaN(ultima_fase_conversacion_id)){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            `El faseConversacionId de ultima fase especificado es inválido`);
    }

    const esConversacionActiva = await ConversacionDAO.esConversacionActiva(conversacionId);
    if (!esConversacionActiva){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            `No existe una conversacion activa con el conversacionId especificado`);
    }

    loggerGlobal.debug('conversacion.ultima_fase_conversacion.id: '+ultima_fase_conversacion_id);

    const condicionEntradaValida = await CondicionEntrada.verificarEntradaEsValida(ultima_fase_conversacion_id, 
                                                                                    entrada_de_cliente, 
                                                                                    condicionEntradaParaAbortar);
    if (!condicionEntradaValida){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            ultima_fase_conversacion_entrada_invalida);
    }
    
    //Este metodo retorna true incluso si no hay acciones a realizar registradas para la condicion de entrada
    //elegida por el cliente, ya que eso es válido
    const accionesEntradaEjecutadas = await AccionARealizar.ejecutarAccionesDeEntrada(condicionEntradaValida.id);
    if (!accionesEntradaEjecutadas || accionesEntradaEjecutadas === false){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            "Una o mas acciones a realizar requeridas para la condicion de entrada especificada no se ejecutaron");
    }

    let proximaFaseId;
    if (condicionEntradaValida.es_entrada_para_abortar){
        proximaFaseId = faseConversacionIdNodoBase;
        loggerGlobal.debug('el cliente introdujo condicion para abortar; proximaFaseId: '+proximaFaseId);
    }
    else proximaFaseId = condicionEntradaValida.proxima_fase_conversacion_id;

    const proximaFaseConversacion = await FaseConversacionDAO.consultaParaFaseInteraccion(proximaFaseId);
    if (!usuarioEstaAutenticado && proximaFaseConversacion.requiere_autenticacion 
        && proximaFaseConversacion.requiere_autenticacion === true){
            loggerGlobal.debug('la proxima fase requiere autenticacion ...');
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorUsuarioRequiereAutenticacion,
                "Se requiere autenticacion del usuario");
    }

    const fasesParaInteraccion = [];
    fasesParaInteraccion.push(proximaFaseConversacion);
    const fasesInteraccionCreateInput = await FaseInteraccion.llenarFasesInteraccionCreateInput(fasesParaInteraccion);

    //const ultimaFaseInteraccionId = conversacion.fases_interaccion[conversacion.fases_interaccion.length - 1].id;

    const conversacion = await ConversacionDAO.continuarConversacion(conversacionId,
                                                                condicionEntradaValida, 
                                                                ultima_fase_interaccion_id, 
                                                                fasesInteraccionCreateInput,
                                                                userNameCliente,
                                                                clienteId,
                                                                entrada_de_cliente);

    //la que era la proxima fase conversacion antes de continuar la conversacion, sera ahora la ultima_fase_conversacion
    conversacion.ultima_fase_conversacion = proximaFaseConversacion;

    loggerGlobal.debug('Se avanzo la conversacion; retornando el objeto '+conversacion);
    return conversacion;
}


const Conversacion = {
    consultarUno : consultaUno,
    consultarTodos: consultaTodos,
    insertarUno: insertaUno,
    txInsertarConversacion: txInsertaConversacion,
    crearNuevaConversacion: crearNuevaConversacion,
    continuarConversacion: continuarConversacion,
}

export {Conversacion};