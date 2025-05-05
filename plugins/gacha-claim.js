import { promises as fs } from 'fs';

// Archivos de base de datos
const haremFilePath = './src/database/harem.json';
const tempClaimPath = './src/database/tempClaim.json';

// Cargar harem
async function loadHarem() {
    try {
        const data = await fs.readFile(haremFilePath, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

// Guardar harem
async function saveHarem(harem) {
    await fs.writeFile(haremFilePath, JSON.stringify(harem, null, 2));
}

// Cargar tempClaim
async function loadTempClaim() {
    try {
        const data = await fs.readFile(tempClaimPath, 'utf-8');
        return JSON.parse(data);
    } catch {
        return {};
    }
}

// Guardar tempClaim
async function saveTempClaim(tempClaim) {
    await fs.writeFile(tempClaimPath, JSON.stringify(tempClaim, null, 2));
}

// Handler principal
let handler = async (m, { conn }) => {
    const userId = m.sender;
    const now = Date.now();

    try {
        const [harem, tempClaim] = await Promise.all([loadHarem(), loadTempClaim()]);
        const character = tempClaim[userId];

        // Verificaciones
        if (!character) {
            return conn.reply(m.chat, "❌ Usa *#rw* primero para generar un personaje.", m);
        }

        if (now > character.expires) {
            delete tempClaim[userId];
            await saveTempClaim(tempClaim);
            return conn.reply(m.chat, "⌛ Tiempo agotado. Usa *#rw* de nuevo.", m);
        }

        if (harem.some(c => c.characterId === character.id)) {
            delete tempClaim[userId];
            await saveTempClaim(tempClaim);
            return conn.reply(m.chat, "⚠️ Este personaje ya fue reclamado.", m);
        }

        // Añadir al harem
        harem.push({
            userId: userId,
            characterId: character.id,
            name: character.name,
            img: character.img,
            value: character.value || Math.floor(Math.random() * 9950) + 50,
            claimedAt: now
        });

        // Limpiar tempClaim y guardar
        delete tempClaim[userId];
        await Promise.all([saveHarem(harem), saveTempClaim(tempClaim)]);

        // Mensaje de éxito
        await conn.reply(
            m.chat, 
            `🎉 *¡Personaje reclamado!*\n\n` +
            `🌸 *Nombre:* ${character.name}\n` +
            `💎 *Valor:* ${character.value}\n\n` +
            `💾 Usa *#harem* para ver tu colección.`,
            m
        );

    } catch (error) {
        console.error("Error en #claim:", error);
        conn.reply(m.chat, "❌ Error al reclamar. Intenta de nuevo.", m);
    }
};

handler.help = ['claim', 'c'];
handler.tags = ['gacha'];
handler.command = ['claim', 'c'];
export default handler;
