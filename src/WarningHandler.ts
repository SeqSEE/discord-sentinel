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
import MuteHandler from './MuteHandler';

const warningsFile = '../data/warnings.json';

export default class WarningHandler {
  private discord: DiscordHandler;
  private muteHandler: MuteHandler;
  private warned: string[];
  private warnings: Map<string, number>;
  private checking: boolean;
  constructor(discord: DiscordHandler, muteHandler: MuteHandler) {
    this.discord = discord;
    this.muteHandler = muteHandler;
    this.warned = [];
    this.warnings = new Map<string, number>();
    this.checking = false;
  }

  public start() {
    console.log(`${Date()} started WarningHandler`);
    this.check();
    setTimeout(() => {
      setInterval(() => {
        console.log(`${Date()} check warnings`);
        this.check();
        console.log(`${Date()} finished checking warnings`);
      }, 3600000);
    }, 3600000);
  }
  private check() {
    if (this.checking) return;
    this.checking = true;
    for (let x = 0; x < this.warned.length; x++) {
      let level = Number(this.warnings.get(this.warned[x]));
      if (level - 1 < 1) {
        this.warnings.delete(this.warned[x]);
        delete this.warned[x];
      } else {
        this.warnings.set(this.warned[x], level - 1);
      }
    }
    this.checking = false;
    this.save();
  }

  public pardon(id: string, level: number) {
    if (this.warnings.has(id)) {
      let n =
        Number(this.warnings.get(id)) - level > 0
          ? Number(this.warnings.get(id)) - level
          : 0;
      this.warnings.set(id, n);
      this.save();
    }
  }

  public getLevel(id: string) {
    return this.warned.indexOf(id) === -1
      ? 0
      : Number(this.warnings.get(id)) | 0;
  }

  public async warn(
    channel: string,
    id: string,
    level: number,
    reason: string
  ): Promise<void> {
    let lvl: number = !this.warnings.has(id)
      ? 0 + level
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
    if (this.warned.indexOf(id) === -1) this.warned.push(id);
    if (lvl >= Number(process.env.MAX_WARN)) {
      await this.muteHandler.mute(
        channel,
        id,
        60,
        'Exceeded maximum warning level'
      );
    }
    let chan = await this.discord.getClient().channels.fetch(channel);
    if (chan instanceof TextChannel) {
      (chan as TextChannel).send(warnEmbed);
    }
    this.save();
  }

  public load() {
    if (fs.existsSync(path.join(__dirname, warningsFile))) {
      let w: { id: string; level: number }[] = JSON.parse(
        fs.readFileSync(path.join(__dirname, warningsFile)).toString('utf8')
      );
      w.forEach(async (warn) => {
        this.warnings.set(warn.id, warn.level);
        if (this.warned.indexOf(warn.id) === -1) this.warned.push(warn.id);
        if (warn.level >= Number(process.env.MAX_WARN)) {
          await this.muteHandler.mute(
            process.env.DEFAULT_CHAN as string,
            warn.id,
            60,
            'Exceeded maximum warning level'
          );
        }
      });
    }
  }

  public save(): void {
    let w: { id: string; level: number }[] = [];
    for (let x = 0; x < this.warned.length; x++) {
      let level = Number(this.warnings.get(this.warned[x]));
      if (level > 0) w.push({ id: this.warned[x], level });
    }

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
