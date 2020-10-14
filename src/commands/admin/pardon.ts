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

import { TextChannel, User } from 'discord.js';
import MessageObject from '../../interface/MessageObject';
import CommandHandler from '../../internal/CommandHandler';
import DiscordHandler from '../../internal/DiscordHandler';
import WarningHandler from '../../WarningHandler';

export async function pardon(
  discord: DiscordHandler,
  cmdHandler: CommandHandler,
  warnHandler: WarningHandler,
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
  if (args.length < 2) {
    if (chan)
      chan.send(
        `Error: Invalid arguments\nUsage:\n${cmdHandler.getCmdPrefix()}pardon <user> <level>`
      );
    else if (user)
      user.send(
        `Error: Invalid arguments\nUsage:\n${cmdHandler.getCmdPrefix()}pardon <user> <level>`
      );
  } else {
    let target: User | undefined = await discord.util.parseUser(args[0]);
    let level = Number(args[1]);
    if (!target) {
      if (chan) chan.send(`Error: Invalid user ${args[0]}`);
      else if (user) user.send(`Error: Invalid user ${args[0]}`);
    } else {
      if (target.id === process.env.SUPER_ADMIN) {
        if (chan) chan.send(`Error: Cannot pardon SUPER_ADMIN '${args[0]}'`);
        else if (user)
          user.send(`Error: Cannot pardon SUPER_ADMIN '${args[0]}'`);
      } else if (cmdHandler.isAdmin(target.id)) {
        if (chan) chan.send(`Error: Cannot pardon admin '${args[0]}'`);
        else if (user) user.send(`Error: Cannot pardon admin '${args[0]}'`);
      } else {
        warnHandler.pardon(target.id, level);
        if (chan) chan.send(`Lowered ${args[0]}'s warning level by ${level}`);
        else if (user)
          user.send(`Lowered ${args[0]}'s warning level by ${level}`);
      }
    }
  }
}
