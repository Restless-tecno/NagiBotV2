import axios from 'axios';

const ZWSP = '\u200B'; // Carácter invisible

// Personajes con valores fijos
const SPECIAL_VALUES = {
    'Michael Kaiser Female': 2000,
    'Albedo': 1000,
    'Izumi Miyamura': 1000
};

export function generateRandomValue(characterName = '') {
    // Verificar si el personaje tiene valor especial
    if (SPECIAL_VALUES[characterName]) {
        return SPECIAL_VALUES[characterName];
    }
    
    // Valor aleatorio entre 50 y 50000
    return Math.floor(Math.random() * (50000 - 50 + 1)) + 50;
}

export async function searchCharacter(name) {
    try {
        // Ejemplo de API - reemplaza con tu API real
        const response = await axios.get(`https://api.example.com/search?q=${encodeURIComponent(name)}`);
        
        if (response.data?.length > 0) {
            const charData = response.data[0];
            return {
                id: charData.id || Math.random().toString(36).substring(7),
                name: charData.name,
                gender: charData.gender || 'Desconocido',
                value: String(generateRandomValue(charData.name)),
                source: charData.source || 'Desconocido',
                img: charData.images || ['https://default.image.url'],
                vid: charData.videos || [],
                user: null,
                status: "Libre",
                votes: 0
            };
        }
        return null;
    } catch (error) {
        console.error('Error en búsqueda online:', error);
        return null;
    }
}

export function hideIdInMessage(message, id) {
    return `${message}\n${ZWSP.repeat(10)}${id}${ZWSP.repeat(10)}`;
}

export function extractHiddenId(text) {
    const match = text.match(new RegExp(`${ZWSP}{10}(.+?)${ZWSP}{10}`));
    return match?.[1] || null;
}
