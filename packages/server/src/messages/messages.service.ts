import { rmdirSync, existsSync, mkdirSync, readdirSync, lstatSync, unlinkSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { cwd } from 'process';
import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto.js';
import { UpdateMessageDto } from './dto/update-message.dto.js';
import loki from 'lokijs';
import lfsa from 'lokijs/src/loki-fs-structured-adapter.js';
import { sortByDateDesc } from '../utils/index.js';

const dbName = process.env.DB || 'db/safr.db';

function removeDirectorySync(directoryPath: string): void {
  if (existsSync(directoryPath)) {
    const files = readdirSync(directoryPath);

    for (const file of files) {
      const filePath = join(directoryPath, file);
      if (lstatSync(filePath).isDirectory()) {
        // Recursively remove subdirectories
        removeDirectorySync(filePath);
      } else {
        // Remove files
        unlinkSync(filePath);
      }
    }

    // Remove the empty directory itself
    rmdirSync(directoryPath);
    console.log(`Directory ${directoryPath} and its contents have been removed.`);
  } else {
    console.error(`Directory ${directoryPath} does not exist.`);
  }
}

@Injectable()
export class MessagesService {
  private db: loki;
  // private messageTopicStore = {} as { [topic: string]: Collection };

  constructor() {
    this.initialize();
  }

  private initialize() {
    const folderPath = dirname(resolve(cwd(), dbName));
    if (!existsSync(folderPath)) mkdirSync(folderPath, { recursive: true });

    const autoloadCallback = () => {
      if (this.db.collections && this.db.collections.length > 0) {
        this.db.collections.forEach((c) => {
          console.log(`Number of entries in collection '${c.name}': ${c.count()}`);
        });
      }
      console.log(`Storing all messages in ${dbName}.`);
    };

    this.db = new loki(dbName, {
      adapter: new lfsa(),
      autoload: true,
      autoloadCallback,
      autosave: true,
      throttledSaves: true,
    } as Partial<LokiConfigOptions>);
  }

  clearAllCollections() {
    this.db.close((err) => {
      if (err) {
        console.error(err);
      } else {
        const folder = dirname(join(cwd(), dbName));
        if (existsSync(folder)) removeDirectorySync(folder);
        console.log(`Successfully closed and deleted the database ${dbName}.`);
        this.initialize();
      }
    });
  }

  /** This action adds a new message, or updates an existing one if the message ID is found */
  create(topic: string, message: CreateMessageDto) {
    // if (!this.db.getCollection(topic)) {
    //   this.messageTopicStore[topic] = this.db.addCollection(topic);
    // }
    const collection = this.db.getCollection(topic) || this.db.addCollection(topic);
    const { id } = message as any;
    if (id) {
      const found = collection.findOne({ id });
      if (found) {
        const result = collection.update({ ...found, ...message });
        return result;
      }
    }
    return collection.insert(message);
  }

  /** Returns all messages, optionally filtered by the query */
  findAll(topic: string, query?: string) {
    console.log('Find all');
    const collection = this.db.getCollection(topic);
    if (!collection) {
      console.log('No collection for topic ' + topic);
      return [];
    }
    const q = query
      ? (JSON.parse(query) as { [prop: string]: string | number | { [ops: string]: string | number } })
      : undefined;
    return q ? collection.chain().find(q).sort(sortByDateDesc).data() : collection.chain().sort(sortByDateDesc).data();
  }

  findOne(topic: string, query: string | number | { [key: string]: any }): LokiObj | false {
    const collection = this.db.getCollection(topic);
    if (!collection) {
      return false;
    }
    // if (!this.messageTopicStore.hasOwnProperty(topic)) {
    //   return false;
    // }
    // const collection = this.messageTopicStore[topic];
    if (typeof query === 'number') {
      return collection.get(query);
    }
    if (typeof query === 'string') {
      const q = query
        ? (JSON.parse(query) as { [prop: string]: string | number | { [ops: string]: string | number } })
        : undefined;
      return q ? collection.findOne(q) : undefined;
    }
    return collection.findOne(query);
    // return `This action returns a #${query} message`;
  }

  update(topic: string, id: number, msg: UpdateMessageDto): LokiObj | false {
    const collection = this.db.getCollection(topic);
    if (!collection) {
      return false;
    }
    collection.update(msg);
    // if (!this.messageTopicStore.hasOwnProperty(topic)) {
    //   return false;
    // }
    // return this.messageTopicStore[topic].update(msg);
    // return `This action updates a #${id} message`;
  }

  remove(topic: string, id: number) {
    const collection = this.db.getCollection(topic);
    if (!collection) {
      return false;
    }
    const item = collection.get(id);
    return item ? collection.remove(item) : false;

    // if (!this.messageTopicStore.hasOwnProperty(topic)) {
    //   return false;
    // }
    // const item = this.messageTopicStore[topic].get(id);
    // return item ? this.messageTopicStore[topic].remove(item) : false;
    // return `This action removes a #${id} message`;
  }
}
