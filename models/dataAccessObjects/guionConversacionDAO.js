import {dbConnectionProvider} from '../db/dbConnectionManager.js'; 
import {ErrorConfiguracionDatos, FabricaErrores} from '../errors/errorsManager.js'
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';
import { CanalDAO } from './canalDAO.js';
import { FaseConversacionDAO} from './faseConversacionDAO.js';
import { FaseConversacion } from '../businessObjects/faseConversacion.js';
import { CondicionEntradaDAO } from './condicionEntradaDAO.js';
import { EmpresaDAO } from './empresaDAO.js';

let columnasUpdateGuion;

if (!columnasUpdateGuion){
    //Se crean aqui, estaticamente, para crearlas solo 1 vez y mejorar performance 
    const Column = dbConnectionProvider.helpers.Column;
    const columnaFechaHoraActualizacion = new Column({
        name:'fecha_hora_actualizacion',
        mod:'^',
        def:'current_timestamp'
    });

    columnasUpdateGuion = new dbConnectionProvider.helpers.ColumnSet(
        ['nombre_guion',
        columnaFechaHoraActualizacion
        ],
        {table:'guion_conversacion'});
}

const consultarGuion_CrearConversacion = async (id) => {
    if (!id || isNaN(id) || id < 1){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar el id para consultar GuionConversacion');
    }

    loggerGlobal.info('el id que me llego para buscar el guion es: '+id);
    if (id < 1){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'El id para consultar GuionConversacion debe ser mayor que cero');
    }

    let respuesta;

    try
    {
        //const values = [id];
        const queryGuion = `SELECT   id,nombre_guion,empresa_id,asignacion_automatica_operadores,criterio_asignacion_id,tiempo_limite_sesion,ramas_distintas_cliente_no_cliente,fecha_hora_registro,fecha_hora_actualizacion,registro_esta_activo
                            FROM     guion_conversacion
                            WHERE    id=${id}`;

        respuesta = await dbConnectionProvider.task('consultaGuion_CrearConversacion_Task', async t => {

            const guion = await t.one(queryGuion);
            if (guion){
                const queryCanal = await CanalDAO.consultaCanalesDeGuion_query(id);
                let canalesRetornados = await t.many(queryCanal);

                guion.canales = canalesRetornados;
                loggerGlobal.debug('Ejecute el query de canales; voy a consultar las fases ...'); 
                
                const queryFases = await FaseConversacionDAO.consultafasesConversacionHastaNivel1_query(id);
                const listaFases = await t.many(queryFases);
                const faseRaiz = await FaseConversacion.getArbolFasesHastaNivel1(listaFases);
                guion.fase_conversacion_raiz = faseRaiz;

                const condicion_abortar = await CondicionEntradaDAO.consultarCondicionEntradaParaAbortar(guion.id);
                guion.condicion_entrada_para_abortar = condicion_abortar;
                
                /*const queryEmpresa = await EmpresaDAO.consultaUno_query(guion.empresa_id);
                const empresa = await t.one(queryEmpresa);
                guion.empresa = empresa;*/
                return guion;
            }

            /*return t.oneOrNone(queryGuion)
            .then(guion => {
                const queryCanal = canalDAO.consultaCanalesDeGuion_query(id);
                return t.manyOrNone(queryCanal)
                .then(canalesRetornados => {
                    guion.canales = canalesRetornados;
                    const queryFases = FaseConversacionDAO.consultafasesConversacionHastaNivel1_query(id);
                    loggerGlobal.debug('Ejecute el query de canales; voy a consultar las fases ...');
                    const queryEmpresa = EmpresaDAO.consultaUno_query(1);
                    return t.manyOrNone(queryFases)
                    .then(listaFases => {
                        const faseRaiz = FaseConversacion.getArbolFasesHastaNivel1(listaFases);
                        guion.fase_conversacion_raiz = faseRaiz;
                        guion.empresa = listaFases;
                        return guion;
                    });
                });
            });*/
        })
        .then(data => {
            loggerGlobal.debug('Respuesta en el task del metodo consultarGuion_CrearConversacion de GuionConversacion: ');
            loggerGlobal.debug(data);
            return data;
        })
        .catch(error => {
            loggerGlobal.error('Error en el task del metodo consultarGuion_CrearConversacion de GuionConversacion: ');
            loggerGlobal.error(error);
            return error;
        });

    }
    catch(error){
        loggerGlobal.error('Error al consultar un GuionConversacion ...');
        loggerGlobal.error(error);
        return error;
    }
    
    if (respuesta && respuesta instanceof Error){
        loggerGlobal.error('Obtuve un error al intentar consultar un GuionConversacion ...');
        if (respuesta instanceof dbConnectionProvider.pgpErrors.QueryResultError &&
            respuesta.code === dbConnectionProvider.pgpErrors.queryResultErrorCode.noData){
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorDatosNoEncontrados,
                    `No se encontro el GuionConversacion con id ${id}`,respuesta);
        }
        else{
            if (respuesta instanceof ErrorConfiguracionDatos){
                throw respuesta;
            }
            else{
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorCapaDatos,
                    `Error en la capa de datos al intentar consultar el GuionConversacion con id ${id}`,respuesta);
            }
        }
    }

    //const respuesta = await connectDB.one(`select id,nombreguion,TO_CHAR(fechahoraregistro,'YYYY/MM/DD HH:MI:SS') as fechahoraregistro,TO_CHAR(fechahoraactualizacion,'YYYY/MM/DD HH:MI:SS') as fechahoraactualizacion from GUION_CONVERSACION where id=$1`,values);
    loggerGlobal.debug('Respuesta en el metodo consultarGuion_CrearConversacion de guionConversacion: ');
    loggerGlobal.debug(respuesta);
    return respuesta;

}

const consultaTodos = async () => {
    const respuesta = await dbConnectionProvider.manyOrNone(`select id,nombre_guion,TO_CHAR(fecha_hora_registro,'YYYY/MM/DD HH:MI:SS') as fecha_hora_registro,TO_CHAR(fecha_hora_actualizacion,'YYYY/MM/DD HH:MI:SS') as fecha_hora_actualizacion,empresa_id from GUION_CONVERSACION`);
    loggerGlobal.debug('Respuesta en el metodo consultaTodos de guionConversacion: ');
    loggerGlobal.debug(respuesta);
    return respuesta;
}

const actualizaUno = async (id,guionConversacionUpdateInput) => {
    loggerGlobal.info('el id que me llego para actualizar el guion es: '+id);

    const guion = await consultaUno(id);
    if (guion){
        //FORMA ANTERIOR: asi lo hacia SIN helpers
        //const values = [guionConversacion.nombreguion,id];
        //const respuesta = await connectDB.oneOrNone(`UPDATE GUION_CONVERSACION SET nombreguion = $1 , fechahoraactualizacion = current_timestamp WHERE ID = $2  RETURNING id`, values, event => event.id); //=> event.id);
        try{
        const values = [{nombreguion: guionConversacionUpdateInput.nombreguion}];
        const condicion = ` WHERE ID = ${id}  RETURNING id`;
        const query = dbConnectionProvider.helpers.update(values,columnasUpdateGuion)+condicion;
        const respuesta = await dbConnectionProvider.oneOrNone(query); //=> event.id);
        //QUERY generado: UPDATE "guion_conversacion" AS t SET "nombreguion"=v."nombreguion","fechahoraactualizacion"=v."fechahoraactualizacion" FROM (VALUES('Probando guion con helpers 12',current_timestamp)) AS v("nombreguion","fechahoraactualizacion") WHERE ID = 1  RETURNING id

        loggerGlobal.debug('Respuesta en el metodo actualizaUno de guionConversacion: ');
        loggerGlobal.debug(respuesta);

        guion.nombreguion = guionConversacionUpdateInput.nombreguion;
        return guion;
        }catch(error){
            loggerGlobal.error('Error al actualizar GuionConversacion ...');
            loggerGlobal.error(error);
            return null;
        }
    }
    return null;
}

const GuionConversacionDAO = {
    consultarGuion_CrearConversacion : consultarGuion_CrearConversacion,
    consultarTodos: consultaTodos,
    actualizarUno: actualizaUno,
}

export {GuionConversacionDAO};