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
import { Channel, Guild, GuildChannel, Role, TextChannel } from 'discord.js';
import DiscordHandler from './internal/DiscordHandler';

const mutedFile = '../../data/muted.json';

export default class MuteHandler {
  private discord: DiscordHandler;
  private muted: Map<string, number>;
  private checking: boolean;
  private mutedLoop: NodeJS.Timeout | null;
  constructor(discord: DiscordHandler) {
    this.discord = discord;
    this.muted = new Map<string, number>();
    this.checking = false;
    this.mutedLoop = null;
    this.load();
  }

  private check() {
    if (this.checking) return;
    this.checking = true;
    Object.keys(this.muted).forEach((mute) => {
      let end = Number(this.muted.get(mute));
      if (Math.floor(Date.now() / 1000) - end > 0) {
        this.muted.delete(mute);
        //remove role to allow to talk
      }
    });
    this.save();
    this.checking = false;
  }

  public async mute(
    channel: string,
    id: string,
    length: number,
    reason: string
  ) {
    let end = Math.floor(Date.now() / 1000) + length;
    let date = new Date(end * 1000);
    let hours = date.getHours();
    let minutes = '0' + date.getMinutes();
    let seconds = '0' + date.getSeconds();
    let formattedTime =
      hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

    let muteEmbed = {
      embed: {
        color: 8359053,
        author: {
          name: process.env.BOT_NAME as string,
          icon_url: process.env.ICON_URL as string,
        },
        title: `**MUTED**`,
        url: '',
        description: `** **`,
        fields: [
          {
            name: `Offender`,
            value: `<@${id}>`,
            inline: false,
          },
          {
            name: `Reason`,
            value: `${reason}`,
            inline: false,
          },
          {
            name: `Ends`,
            value: `${formattedTime}`,
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
    this.muted.set(id, end);
    let chan = await this.discord.getClient().channels.fetch(channel);
    if (chan instanceof TextChannel) {
      (chan as TextChannel).send(muteEmbed);
    }
    this.save();
  }
  private load() {
    if (fs.existsSync(mutedFile)) {
      let m: { id: string; end: number }[] = JSON.parse(
        fs.readFileSync(mutedFile).toString('utf8')
      );
      m.forEach((mute) => {
        this.muted.set(mute.id, mute.end);
      });
    }
    this.mutedLoop = setInterval(() => {
      this.check();
    }, 60000);
  }

  public save(): void {
    let m: { id: string; end: number }[] = [];
    Object.keys(this.muted).forEach((id) => {
      let end = Number(this.muted.get(id));
      if (Math.floor(Date.now() / 1000) - end < 0) m.push({ id, end });
    });
    fs.writeFile(
      path.join(__dirname, mutedFile),
      JSON.stringify(m, null, 2),
      function (err) {
        if (err) {
          console.log(err);
        }
      }
    );
  }

  public async setup(): Promise<void> {
    let guild: Guild = ((await this.discord
      .getClient()
      .channels.fetch(process.env.DEFAULT_CHAN as string)) as TextChannel)
      .guild;
    let role: Role | undefined = guild.roles.cache.find(
      (role) => role.name === 'sentinel-muted'
    );
    if (role) {
      guild.channels.cache.forEach(async (channel: Channel) => {
        if (channel instanceof GuildChannel) {
          channel.updateOverwrite(role as Role, { SEND_MESSAGES: false });
        }
      });
    } else {
      role = await guild.roles.create({
        data: {
          name: 'sentinel-muted',
          color: 'RED',
        },
        reason: 'Some people do not need to be heard',
      });
      guild.channels.cache.forEach(async (channel: Channel) => {
        if (channel instanceof GuildChannel) {
          channel.updateOverwrite(role as Role, { SEND_MESSAGES: false });
        }
      });
    }
  }
}
