import React from 'react';
import { useState } from 'react';
import { gql, useLazyQuery } from '@apollo/client';

async function graqhQuery(queryParam) {
    return new Promise((resolve, reject) => {
      fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: queryParam,
        })
        .then((res) => resolve(res.json()))
        .catch((err) => reject(err));
    });
};


function Chat0() {

    const mensajeSaludo = `¡Hola! Soy Chatgea, el chatbot de Pangea Technologies, estoy listo para ayudarte en el servicio que necesites 🚀\nElige una opción tipeando el número respectivo:
    1. Implementación de una solución Web
    2. Asesoría en Marketing digital
    3. Aplicar Inteligencia de negocios
    4. Desarrollo Móvil
    5. Capacitación para desarrolladores
    6. Solicitar un presupuesto
    7. Más información acerca de Pangea Technologies
    7. Contactar con un agente de atención
    8. Salir `;//+'&#128516;';

    const [conversacionId, setConversacionId] = useState(0);
    const [opcionesActuales, setOpcionesActuales] = useState(null);

    const [mensajeChat, setMensajeChat] = useState(mensajeSaludo);

    const [mensajeEntrante, setMensajeEntrante] = useState('');

    const handleMessageChange = (event) => {
        setMensajeEntrante(event.target.value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        console.log('ejecutando el handleSubmit ...');
        console.log('el mensaje actual es: '+mensajeEntrante);
        if (mensajeEntrante === '' || mensajeEntrante.trim() === ''){
            alert('Por favor introduce alguna opción');
            setMensajeEntrante('');
            return;
        }

        console.log('invocando el servicio Graphql ...');
        const query = JSON.stringify({        
            query: `query GuionesConversacion {
                        guionesConversacion {
                            id
                            nombre_guion
                            fecha_hora_registro
                            fecha_hora_actualizacion
                        }
                    }`
        });

        const query2 = JSON.stringify({
            query: `mutation CrearNuevaConversacion ($conversacionCreateInput: ConversacionCreateInput!) {
                        crearNuevaConversacion(conversacionCreateInput: $conversacionCreateInput) {
                            id
                            fecha_hora_inicio_conversacion
                            fases_interaccion {
                                id
                                secuencia_en_conversacion
                                fase_conversacion {
                                    nombre_fase
                                    id
                                }
                            }
                        }
                    }` 
        });

        const query4 = JSON.stringify({        
            query: `query Empresa {
                        empresa(id: "10") {
                            nombre_empresa
                        }
                    }`
        });

        const query3 = JSON.stringify({        
            query: `query Empresa {
                        empresa(id: "1") {
                            nombre_empresa
                        }
                    }`
        });

        let queryConsulta;
        if (mensajeEntrante === '1') queryConsulta = query;
        else{ 
            if (mensajeEntrante === '2') queryConsulta = query3;
            else queryConsulta = query4;
        }

        let mensajeServicio;
        const resp = await graqhQuery(queryConsulta)
            .then((data) => {
                if (data['errors']){ 
                    console.log('vienen errores ...');
                    mensajeServicio = data['errors'][0].message;
                    return data['errors'];
                }

                console.log('Esta es la data:');
                console.log(data['data']);
                mensajeServicio = JSON.stringify(data['data']);
                return data['data'];
            })
            .catch((err) => {
                console.log(err['errors']);
                return err;
            });

        //const mensajeServicio = JSON.stringify(resp);
        console.log('respuesta recibida: '+mensajeServicio);



        setMensajeChat(mensajeChat + '\n' + mensajeEntrante + '\n' + mensajeServicio + '\n' );
        setMensajeEntrante('');
        console.log('actualice el textArea ...');
        
    };

    return (
        <div className="chat">
            <form className="send-message-form" onSubmit={(handleSubmit)}>
                <textarea id='mensajes' className='messageList' readOnly={true}
                value={mensajeChat} cols={100} rows={20}></textarea>
                <br />
                <input
                    type="text"
                    placeholder="Elige tu opción ..."
                    value={mensajeEntrante}
                    onChange={handleMessageChange}
                    size={90}
                    maxLength={100}
                />
                <button type="submit">Enviar</button>
            </form>
        </div>
    );

}

export default Chat0;