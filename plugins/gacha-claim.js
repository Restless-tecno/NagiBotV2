import { promises as fs } from 'fs';

const DB_PATH = './src/database/';

async function loadHarem() {
    try {
        const data = await fs.readFile(`${DB_PATH}harem.json`, 'utf-8');
        return JSON.parse(data) || [];
    } catch {
        return [];
    }
}

async function saveHarem(data) {
    await fs.writeFile(`${DB_PATH}harem.json`, JSON.stringify(data, null, 2));
}

async function loadTempClaim() {
    try {
        const data = await fs.readFile(`${DB_PATH}tempClaim.json`, 'utf-8');
        return JSON.parse(data) || {};
    } catch {
        return {};
    }
}

let handler = async (m, { conn }) => {
    const userId = m.sender;
    const username = conn.getName(userId);
    const now = Date.now();

    try {
        const [harem, tempClaim] = await Promise.all([loadHarem(), loadTempClaim()]);
        const character = tempClaim[userId];

        if (!character) throw new Error("Usa #rw primero para generar un personaje");
        if (now > character.expires) throw new Error("Tiempo agotado (2 minutos)");
        if (harem.some(c => c.id === character.id)) throw new Error("¡Este personaje ya fue reclamado!");

        // Añadir al harem
        const newHarem = [...harem, {
            ...character,
            username,
            claimedAt: now,
            originalOwner: userId
        }];

        // Actualizar datos
        delete tempClaim[userId];
        await Promise.all([
            saveHarem(newHarem),
            fs.writeFile(`${DB_PATH}tempClaim.json`, JSON.stringify(tempClaim, null, 2))
        ]);

        // Confirmación
        await conn.reply(
            m.chat,
            `🎉 *@${username.split('@')[0]} ha reclamado a ${character.name}!*\n` +
            `💎 Valor: ${character.value} | 📺 Fuente: ${character.source}\n` +
            `✅ Usa #harem para ver tu colección`,
            m,
            { mentions: [userId] }
        );

    } catch (error) {
        conn.reply(m.chat, `❌ Error: ${error.message}`, m);
    }
};

handler.help = ['claim'];
handler.tags = ['gacha'];
handler.command = ['claim', 'c'];
export default handler;
