import React from 'react';
import { useState } from 'react';
import { useLazyQuery } from '@apollo/client';
import {clientGraphQLQueries} from '../graphql/queries';


function Chat() {

    let mensajeSaludo = `¡Hola! Soy Chatgea, el chatbot de Pangea Technologies, estoy listo para ayudarte en el servicio que necesites 🚀\nElige una opción tipeando el número respectivo:\n
    1. Implementación de una solución Web\n
    2. Asesoría en Marketing digital\n
    3. Aplicar Inteligencia de negocios\n
    4. Desarrollo Móvil\n
    5. Capacitación para desarrolladores\n
    6. Solicitar un presupuesto\n
    7. Más información acerca de Pangea Technologies\n
    7. Contactar con un agente de atención\n
    8. Salir\n`;//+'&#128516;';

    let pruebaMensajes = `Probando la linea1\nesta es la la linea 2\ny esta la 3`;
    const mensajesSeparados = pruebaMensajes.split('\n');

    const [conversacionId, setConversacionId] = useState(0);
    const [faseConversacionId, setFaseConversacionId] = useState(0);
    const [opcionesActuales, setOpcionesActuales] = useState(null);

    const [mensajeChat, setMensajeChat] = useState(mensajeSaludo);
    const [mensajeEntrante, setMensajeEntrante] = useState('');

    const [invocarServicio,{loading, error, data}] = useLazyQuery(clientGraphQLQueries.QUERY_EMPRESA,{
        variables: {empresaId:mensajeEntrante},
    });

    const handleMessageChange = (event) => {
        setMensajeEntrante(event.target.value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (mensajeEntrante === '' || mensajeEntrante.trim() === ''){
            alert('Por favor introduce alguna opción');
            setMensajeEntrante('');
            return;
        }

        const resp = await invocarServicio({variables: {empresaId:mensajeEntrante}});
        if (resp.data){
            let mensaje = `${mensajeChat}
            
            Usuario: ${mensajeEntrante}
            Sistema: ${JSON.stringify(resp.data)}`;
            console.log('mensaje sin cortar es: '+mensaje);
            setMensajeChat(mensaje);

            console.log('conversacionId: '+conversacionId);
            console.log('faseConversacionId: '+faseConversacionId);
            setConversacionId(conversacionId + 1);
            setFaseConversacionId(faseConversacionId + 1);
        }
        if (resp.error){
            setMensajeChat(mensajeChat + '\n\nUsuario: '+ mensajeEntrante + '\nSistema: ' + resp.error?.message);
        }
        setMensajeEntrante('');
    }

    const handleLoad = async (event) =>{
        console.log('ejecuté el load ...');
    }

    /*const handleOnClick = async () => {

        const resp = await invocarServicio({variables: {empresaId:mensajeEntrante}});
        if (resp.data){
            setMensajeChat(mensajeChat + '\n\nUsuario: '+ mensajeEntrante + '\nSistema: ' + JSON.stringify(resp.data));
            console.log('conversacionId: '+conversacionId);
            console.log('faseConversacionId: '+faseConversacionId);
            setConversacionId(conversacionId + 1);
            setFaseConversacionId(faseConversacionId + 1);
        }
        if (resp.error){
            setMensajeChat(mensajeChat + '\n\nUsuario: '+ mensajeEntrante + '\nSistema: ' + resp.error?.message);
        }
        setMensajeEntrante('');
    };*/

    return (
        <>
        <form className="send-message-form" onSubmit={handleSubmit}>
            <div style={{padding:"30px",boxShadow:"3px 3px 20px #000", borderRadius:"20px", overflow:"auto", height:"300px", 
                backgroundColor:"#fff", width:"90%", fontSize:"small"}} onLoad={handleLoad}>
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
                    backgroundColor:"#034ECB", color:"#fff"}} >
                        Enviar
            </button>
        </form>
        </>        
    );

}

export default Chat;