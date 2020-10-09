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

import { TextChannel, User, GuildMember } from 'discord.js';
import MessageObject from '../../interface/MessageObject';
import CommandHandler from '../../internal/CommandHandler';
import DiscordHandler from '../../internal/DiscordHandler';

export async function ban(
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
  let args = discord.util.parseArgs(messageObj.content);
  if (args.length < 3) {
    if (chan)
      chan.send(
        `Error: Invalid arguments\nUsage:\n${cmdHandler.getCmdPrefix()}ban <user> <history> <reason>`
      );
    else if (user)
      user.send(
        `Error: Invalid arguments\nUsage:\n${cmdHandler.getCmdPrefix()}ban <user> <history> <reason>`
      );
  } else {
    let uname = args[0];
    let target: User | undefined = await discord.util.parseUser(uname);

    if (!target) {
      if (chan) chan.send(`Error: Invalid user ${uname}`);
      else if (user) user.send(`Error: Invalid user ${uname}`);
    } else {
      if (target.id === process.env.SUPER_ADMIN) {
        if (chan) chan.send(`Error: Cannot ban SUPER_ADMIN '${uname}'`);
        else if (user) user.send(`Error: Cannot ban SUPER_ADMIN '${uname}'`);
      } else if (cmdHandler.isAdmin(target.id)) {
        if (chan) chan.send(`Error: Cannot ban admin '${uname}'`);
        else if (user) user.send(`Error: Cannot ban admin '${uname}'`);
      } else {
        let days = Number(args[1]) | 0;
        args.shift();
        args.shift();
        let reason = args.join(' ');
        if (!reason) {
          if (chan) chan.send(`Error: Must include reason`);
          else if (user) user.send(`Error: Must include reason`);
        } else {
          if (days < 0) {
            if (chan) chan.send(`Error: 0 days is the minimum '`);
            else if (user) user.send(`Error: 0 days is the minimum '`);
          } else {
            if (chan instanceof TextChannel) {
              let member:
                | GuildMember
                | undefined = await chan.guild.members.fetch(target);
              if (member) {
                let u: User | undefined = await discord.util.parseUser(uname);
                member
                  .ban({
                    days: days,
                    reason: `${reason} by ${messageObj.author}`,
                  })
                  .then(async () => {
                    if (chan)
                      await chan.send(
                        `${u} Banned by ${messageObj.author} removed messages from the past ${days} days. Reason ${reason}`
                      );
                    else if (user)
                      await user.send(
                        `${u} Banned by ${messageObj.author} removed messages from the past ${days} days. Reason ${reason}`
                      );
                  })
                  .catch(async (e: Error) => {
                    console.log(JSON.stringify(e));
                    if (chan)
                      await chan.send(
                        `Error: An error occured when attempting to ban '${u}'`
                      );
                    else if (user)
                      await user.send(
                        `Error: An error occured when attempting to ban '${u}'`
                      );
                  });
              }
            }
          }
        }
      }
    }
  }
}
