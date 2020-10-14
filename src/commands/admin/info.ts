/*
 * Copyright 2020 Cryptech Services
 *
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

import {
  Collection,
  GuildMember,
  PresenceStatus,
  Role,
  TextChannel,
  User,
} from 'discord.js';
import MessageObject from '../../interface/MessageObject';
import UserInfo from '../../interface/UserInfo';
import CommandHandler from '../../internal/CommandHandler';
import DiscordHandler from '../../internal/DiscordHandler';
import MuteHandler from '../../MuteHandler';
import WarningHandler from '../../WarningHandler';

export async function info(
  discord: DiscordHandler,
  cmdHandler: CommandHandler,
  warnHandler: WarningHandler,
  muteHandler: MuteHandler,
  messageObj: MessageObject
): Promise<void> {
  let user = await discord.getClient().users.fetch(messageObj.author);
  let c = await discord.getClient().channels.fetch(messageObj.channel);
  let chan: TextChannel | null =
    c instanceof TextChannel ? (c as TextChannel) : null;
  if (
    messageObj.author !== process.env.SUPER_ADMIN &&
    !cmdHandler.isAdmin(messageObj.author)
  ) {
    if (chan) chan.send('Error: Permission Denied');
    else if (user) user.send('Error: Permission Denied');
    return;
  }
  let m = messageObj.content.split(/\s+/);
  if (m.length < 2) {
    if (chan)
      chan.send(
        `Error: Invalid arguments\nUsage:\n${cmdHandler.getCmdPrefix()}info <user>`
      );
    else if (user)
      user.send(
        `Error: Invalid arguments\nUsage:\n${cmdHandler.getCmdPrefix()}info <user>`
      );
  } else {
    let target: User | undefined = await discord.util.parseUser(m[1]);
    if (!target) {
      if (chan) chan.send(`Error: Invalid user ${m[1]}`);
      else if (user) user.send(`Error: Invalid user ${m[1]}`);
    } else {
      if (chan instanceof TextChannel) {
        let bans = await (chan as TextChannel).guild.fetchBans();
        let ban: { user: User; reason: string } | undefined = bans
          .filter((b) => b.user.id === target!.id)
          .first();
        let status: PresenceStatus = target.presence.status;
        let g: GuildMember = await (chan as TextChannel).guild.members.fetch(
          target
        );
        let joined: Date = (g.joinedAt as Date) || new Date();
        let createdAt: Date = target.createdAt;
        let display = `${target.username}#${target.discriminator}`;
        let nick = g.nickname || '';
        let mainRole: Role = g.roles.highest;
        let t: Collection<string, Role> = g.roles.cache;
        let roles: string[] = [];
        for (let role of t) {
          roles.push(role[1].name);
        }
        let i: UserInfo;
        if (!ban)
          i = {
            admin: cmdHandler.isAdmin(target.id),
            status,
            joined: joined.toString(),
            createdAt: createdAt.toString(),
            display,
            nick,
            mainRole: mainRole.name,
            roles,
            ban: {},
          };
        else
          i = {
            admin: cmdHandler.isAdmin(target.id),
            status,
            joined: joined.toString(),
            createdAt: createdAt.toString(),
            display,
            nick,
            mainRole: mainRole.name,
            roles,
            ban,
          };

        let infoEmbed = {
          embed: {
            color: 8359053,
            author: {
              name: process.env.BOT_NAME as string,
              icon_url: process.env.ICON_URL as string,
            },
            title: `${target.bot ? 'Bot' : 'User'} Information`,
            url: (await target.fetch()).displayAvatarURL,
            description: `${
              target.bot ? '**[BOT]**  ' : i.admin ? '**[ADMIN]**  ' : ''
            }<@${target.id}> -- ${target.id}`,
            fields: [
              {
                name: 'Joined',
                value: i.joined,
                inline: false,
              },
              {
                name: 'Account Creation',
                value: i.createdAt,
                inline: false,
              },
              {
                name: 'All Roles',
                value: `[${i.roles.join(',')}]`,
                inline: false,
              },
              {
                name: 'Nickname',
                value: i.nick.length > 0 ? i.nick : 'none',
                inline: true,
              },
              {
                name: 'Main Role',
                value: i.mainRole,
                inline: true,
              },
              {
                name: 'Status',
                value: i.status,
                inline: true,
              },
              {
                name: 'Warning Level',
                value: `${warnHandler.getLevel(target.id)}/${Number(
                  process.env.MAX_WARN
                )}`,
                inline: true,
              },
              {
                name: 'Muted Until',
                value: `${
                  muteHandler.mutedUntil(target.id) > 0 ? new Date((muteHandler.mutedUntil(target.id) * 1000)) : 'Not Muted'
                }`,
                inline: true,
              },
              {
                name: 'Ban',
                value:
                  Object.values(i.ban).length > 0
                    ? JSON.stringify(i.ban, null, 2)
                    : 'Not Banned',
                inline: true,
              },
            ],
            timestamp: new Date(),
            image: {
              url: `https://cdn.discordapp.com/avatars/${target.id}/${target.avatar}.png`,
            },
            footer: {
              icon_url: process.env.ICON_URL as string,
              text: process.env.BOT_NAME as string,
            },
          },
        };
        if (chan) await chan.send(infoEmbed);
        else if (user) await user.send(infoEmbed);
      }
    }
  }
}
