/*const { WebSocketServer } = require("ws");

const serveur = new WebSocketServer({ port: 3000 });

const listClient = new Map();

function handleMessage(serv, client, message) {
  console.log(message);
  console.log(client.userID);
  serv.clients.forEach((c) => {
    if (c !== client && client.readyState === WebSocket.OPEN) {
      c.send(
        JSON.stringify({
          type: "message",
          message: message,
          from: client.userID,
        }),
      );
    }
  });
}

function handleConnexion(serveur, client, userID) {
  listClient.set(String(userID), client);
  client.userID = userID;
  console.log("Utilisateur " + userID + " enregistré");
}

function handleMessagePrive(client, targetID, message) {
  const destinataire = listClient.get(targetID);

  if (destinataire && destinataire.readyState === WebSocket.OPEN) {
    destinataire.send(
      JSON.stringify({
        type: "message",
        from: client.userID,
        message: message,
      }),
    );
  } else {
    const msg = `L'Utilisateur ${targetID} est hors ligne`;
    client.send(
      JSON.stringify({
        type: "destinataire_inconnu",
        message: msg,
      }),
    );
  }
}

serveur.on("connection", (client) => {
  console.log("Un client s'est connecté !");

  // Écouter les messages du client
  client.on("message", (data) => {
    const dataparse = JSON.parse(data);

    console.log(`Reçu du client : ${dataparse}`);
    console.log(dataparse.type);
    switch (dataparse.type) {
      case "message":
        const regex = dataparse.message.match(/^@([a-zA-Z0-9_]+)\s+(.*)/);
        if (regex) {
          const targetID = regex[1];
          const message = regex[2];
          handleMessagePrive(client, targetID, message);
        } else {
          handleMessage(serveur, client, dataparse.message);
        }
        break;
      case "connexion":
        handleConnexion(serveur, client, dataparse.userID);
        break;
    }
  });

  client.on("close", () => console.log("Client déconnecté"));
});

console.log("Serveur WebSocket lancé sur ws://localhost:3000");*/

const { WebSocketServer, WebSocket } = require("ws");

const serveur = new WebSocketServer({ port: 3000 });
// On garde une trace des pseudos pour le style Discord
const clientsMap = new Map(); 

const DICTIONNAIRE = ["INTERFACE", "NAVIGATION", "PROTOCOLE", "RESEAU", "ALGORITHME"];
let motSecret = "";

function demarrerPartie() {
    motSecret = DICTIONNAIRE[Math.floor(Math.random() * DICTIONNAIRE.length)];
    console.log("Nouveau mot :", motSecret);
    // On dit à tout le monde que ça recommence, mais on cache le mot
    broadcast({
        type: "system",
        content: `Nouvelle partie ! Le mot fait ${motSecret.length} lettres. Trouvez les lettres pour avoir des indices privés, ou devinez le mot entier !`
    });
}

// Fonction pour envoyer un message à TOUT LE MONDE
function broadcast(data) {
    serveur.clients.forEach(c => {
        if (c.readyState === WebSocket.OPEN) c.send(JSON.stringify(data));
    });
}

// Fonction pour envoyer un message à UN SEUL JOUEUR
function sendTo(client, data) {
    if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
    }
}

demarrerPartie();

serveur.on("connection", (client) => {
    // On attribue un pseudo aléatoire style Discord (User#1234)
    const pseudo = "User#" + Math.floor(1000 + Math.random() * 9000);
    clientsMap.set(client, pseudo);

    sendTo(client, { type: "system", content: `Bienvenue ${pseudo} ! Connecté au serveur.` });

    client.on("message", (message) => {
        const data = JSON.parse(message);

        switch (data.type) {
            case "chat_message":
                // On relaie le message à tout le monde avec le pseudo
                broadcast({
                    type: "chat",
                    from: clientsMap.get(client),
                    content: data.content
                });
                break;

            case "guess_letter":
                const lettre = data.content.toUpperCase();
                
                // Recherche des positions de la lettre
                let positions = [];
                for(let i=0; i<motSecret.length; i++) {
                    if(motSecret[i] === lettre) positions.push(i+1); // +1 pour parler humainement (1er, 2e...)
                }

                if (positions.length > 0) {
                    // C'est la demande CLÉ : Réponse privée uniquement au joueur
                    sendTo(client, {
                        type: "private_clue",
                        content: `🤫 Indice secret : La lettre **${lettre}** se trouve aux positions : ${positions.join(", ")}`
                    });
                } else {
                    sendTo(client, {
                        type: "private_error",
                        content: `❌ Pas de **${lettre}** dans le mot.`
                    });
                }
                break;

            case "guess_word":
                const tentative = data.content.toUpperCase();
                if (tentative === motSecret) {
                    broadcast({
                        type: "win",
                        content: `🏆 VICTOIRE ! **${clientsMap.get(client)}** a trouvé le mot : **${motSecret}** !`
                    });
                    setTimeout(demarrerPartie, 4000);
                } else {
                    // On affiche publiquement l'échec pour mettre la pression
                    broadcast({
                        type: "system",
                        content: `😱 ${clientsMap.get(client)} a tenté "${tentative}" et s'est trompé !`
                    });
                }
                break;
        }
    });

    client.on("close", () => clientsMap.delete(client));
});

console.log("Serveur Discord-Pendu lancé sur ws://localhost:3000");