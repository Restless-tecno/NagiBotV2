//Codígo creado por Destroy wa.me/50231458537

import fs from 'fs';
import path from 'path';

let handler = async (m, { conn, usedPrefix }) => {
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
    m.react('👊');

    let str;
    if (m.mentionedJid.length > 0) {
        str = `\`${name2}\` *Le dió un coñazo a* \`${name || who}\`.`;
    } else if (m.quoted) {
        str = `\`${name2}\` *Le dió en la madre a* \`${name || who}\`.`;
    } else {
        str = `\`${name2}\` *Mejor no menciono como quedó*`.trim();
    }
    
    if (m.isGroup) {
        let pp = 'https://qu.ax/uSfl.mp4'; 
        let pp2 = 'https://qu.ax/nJngK.mp4'; 
        let pp3 = 'https://qu.ax/iXuAh.mp4';
        let pp4 = 'https://qu.ax/CoDLF.mp4';
        let pp5 = 'https://qu.ax/tuDTg.mp4';
        let pp6 = 'https://qu.ax/omASp.mp4';
        let pp7 = 'https://qu.ax/HzdhK.mp4';
        let pp8 = 'https://qu.ax/xszwF.mp4';
        
        const videos = [pp, pp2, pp3, pp4, pp5, pp6, pp7, pp8];
        const video = videos[Math.floor(Math.random() * videos.length)];

        let mentions = [who];
        conn.sendMessage(m.chat, { video: { url: video }, gifPlayback: true, caption: str, mentions }, { quoted: m });
    }
}

handler.help = ['hit/golpear/coñazo @tag'];
handler.tags = ['anime'];
handler.command = ['hot', 'golpear', 'coñazo'];
handler.group = true;

export default handler;
