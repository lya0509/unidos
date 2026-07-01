import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import pino from 'pino'
import qrcode from 'qrcode-terminal'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

async function connectToWhatsApp () {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    const { version, isLatest } = await fetchLatestBaileysVersion()
    console.log(`🌐 Usando versión de WhatsApp Web: v${version.join('.')}, ¿Es la última?: ${isLatest}`)
    
    const sock = makeWASocket({
        version,
        printQRInTerminal: false, // Lo imprimimos manualmente con qrcode-terminal
        auth: state,
        logger: pino({ level: 'silent' })
    })

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update
        
        if (qr) {
            console.log('===================================================')
            console.log('🤖 ESCANEA ESTE CÓDIGO QR EN TU WHATSAPP PARA INICIAR')
            console.log('===================================================')
            qrcode.generate(qr, { small: true })
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('Conexión cerrada. Detalle del error:', lastDisconnect.error)
            console.log('Reconectando...', shouldReconnect)
            if (shouldReconnect) {
                connectToWhatsApp()
            }
        } else if (connection === 'open') {
            console.log('✅ Bot conectado exitosamente a WhatsApp')
        }
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0]
        if (!msg.message || msg.key.fromMe) return

        const texto = msg.message.conversation || msg.message.extendedTextMessage?.text
        if (!texto) return

        const numero = msg.key.remoteJid

        if (texto.toLowerCase().startsWith('sos')) {
            console.log(`SOS recibido de ${numero}: ${texto}`)
            
            // Responder en WhatsApp
            await sock.sendMessage(numero, { 
                text: '🚨 Hemos recibido tu alerta SOS. Estamos procesándola en el sistema central de Logística.' 
            })
            
            // Aquí en un futuro enviaríamos el payload a FastAPI:
            // axios.post('http://localhost:8000/api/v1/sos/bot', { numero, mensaje: texto })
        }
    })
}

connectToWhatsApp()
