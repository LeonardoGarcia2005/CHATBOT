//import { app } from '../../app.js';
import pkg1 from "body-parser";
const { urlencoded, json } = pkg1;
import {configurationProvider} from '../../globalServices/config/configurationManager.js';
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';
import {createHmac} from 'node:crypto';
//import { gql } from '@apollo/client';

const adicionarMessenger = async function(app) {
    app.use(
      urlencoded({
        extended: true
      })
    );
    loggerGlobal.info("Añadi el urlencoded ....");

    // Parse application/json. Verify that callback came from Facebook
    app.use(json({ verify: verifyRequestSignature }));

    app.get('/webhook', function(req, res) {
      loggerGlobal.info("Ejecutando el endpoint /webhook por el GET ....");

        if (req.query['hub.mode'] === 'subscribe' &&
            req.query['hub.verify_token'] === configurationProvider.pageAppForMessenger.verifyToken) {

          loggerGlobal.info("Hola Jorge ... invocación válida por el GET para verificar este endpoint!!");
          res.status(200).send(req.query['hub.challenge']);

        } else {
          loggerGlobal.error("La validacion fallo. Revise:\n "+
          "1. Que el token de verificacion sea el correcto;\n"+
          "2. Que el URL de esta app este configurado como callback URL del weebhook ...");
          res.sendStatus(403);          
        }  
      });
      
    app.post("/webhook", (req, res) => {
        loggerGlobal.info("Ejecutando el endpoint /webhook por el POST ....");
        let body = req.body;
        //const cuerpo = body.entry[0].messaging[0].message.text;
        //console.log(cuerpo);
      
        console.log(`\u{1F7EA} Received webhook:`);
        console.dir(body, { depth: null });
      
        // Check if this is an event from a page subscription
        if (body.object === "page") {
          // Returns a '200 OK' response to all requests
          res.status(200).send("EVENT_RECEIVED");
          //const entries = body.entry ? body.entry.length : 0;
          //loggerGlobal.info('cantidad de entradas: '+entries);

          // Iterate over each entry - there may be multiple if batched
          body.entry.forEach(async function (entry) {
              
            //loggerGlobal.debug(inspect(entry.messaging[0].message));
              //let message = entry.messaging[0].message.text;
              //let postback = entry.messaging[0].message.postback;
              //loggerGlobal.debug(message);
            // Gets the body of the webhook event
              let webhook_event = entry.messaging[0];
              //loggerGlobal.info(webhook_event);

              // Get the sender PSID
              //let mensaje = entry.messaging[0].message.text;
              let sender_psid = webhook_event.sender.id;
              loggerGlobal.info('Sender PSID: ' + sender_psid);
              //console.log(mensaje);

              // Check if the event is a message or postback and
              // pass the event to the appropriate handler function
              if (entry.messaging[0].message) {
                loggerGlobal.info('manejando un message event ....');
                handleMessage(sender_psid, entry.messaging[0].message);        
              } else if (webhook_event.postback) {
                loggerGlobal.info('manejando un postback event ....');
                handlePostback(sender_psid, webhook_event.postback);
              }        
          });

        } else {
          // Return a '404 Not Found' if event is not from a page subscription
          res.sendStatus(404);
        }
    });


    async function handleMessage(sender_psid, received_message) {

      //loggerGlobal.info('senderId recibido: '+sender_psid);
      //loggerGlobal.info('el mensaje recibido: ',received_message);
      let response;

      // Check if the message contains text
      if (received_message.text) {    

        //const resp = await getResponseFromTalking(received_message.text);
        //loggerGlobal.debug('Respuesta: '+JSON.stringify(resp));

        // Create the payload for a basic text message
        response = {
          //"text": `Me enviaste el mensaje: "${received_message.text}". Ahora enviame una imagen!`,
          "text": `Me enviaste el mensaje: "${received_message.text}". Ahora enviame una imagen!`
        }
      }  else if (received_message.attachments) {
      
        // Gets the URL of the message attachment
        let attachment_url = received_message.attachments[0].payload.url;
        response = {
          "attachment": {
            "type": "template",
            "payload": {
              "template_type": "generic",
              "elements": [{
                "title": "¿Es esta la imagen correcta?",
                "subtitle": "Presiona un boton para responder.",
                "image_url": attachment_url,
                "buttons": [
                  {
                    "type": "postback",
                    "title": "Si!",
                    "payload": "Si",
                  },
                  {
                    "type": "postback",
                    "title": "No!",
                    "payload": "No",
                  }
                ],
              }]
            }
          }
        }
      }
      
      // Sends the response message
      callSendAPI(sender_psid, response);    
    }

    function handlePostback(sender_psid, received_postback) {
      let response;
      
      // Get the payload for the postback
      let payload = received_postback.payload;

      // Set the response based on the postback payload
      if (payload === 'Si') {
        response = { "text": "Gracias!" }
      } else if (payload === 'No') {
        response = { "text": "Oops, trata de enviar otra imagen." }
      }
      // Send the message to acknowledge the postback
      callSendAPI(sender_psid, response);
    }

    function callSendAPI(sender_psid, response) {
      //loggerGlobal.debug('el mensaje a enviar es: '+response.text);
      // Construct the message body
      let request_body = {
        "recipient": {
          "id": sender_psid
        },
        "message": response,
        "access_token": `${configurationProvider.pageAppForMessenger.pageAccesToken}`,
      }

      SendRequest(request_body); //Execute the function the request is in.
    }
          
    function SendRequest(datatosend) {
      function OnResponse(response) {
          var data = '';

          response.on('data', function(chunk) {
              data += chunk; //Append each chunk of data received to this variable.
          });
          response.on('end', function() {
              console.log(data); //Display the server's response, if any.
          });
      }

        loggerGlobal.info('Voy a hacer un fetch respondiendo ...');
        loggerGlobal.debug('DAta a enviar es: '+JSON.stringify(datatosend));

        // Make a post Request.
        const facebookAPIUrl = configurationProvider.messengerAPI.apiDomain + '/' +
                               configurationProvider.messengerAPI.apiVersion + '/me/messages?';
                               //https://graph.facebook.com/v11.0/me/messages?
        fetch(facebookAPIUrl,{
          method: 'POST',
            body: JSON.stringify(datatosend),
            headers: { 'Content-type': 'application/json;' },// charset=UTF-8' },
        })
          .then((response) => response.json())
          .then((json) => loggerGlobal.debug(json))
          .catch(error => {
              loggerGlobal.error(error)
          })
            
    }

    // Verify that the callback came from Facebook.
    function verifyRequestSignature(req, res, buf) {
      loggerGlobal.info('verificando la firma ...');
      var signature = req.headers["x-hub-signature"];

      if (!signature) {
        console.warn(`No se encontro "x-hub-signature" en los headers.`);
      } else {
        var elements = signature.split("=");
        var signatureHash = elements[1];
        var expectedHash = //crypto
          createHmac("sha1", configurationProvider.pageAppForMessenger.appSecret)//sha1
          .update(buf)
          .digest("hex");
        if (signatureHash != expectedHash) {
          throw new Error("No se puedo validar la firma del request");
        }
        loggerGlobal.info('firma verificada ...');
      }
    }
      
    function setDefaultUser(id) {
      console.log('se llamo a la funcion setDefaultUser ...');
      /*let user = new User(id);
      users[id] = user;
      i18n.setLocale("en_US");*/
    }

    function isGuestUser(webhookEvent) {
      let guestUser = false;
      if ("postback" in webhookEvent) {
        if ("referral" in webhookEvent.postback) {
          if ("is_guest_user" in webhookEvent.postback.referral) {
            guestUser = true;
          }
        }
      }
      return guestUser;
    }

    function receiveAndReturn(user, webhookEvent, isUserRef) {
      let receiveMessage = new Receive(user, webhookEvent, isUserRef);
      return receiveMessage.handleMessage();
    }

    async function getResponseFromTalking(received_message) {

      if (!received_message) return null;

      loggerGlobal.debug('voy a invocar los servicios de conversacion ...');

      const query = 
        `{
            mutation CrearNuevaConversacion($conversacionCreateInput: ConversacionCreateInput!) {
                crearNuevaConversacion(conversacionCreateInput: $conversacionCreateInput) {
                  ultima_fase_conversacion {
                    id
                    nombre_fase
                    mensaje_de_fase
                  }
                }
            }          
          }`

      loggerGlobal.debug('El query es: '+query);

      const respuestaSistema = await
      fetch('http://localhost:4000/graphql',{
        method: 'POST',
          body: JSON.stringify({query}),
          headers: { 'Content-type': 'application/json;' },// charset=UTF-8' },
          variables: {
            "conversacionCreateInput": {
              "guion_conversacion_id": '2',
              "tomada_por_operador": false,
              "canal_id": "3",//1 es Canal WEB
              "identificador_cliente_en_canal": null
            }
          }
      })
        .then((response) => response.json())
        .then((json) => {
          loggerGlobal.debug('Obtuve respuesta al invocar servicio ....');
          loggerGlobal.debug(json);
          return json;
        })
        .catch(error => {
            loggerGlobal.error(error)
        });

      return respuestaSistema;  
    }

    return app;
}

export {adicionarMessenger};