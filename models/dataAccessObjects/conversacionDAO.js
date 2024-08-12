//import {db} from '../conexionBD.cjs'; 
import {dbConnectionProvider} from '../db/dbConnectionManager.js'; 
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';
import { FabricaErrores } from '../errors/errorsManager.js';
import { configurationProvider } from '../../globalServices/config/configurationManager.js';
import {FaseInteraccionDAO} from './faseInteraccionDAO.js'; 
import { MensajeEmitidoDAO } from './mensajeEmitidoDAO.js';
import { MensajeEmitido } from '../businessObjects/mensajeEmitido.js';


let columnasInsertConversacion;

if (!columnasInsertConversacion){
    //Se crean aqui, estaticamente, para crearlas solo 1 vez y mejorar performance 
    loggerGlobal.debug('voy a crear el ColumnSet ...');

    const Column = dbConnectionProvider.helpers.Column;
    const columnaFechaHoraInicioConversacion = new Column({
        name:'fecha_hora_inicio_conversacion',
        mod:'^',
        def:'current_timestamp'
    });

    columnasInsertConversacion = new dbConnectionProvider.helpers.ColumnSet(
        ['guion_conversacion_id',
        columnaFechaHoraInicioConversacion,
        'tomada_por_operador',
        'cliente_canal_id',
        'registro_esta_activo',
        ],
        {table:'conversacion'});
}

const esConversacionActiva = async (conversacionId) => {

    if (!conversacionId || isNaN(conversacionId)){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe suministrar un conversacionId valido para verificar si existe una conversacion activa con ese id');
    }

    loggerGlobal.info('el id que me llego para buscar la conversacion es: '+conversacionId);

    const values = [conversacionId];
    const query =  `SELECT  id,fecha_hora_inicio_conversacion 
                    FROM    conversacion 
                    WHERE   id=$1 
                    AND     registro_esta_activo = true 
                    AND     fecha_hora_fin_conversacion IS NULL`;
    const respuesta = await dbConnectionProvider.oneOrNone(query,values);



    loggerGlobal.debug('Respuesta en el metodo esConversacionActiva de conversacion: ');
    loggerGlobal.debug(respuesta);
    
    if (respuesta && respuesta.id) return true;

    return false;
}

const consultaUno = async (id) => {
    loggerGlobal.info('el id que me llego para buscar la conversacion es: '+id);
    const values = [id];
    const respuesta = await dbConnectionProvider.one(`SELECT id,guion_conversacion_id,fecha_hora_inicio_conversacion,fecha_hora_fin_conversacion,tomada_por_operador,cliente_canal_id,registro_esta_activo FROM conversacion WHERE id=$1`,values);
    //const respuesta = await connectDB.one(`select id,nombreguion,TO_CHAR(fechahoraregistro,'YYYY/MM/DD HH:MI:SS') as fechahoraregistro,TO_CHAR(fechahoraactualizacion,'YYYY/MM/DD HH:MI:SS') as fechahoraactualizacion from GUION_CONVERSACION where id=$1`,values);
    loggerGlobal.debug('Respuesta en el metodo consultaUno de conversacion: ');
    loggerGlobal.debug(respuesta);
    return respuesta;
}

const consultaTodos = async () => {
    const respuesta = await dbConnectionProvider.manyOrNone(`select id,guion_conversacion_id,TO_CHAR(fecha_hora_inicio_conversacion,'YYYY/MM/DD HH:MI:SS') as fecha_hora_inicio_conversacion,TO_CHAR(fecha_hora_fin_conversacion,'YYYY/MM/DD HH:MI:SS') as fecha_hora_fin_conversacion,tomada_por_operador,cliente_canal_id,registro_esta_activo from CONVERSACION`);
    loggerGlobal.debug('Respuesta en el metodo consultaTodos de conversacion: ');
    loggerGlobal.debug(respuesta);
    return respuesta;
}

const insertaUno = async (conversacionCreateInput,guionConversacionId) => {
    loggerGlobal.info('el guionConversacionId que me llego para registrar la conversacion es: '+guionConversacionId);
    loggerGlobal.debug('objeto conversacionCreateInput: ',conversacionCreateInput);

    try{
        const values = [{tomada_por_operador:conversacionCreateInput.tomada_por_operador,
                        registro_esta_activo:conversacionCreateInput.registro_esta_activo,
                        guion_conversacion_id:guionConversacionId,
                    }];
        const datosRetorno = 'id,guion_conversacion_id,fecha_hora_inicio_conversacion,fecha_hora_fin_conversacion,tomada_por_operador,cliente_canal_id,registro_esta_activo';
        const query = dbConnectionProvider.helpers.insert(values,columnasInsertConversacion)+' RETURNING '+datosRetorno;
        const respuesta = await dbConnectionProvider.oneOrNone(query);
        //QUERY generado: UPDATE "guion_conversacion" AS t SET "nombreguion"=v."nombreguion","fechahoraactualizacion"=v."fechahoraactualizacion" FROM (VALUES('Probando guion con helpers 12',current_timestamp)) AS v("nombreguion","fechahoraactualizacion") WHERE ID = 1  RETURNING id

        loggerGlobal.debug('Respuesta en el metodo insertaUno de conversacion: ');
        loggerGlobal.debug(respuesta);
        return respuesta;

    }catch(error){
        loggerGlobal.error('Error al insertar Conversacion ...');
        loggerGlobal.error(error);
        return null;
    }
}

//-----------------------------------------------------------------------------------
//OJO: El siguiente fue solo un metodo para probar la transaccionalidad con una insercion, NO un metodo definitivo
const txInsertaConversacion = async (conversacionCreateInput,faseInteraccionCreateInput,guionConversacionId) => {
    loggerGlobal.info('Iniciando el metodo de transaccion para Conversacion ... ');
    loggerGlobal.info('el guionConversacionId que me llego para registrar la conversacion es: '+guionConversacionId);
    loggerGlobal.debug('objeto conversacionCreateInput: ',conversacionCreateInput);
    loggerGlobal.debug('objeto faseInteraccionCreateInput: ',faseInteraccionCreateInput);

    try{
        const values = [{tomada_por_operador:conversacionCreateInput.tomada_por_operador,
                        registro_esta_activo:conversacionCreateInput.registro_esta_activo,
                        guionconversacionid:guionConversacionId,
                    }];
        const datosRetorno = 'id,guion_conversacion_id,fecha_hora_inicio_conversacion,fecha_hora_fin_conversacion,tomada_por_operador,cliente_canal_id,registro_esta_activo';
        const queryConv = dbConnectionProvider.helpers.insert(values,columnasInsertConversacion)+' RETURNING '+datosRetorno;
        
        const respuesta = await dbConnectionProvider.tx('txInsertaConversacionName', t => {
            
            return t.oneOrNone(queryConv)
            .then(conversacion => {
                const queryFase = FaseInteraccionDAO.queryInsertaUno(faseInteraccionCreateInput,conversacion.id);
                return t.oneOrNone(queryFase)
                .then(faseIncluida => {
                    let fases = [];
                    fases.push(faseIncluida);
                    conversacion.fasesinteraccion = fases;
                    return conversacion;
                });
            });
        })
        .then(data => {
            loggerGlobal.debug('Respuesta en el metodo txInsertaConversacion de conversacion: ');
            loggerGlobal.debug(data);
            return data;
        })
        .catch(error => {
            loggerGlobal.error('Error en el metodo txInsertaConversacion de conversacion: ');
            loggerGlobal.error(error);
            return error;
        });

        return respuesta;
        
    }catch(error){
        loggerGlobal.error('Error al insertar Conversacion ...');
        loggerGlobal.error(error);
        return error;
    }

}

//-----------------------------------------------------------------------------------
// El siguiente metodo es usado para crear transaccionalmente una nueva conversacion
//-----------------------------------------------------------------------------------
const crearNuevaConversacion = async (conversacionCreateInput,clienteCanalId) => {

    if (!conversacionCreateInput){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe suministrar los datos para crear la conversacion');
    }

    if (!conversacionCreateInput.guion_conversacion_id || conversacionCreateInput.guion_conversacion_id < 1){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar el guionConversacionId para crear la conversacion');
    }

    if (!conversacionCreateInput.canal_id || isNaN(conversacionCreateInput.canal_id) || conversacionCreateInput.canal_id < 1){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar el canal para crear la conversacion');
    }

    if (!clienteCanalId || isNaN(clienteCanalId) || clienteCanalId < 1){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar el cliente_canal_id para crear la conversacion');
    }

    if (!conversacionCreateInput.fases_interaccion || !Array.isArray(conversacionCreateInput.fases_interaccion) || 
        conversacionCreateInput.fases_interaccion.length < 1){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar al menos 1 fase de Interaccion para insertar con la conversacion');
    }

    loggerGlobal.debug('objeto conversacionCreateInput: ',conversacionCreateInput);
    let respuesta;

    try{
        const values = [{guion_conversacion_id:conversacionCreateInput.guion_conversacion_id,
                        tomada_por_operador:conversacionCreateInput.tomada_por_operador,
                        cliente_canal_id:clienteCanalId,
                        registro_esta_activo:true,
                    }];
        const datosRetorno = 'id,guion_conversacion_id,fecha_hora_inicio_conversacion,tomada_por_operador,cliente_canal_id,registro_esta_activo';
        const queryConv = dbConnectionProvider.helpers.insert(values,columnasInsertConversacion)+' RETURNING '+datosRetorno;

        respuesta = await dbConnectionProvider.tx('crearNuevaConversacion', async t => {
            
            const conversacion = await t.one(queryConv);
            if (conversacion){
            
                let fasesInteraccionInput = conversacionCreateInput.fases_interaccion;
                fasesInteraccionInput.forEach(fase => {
                    fase.conversacion_id = conversacion.id;
                });
                const queryFases = await FaseInteraccionDAO.insertaFasesInteraccion_query(conversacionCreateInput.fases_interaccion);
                //loggerGlobal.debug('Query de Fases interaccion es: ');
                //loggerGlobal.debug(queryFases);
            
                            
                const fasesInteraccionIncluidas = await t.many(queryFases);
                if(fasesInteraccionIncluidas){
                    conversacion.fases_interaccion = fasesInteraccionIncluidas;

                    fasesInteraccionIncluidas.forEach(faseInteraccion => {
                        fasesInteraccionInput.forEach(faseInput => {
                            if (faseInput.fase_conversacion_id === faseInteraccion.fase_conversacion_id){
                                faseInput.id = faseInteraccion.id;
                            }
                        });
                    });
    
                    const mensajesEmitidosInput = MensajeEmitido.getMensajesEmitidosInput(
                        fasesInteraccionInput, configurationProvider.system.userName, configurationProvider.system.userId);
                    
    
                    /*const mensajesEmitidosInput = [];
                    fasesInteraccionInput.forEach(fase => {
                        mensajesEmitidosInput.push(fase.mensaje_emitido_input);
                    });*/
                    const queryMensajes = await MensajeEmitidoDAO.insertaMensajesEmitidos_query(mensajesEmitidosInput);

                    const mensajesEmitidosIncluidos = await t.many(queryMensajes);
                    if (mensajesEmitidosIncluidos){
                        loggerGlobal.debug('se registraron los mensajes emitidos de la conversacion');
                        return conversacion;
                    }
                }
            }
        })
        .then(data => {
            loggerGlobal.debug('Respuesta en la tx crearNuevaConversacion de conversacionDAO: ');
            loggerGlobal.debug(JSON.stringify(data));
            return data;
        })
        .catch(error => {
            loggerGlobal.error('Error en la tx crearNuevaConversacion de conversacionDAO: ');
            loggerGlobal.error(error);
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorCapaDatos,
                'Error en la capa de datos al intentar crear la conversacion ',error);
        });

    }
    catch(error){
        loggerGlobal.error('Error al insertar Conversacion ...');
        loggerGlobal.error(error);
        return error;
    }

    if (respuesta && respuesta instanceof Error){
        loggerGlobal.error('Obtuve un error al intentar crear la nueva Conversacion ...');
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorCapaDatos,
            'Error en la capa de datos al intentar crear una conversacion ',respuesta);
    }
    
    loggerGlobal.debug('Respuesta en el metodo crearNuevaConversacion de conversacionDAO: ');
    loggerGlobal.debug(respuesta);
    return respuesta;

}


const continuarConversacion = async (conversacionId, condicionEntradaRecibida, faseInteraccionIdActualizar, 
                                        fasesInteraccionCreateInput, userNameCliente, clienteId, 
                                        entrada_de_cliente) => {
    
    let respuesta;

    if (!conversacionId || !fasesInteraccionCreateInput || !condicionEntradaRecibida){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar los objetos requeridos para continuar la conversacion y poder hacer los registros respectivos en la BD');
    }

    loggerGlobal.debug('condicionEntradaRecibida viene como: '+condicionEntradaRecibida);
    loggerGlobal.debug('es_entrada_para_abortar viene como: '+condicionEntradaRecibida.es_entrada_para_abortar);

    try{

        respuesta = await dbConnectionProvider.tx('continuarConversacion', async t => {

            const faseInteraccionActualizarQuery = await FaseInteraccionDAO.actualizarCondicionEntradaEnFase_query(
                                                                                faseInteraccionIdActualizar,
                                                                                condicionEntradaRecibida.id,
                                                                                condicionEntradaRecibida.es_entrada_para_abortar);
            const faseInteraccionActualizada = await t.one(faseInteraccionActualizarQuery);
            
            if (faseInteraccionActualizada){

                fasesInteraccionCreateInput.forEach(fase => {
                    fase.conversacion_id = conversacionId;
                });
                const queryFases = await FaseInteraccionDAO.insertaFasesInteraccion_query(fasesInteraccionCreateInput);
                //loggerGlobal.debug('Query de Fases interaccion es: ');
                //loggerGlobal.debug(queryFases);
            
                const fasesInteraccionIncluidas = await t.many(queryFases);
                if(fasesInteraccionIncluidas){

                    const conversacion = {
                        id:conversacionId,
                        fases_interaccion: [],
                    }

                    fasesInteraccionIncluidas.forEach(faseInteraccion => {
                        fasesInteraccionCreateInput.forEach(faseInput => {
                            if (faseInput.fase_conversacion_id === faseInteraccion.fase_conversacion_id){
                                faseInput.id = faseInteraccion.id;
                                conversacion.fases_interaccion.push(faseInteraccion);
                            }
                        });
                    });

                    const mensajesEmitidosInput = MensajeEmitido.getMensajesEmitidosInput(
                        fasesInteraccionCreateInput, userNameCliente, clienteId, entrada_de_cliente);

                    const mensajesEmitidosInputSistema = MensajeEmitido.getMensajesEmitidosInput(
                        fasesInteraccionCreateInput, configurationProvider.system.userName, configurationProvider.system.userId, null);
                    
                    mensajesEmitidosInputSistema.forEach(mensajeSistema => {
                        mensajesEmitidosInput.push(mensajeSistema);
                    });
    
                    const queryMensajes = await MensajeEmitidoDAO.insertaMensajesEmitidos_query(mensajesEmitidosInput);

                    const mensajesEmitidosIncluidos = await t.many(queryMensajes);
                    if (mensajesEmitidosIncluidos){
                        loggerGlobal.debug('se registraron los mensajes emitidos en la continuacion de la conversacion');
                        return conversacion;
                    }
                }
            }
            
        })
        .then(data => {
            loggerGlobal.debug('Respuesta en la tx continuarConversacion de conversacionDAO: ');
            loggerGlobal.debug(JSON.stringify(data));
            return data;
        })
        .catch(error => {
            loggerGlobal.error('Error en la tx continuarConversacion de conversacionDAO: ');
            loggerGlobal.error(error);
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorCapaDatos,
                'Error en la capa de datos al intentar actualizar la conversacion ',error);
        });

    }
    catch(error){
        loggerGlobal.error('Error al actualizar Conversacion ...');
        loggerGlobal.error(error);
        return error;
    }

    if (respuesta && respuesta instanceof Error){
        loggerGlobal.error('Obtuve un error al intentar actualizar la nueva Conversacion ...');
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorCapaDatos,
            'Error en la capa de datos al intentar actualizar una conversacion ',respuesta);
    }
    
    loggerGlobal.debug('Respuesta en el metodo continuarConversacion de conversacionDAO: ');
    loggerGlobal.debug(respuesta);
    return respuesta;
}

const ConversacionDAO = {
    consultarUno : consultaUno,
    consultarTodos: consultaTodos,
    insertarUno: insertaUno,
    txInsertarConversacion: txInsertaConversacion,
    crearNuevaConversacion: crearNuevaConversacion,
    esConversacionActiva: esConversacionActiva,
    continuarConversacion: continuarConversacion,
}

export {ConversacionDAO};