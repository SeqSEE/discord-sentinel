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

import DiscordHandler from '../../DiscordHandler';
import MessageObject from '../../../interface/MessageObject';
import { TextChannel } from 'discord.js';
import CommandHandler from '../../CommandHandler';
import Command from '../../Command';

export async function help(
  discord: DiscordHandler,
  cmdHandler: CommandHandler,
  messageObj: MessageObject
): Promise<void> {
  let user = await discord.getClient().users.fetch(messageObj.author);
  let c = await discord.getClient().channels.fetch(messageObj.channel);
  let chan: TextChannel | null =
    c instanceof TextChannel ? (c as TextChannel) : null;
  let args = discord.util.parseArgs(messageObj.content);
  let commands: { name: string; value: string; inline: boolean }[] = [];
  cmdHandler.getCommands().map((cmd) => {
    let command = cmdHandler.getCommand(cmd);
    if (command && command.isEnabled()) {
      
      commands.push(command.getHelpSection());
    }
  });

  let helpEmbed = {
    embed: {
      color: 8359053,
      author: {
        name: process.env.BOT_NAME as string,
        icon_url: process.env.ICON_URL as string,
      },
      title: `**HELP**`,
      url: '',
      description: `** **`,
      fields: [commands],
      timestamp: new Date(),
      image: {
        url: '',
      },
      footer: {
        iconURL: process.env.ICON_URL as string,
        text: process.env.BOT_NAME as string,
      },
    },
  };
  if (args.length < 1) {
    if (chan) await chan.send(helpEmbed);
    else if (user) await user.send(helpEmbed);
  } else {
    const command = args[0];
    const cmd: Command | undefined = cmdHandler.getCommand(
      `${command}`
    );
    if (cmd) {
      if (chan)
        await chan.send(`Usage:\n${cmdHandler.getCmdPrefix()}${cmd.getUsage()}`);
      else if (user)
        await user.send(`Usage:\n${cmdHandler.getCmdPrefix()}${cmd.getUsage()}`);
    } else {
      if (chan)
      await  chan.send(
          `Error: ${cmdHandler.getCmdPrefix()}${command} is not a registered command.`
        );
      else if (user)
      await user.send(
          `Error: ${cmdHandler.getCmdPrefix()}${command} is not a registered command.`
        );
    }
  }
}
