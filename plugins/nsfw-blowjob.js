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
    m.react('😮');

    let str;
    if (m.mentionedJid.length > 0) {
        str = `\`${name2}\` *le dio una mamada a* \`${name || who}\`.`;
    } else if (m.quoted) {
        str = `\`${name2}\` *le está dando una mamada a* \`${name || who}\`.`;
    } else {
        str = `\`${name2}\` *está dando una mamada >.<*`.trim();
    }
    
    if (m.isGroup) {
        let pp = 'https://files.catbox.moe/w5u266.mp4'; 
        let pp2 = 'https://files.catbox.moe/ztq87p.mp4'; 
        let pp3 = 'https://files.catbox.moe/7b7mwl.mp4';
        let pp4 = 'https://files.catbox.moe/4g0a66.mp4';
        let pp5 = 'https://files.catbox.moe/5f4k8a.mp4';
        let pp6 = 'https://files.catbox.moe/mdpjh3.mp4';
        let pp7 = 'https://files.catbox.moe/i6l08x.mp4';
        let pp8 = 'https://files.catbox.moe/3whwql.mp4';
        let pp9 = 'https://files.catbox.moe/3jhynx.mp4';
        let pp10 = 'https://files.catbox.moe/8c1ew0.mp4';
        let pp11 = 'https://files.catbox.moe/lljb6g.mp4';
        
        const videos = [pp, pp2, pp3, pp4, pp5, pp6, pp8, pp9, pp10, pp11];
        const video = videos[Math.floor(Math.random() * videos.length)];

        let mentions = [who];
        conn.sendMessage(m.chat, { video: { url: video }, gifPlayback: true, caption: str, mentions }, { quoted: m });
    }
}

handler.help = ['blowjob/mamada @tag'];
handler.tags = ['nsfw'];
handler.command = ['blowjob','bj','mamada'];
handler.group = true;

export default handler;
