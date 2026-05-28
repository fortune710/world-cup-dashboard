import json
import time
import logging
from typing import Optional
import pika
from pika.adapters.blocking_connection import BlockingChannel
from pika.connection import Connection
from config.settings import Settings

logger = logging.getLogger(__name__)


class QueueService:
    def __init__(self) -> None:
        self.url: str = Settings.RABBITMQ_URL
        self._connection: Optional[Connection] = None
        self._channel: Optional[BlockingChannel] = None

    def _connect(self) -> None:
        if not self._connection or self._connection.is_closed:
            params = pika.URLParameters(self.url)
            params.heartbeat = 600
            params.blocked_connection_timeout = 300

            for attempt in range(5):
                try:
                    self._connection = pika.BlockingConnection(params)
                    self._channel = self._connection.channel()
                    logger.info(json.dumps({"event": "queue_connection_established", "rabbitmq_url": self.url}))
                    break
                except pika.exceptions.AMQPConnectionError:
                    logger.warning(json.dumps({"event": "queue_connection_retry", "attempt": attempt + 1, "max_attempts": 5}))
                    time.sleep(5)
            else:
                raise ConnectionError("Could not connect to RabbitMQ after 5 attempts")

    def publish(self, queue_name: str, message: dict) -> None:
        """
        Publishes a persistent message to the specified queue.

        Args:
            queue_name: Target queue name.
            message: Payload to send (serialized to JSON).
        """
        self._connect()
        assert self._channel is not None
        self._channel.queue_declare(queue=queue_name, durable=True)
        self._channel.basic_publish(
            exchange='',
            routing_key=queue_name,
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=2,  # persistent
            ),
        )
        logger.info(json.dumps({"event": "queue_message_published", "queue_name": queue_name, "message": message}, default=str))

    def consume(self, queue_name: str, count: int = 1) -> list[dict]:
        """
        Fetches up to `count` messages from the specified queue without auto-acking.

        Args:
            queue_name: Source queue name.
            count: Maximum number of messages to retrieve.

        Returns:
            List of dicts with keys 'body' (parsed JSON) and 'delivery_tag'.
        """
        self._connect()
        assert self._channel is not None
        self._channel.queue_declare(queue=queue_name, durable=True)

        messages: list[dict] = []
        for _ in range(count):
            method_frame, _header_frame, body = self._channel.basic_get(
                queue=queue_name, auto_ack=False
            )
            if method_frame:
                messages.append({
                    'body': json.loads(body),
                    'delivery_tag': method_frame.delivery_tag,
                })
            else:
                break
        logger.info(json.dumps({"event": "queue_messages_consumed", "queue_name": queue_name, "message_count": len(messages)}))
        return messages

    def ack(self, delivery_tag: int) -> None:
        if self._channel:
            self._channel.basic_ack(delivery_tag=delivery_tag)

    def nack(self, delivery_tag: int, requeue: bool = True) -> None:
        if self._channel:
            self._channel.basic_nack(delivery_tag=delivery_tag, requeue=requeue)

    def close(self) -> None:
        if self._connection and self._connection.is_open:
            self._connection.close()
            logger.info(json.dumps({"event": "queue_connection_closed"}))
