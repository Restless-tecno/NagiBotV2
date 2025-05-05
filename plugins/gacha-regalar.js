import { promises as fs } from 'fs';

const DB_PATH = './src/database/harem.json';

async function loadHarem() {
    try {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(data) || [];
    } catch {
        return [];
    }
}

async function saveHarem(data) {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

let handler = async (m, { conn, args }) => {
    const sender = m.sender;
    const username = conn.getName(sender);

    if (!args[0] || !args[1]?.startsWith('@')) {
        return conn.reply(m.chat, `✘ Uso: #regalar <nombre_personaje> @usuario\nEjemplo: #regalar naruto @amigo`, m);
    }

    try {
        const harem = await loadHarem();
        const characterName = args.slice(0, -1).join(' ').toLowerCase();
        const recipient = args[args.length - 1].replace('@', '') + '@s.whatsapp.net';

        // Buscar personaje
        const charIndex = harem.findIndex(c => 
            c.name.toLowerCase() === characterName && 
            c.userId === sender
        );

        if (charIndex === -1) {
            return conn.reply(m.chat, `❌ No tienes un personaje llamado "${args.slice(0, -1).join(' ')}"`, m);
        }

        // Transferir
        harem[charIndex].userId = recipient;
        harem[charIndex].username = conn.getName(recipient);
        harem[charIndex].transferredAt = Date.now();

        await saveHarem(harem);

        await conn.reply(
            m.chat,
            `🎁 *${username}* ha regalado a *${harem[charIndex].name}* a @${recipient.split('@')[0]}!\n` +
            `💎 Valor: ${harem[charIndex].value} | 📺 Fuente: ${harem[charIndex].source}`,
            m,
            { mentions: [sender, recipient] }
        );

    } catch (error) {
        conn.reply(m.chat, `❌ Error al regalar: ${error.message}`, m);
    }
};

handler.help = ['regalar <nombre> @usuario'];
handler.tags = ['gacha'];
handler.command = ['regalar', 'give'];
export default handler;
