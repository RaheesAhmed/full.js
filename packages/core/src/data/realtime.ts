import type { RealtimeManager, RealtimeConfig, SubscribeOptions } from './types';
import { createError, ErrorCodes } from '../errors';

export class WebSocketRealtimeManager implements RealtimeManager {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<(data: unknown) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;
  private pendingMessages: Array<{ channel: string; data: unknown }> = [];
  private config: RealtimeConfig;

  constructor(config: RealtimeConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.getWebSocketUrl());

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.processPendingMessages();
          resolve();
        };

        this.ws.onclose = () => {
          this.handleDisconnect();
        };

        this.ws.onerror = (error) => {
          reject(createError({
            code: ErrorCodes.REALTIME_CONNECTION_FAILED,
            message: 'WebSocket connection failed',
            details: error instanceof Error ? error.message : 'Unknown error',
            solution: 'Check network connectivity and WebSocket server status'
          }));
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };
      } catch (error) {
        reject(createError({
          code: ErrorCodes.REALTIME_CONNECTION_FAILED,
          message: 'Failed to create WebSocket connection',
          details: error instanceof Error ? error.message : 'Unknown error',
          solution: 'Check WebSocket URL and server status'
        }));
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  subscribe(
    channel: string,
    callback: (data: unknown) => void,
    options?: SubscribeOptions
  ): () => void {
    let subscribers = this.subscribers.get(channel);
    if (!subscribers) {
      subscribers = new Set();
      this.subscribers.set(channel, subscribers);
    }

    const wrappedCallback = this.wrapCallback(callback, options);
    subscribers.add(wrappedCallback);

    // Subscribe to channel on server
    this.sendMessage({
      type: 'subscribe',
      channel
    });

    return () => {
      subscribers?.delete(wrappedCallback);
      if (subscribers?.size === 0) {
        this.subscribers.delete(channel);
        // Unsubscribe from channel on server
        this.sendMessage({
          type: 'unsubscribe',
          channel
        });
      }
    };
  }

  publish(channel: string, data: unknown): void {
    const message = {
      type: 'publish',
      channel,
      data
    };

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.pendingMessages.push({ channel, data });
      this.connect(); // Attempt to reconnect
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      const subscribers = this.subscribers.get(message.channel);
      
      if (subscribers) {
        subscribers.forEach(callback => callback(message.data));
      }
    } catch (error) {
      console.error('Failed to handle WebSocket message:', error);
    }
  }

  private handleDisconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect();
      }, this.reconnectTimeout * this.reconnectAttempts);
    }
  }

  private processPendingMessages(): void {
    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift();
      if (message) {
        this.publish(message.channel, message.data);
      }
    }
  }

  private wrapCallback(
    callback: (data: unknown) => void,
    options?: SubscribeOptions
  ): (data: unknown) => void {
    if (!options) {
      return callback;
    }

    let timeoutId: NodeJS.Timeout | null = null;
    let lastCall = 0;

    return (data: unknown) => {
      const now = Date.now();

      // Handle debouncing
      if (options.debounce) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          callback(data);
        }, options.debounce);
        return;
      }

      // Handle throttling
      if (options.throttle) {
        if (now - lastCall < options.throttle) {
          return;
        }
        lastCall = now;
      }

      try {
        callback(data);
      } catch (error) {
        if (options.onError) {
          options.onError(error instanceof Error ? error : new Error('Unknown error'));
        }
      }
    };
  }

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws`;
  }

  private sendMessage(message: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
} 