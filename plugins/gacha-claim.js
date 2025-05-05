import { promises as fs } from 'fs';

// Archivos de base de datos
const haremFilePath = './src/database/harem.json';
const tempClaimPath = './src/database/tempClaim.json';

// Función para cargar el harem
async function loadHarem() {
    try {
        await fs.access(haremFilePath);
        const data = await fs.readFile(haremFilePath, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

// Función para guardar el harem
async function saveHarem(harem) {
    await fs.writeFile(haremFilePath, JSON.stringify(harem, null, 2));
}

// Función para cargar claims temporales
async function loadTempClaim() {
    try {
        await fs.access(tempClaimPath);
        const data = await fs.readFile(tempClaimPath, 'utf-8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

// Función para guardar claims temporales
async function saveTempClaim(tempClaim) {
    await fs.writeFile(tempClaimPath, JSON.stringify(tempClaim, null, 2));
}

let handler = async (m, { conn }) => {
    const userId = m.sender;
    const now = Date.now();
    const username = conn.getName(m.sender);

    try {
        const [harem, tempClaim] = await Promise.all([loadHarem(), loadTempClaim()]);
        const character = tempClaim[userId];

        if (!character) {
            return conn.reply(m.chat, "❌ No hay personajes pendientes. Usa #rw primero.", m);
        }

        if (now > character.expires) {
            delete tempClaim[userId];
            await saveTempClaim(tempClaim);
            return conn.reply(m.chat, "⌛ Tiempo agotado. Usa #rw de nuevo.", m);
        }

        if (harem.some(c => c.characterId === character.id)) {
            delete tempClaim[userId];
            await saveTempClaim(tempClaim);
            return conn.reply(m.chat, "⚠️ Este personaje ya fue reclamado.", m);
        }

        // Añadir al harem
        harem.push({
            userId: userId,
            username: username,
            characterId: character.id,
            name: character.name,
            gender: character.gender,
            img: character.img,
            value: character.value,
            source: character.source,
            claimedAt: now
        });

        delete tempClaim[userId];
        await Promise.all([saveHarem(harem), saveTempClaim(tempClaim)]);

        // Mensaje de confirmación
        await conn.sendMessage(m.chat, {
            text: `🎉 *¡Personaje Reclamado por ${username}!*\n\n` +
                  `🌸 *Nombre:* ${character.name}\n` +
                  `⚥ *Género:* ${character.gender}\n` +
                  `💎 *Valor:* ${character.value}\n` +
                  `📺 *Fuente:* ${character.source}\n\n` +
                  `✅ Ahora forma parte de tu harem.`,
            mentions: [m.sender]
        });

    } catch (error) {
        console.error("Error en #claim:", error);
        conn.reply(m.chat, `❌ Error al reclamar: ${error.message}`, m);
    }
};

handler.help = ['c', 'claim'];
handler.tags = ['gacha'];
handler.command = ['c', 'claim'];
export default handler;
