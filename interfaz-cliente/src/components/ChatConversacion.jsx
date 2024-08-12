import React from 'react';
import { useState,useEffect } from 'react';
import { useMutation,useQuery,useLazyQuery } from '@apollo/client';
import {clientGraphQLMutations} from '../graphql/mutations';
import { useAuth } from "../context/AuthContext";
import { clientGraphQLQueries } from '../graphql/queries';


function ChatConversacion() {

    /*const mensajeSaludo = `¡Hola! Soy Chatgea, el chatbot de Pangea Technologies, estoy listo para ayudarte en el servicio que necesites 🚀\nElige una opción tipeando el número respectivo:
    1. Implementación de una solución Web
    2. Asesoría en Marketing digital
    3. Aplicar Inteligencia de negocios
    4. Desarrollo Móvil
    5. Capacitación para desarrolladores
    6. Solicitar un presupuesto
    7. Más información acerca de Pangea Technologies
    7. Contactar con un agente de atención
    8. Salir `;//+'&#128516;';*/



    const mensajeSaludo = `Bienvenido soy el asistente de Whatsapp de Créditos Directos.
    Introduce un valor para comenzar la conversación ...`;
    /*const mensajeSaludo = `Bienvenido soy el asistente de Whatsapp de Créditos Directos, fui creado para brindarte un mejor servicio.
        Ingresa el número de la opción que desees:
        1. Consulta de disponible, saldos y vencimiento de tu Tarjeta D
        2. Solicitar préstamo
        3. Requisitos para solicitar un préstamo
        4. Solicitar débito automático
        5. Promociones y beneficios
        6. Sucursales
        7. Información de contacto
        8. Hablar con un operador
        9. Cancelar registro`;*/

    const [conversacionIniciada, setConversacionIniciada] = useState(false);
    const [mensajeChat, setMensajeChat] = useState(mensajeSaludo);
    const [mensajeEntrante, setMensajeEntrante] = useState('');

    // Estado para almacenar el ID de sesión
    const [sessionId, setSessionId] = useState('');

    const [solicitarToken] = useLazyQuery(clientGraphQLQueries.QUERY_GET_PUBLIC_TOKEN);

    const { authenticate } = useAuth(); //Me traigo el contexto para enviar el token necesario y validarlo

    const [crearConversacion,{loading, errors, data, client }] = useMutation(clientGraphQLMutations.MUTATION_CREAR_CONVERSACION);
    const [continuarConversacion,{loadingCont, errorCont, dataCont}] = useMutation(clientGraphQLMutations.MUTATION_CONTINUAR_CONVERSACION);

    // Función para obtener el ID de sesión del localStorage
    useEffect(() => {
        async function fetchData(){
            localStorage.removeItem("token");
            console.log('invocando query para la obtención del token ...');

            let resp;
            try{
                const {data,error} = await solicitarToken();
                if (error){
                    console.log('Error al generar el token: '+error.message);
                    return;
                }

                //console.log('la data que me llego es : ' +JSON.stringify(data));
                const token = data?.getTokenAccesoPublico?.tokenJWT;
                /*const userInfo = {
                    id: data.loginUser.id,
                    username: data.loginUser.username,
                    imgProfileUser: data.loginUser.imgProfileUser,
                };*/
            
                authenticate(token, null);
            }
            catch(error){
                console.log('Error al invocar la mutation generarToken ...'+error.message);
            }
        }
        fetchData();

    }, []); // Se ejecuta solo una vez al montar el componente

    const handleMessageChange = (event) => {
        setMensajeEntrante(event.target.value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        let mensajeServicioDividido = async (mensaje) => {
            let mensajeDividido = '';
            mensaje.split('\n').map((parte) => (
                mensajeDividido = mensajeDividido + parte
            ));
            return mensajeDividido;
        }
    
        if (!conversacionIniciada){  //se esta creando la conversacion ....
            try{
                const resp = await crearConversacion({
                    variables: {
                        "conversacionCreateInput": {
                            "guion_conversacion_id": mensajeEntrante,
                            "tomada_por_operador": false,
                            "canal_id": "1",//1 es Canal WEB
                            "identificador_cliente_en_canal": ""
                        }
                    },
                });
                //console.log('objeto resp: '+JSON.stringify(resp));
                //const sessionIDresp = resp.headers['sessionID'];
                //const lastResponseHeaders = client?.cache;//?.data?.data?.ROOT_QUERY?.__headers;
                //console.log('lastResponseHeaders: '+client.cache.response);//cache.ROOT_QUERY);

                //const headers = client.getResponse();// no sirve esto ..
                  //console.log('el headers recibido: '+headers);

                if (resp.data){
                    const ultimaFaseConversacion = resp.data.crearNuevaConversacion?.ultima_fase_conversacion;
                    //console.log('ultima fase al crear conversacion: '+ultimaFaseConversacion);
                    //console.log('conversacion desestructurado: '+JSON.stringify(resp.data));

                    const cadenaCompletaChat = mensajeChat + '\n\nUsuario: '+ mensajeEntrante + '\nSistema: ' + ultimaFaseConversacion.mensaje_de_fase;
                    setMensajeChat(cadenaCompletaChat);
                    setConversacionIniciada(true);
                }
                if (resp.errors){
                    setMensajeChat(mensajeChat + '\n\nUsuario: '+ mensajeEntrante + '\nSistema: ' + resp.errors?.message);
                }
            }catch(error){
                setMensajeChat(mensajeChat + '\n\nUsuario: '+ mensajeEntrante + '\nSistema: ' + error.message);
            }
        }
        else{     //se va a continuar la conversacion ....

            //console.log('faseConversacionIdActual antes de continuarConversacion: '+faseConversacionIdActual);
            //console.log('conversacionId antes de continuarConversacion: '+conversacionId);

            try{
                const resp = await continuarConversacion({
                    variables: {
                        "conversacionUpdateInput": {
                            "entrada_de_cliente": mensajeEntrante,
                        }
                    }
                });
                console.log('resp es: '+JSON.stringify(resp));

                if (resp.data){
                    const ultimaFaseConversacion = resp.data.continuarConversacion?.ultima_fase_conversacion;
                    const mensajeFase = ultimaFaseConversacion?.mensaje_de_fase;

                    setMensajeChat(mensajeChat + '\n\nUsuario: '+ mensajeEntrante + '\nSistema: ' + mensajeFase);

                    if (resp.data?.continuarConversacion?.tokenJWTUsuarioAutenticado){
                        console.log('Me llego un nuevo token: '+resp.data.continuarConversacion.tokenJWTUsuarioAutenticado);
                        authenticate(resp.data?.continuarConversacion.tokenJWTUsuarioAutenticado, null);
                    }
                }
                if (resp.errors){
                    console.log('Mostrando errores en la respuesta de error del mutation ... ');
                    setMensajeChat(mensajeChat + '\n\nUsuario: '+ mensajeEntrante + '\nSistema: ' + resp.errors[0]?.message);
                }

            }catch(error){
                let mensajeError = error.message;
                
                if (error.graphQLErrors && error.graphQLErrors.length > 0) {
                    mensajeError = error.graphQLErrors[0].message;
                }

                console.log('Mostrando errores en el catch del Componente: '+mensajeError);
                setMensajeChat(mensajeChat + '\n\nUsuario: '+ mensajeEntrante + '\nSistema: ' + mensajeError);
            }
        }

        setMensajeEntrante('');
    }

    const handleLoad = async (event) =>{
        console.log('ejecuté el load ...');
    }

    //console.log('Voy a renderizar el componente ...');

    return (
        <>
        <form className="send-message-form" onSubmit={handleSubmit} >
            <div style={{padding:"20px",boxShadow:"3px 3px 20px #000", borderRadius:"20px", overflow:"auto", height:"300px", 
                backgroundColor:"#fff", width:"80%", fontSize:"small"}} onLoad={handleLoad}>
                    { 
                        mensajeChat.split('\n').map((part, index) => (
                            <React.Fragment key={index}>
                                {part}
                                {index < mensajeChat.split('\n').length - 1 && <br />}
                            </React.Fragment>
                        ))
                    }
            </div>
            <div style={{marginTop:"20px"}}>
                <input style={{borderRadius:"10px", padding:"10px", width:"350px"}}
                        type="text"
                        placeholder="Introduce tu opción aquí ..."
                        value={mensajeEntrante}
                        onChange={handleMessageChange}
                        size={90}
                        maxLength={100}
                />
            </div>
            <button type="submit" style={{borderRadius:"10px", padding:"10px 50px 10px 50px", margin:"20px 10px 0 10px",
                    backgroundColor:"#034ECB", color:"#fff"}}>
                        Enviar
            </button>
        </form>
        </>        
    );

}

export default ChatConversacion;