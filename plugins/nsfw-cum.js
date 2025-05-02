//Codígo creado por Destroy wa.me/584120346669

import fs from 'fs';
import path from 'path';

let handler = async (m, { conn, usedPrefix }) => {
if (!db.data.chats[m.chat].nsfw && m.isGroup) {
    return m.reply(`${emoji} El contenido *NSFW* está desactivado en este grupo.\n> Un administrador puede activarlo con el comando » *#nsfw*`);
    }

    let who;
    if (m.mentionedJid.length > 0) {
        who = m.mentionedJid[0];
    } else if (m.quoted) {
        who = m.quoted.sender;
    } else {
        who = m.sender;
    }

    let name = conn.getName(who);
    let name2 = conn.getName(m.sender);
    m.react('💦');

    let str;
    if (m.mentionedJid.length > 0) {
        str = `\`${name2}\` *se vino dentro de* \`${name || who}\`.`;
    } else if (m.quoted) {
        str = `\`${name2}\` *se vino dentro de* \`${name || who}\`.`;
    } else {
        str = `\`${name2}\` *se vino dentro de...  Omitiremos eso*`.trim();
    }
    
    if (m.isGroup) {
        let pp = 'https://files.catbox.moe/yjl6ca.mp4'; 
        let pp2 = 'https://files.catbox.moe/z4gn6n.mp4'; 
        let pp3 = 'https://files.catbox.moe/kkgayp.mp4';
        let pp4 = 'https://files.catbox.moe/u4997a.mp4';
        let pp5 = 'https://files.catbox.moe/1shm3w.mp4';
        let pp6 = 'https://files.catbox.moe/ghhml4.mp4';
        let pp7 = 'https://files.catbox.moe/q2p2co.mp4';
        let pp8 = 'https://files.catbox.moe/brktzk.mp4';
        let pp9 = 'https://files.catbox.moe/xtagq2.mp4';
        let pp10 = 'https://files.catbox.moe/fbuih4.mp4';
        let pp11 = 'https://files.catbox.moe/pm0kkd.mp4';
        
        const videos = [pp, pp2, pp3, pp4, pp5, pp6, pp7, pp8, pp9, pp10, pp11];
        const video = videos[Math.floor(Math.random() * videos.length)];

        let mentions = [who];
        conn.sendMessage(m.chat, { video: { url: video }, gifPlayback: true, caption: str, mentions }, { quoted: m });
    }
}

handler.help = ['cum/leche @tag'];
handler.tags = ['nsfw'];
handler.command = ['cum','leche'];
handler.group = true;

export default handler;
