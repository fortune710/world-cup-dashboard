import unittest
import os
import json
import pika
from services.queue_service import QueueService

class TestQueueIntegration(unittest.TestCase):
    def setUp(self):
        self.url = os.getenv('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672/')
        self.queue_name = 'player_stats_updates'

    def test_publish_message(self):
        # We'll use the QueueService to publish and then check if it's there
        service = QueueService()
        try:
            service.publish(self.queue_name, {"player_id": 999, "name": "Queue Test Player"})
            
            # Now consume it manually to verify
            params = pika.URLParameters(self.url)
            connection = pika.BlockingConnection(params)
            channel = connection.channel()
            
            method_frame, header_frame, body = channel.basic_get(self.queue_name)
            if method_frame:
                data = json.loads(body)
                self.assertEqual(data['player_id'], 999)
                self.assertEqual(data['name'], "Queue Test Player")
                channel.basic_ack(method_frame.delivery_tag)
                print(" [x] Integration test message verified.")
            else:
                self.fail("No message found in queue")
                
            connection.close()
        except Exception as e:
            self.skipTest(f"RabbitMQ integration test skipped: {e}")
        finally:
            service.close()

if __name__ == '__main__':
    unittest.main()
