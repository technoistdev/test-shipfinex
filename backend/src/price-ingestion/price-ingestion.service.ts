import { Injectable, OnModuleInit, OnModuleDestroy, Inject, Logger } from '@nestjs/common';
import WebSocket from 'ws';
import Redis from 'ioredis';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PriceIngestionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PriceIngestionService.name);
  private sockets: Map<string, WebSocket> = new Map();
  private readonly assets = ['bitcoin', 'ethereum', 'tether', 'bnb', 'solana', 'usdc', 'xrp', 'dogecoin', 'cardano', 'avalanche', 'litecoin', 'monero'];

  private readonly binanceMapping: Record<string, string> = {
    BTCUSDT: 'bitcoin',
    ETHUSDT: 'ethereum',
    USDTUSDC: 'tether',
    BNBUSDT: 'bnb',
    SOLUSDT: 'solana',
    XRPUSDT: 'xrp',
    DOGEUSDT: 'dogecoin',
    ADAUSDT: 'cardano',
    AVAXUSDT: 'avalanche',
    LTCUSDT: 'litecoin',
    XMRUSDT: 'monero',
  };

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
  ) { }

  onModuleInit() {
    this.startCoincap();
    this.startBinance();
    this.startBlockchain();
    this.startPollingFallback();
  }

  onModuleDestroy() {
    this.sockets.forEach((ws) => ws.close());
  }

  private startCoincap() {
    const url = `wss://ws.coincap.io/prices?assets=${this.assets.join(',')}`;
    const ws = new WebSocket(url);
    this.sockets.set('coincap', ws);

    ws.on('open', () => this.logger.log('Connected to CoinCap WebSocket'));
    ws.on('message', async (data: WebSocket.Data) => {
      try {
        const payload = JSON.parse(data.toString());
        for (const [id, priceStr] of Object.entries(payload)) {
          await this.handlePriceUpdate(id, parseFloat(priceStr as string));
        }
      } catch (err) { 
        this.logger.error('Error in CoinCap WebSocket', err);
      }
    });
    ws.on('close', () => setTimeout(() => this.startCoincap(), 10000));
  }

  private startBinance() {
    const url = 'wss://stream.binance.com:9443/ws/!miniTicker@arr';
    const ws = new WebSocket(url);
    this.sockets.set('binance', ws);

    ws.on('open', () => this.logger.log('Connected to Binance WebSocket'));
    ws.on('message', async (data: WebSocket.Data) => {
      try {
        const tickers = JSON.parse(data.toString());
        for (const ticker of tickers) {
          const internalId = this.binanceMapping[ticker.s];
          if (internalId) {
            await this.handlePriceUpdate(internalId, parseFloat(ticker.c));
          }
        }
      } catch (err) { 
        this.logger.error('Error in Binance WebSocket', err);
       }
    });
    ws.on('close', () => setTimeout(() => this.startBinance(), 10000));
  }

  private startBlockchain() {
    const url = 'wss://ws.blockchain.info/inv';
    const ws = new WebSocket(url);
    this.sockets.set('blockchain', ws);

    ws.on('open', () => {
      this.logger.log('Connected to Blockchain.info WebSocket');
      ws.send(JSON.stringify({ op: 'unconfirmed_sub' }));
    });

    ws.on('message', (data: WebSocket.Data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.op === 'utx') {
          const totalValue = msg.x.out.reduce((acc: number, o: any) => acc + o.value, 0) / 100000000;
          if (totalValue > 10) {
            this.rabbitClient.emit('blockchain.alert', { type: 'whale_move', value: totalValue, txid: msg.x.hash });
          }
        }
      } catch (err) { 
        this.logger.error('Error in Blockchain WebSocket', err);
      }
    });
    ws.on('close', () => setTimeout(() => this.startBlockchain(), 10000));
  }

  private startPollingFallback() {
    setInterval(async () => {
      try {
        const res = await fetch(`https://api.coincap.io/v2/assets?ids=${this.assets.join(',')}`);
        const json: any = await res.json();
        for (const asset of json.data || []) {
          await this.handlePriceUpdate(asset.id, parseFloat(asset.priceUsd));
        }
      } catch (err) {}
    }, 60000);
  }

  private async handlePriceUpdate(asset: string, price: number) {
    if (isNaN(price)) return;
    await this.redis.set(`latest_price:${asset}`, price);
    this.rabbitClient.emit('price.updated', { asset, price, timestamp: Date.now() });
  }
}
