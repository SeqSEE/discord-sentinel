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

import InternalCommands from './internal/InternalCommands';
import DiscordHandler from './internal/DiscordHandler';
import CommandHandler from './internal/CommandHandler';
import MessageHandler from './internal/MessageHandler';
import MuteHandler from './MuteHandler';
import WarningHandler from './WarningHandler';
import MessageObject from './interface/MessageObject';
import { ping } from './commands/example/ping';
import { mute } from './commands/admin/mute';
import { unmute } from './commands/admin/unmute';
import { kick } from './commands/admin/kick';
import { warn } from './commands/admin/warn';
import { pardon } from './commands/admin/pardon';
import { info } from './commands/admin/info';
import { ban } from './commands/admin/ban';
import { unban } from './commands/admin/unban';

export default class Commands extends InternalCommands {
  private muteHandler: MuteHandler;
  private warnHandler: WarningHandler;
  constructor(
    discord: DiscordHandler,
    cmdHandler: CommandHandler,
    msgHandler: MessageHandler,
    muteHandler: MuteHandler,
    warnHandler: WarningHandler
  ) {
    super(discord, cmdHandler, msgHandler);
    this.muteHandler = muteHandler;
    this.warnHandler = warnHandler;
  }
  public async registerCommands(): Promise<void> {
    await super.registerCommands(); //register the internal commands first
    this.registerCommand(
      'ping',
      'ping',
      [],
      async (messageObj: MessageObject) => {
        if (Number(process.env.DEBUG) === 1)
          console.log(`${Date()} author: ${messageObj.author} command: ping`);
        return await ping(this.getDiscord(), messageObj);
      }
    );
    this.registerCommand(
      'info',
      'info <user>',
      [],
      async (messageObj: MessageObject) => {
        if (Number(process.env.DEBUG) === 1)
          console.log(`${Date()} author: ${messageObj.author} command: info`);
        return info(
          this.getDiscord(),
          this.getCommandHandler(),
          this.warnHandler,
          this.muteHandler,
          messageObj
        );
      }
    );
    this.registerCommand(
      'mute',
      'mute <user> <length> <reason>',
      [],
      async (messageObj: MessageObject) => {
        if (Number(process.env.DEBUG) === 1)
          console.log(`${Date()} author: ${messageObj.author} command: mute`);
        return mute(
          this.getDiscord(),
          this.getCommandHandler(),
          this.muteHandler,
          messageObj
        );
      }
    );
    this.registerCommand(
      'unmute',
      'unmute <user>',
      [],
      async (messageObj: MessageObject) => {
        if (Number(process.env.DEBUG) === 1)
          console.log(`${Date()} author: ${messageObj.author} command: unmute`);
        return unmute(
          this.getDiscord(),
          this.getCommandHandler(),
          this.muteHandler,
          messageObj
        );
      }
    );
    this.registerCommand(
      'kick',
      'kick <user> <reason>',
      [],
      async (messageObj: MessageObject) => {
        if (Number(process.env.DEBUG) === 1)
          console.log(`${Date()} author: ${messageObj.author} command: kick`);
        return kick(this.getDiscord(), this.getCommandHandler(), messageObj);
      }
    );
    this.registerCommand(
      'warn',
      'warn <user> <level> <reason>',
      [],
      async (messageObj: MessageObject) => {
        if (Number(process.env.DEBUG) === 1)
          console.log(`${Date()} author: ${messageObj.author} command: warn`);
        return warn(
          this.getDiscord(),
          this.getCommandHandler(),
          this.warnHandler,
          messageObj
        );
      }
    );
    this.registerCommand(
      'pardon',
      'pardon <user> <level>',
      [],
      async (messageObj: MessageObject) => {
        if (Number(process.env.DEBUG) === 1)
          console.log(`${Date()} author: ${messageObj.author} command: pardon`);
        return pardon(
          this.getDiscord(),
          this.getCommandHandler(),
          this.warnHandler,
          messageObj
        );
      }
    );
    this.registerCommand(
      'ban',
      'ban <user> <history> <reason>',
      [],
      async (messageObj: MessageObject) => {
        if (Number(process.env.DEBUG) === 1)
          console.log(`${Date()} author: ${messageObj.author} command: ban`);
        return ban(this.getDiscord(), this.getCommandHandler(), messageObj);
      }
    );
    this.registerCommand(
      'unban',
      'unban <user>',
      [],
      async (messageObj: MessageObject) => {
        if (Number(process.env.DEBUG) === 1)
          console.log(`${Date()} author: ${messageObj.author} command: unban`);
        return unban(this.getDiscord(), this.getCommandHandler(), messageObj);
      }
    );
  }
}
