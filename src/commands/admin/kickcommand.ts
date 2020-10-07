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

import { GuildMember, TextChannel, User } from 'discord.js';
import MessageObject from '../../interface/MessageObject';
import CommandHandler from '../../internal/CommandHandler';
import DiscordHandler from '../../internal/DiscordHandler';

export async function kickcommand(
  discord: DiscordHandler,
  cmdHandler: CommandHandler,
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
        `Error: Invalid arguments\nUsage:\n${cmdHandler.getCmdPrefix()}kick <user> <reason>`
      );
    else if (user)
      user.send(
        `Error: Invalid arguments\nUsage:\n${cmdHandler.getCmdPrefix()}kick <user> <reason>`
      );
  } else {
    let u = m[1];
    let target: User | undefined = await discord.util.parseUser(u);
    m.shift();
    m.shift();
    if (!target) {
      if (chan) chan.send(`Error: Invalid user ${u}`);
      else if (user) user.send(`Error: Invalid user ${u}`);
    } else {
      if (target.id === process.env.SUPER_ADMIN) {
        if (chan) chan.send(`Error: Cannot kick SUPER_ADMIN '${u}'`);
        else if (user) user.send(`Error: Cannot kick SUPER_ADMIN '${u}'`);
      } else if (cmdHandler.isAdmin(target.id)) {
        if (chan) chan.send(`Error: Cannot kick admin '${u}'`);
        else if (user) user.send(`Error: Cannot kick admin '${u}'`);
      } else {
        if (m.length < 1) {
          if (chan) chan.send(`Error: Must include reason`);
          else if (user) user.send(`Error: Must include reason`);
        } else {
          if (chan instanceof TextChannel) {
            let member:
              | GuildMember
              | undefined = await chan.guild.members.fetch(target);
            if (member) {
              member
                .kick(m.join(' '))
                .then(async () => {
                  if (chan) await chan.send(`Kicked '${u}'`);
                  else if (user) await user.send(`Kicked '${u}'`);
                })
                .catch(async (e: Error) => {
                  if (chan)
                    await chan.send(
                      `Error: An error occured when attempting to kick '${u}'`
                    );
                  else if (user)
                    await user.send(
                      `Error: An error occured when attempting to kick '${u}'`
                    );
                });
            }
          }
        }
      }
    }
  }
}
