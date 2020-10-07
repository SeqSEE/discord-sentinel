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
import { TextChannel } from 'discord.js';
import DiscordHandler from './internal/DiscordHandler';

export default class WarningHandler {
  private discord: DiscordHandler;
  constructor(discord: DiscordHandler) {
    this.discord = discord;
  }
  public async warn(
    channel: string,
    id: string,
    level: number,
    reason: string
  ) {
    let lvl = 0 + level;
    let maxLevel = 0;
    let warnEmbed = {
      embed: {
        color: 8359053,
        author: {
          name: process.env.BOT_NAME as string,
          icon_url: process.env.ICON_URL as string,
        },
        title: `**WARN**`,
        url: '',
        description: `** **`,
        fields: [
          {
            name: `Offender`,
            value: `<@${id}>`,
            inline: false,
          },
          {
            name: `Warning Level`,
            value: `${lvl}/${maxLevel}`,
            inline: false,
          },
          {
            name: `Reason`,
            value: `${reason}`,
            inline: false,
          },
        ],
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
    let chan = await this.discord.getClient().channels.fetch(channel);
    if (chan instanceof TextChannel) {
      (chan as TextChannel).send(warnEmbed);
    }
  }

  load() {}

  save() {}
}
