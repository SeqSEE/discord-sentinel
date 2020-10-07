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

import fs from 'fs';
import path from 'path';
import { TextChannel } from 'discord.js';
import DiscordHandler from './internal/DiscordHandler';

const warningsFile = '../../data/warnings.json';

export default class WarningHandler {
  private discord: DiscordHandler;
  private warnings: Map<string, number>;
  constructor(discord: DiscordHandler) {
    this.discord = discord;
    this.warnings = new Map<string, number>();
    this.load();
  }
  public async warn(
    channel: string,
    id: string,
    level: number,
    reason: string
  ): Promise<void> {
    let lvl: number =
      this.warnings.get(id) === undefined
        ? 0
        : Number(this.warnings.get(id)) + level;
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
            value: `${lvl}/${Number(process.env.MAX_WARN)}`,
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
    this.warnings.set(id, lvl);
    this.save();
    let chan = await this.discord.getClient().channels.fetch(channel);
    if (chan instanceof TextChannel) {
      (chan as TextChannel).send(warnEmbed);
    }
  }

  private load() {
    if (fs.existsSync(warningsFile)) {
      let w: { id: string; level: number }[] = JSON.parse(
        fs.readFileSync(warningsFile).toString('utf8')
      );
      w.forEach((warn) => {
        this.warnings.set(warn.id, warn.level);
      });
    }
  }

  public save(): void {
    let w: { id: string; level: number }[] = [];
    Object.keys(this.warnings).forEach((id) => {
      w.push({ id, level: Number(this.warnings.get(id)) });
    });
    fs.writeFile(
      path.join(__dirname, warningsFile),
      JSON.stringify(w, null, 2),
      function (err) {
        if (err) {
          console.log(err);
        }
      }
    );
  }
}
