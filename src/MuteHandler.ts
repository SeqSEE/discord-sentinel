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

const mutedFile = '../data/muted.json';

export default class MuteHandler {
  private discord: DiscordHandler;
  private muted: string[];
  private mutedMap: Map<string, number>;
  private checking: boolean;
  constructor(discord: DiscordHandler) {
    this.discord = discord;
    this.muted = [];
    this.mutedMap = new Map<string, number>();
    this.checking = false;
  }

  public start() {
    let check = () => {
      console.log(`${Date()} checking mutes`);
      this.check();
      console.log(`${Date()} finished checking mutes`);
    };
    console.log(`${Date()} started MuteHandler`);
    setInterval(check, 60000);
  }

  private check() {
    if (this.checking) return;
    this.checking = true;
    for (let x = 0; x < this.muted.length; x++) {
      let end = Number(this.mutedMap.get(this.muted[x]));
      if (Math.floor(Date.now() / 1000) - end > 0) {
        this.unmute(this.muted[x]);
      }
    }
    this.checking = false;
    this.save();
  }

  public mutedUntil(id: string) {
    return this.muted.indexOf(id) === -1
      ? 0
      : Number(this.mutedMap.get(id)) | 0;
  }

  public async unmute(id: string) {
    if (this.mutedMap.has(id)) {
      this.mutedMap.delete(id);
      for (let x = 0; x < this.muted.length; x++) {
        if (this.muted[x] === id) delete this.muted[x];
      }
      let guild: Guild = ((await this.discord
        .getClient()
        .channels.fetch(process.env.DEFAULT_CHAN as string)) as TextChannel)
        .guild;
      let role: Role | undefined = guild.roles.cache.find(
        (role) => role.name === 'sentinel-muted'
      );
      if (role) {
        let member = await guild.members.fetch(id);
        if (member) await member.roles.remove(role as Role);
      }
      this.save();
    }
  }

  public async mute(
    channel: string,
    id: string,
    length: number,
    reason: string
  ) {
    let end = Date.now() + length * 60000;

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
            value: `${new Date(end)}`,
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
    this.mutedMap.set(id, Math.floor(end / 1000));
    if (this.muted.indexOf(id) === -1) this.muted.push(id);
    let guild: Guild = ((await this.discord
      .getClient()
      .channels.fetch(process.env.DEFAULT_CHAN as string)) as TextChannel)
      .guild;
    let role: Role | undefined = guild.roles.cache.find(
      (role) => role.name === 'sentinel-muted'
    );
    if (role) {
      let member = await guild.members.fetch(id);
      if (member) await member.roles.add(role as Role);
    }

    let chan = await this.discord.getClient().channels.fetch(channel);
    if (chan instanceof TextChannel) {
      await (chan as TextChannel).send(muteEmbed);
    }
    this.save();
  }
  public load() {
    if (fs.existsSync(path.join(__dirname, mutedFile))) {
      let m: { id: string; end: number }[] = JSON.parse(
        fs.readFileSync(path.join(__dirname, mutedFile)).toString('utf8')
      );
      m.forEach((mute) => {
        this.mute(
          process.env.DEFAULT_CHAN as string,
          mute.id,
          -1 * Math.floor(Date.now() / 1000) - mute.end,
          'Loaded muted'
        );
      });
    }
  }

  public save(): void {
    let m: { id: string; end: number }[] = [];
    for (let x = 0; x < this.muted.length; x++) {
      let end = Number(this.mutedMap.get(this.muted[x]));
      if (Math.floor(Date.now() / 1000) - end < 0)
        m.push({ id: this.muted[x], end });
    }
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
        if (channel instanceof GuildChannel && channel instanceof TextChannel) {
          let member = channel.guild.members.cache.find(
            (member) => member.id === this.discord.getClient().user?.id
          );
          let sentinel: Role | undefined = guild.roles.cache.find(
            (role) => role.id === member?.roles.highest.id
          );
          if (sentinel?.permissionsIn(channel).has('VIEW_CHANNEL')) {
            channel
              .updateOverwrite(sentinel as Role, {
                SEND_MESSAGES: true,
              })
              .then(() => {
                console.log(
                  `Updated Sentinel's role for ${channel.name} - ${channel.id}`
                );
              })
              .catch((e) => {
                console.log(
                  `${Date()} Error while updating Sentinel's role for ${
                    channel.name
                  } - ${channel.id}`
                );
                console.log(JSON.stringify(e));
              });
            channel
              .updateOverwrite(role as Role, {
                SEND_MESSAGES: false,
                ADD_REACTIONS: false,
              })
              .then(() => {
                console.log(
                  `${Date()} Updated ${channel.name} - ${channel.id}`
                );
              })
              .catch((e) => {
                console.log(
                  `${Date()} Error while updating ${channel.name} - ${
                    channel.id
                  }`
                );
                console.log(JSON.stringify(e));
              });
          }
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
        if (channel instanceof GuildChannel && channel instanceof TextChannel) {
          let member = channel.guild.members.cache.find(
            (member) => member.id === this.discord.getClient().user?.id
          );
          let sentinel: Role | undefined = guild.roles.cache.find(
            (role) => role.id === member?.roles.highest.id
          );
          if (sentinel?.permissionsIn(channel).has('VIEW_CHANNEL')) {
            channel
              .updateOverwrite(sentinel as Role, {
                SEND_MESSAGES: true,
              })
              .then(() => {
                console.log(
                  `${Date()} Updated Sentinel's role for ${channel.name} - ${
                    channel.id
                  }`
                );
              })
              .catch((e) => {
                console.log(
                  `${Date()} Error while updating Sentinel's role for ${
                    channel.name
                  } - ${channel.id}`
                );
                console.log(JSON.stringify(e));
              });
            channel
              .updateOverwrite(role as Role, {
                SEND_MESSAGES: false,
                ADD_REACTIONS: false,
              })
              .then(() => {
                console.log(
                  `${Date()} Updated ${channel.name} - ${channel.id}`
                );
              })
              .catch((e) => {
                console.log(
                  `${Date()} Error while updating ${channel.name} - ${
                    channel.id
                  }`
                );
                console.log(JSON.stringify(e));
              });
          }
        }
      });
    }
    if (role) {
      guild.members.cache.forEach((member) => {
        if (member.roles.cache.has(role?.id as string)) {
          member.roles
            .remove(role as Role)
            .then(() => {
              console.log(
                `${Date()} Removed ${role?.name} from ${member.displayName}`
              );
            })
            .catch((e) => {
              console.log(
                `${Date()} Error while removing ${role?.name} from ${
                  member.displayName
                }`
              );
              console.log(JSON.stringify(e));
            });
        }
      });
      for (let x = 0; x < this.muted.length; x++) {
        let member = await guild.members.fetch(this.muted[x]);
        if (member) {
          if (member.roles.cache.has(role?.id as string)) {
            await member.roles
              .add(role as Role)
              .then(() => {
                console.log(
                  `${Date()} Added ${role?.name} from ${member.displayName}`
                );
              })
              .catch((e) => {
                console.log(
                  `${Date()}Error while adding ${role?.name} from ${
                    member.displayName
                  }`
                );
                console.log(JSON.stringify(e));
              });
          }
        }
      }
    }
  }
}
